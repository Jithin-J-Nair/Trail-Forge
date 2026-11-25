import { cacheKey, createOsmCache } from './cache.js';
import { geocode } from './geocode.js';
import { fetchOverpassBundle } from './overpass.js';
import { transformOverpass } from './transform.js';

const query = process.argv.slice(2).join(' ').trim() || 'Asakusa, Tokyo';
const theme = 'culture' as const;
const radiusMeters = 500;

async function main() {
  const cache = createOsmCache();

  console.log(JSON.stringify({ stage: 'geocode:start', query }));
  const place = await geocode(query);
  console.log(
    JSON.stringify({
      stage: 'geocode:done',
      displayName: place.displayName,
      lon: place.lon,
      lat: place.lat,
    }),
  );

  const key = cacheKey(place.lon, place.lat, radiusMeters, theme);

  const run = async (label: string) => {
    const cached = await cache.get(key);
    if (cached) {
      console.log(
        JSON.stringify({
          label,
          stage: 'cache:hit',
          query,
          displayName: place.displayName,
          fromCache: true,
          pois: cached.pois.length,
          buildings: cached.buildings.length,
          roads: cached.roads.length,
          center: cached.center,
        }),
      );
      return;
    }

    const bundle = await fetchOverpassBundle(
      { lon: place.lon, lat: place.lat },
      radiusMeters,
      theme,
    );
    console.log(
      JSON.stringify({
        label,
        stage: 'overpass:raw',
        rawPois: bundle.pois.length,
        rawBuildings: bundle.buildings.length,
        rawRoads: bundle.highways.length,
      }),
    );

    const named = bundle.pois.filter(
      (el) => el.tags?.['name'] || el.tags?.['name:en'] || el.tags?.['name:ja'],
    ).length;
    console.log(JSON.stringify({ label, stage: 'filter:named', namedPois: named }));

    const scene = transformOverpass({ lon: place.lon, lat: place.lat }, bundle);
    console.log(
      JSON.stringify({
        label,
        stage: 'transform:capped',
        pois: scene.pois.length,
        buildings: scene.buildings.length,
        roads: scene.roads.length,
      }),
    );

    await cache.set(key, scene);
    console.log(
      JSON.stringify({
        label,
        query,
        displayName: place.displayName,
        fromCache: false,
        pois: scene.pois.length,
        buildings: scene.buildings.length,
        roads: scene.roads.length,
        center: scene.center,
        samplePois: scene.pois.slice(0, 5).map((p) => p.name),
      }),
    );
  };

  await run('first');
  await run('second');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
