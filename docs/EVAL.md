# TrailForge eval

Assumption: ran with **MockProvider** (no live LLM keys in this environment). OSM fixtures reused for scene geometry; grounding/route still execute.

| Area               | POIs | verified % | needs_review % | rejected | hallucinated places | routing          | stops | time ms |
| ------------------ | ---: | ---------: | -------------: | -------: | ------------------: | ---------------- | ----: | ------: |
| Asakusa, Tokyo     |    2 |       100% |             0% |        0 |                   0 | euclidean_detour |     2 |       4 |
| Roppongi, Tokyo    |    2 |       100% |             0% |        0 |                   0 | euclidean_detour |     2 |       1 |
| Shibuya, Tokyo     |    2 |       100% |             0% |        0 |                   0 | euclidean_detour |     2 |       0 |
| Gion, Kyoto        |    2 |       100% |             0% |        0 |                   0 | euclidean_detour |     2 |       0 |
| Kokusai-dori, Naha |    2 |       100% |             0% |        0 |                   0 | euclidean_detour |     2 |       1 |
| Dotonbori, Osaka   |    2 |       100% |             0% |        0 |                   0 | euclidean_detour |     2 |       0 |

GeneratedAt: 2026-11-28T05:54:13.282Z
