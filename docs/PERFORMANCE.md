# TrailForge performance notes

Measured on the Phase 9 branch in CI/dev VM (Node 22). Numbers are local Vite production builds unless noted.

## Bundle (apps/web `vite build`)

| Metric                            | Before Phase 9 (approx) | After Phase 9                                                |
| --------------------------------- | ----------------------- | ------------------------------------------------------------ |
| Initial JS (gzipped, main chunks) | ~420 kB (scene eager)   | scene lazy-split; UI shell loads first                       |
| 3D scene chunk                    | bundled with app        | separate dynamic `import('./scene/Scene.js')`                |
| DPR policy                        | fixed `[1,2]`           | quality probe: low `[1,1]` / medium `[1,1.5]` / high `[1,2]` |

Exact gzip sizes vary by lockfile; re-run `npm run build -w @trailforge/web` and read the Vite summary.

## Runtime (fixture scene, `?debug=1`)

| Metric                 | Target           | Observed / note                                                                                    |
| ---------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| FPS                    | 60 on mid laptop | Fixture scene uses 1 merged building mesh + 1 road LineSegments + pins; draw calls typically ≪ 150 |
| Draw calls             | ≤ 150            | Merged buildings keep meshes at 1; roads 1; pins per visible POI                                   |
| Shadows                | optional         | Enabled only on `quality=high`                                                                     |
| Prefers-reduced-motion | respected        | Intro/fly-through jump cuts                                                                        |

## Lighthouse (desktop, local preview)

| Metric      | Target | Result                                                                                     |
| ----------- | ------ | ------------------------------------------------------------------------------------------ |
| Performance | ≥ 85   | Not run in headless CI (no Chrome lighthouse job yet). Manual check recommended on deploy. |
| CLS         | low    | Static shell + reserved 420px scene height reduces shift                                   |

## Accessibility pass (Phase 9)

- Visible `:focus-visible` outlines retained
- `aria-live` on loading stage copy
- Language select and panel buttons are keyboard reachable
- Contrast: light text on near-black/moss surfaces (AA intended for body copy)

## How to re-measure

```bash
npm run build -w @trailforge/web
npm run preview -w @trailforge/web
# open with ?debug=1&quality=medium
```
