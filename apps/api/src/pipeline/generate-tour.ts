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
import { ApiError } from '../http/errors.js';
import { logger } from '../logger.js';
import { lookupDemoCenter } from '../osm/demo-centers.js';
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
    if (err instanceof OsmNotFoundError) {
      throw new ApiError(404, 'area_not_found', err.message);
    }
    const demo = lookupDemoCenter(request.query);
    if (demo && err instanceof OsmUpstreamError) {
      logger.warn({ err: err.message }, 'OSM upstream failed; using demo empty scene');
      scene = {
        center: { lon: demo.lon, lat: demo.lat },
        pois: [],
        buildings: [],
        roads: [],
        displayName: demo.displayName,
        fromCache: false,
      };
    } else if (err instanceof OsmUpstreamError) {
      throw new ApiError(502, 'upstream_error', 'Map data upstream failed');
    } else {
      throw err;
    }
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

  const response = GenerateResponseSchema.parse({
    center: scene.center,
    scene: { buildings: scene.buildings, roads: scene.roads },
    pois: scene.pois,
    content: grounded.content,
    route,
    verification: grounded.verification,
  });

  return {
    response,
    timings: { geocodeMs, overpassMs, llmMs, totalMs: now() - t0 },
  };
}
