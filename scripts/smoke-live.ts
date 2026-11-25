/**
 * Live OSM smoke (NOT CI). Geocodes three areas and prints scene counts.
 * Usage: npm run smoke:live
 */
import { fetchAreaScene } from '../apps/api/src/osm/fetch-area.js';

const AREAS = ['Asakusa, Tokyo', 'Shibuya, Tokyo', 'Kyoto Gion'] as const;

async function main() {
  for (const query of AREAS) {
    const start = Date.now();
    try {
      const scene = await fetchAreaScene(query, 'culture', 500);
      console.log(
        JSON.stringify({
          query,
          displayName: scene.displayName,
          fromCache: scene.fromCache,
          pois: scene.pois.length,
          buildings: scene.buildings.length,
          roads: scene.roads.length,
          center: scene.center,
          samplePois: scene.pois.slice(0, 5).map((p) => p.name),
          ms: Date.now() - start,
        }),
      );
    } catch (err) {
      console.log(
        JSON.stringify({
          query,
          error: err instanceof Error ? err.message : String(err),
          ms: Date.now() - start,
        }),
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
