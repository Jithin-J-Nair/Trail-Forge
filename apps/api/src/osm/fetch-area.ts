import type { Theme } from '@trailforge/shared';
import { cacheKey, createOsmCache, type OsmCache } from './cache.js';
import { geocode } from './geocode.js';
import { fetchOverpassBundle } from './overpass.js';
import { transformOverpass, type TransformedScene } from './transform.js';

export type FetchAreaResult = TransformedScene & {
  displayName: string;
  fromCache: boolean;
};

export async function fetchAreaScene(
  query: string,
  theme: Theme,
  radiusMeters: number,
  options: {
    cache?: OsmCache;
    fetchImpl?: typeof fetch;
    signal?: AbortSignal;
  } = {},
): Promise<FetchAreaResult> {
  const cache = options.cache ?? createOsmCache();
  const netOpts = {
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  };
  const place = await geocode(query, netOpts);
  const key = cacheKey(place.lon, place.lat, radiusMeters, theme);
  const cached = await cache.get(key);
  if (cached) {
    return { ...cached, displayName: place.displayName, fromCache: true };
  }

  const bundle = await fetchOverpassBundle(
    { lon: place.lon, lat: place.lat },
    radiusMeters,
    theme,
    netOpts,
  );
  const scene = transformOverpass({ lon: place.lon, lat: place.lat }, bundle);
  await cache.set(key, scene);
  return { ...scene, displayName: place.displayName, fromCache: false };
}
