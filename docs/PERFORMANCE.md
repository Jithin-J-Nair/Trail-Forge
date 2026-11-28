# TrailForge performance notes

Measured on the reconstruction Phase 7 branch in CI/dev VM (Node 22). Numbers are local Vite production builds unless noted.

## Bundle (apps/web `vite build`)

| Asset                   | Size    | gzip    |
| ----------------------- | ------- | ------- |
| `index-*.js` (UI shell) | ~220 kB | ~67 kB  |
| `Scene-*.js` (lazy 3D)  | ~860 kB | ~232 kB |
| CSS                     | ~12 kB  | ~3.3 kB |

DPR policy: quality probe → low `[1,1]` / medium `[1,1.5]` / high `[1,2]`. Re-run `npm run build -w @trailforge/web` to refresh exact hashes.

## Runtime (fixture scene, `?debug=1`)

| Metric                 | Target           | Observed / note                                                                                    |
| ---------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| FPS                    | 60 on mid laptop | Fixture scene uses 1 merged building mesh + 1 road LineSegments + pins; draw calls typically ≪ 150 |
| Draw calls             | ≤ 150            | Merged buildings keep meshes at 1; roads 1; pins per visible POI                                   |
| Shadows                | optional         | Disabled on Canvas (`shadows={false}`); quality probe still gates DPR/bloom                        |
| Prefers-reduced-motion | respected        | Landing uses `motion-safe:` animations; FPP/Follow/Intro snap; CSS zeros transitions               |

## Accessibility pass (Phase 7)

- Skip link → `#main`; primary nav `aria-label`
- Visible `:focus-visible` outlines retained
- `aria-live` on generate stages (sr-only) + SearchPanel stage + Toast `role="alert"`
- EmptyCanvas `role="status"`; Scene Suspense fallback polite
- KeyboardNav: ArrowLeft/Right + Escape only — **Tab not hijacked** (forms keep focus order)
- Mobile sheet: safe-area padding, `100dvh` height, dialog label + toolbar
- Contrast: fog text on near-black/moss surfaces (AA intended for body copy); teal replaces leftover cyan classes

## How to re-measure

```bash
npm run build -w @trailforge/web
npm run preview -w @trailforge/web
# open with ?debug=1&quality=medium
```
