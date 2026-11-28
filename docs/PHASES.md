# TrailForge phases

## Assumptions

- Node.js current LTS (engines require >=22); package manager is npm workspaces.
- Default git branch is `main`.
- Claude and Ollama providers are interface stubs that fail clearly without `ANTHROPIC_API_KEY` / `OLLAMA_HOST`; Mock is the default and is used in tests/CI.
- English and Japanese UI/copy placeholders are acceptable in Phase 1.
- Phase 1 does not call Overpass/Nominatim, does not build a full 3D city, and does not run real LLM generation beyond the Mock provider.
- LLM API keys never ship to the browser; all provider code lives in `apps/api`.
- Local API CORS origin defaults to `http://localhost:5173`; Vite proxies `/api` to the API.
- Road `kind` enum: `motorway | primary | secondary | tertiary | residential | path | other`.
- Local projection: meters relative to response `center` `{lon, lat}`; **+x east, +z south** (Y-up). Equirectangular; accurate within ~1m inside a 500m Tokyo radius.

## Phase 1 summary

1. Built an npm-workspaces monorepo with strict TypeScript, ESLint, Prettier, Vitest, concurrent `npm run dev`, and GitHub Actions CI.
2. The API validates env with Zod at boot, serves `/api/health` → `{status:"ok"}`, and wires Helmet, CORS, Pino, rate limits, LRU cache, plus Mock/Claude/Ollama LLM providers.
3. The web app is a dark Tailwind shell (header + OSM footer) with a tiny R3F placeholder; Vite proxies `/api` so the browser can hit health without CORS friction.
4. Shared Zod schemas are the contract between web, API, and LLM I/O; secrets stay server-side.
5. Interview line: “Phase 1 is the production skeleton—typed contracts, proxied health check, fail-fast env, and CI—before any OSM fetch or grounded generation.”

## Phase 2 summary

1. Added shared Zod schemas and inferred types for the full generate contract: request, POI/building/road, claims/content, route, and response.
2. Exported `lonLatToLocalMeters` / `localMetersToLonLat` with Tokyo unit tests proving under 1m error at ~500m.
3. Both apps import `@trailforge/shared`: web form drafts use `GenerateRequest`/`Theme`; API validates via `/api/v1/generate/validate`.
4. Phase 1 TourRequest and LLM schemas remain; Phase 2 is the typed domain layer only—no OSM fetch or LLM generation yet.
5. Interview line: “Phase 2 locks the data contracts and local meter projection so later Overpass and 3D work share one validated shape.”

## Phase 3 assumptions

- Nominatim may return HTTP 403 from some cloud egress IPs; geocode falls back to Photon (`photon.komoot.io`) with the same TrailForge User-Agent.
- Overpass public mirrors rate-limit or 504 under parallel load; the client tries mail.ru → kumi → overpass-api.de, form then raw body, sequentially.
- Building footprints prefer `out geom`; when mirrors only return `out center`, transform synthesizes ~12m boxes at real OSM centers so the scene stays dense.
- Fixtures/`SAMPLE_RESPONSE` are tests-only unless `VITE_DEMO_MODE=true` or `?demo=1` (UI shows a **DEMO DATA** badge). Generate never silently substitutes sample data.

## Phase 3 summary

1. Added `apps/api/src/osm`: Nominatim+Photon geocode (1 req/s, 8s timeout), Overpass `nwr` POI/building/highway fetch with retry + multi-endpoint.
2. `transform.ts` projects to local meters, keeps POIs with `name`/`name:en`/`name:ja`, caps (12 POIs / 2000 buildings), derives heights, Douglas–Peucker simplifies footprints.
3. Two-layer cache (memory LRU + `.cache/` JSON, 24h TTL); `npm run -w apps/api osm:try` logs per-stage counts; `npm run smoke:live` hits Asakusa/Shibuya/Gion (not CI).
4. Unit tests use recorded fixtures only—no live network in CI.
5. Interview line: “Phase 3 turns a place name into a typed OSM scene with respectful rate limits and a disk cache so demos stay fast.”

## Phase 3 re-harden summary

1. Root cause: Nominatim HTTP 403 on cloud egress + `osm:try`/`generate` silent demo/fixture/SAMPLE_RESPONSE masking made empty scenes look “successful.”
2. Fix: Photon fallback; Overpass `nwr` + shopping `tourism=*`; honest 502 on Overpass failure; empty POIs → 200 + `message`; SAMPLE only under DEMO_MODE with badge.
3. Acceptance: live Asakusa vs Shibuya return different named places and hundreds of buildings when upstream is reachable.

## Phase 4 summary

1. Added `apps/api/src/ai` with `generateJson` providers (Mock / Claude / Ollama via `LLM_PROVIDER`), delimited OSM data prompts, and schema-repair retry.
2. `grounding.ts` enforces poiId/key existence, grounded numbers/URLs, missing-source review, and rejects hallucinated places.
3. `route.ts` builds a deterministic nearest-neighbor + 2-opt path with 1.3× detour and 80 m/min walking budget trimming.
4. Tests cover each grounding rule (including injection-style tags), route trim/order, and Mock repair-retry; CI uses Mock.
5. Interview line: “Phase 4 is the trust layer—the LLM may draft, but only OSM-cited claims survive, and the route is computed in code.”

## Phase 5 summary

1. Added `POST /api/generate` that runs geocode → Overpass → transform → LLM → grounding → route and returns a Zod-validated `GenerateResponse`.
2. Errors use `{error:{code,message}}` with 400/404/429/502/504/500; request-id middleware; stage timings in logs; 10/min generate rate limit; in-flight dedupe.
3. Integration tests with fixtures + MockAiProvider cover happy path, invalid input, not found, upstream failure, and rate limit.
4. Assumption: OSM upstream failures return typed 502 (no empty demo scene); zero themed POIs still return 200 with `message`.
5. Interview line: “Phase 5 exposes one public generate endpoint with honest errors and a server-only LLM boundary.”

## Phase 6 summary

1. Added R3F `Scene` with dusk/neon lighting, fog, clamped DPR, OrbitControls limits, and intro camera ease (skipped under prefers-reduced-motion).
2. Buildings merge into one extruded mesh with height vertex colors; roads are a single LineSegments layer over a dark grid ground.
3. Zustand `tour-scene-store` holds response/selection/language/status; `?debug=1` shows FPS/draw-call overlay; WebGL fallback message included.
4. Fixture data drives the preview; geometries dispose on unmount to avoid leaks.
5. Interview line: “Phase 6 proves the 3D performance budget—merged buildings, few draw calls, and a readable night city shell.”

## Phase 7 summary

1. Added POI pins (beam + pulsing ring + Html labels) colored by verification status; rejected pins are hidden.
2. RouteLine draws a CatmullRom path with stop markers and a breathing dash opacity; Play route flies the camera stop-to-stop.
3. Selection flies the camera to a pin and opens keyboard paths: Tab cycles, arrows step the route, Escape clears; prefers-reduced-motion uses jump cuts.
4. Profiler note: pin pulse/route opacity mutate existing uniforms/scales only—no Vector3/array allocations inside `useFrame`.
5. Interview line: “Phase 7 makes the tour explorable—mouse, touch, and keyboard all drive the same selection model.”

## Phase 8 summary

1. Product UI: search panel with theme chips, duration/radius sliders, staged loading + AbortController cancel, and toasts for errors/offline.
2. Result panel shows route stats, verification bar, synced POI list, claim source tags (“Why trusted?”), and needs_review approve/remove edits.
3. Client-side GeoJSON/CSV export of verified/human-reviewed items with ODbL metadata and UTF-8 BOM for CSV.
4. Typed ja/en dictionaries with `?lang=` persistence; mobile uses a bottom sheet for the panel.
5. Interview line: “Phase 8 closes the loop—search, verify, edit, and export a tour without leaving the browser.”

## Phase 9 summary

1. Lazy-loaded the 3D scene chunk; quality probe (`?quality=low|medium|high`) drives DPR, antialias, and shadows.
2. Typography/tokens: Noto Sans JP stack, shared transition micro-interactions, reserved scene height to limit CLS.
3. Documented before/after bundle and runtime budgets in `docs/PERFORMANCE.md`.
4. Accessibility: focus styles, aria-live loading, keyboardable controls retained.
5. Interview line: “Phase 9 keeps the night city fast—code-split WebGL, adaptive quality, and measured budgets.”

## UI redesign summary (web only)

1. Full-bleed R3F night city with glass floating search/result panels and a bottom route bar (Play/Export); mobile uses bottom sheets.
2. Tokens: `#05070D` canvas, cyan/violet accents, Inter + Space Grotesk + Noto Sans JP; DEMO DATA badge when fixture/API fallback is active.
3. Buildings use a procedural window shader; selective bloom on bright emissives; idle auto-orbit stops on interaction / reduced-motion.
4. Dev fixture ~400 buildings / 8 roads / 8 mixed-status POIs paints the scene when the API is unavailable.
5. Interview line: “The product UI is a dusk city HUD—trust panels float over the map instead of a dashboard scaffolding the 3D.”

## Phase 10 summary — How to explain this project in 2 minutes

1. TrailForge is a production-shaped monorepo that plans walking tours from OpenStreetMap only—never from LLM imagination.
2. The API geocodes, pulls Overpass, projects to meters, drafts bilingual blurbs, grounds every claim against OSM tags, and orders the route in deterministic code.
3. The web app shows a performance-aware 3D dusk city, lets you review shaky claims, and exports verified GeoJSON/CSV with ODbL attribution.
4. CI runs typecheck/lint/test/build/audit; nightly Mock eval writes `docs/EVAL.md`; Docker ships a non-root API with `/api/health`.
5. Interview closer: “I built the trust boundary first—schemas, grounding, caching, and rate limits—so the 3D tour is impressive and accountable.”

## Arena PR #14 hygiene (post-merge)

1. Removed unused Arena scaffold: root strategy/architecture MD dump, `services/*`, `packages/ai-core`, `packages/domain`, terraform/deploy stubs.
2. Kept working geo resilience (provider fallback, circuit breaker, LOCAL_DEV labeled fixtures) and fixed trustScore formula (was saturating at 100).
3. Restored DEMO honesty: `?demo=1` / `VITE_DEMO_MODE`, SAMPLE_RESPONSE `demo: true` + non-live provenance; auth login lives on Profile, not SearchPanel.
4. Docs kept short: root `README` + `docs/{ARCHITECTURE,PHASES,PERFORMANCE,DEPLOY,EVAL}` only.
5. Interview line: “We kept Arena’s useful geo resilience and deleted the speculative novel — green CI and honest DEMO labels matter more than blueprint MD files.”

## Reconstruction Phase 0 summary — product audit + master plan

1. Audited `main` @ `d9a6536`: working OSM → generate → grounding → R3F → export spine; DEMO still auto-paints SAMPLE on `/app` until PR #16.
2. Architecture decision: keep R3F extrusions primary; MapLibre/Cesium/terrain only as key-gated additive adapters — no stack rewrite.
3. Open PR verdicts: merge #16 (honesty), merge #17 after #16 (solar/FPP); #19 skills already merged to main.
4. Wrote `docs/PRODUCT_AUDIT.md` and `docs/MASTER_IMPLEMENTATION_PLAN.md` (phases 0–9); kept `docs/AGENT_SKILLS.md` from #19/TF-34.
5. Interview line: “Phase 0 is an honest map of what already works — we plan reconstruction around the live OSM path instead of inventing a new product.”

## Reconstruction Phase 1 summary — design system + cinematic landing

1. Retokenized the dusk HUD: charcoal slate, soft teal, warm amber (dropped cyan/violet neon); Fraunces + Source Sans 3 + Noto Sans JP.
2. Cinematic `/` landing: full-bleed cartographic SVG atmosphere, hero brand TrailForge, one headline, one support line, CTA group, OSM attribution.
3. Entrance + map-drift + pin-glow motions with `prefers-reduced-motion` already gated in CSS; nav uses amber active state (not neon pills).
4. Glass HUD classes remapped to new tokens so `/app` generate → R3F path is unchanged.
5. Interview line: “Phase 1 gives TrailForge a cartographic dusk identity—the brand leads the first viewport before you open the live city HUD.”

## Scene mix polish

1. `/app` no longer auto-paints SAMPLE city; fixture only under explicit DEMO (`?demo=1` / `VITE_DEMO_MODE`) or offline fallback (still badged).
2. Building window shader + bloom/lights toned down: dusk atmosphere without cyan/violet neon blast.
3. Live Generate still uses the same dusk HUD — just quieter materials over real OSM footprints.
4. Assumption: empty scene until Generate is preferable to a fake dense city that reads as “the product.”
5. Interview line: “Demo is opt-in; the 3D look stays dusk, not a nightclub.”

## Reconstruction Phase 2 summary — core app honesty + persistence shell

1. Empty `/app` shows honest EmptyCanvas until Generate or `?demo=1`; DEMO badge stays below nav when fixture/devMode.
2. Offline/error paths toast without painting SAMPLE unless DEMO is explicit; selection clears on new response.
3. Save itinerary requires signed-in user; failures toast without inventing city data; ResultPanel shows sign-in hint.
4. Location search / theme / route bar shell unchanged; real POIs still come from generate API only.
5. Interview line: “Phase 2 makes the empty canvas tell the truth—generate live OSM or open a labeled demo, never a silent fake city.”

## HQ cinematic FPP + solar day/night

1. Scene lighting follows approximate solar elevation from the tour lat/lon (longitude-based local clock); buildings fade windows day→night via `uDay`.
2. Route Play is a GSAP MotionPathPlugin first-person walk at eye height along the ordered POI path (Esc/Stop ends); orbit idle pauses while walking.
3. OSM footprint extrusions stay the geometry source — not photoreal 3D tiles (stack tradeoff).
4. Assumption: mid-latitude solar formula + lon offset is enough for atmosphere; no tz database in the browser.
5. Interview line: “Day/night is physics from coordinates; the walk is deterministic MotionPath on the grounded route.”

## Reconstruction Phase 3 summary — spatial coverage adapters

1. Added `apps/web/src/spatial/` with `resolveSpatialLayer()` coverage enum (`none` | `partial` | `full`) and honest fallback to OSM extrusions.
2. Without MapTiler/Cesium keys the scene matches Phase 2 (R3F footprints); keys alone never claim photoreal tiles.
3. `CoverageBadge` states mode + footprint-only note; `.env.example` documents optional keys; `docs/SPATIAL.md` records limitations.
4. Unit tests cover missing keys → `none` and “no fake full coverage” without a tiles adapter.
5. Interview line: “Phase 3 is coverage-aware honesty—extrusions by default, tiles only when an adapter and keys actually exist.”

## Reconstruction Phase 4 summary — cinematic camera polish

1. Kept #17 FPP MotionPath walk; extracted shared `route-path` helpers for densify + nearest stop.
2. Added elevated Follow camera along the ordered route; Aerial keeps IntroCamera orbit when idle.
3. RouteBar offers Aerial / Follow / Walk (FPP); Esc or end returns to aerial; reduced-motion snaps.
4. No FPP rewrite — follow is additive GSAP MotionPath at chase height selecting nearest POIs.
5. Interview line: “Phase 4 is three honest cameras on one grounded route—orbit, follow, and eye-height walk.”
