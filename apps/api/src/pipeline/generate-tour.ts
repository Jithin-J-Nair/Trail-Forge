import {
  GenerateResponseSchema,
  type GenerateRequest,
  type GenerateResponse,
} from '@trailforge/shared';
import { createAiProvider } from '../ai/create-provider.js';
import { generatePoiDraft } from '../ai/generate.js';
import { groundLlmDraft } from '../ai/grounding.js';
import type { LlmJsonProvider } from '../ai/provider.js';
import { planRoute } from '../ai/route.js';
import { fetchWikidataEntity } from '../enrichment/wikidata.js';
import { fetchWikipediaSummary } from '../enrichment/wikipedia.js';
import { ApiError } from '../http/errors.js';
import { OsmNotFoundError, OsmUpstreamError } from '../osm/errors.js';
import { fetchAreaScene, type FetchAreaResult } from '../osm/fetch-area.js';

export type GenerateDeps = {
  llm?: LlmJsonProvider;
  fetchImpl?: typeof fetch;
  loadScene?: (request: GenerateRequest) => Promise<FetchAreaResult>;
  now?: () => number;
};

export type StageTimings = {
  geocodeMs: number;
  overpassMs: number;
  llmMs: number;
  totalMs: number;
};

export async function generateTour(
  request: GenerateRequest,
  deps: GenerateDeps = {},
): Promise<{ response: GenerateResponse; timings: StageTimings }> {
  const now = deps.now ?? Date.now;
  const t0 = now();
  const llm = deps.llm ?? createAiProvider();

  const geoStart = now();
  let scene: FetchAreaResult;
  try {
    scene = deps.loadScene
      ? await deps.loadScene(request)
      : await fetchAreaScene(request.query, request.theme, request.radiusMeters, {
          ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
        });
  } catch (err) {
    const anyErr = err as any;
    const diagnostics = anyErr?.diagnostics;
    if (err instanceof OsmNotFoundError || anyErr?.code === 'NOT_FOUND') {
      throw new ApiError(404, 'area_not_found', err instanceof Error ? err.message : 'Area not found', diagnostics);
    }
    if (err instanceof OsmUpstreamError || anyErr?.code === 'UPSTREAM_ERROR' || anyErr?.code === 'CIRCUIT_OPEN' || anyErr?.code === 'TIMEOUT' || anyErr?.code === 'RATE_LIMITED' || anyErr?.code === 'CONFIG_MISSING') {
      throw new ApiError(502, 'upstream_error', err instanceof Error ? err.message : 'Map data upstream failed', diagnostics, { code: anyErr?.code });
    }
    throw err;
  }
  const geocodeMs = now() - geoStart;
  const overpassMs = geocodeMs;

  const llmStart = now();
  const draft = await generatePoiDraft(llm, scene.pois);
  const grounded = groundLlmDraft(scene.pois, draft);
  const route = planRoute(scene.pois, request.durationMinutes, {
    ...(draft.titleJa ? { titleJa: draft.titleJa } : {}),
    ...(draft.titleEn ? { titleEn: draft.titleEn } : {}),
  });
  const llmMs = now() - llmStart;

  const provenance = 'provenance' in scene ? (scene as any).provenance : undefined;
  const devMode = Boolean((scene as any).devMode);
  const emptyMessage =
    scene.pois.length === 0
      ? 'No places found for this theme nearby. Try another theme or a larger radius.'
      : devMode
        ? 'DEV MODE: Showing clearly marked local fixture data (not real geographic data).'
        : undefined;

  const enrichmentTargets = scene.pois
    .filter((p) => p.osmTags['wikidata'] || p.osmTags['wikipedia'])
    .slice(0, 6);
  const enrichment = (
    await Promise.all(
      enrichmentTargets.map(async (p) => {
        const wikidataQid = p.osmTags['wikidata'];
        const wikipediaRef = p.osmTags['wikipedia'] ?? p.name;
        const [wikidata, wikipedia] = await Promise.all([
          wikidataQid ? fetchWikidataEntity(wikidataQid, { ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}) }) : Promise.resolve(null),
          wikipediaRef ? fetchWikipediaSummary(wikipediaRef, { ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}) }) : Promise.resolve(null),
        ]);
        if (!wikidata && !wikipedia) return null;
        return {
          poiId: p.id,
          ...(wikidata ? { wikidata } : {}),
          ...(wikipedia ? { wikipedia } : {}),
        };
      }),
    )
  ).filter((e): e is NonNullable<typeof e> => e !== null);

  const totalClaims = grounded.content.flatMap((c) => [...c.ja, ...c.en]).length;
  const verifiedClaims = grounded.content.filter((c) => c.status === 'verified').flatMap((c) => [...c.ja, ...c.en]).length;
  const verificationCoverage = totalClaims > 0 ? verifiedClaims / totalClaims : 0;
  const sourcedPois = scene.pois.filter((p) => p.osmTags && Object.keys(p.osmTags).length > 0).length;
  const sourceQuality = scene.pois.length > 0 ? sourcedPois / scene.pois.length : 0;
  const unsupportedClaims = grounded.content.filter((c) => c.status !== 'verified').length;
  const missingMetadata = scene.pois.filter((p) => !p.name || !p.category).length;
  const trustScore = {
    score: Math.max(0, Math.min(100, Math.round((verificationCoverage * 60 + sourceQuality * 30 + Math.max(0, 1 - unsupportedClaims / Math.max(1, grounded.content.length)) * 10) * 100))),
    verificationCoverage,
    sourceQuality,
    unsupportedClaims,
    missingMetadata,
  };

  const response = GenerateResponseSchema.parse({
    center: scene.center,
    scene: { buildings: scene.buildings, roads: scene.roads },
    pois: scene.pois,
    content: grounded.content,
    route,
    verification: grounded.verification,
    ...(emptyMessage ? { message: emptyMessage } : {}),
    ...(provenance ? { provenance } : {}),
    ...(enrichment.length > 0 ? { enrichment } : {}),
    ...(devMode ? { devMode: true } : {}),
    trustScore,
  });

  return {
    response,
    timings: { geocodeMs, overpassMs, llmMs, totalMs: now() - t0 },
  };
}
