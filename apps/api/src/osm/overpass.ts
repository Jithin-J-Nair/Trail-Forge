import type { LonLat, Theme } from '@trailforge/shared';
import { OsmUpstreamError } from './errors.js';
import { THEME_OVERPASS, WALKABLE_HIGHWAYS } from './themes.js';

const USER_AGENT = 'TrailForge/0.1 (tour planner; contact: trailforge-dev@example.com)';
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
] as const;

export type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
  center?: { lat: number; lon: number };
};

export type OverpassBundle = {
  pois: OverpassElement[];
  buildings: OverpassElement[];
  highways: OverpassElement[];
};

function buildQueries(center: LonLat, radius: number, theme: Theme): string[] {
  const base = { radius: String(radius), lat: String(center.lat), lon: String(center.lon) };
  const fill = (tpl: string) =>
    tpl
      .replace(/\{radius\}/g, base.radius)
      .replace(/\{lat\}/g, base.lat)
      .replace(/\{lon\}/g, base.lon);

  const poi = `[out:json][timeout:20];${fill(THEME_OVERPASS[theme])};out center tags;`;
  const buildings = `[out:json][timeout:20];way["building"](around:${radius},${center.lat},${center.lon});out geom tags;`;
  const highways = `[out:json][timeout:20];way["highway"~"^(${WALKABLE_HIGHWAYS})$"](around:${radius},${center.lat},${center.lon});out geom tags;`;
  return [poi, buildings, highways];
}

async function postOverpass(
  endpoint: string,
  query: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
): Promise<OverpassElement[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ data: query }),
      signal: controller.signal,
    });
    if (!res.ok) throw new OsmUpstreamError(`Overpass HTTP ${res.status} at ${endpoint}`);
    const json = (await res.json()) as { elements?: OverpassElement[] };
    return json.elements ?? [];
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function withRetry(
  query: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
): Promise<OverpassElement[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const endpoint of ENDPOINTS) {
      try {
        return await postOverpass(endpoint, query, fetchImpl, signal);
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }
  throw lastErr instanceof OsmUpstreamError
    ? lastErr
    : new OsmUpstreamError(lastErr instanceof Error ? lastErr.message : 'Overpass failed');
}

export async function fetchOverpassBundle(
  center: LonLat,
  radiusMeters: number,
  theme: Theme,
  options: { fetchImpl?: typeof fetch; signal?: AbortSignal } = {},
): Promise<OverpassBundle> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = buildQueries(center, radiusMeters, theme);
  const poiQ = queries[0];
  const buildingQ = queries[1];
  const highwayQ = queries[2];
  if (!poiQ || !buildingQ || !highwayQ) {
    throw new OsmUpstreamError('Failed to build Overpass queries');
  }
  const [pois, buildings, highways] = await Promise.all([
    withRetry(poiQ, fetchImpl, options.signal),
    withRetry(buildingQ, fetchImpl, options.signal),
    withRetry(highwayQ, fetchImpl, options.signal),
  ]);
  return { pois, buildings, highways };
}
