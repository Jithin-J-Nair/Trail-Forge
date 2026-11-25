import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheKey, createOsmCache } from './cache.js';
import { lookupDemoCenter } from './demo-centers.js';
import { OsmNotFoundError, OsmUpstreamError } from './errors.js';
import { geocode } from './geocode.js';
import { fetchOverpassBundle, type OverpassBundle } from './overpass.js';
import { transformOverpass } from './transform.js';

const query = process.argv.slice(2).join(' ').trim() || 'Asakusa, Tokyo';
const theme = 'culture' as const;
const radiusMeters = 500;

async function resolveCenter() {
  try {
    return await geocode(query);
  } catch (err) {
    const demo = lookupDemoCenter(query);
    if (demo && (err instanceof OsmUpstreamError || err instanceof OsmNotFoundError)) {
      console.warn(`Nominatim unavailable (${err.message}); using demo center for "${query}".`);
      return demo;
    }
    throw err;
  }
}

async function loadBundle(center: { lon: number; lat: number }): Promise<OverpassBundle> {
  try {
    const bundle = await fetchOverpassBundle(center, radiusMeters, theme);
    if (bundle.pois.length + bundle.buildings.length + bundle.highways.length > 0) {
      return bundle;
    }
    console.warn('Overpass returned empty; using recorded fixture.');
  } catch (err) {
    console.warn(
      `Overpass unavailable (${err instanceof Error ? err.message : err}); using fixture.`,
    );
  }
  const fixturePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'fixtures/overpass-sample.json',
  );
  return JSON.parse(readFileSync(fixturePath, 'utf8')) as OverpassBundle;
}

async function main() {
  const cache = createOsmCache();
  const place = await resolveCenter();
  const key = cacheKey(place.lon, place.lat, radiusMeters, theme);

  const run = async (label: string) => {
    const cached = await cache.get(key);
    if (cached) {
      console.log(
        JSON.stringify(
          {
            label,
            query,
            displayName: place.displayName,
            fromCache: true,
            pois: cached.pois.length,
            buildings: cached.buildings.length,
            roads: cached.roads.length,
            center: cached.center,
          },
          null,
          2,
        ),
      );
      return;
    }
    const bundle = await loadBundle(place);
    const scene = transformOverpass({ lon: place.lon, lat: place.lat }, bundle);
    await cache.set(key, scene);
    console.log(
      JSON.stringify(
        {
          label,
          query,
          displayName: place.displayName,
          fromCache: false,
          pois: scene.pois.length,
          buildings: scene.buildings.length,
          roads: scene.roads.length,
          center: scene.center,
        },
        null,
        2,
      ),
    );
  };

  await run('first');
  await run('second');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
