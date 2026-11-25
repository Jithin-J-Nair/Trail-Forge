# TrailForge eval

Assumption: ran with **MockProvider** (no live LLM keys in this environment). OSM fixtures reused for scene geometry; grounding/route still execute.

| Area               | POIs | verified % | needs_review % | rejected | hallucinated places | time ms |
| ------------------ | ---: | ---------: | -------------: | -------: | ------------------: | ------: |
| Asakusa, Tokyo     |    2 |       100% |             0% |        0 |                   0 |       3 |
| Roppongi, Tokyo    |    2 |       100% |             0% |        0 |                   0 |       2 |
| Shibuya, Tokyo     |    2 |       100% |             0% |        0 |                   0 |       0 |
| Gion, Kyoto        |    2 |       100% |             0% |        0 |                   0 |       0 |
| Kokusai-dori, Naha |    2 |       100% |             0% |        0 |                   0 |       1 |

GeneratedAt: 2026-11-25T09:59:36.815Z
