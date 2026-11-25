/**
 * Run tour generation against five demo areas using MockProvider (CI-safe).
 * Usage: npm run eval
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MockAiProvider } from '../apps/api/src/ai/mock-provider.js';
import { generateTour } from '../apps/api/src/pipeline/generate-tour.js';
import { transformOverpass } from '../apps/api/src/osm/transform.js';
import type { OverpassBundle } from '../apps/api/src/osm/overpass.js';
import { readFileSync } from 'node:fs';

const AREAS = [
  { query: 'Asakusa, Tokyo', theme: 'culture' as const, center: { lon: 139.7967, lat: 35.7148 } },
  { query: 'Roppongi, Tokyo', theme: 'nightlife' as const, center: { lon: 139.729, lat: 35.6628 } },
  { query: 'Shibuya, Tokyo', theme: 'shopping' as const, center: { lon: 139.7013, lat: 35.6595 } },
  { query: 'Gion, Kyoto', theme: 'culture' as const, center: { lon: 135.775, lat: 35.0037 } },
  {
    query: 'Kokusai-dori, Naha',
    theme: 'food' as const,
    center: { lon: 127.695, lat: 26.217 },
  },
];

const fixture = JSON.parse(
  readFileSync(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '../apps/api/src/osm/fixtures/overpass-sample.json',
    ),
    'utf8',
  ),
) as OverpassBundle;

async function main() {
  const llm = new MockAiProvider();
  const rows: string[] = [
    '| Area | POIs | verified % | needs_review % | rejected | hallucinated places | time ms |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];

  for (const area of AREAS) {
    const t0 = Date.now();
    const scene = transformOverpass(area.center, fixture);
    const { response } = await generateTour(
      {
        query: area.query,
        theme: area.theme,
        durationMinutes: 90,
        radiusMeters: 500,
      },
      {
        llm,
        loadScene: async () => ({
          ...scene,
          displayName: area.query,
          fromCache: false,
        }),
      },
    );
    const ms = Date.now() - t0;
    const total = Math.max(1, response.verification.total);
    const verifiedPct = Math.round((response.verification.verified / total) * 100);
    const reviewPct = Math.round((response.verification.needsReview / total) * 100);
    const hallucinated = response.verification.rejected;
    rows.push(
      `| ${area.query} | ${response.pois.length} | ${verifiedPct}% | ${reviewPct}% | ${response.verification.rejected} | ${hallucinated} | ${ms} |`,
    );
  }

  const md = [
    '# TrailForge eval',
    '',
    'Assumption: ran with **MockProvider** (no live LLM keys in this environment). OSM fixtures reused for scene geometry; grounding/route still execute.',
    '',
    ...rows,
    '',
    `GeneratedAt: ${new Date().toISOString()}`,
    '',
  ].join('\n');

  const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../docs/EVAL.md');
  writeFileSync(out, md, 'utf8');
  console.log(md);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
