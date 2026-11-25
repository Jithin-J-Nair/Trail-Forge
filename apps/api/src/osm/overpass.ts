import type { LonLat, Theme } from '@trailforge/shared';
import { OsmUpstreamError } from './errors.js';
import { THEME_OVERPASS, WALKABLE_HIGHWAYS } from './themes.js';

const USER_AGENT =
  'TrailForge/0.1 (https://github.com/Jithin-J-Nair/Trail-Forge; contact: trailforge-dev@example.com)';
const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
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

function buildQueries(
  center: LonLat,
  radius: number,
  theme: Theme,
): {
  poi: string;
  buildings: string;
  highways: string;
} {
  const base = { radius: String(radius), lat: String(center.lat), lon: String(center.lon) };
  const fill = (tpl: string) =>
    tpl
      .replace(/\{radius\}/g, base.radius)
      .replace(/\{lat\}/g, base.lat)
      .replace(/\{lon\}/g, base.lon);

  return {
    poi: `[out:json][timeout:45];${fill(THEME_OVERPASS[theme])};out center tags;`,
    // Prefer geom; transform falls back to center squares when geometry is missing.
    buildings: `[out:json][timeout:60];way["building"](around:${radius},${center.lat},${center.lon});out center tags;`,
    highways: `[out:json][timeout:45];way["highway"~"^(${WALKABLE_HIGHWAYS})$"](around:${radius},${center.lat},${center.lon});out geom tags;`,
  };
}

async function postOverpass(
  endpoint: string,
  query: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
): Promise<OverpassElement[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 65_000);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    const attempts: Array<{ headers: Record<string, string>; body: string | URLSearchParams }> = [
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({ data: query }),
      },
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Content-Type': 'text/plain',
          Accept: 'application/json',
        },
        body: query,
      },
    ];
    let lastErr: unknown;
    for (const attempt of attempts) {
      try {
        const res = await fetchImpl(endpoint, {
          method: 'POST',
          headers: attempt.headers,
          body: attempt.body,
          signal: controller.signal,
        });
        if (!res.ok) {
          lastErr = new OsmUpstreamError(`Overpass HTTP ${res.status} at ${endpoint}`);
          continue;
        }
        const json = (await res.json()) as { elements?: OverpassElement[] };
        return json.elements ?? [];
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr instanceof OsmUpstreamError
      ? lastErr
      : new OsmUpstreamError(lastErr instanceof Error ? lastErr.message : 'Overpass failed');
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
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const endpoint of ENDPOINTS) {
      try {
        return await postOverpass(endpoint, query, fetchImpl, signal);
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
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
  // Sequential to reduce Overpass 504 storms from cloud egress.
  const pois = await withRetry(queries.poi, fetchImpl, options.signal);
  const buildings = await withRetry(queries.buildings, fetchImpl, options.signal);
  const highways = await withRetry(queries.highways, fetchImpl, options.signal);
  return { pois, buildings, highways };
}
