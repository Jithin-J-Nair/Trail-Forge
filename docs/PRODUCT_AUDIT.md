# TrailForge product audit (Phase 0)

**Audited tip:** `main` @ `4f32032` (Merge PR #19 skills; prior Arena hygiene `d9a6536`)  
**Date:** 2026-11-28 (Asia/Tokyo) — resumed after user stop; rebased after #19  
**Track:** TF-33  
**Method:** repository inspection + open PR review (#16, #17; #19 merged); no speculative rewrite.

## Assumptions (stated, not questions)

1. Autonomous reconstruction phases 0–9 are authorized; stack preference remains npm workspaces + Vite/React/R3F + Express + Zod + Vitest + Claude/Ollama/Mock.
2. Working OSM → generate → grounding → export → R3F scene must be preserved; MapLibre/Cesium/terrain are **additive** adapters only when coverage needs exceed extruded OSM footprints.
3. Real-data honesty is non-negotiable: no silent SAMPLE/fake POIs/elevation/weather on production paths; fixtures require `?demo=1` / `VITE_DEMO_MODE` / `LOCAL_DEV_DATA_SOURCE` + visible badge.
4. Photoreal Google 3D Tiles / Cesium ion / MapTiler require keys; without keys we ship adapters + graceful fallbacks and do **not** claim coverage.
5. Skills from merged PR #19 live under `.cursor/skills/` (TF-34 trim + `.prettierignore`). Phase 1 uses them in-repo.

---

## 1. Current capabilities (what works)

| Capability                        | Evidence                                                                                              | Honesty                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Monorepo + CI                     | `package.json` workspaces; `.github/workflows/ci.yml` typecheck/lint/test/build                       | Solid                                               |
| Shared Zod contracts + projection | `packages/shared` generate request/response, POI/building/road, claims, route                         | Solid                                               |
| Live geocode + Overpass           | `apps/api/src/osm/{geocode,overpass,fetch-area,transform}.ts`; Photon fallback; multi-mirror Overpass | Works when upstream reachable; typed 502 on failure |
| Geo resilience layer (Arena keep) | `apps/api/src/geo/` orchestrator, circuit breaker, retry, optional Mapbox/Geoapify/ORS                | Additive; OSM path still primary for generate       |
| Grounded LLM drafts               | `apps/api/src/ai/{prompt,generate,grounding,route}.ts`; Mock/Claude/Ollama                            | Mock default; grounding rejects uncited claims      |
| `POST /api/generate`              | `routes/generate.ts` + `pipeline/generate-tour.ts`                                                    | End-to-end with fixtures in CI                      |
| R3F dusk city                     | Merged buildings, roads, pins, route line, keyboard nav, adaptive quality                             | Perf budget documented                              |
| Glass HUD product UI              | Search/result panels, i18n ja/en, export GeoJSON/CSV, DEMO badge plumbing                             | UX works; landing is thin                           |
| Auth / saved itineraries          | `auth/`, `itineraries/`, `profile/`, optional `DATABASE_URL`                                          | Optional; degraded without DB                       |
| Docker / eval / docs              | Dockerfile, `docs/{ARCHITECTURE,PERFORMANCE,DEPLOY,EVAL,PHASES}`                                      | Present                                             |

**Preserve:** OSM fetch → transform → LLM data-block → grounding → deterministic route → R3F extrusions → export. Do not rip-replace this spine.

---

## 2. Architecture snapshot

```text
apps/web (Vite/React/R3F/Zustand)
  └─ POST /api/generate ──► apps/api (Express)
        ├─ osm/ (Nominatim+Photon, Overpass, cache, transform)
        ├─ geo/ (optional multi-provider resilience)
        ├─ ai/ (generateJson + grounding + route)  ← production generate path
        ├─ llm/ (older TourRequest-shaped providers) ← legacy parallel
        ├─ enrichment/ (Wikipedia/Wikidata optional)
        └─ auth/itineraries/profile/analytics (+ optional Postgres)
packages/shared (Zod + lonLat projection)
```

**Threat model (still valid):** OSM tags are untrusted data; LLM keys stay server-side; helmet + rate limits + request-id; grounding is the trust boundary.

---

## 3. Weaknesses & technical debt

1. **DEMO honesty gap on `main`:** `GeneratePage` still auto-paints `SAMPLE_RESPONSE` on every `/app` mount (`apps/web/src/pages/GeneratePage.tsx` lines 49–54). PR #16 fixes this; until merge, first paint looks like a real city.
2. **Duplicate LLM stacks:** `apps/api/src/ai/*` (used by generate) and `apps/api/src/llm/*` (wired for `/api/v1/llm/generate` + TourRequest). Confusing; consolidate surgically later, do not rewrite both at once.
3. **Neon/cyan–violet glass aesthetic:** Matches common AI-dashboard look; brand/identity weak on landing (`LandingPage.tsx` is centered text on flat `#05070D`).
4. **Fonts:** Inter + Space Grotesk — Inter is a default stack to move away from for brand surfaces.
5. **Optional Arena surface area:** Redis, Mapbox/Geoapify keys, auth/DB — useful but unevenly documented; generate does not require them.
6. **No MapLibre/Cesium/terrain yet:** Acceptable for footprint extrusions; coverage-aware 3D tiles need adapters + keys (Phase 3).
7. **No real solar/weather on `main`:** Fixed dusk lighting; PR #17 adds approximate solar (good Phase 4/5 seed).
8. **Fly-through is orbit-to-stops, not cinematic FPP:** PR #17 replaces with GSAP MotionPath walk.
9. **Persistence:** Saved itineraries need Postgres; local-first offline save not first-class.
10. **Lighthouse / a11y CI:** Documented intent; no automated Lighthouse job.

---

## 4. Risks

| Risk                                         | Impact                             | Mitigation                                                                 |
| -------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| Nominatim/Overpass 403/504 from cloud egress | Empty or 502 tours                 | Photon + multi-mirror already; labeled DEMO/LOCAL_DEV; never silent SAMPLE |
| Merging incomplete HQ PRs mid-reconstruction | Conflicts with design/scene phases | Merge small honesty PR; rebase cinematic PR after Phase 1 if needed        |
| Speculative Cesium rewrite                   | Breaks working R3F + CI            | Keep R3F primary; tiles as optional layer                                  |
| Keyless “photoreal” claims                   | Dishonest product                  | Adapters + `.env.example` + coverage badge / fallback copy                 |
| Dual `ai/` + `llm/` drift                    | Wrong provider in tests            | Document ownership; delete dead path only with tests green                 |
| Auth/JWT without hardened secrets in prod    | Account risk                       | Require `JWT_SECRET` when auth enabled; fail-fast env                      |

---

## 5. Missing features (vs reconstruction brief)

| Area                                                      | Gap                                    | Target phase                |
| --------------------------------------------------------- | -------------------------------------- | --------------------------- |
| Design system + cinematic landing identity                | Thin landing; neon token set           | **1**                       |
| Core app polish: empty state, persistence UX, POI honesty | Auto-SAMPLE on main; weak empty canvas | **2** (+ merge #16)         |
| Spatial: MapLibre 2D / terrain / tiles adapters           | None                                   | **3**                       |
| Cinematic FPP walk                                        | Orbit fly-through only on main         | **4** (seeded by #17)       |
| Solar + weather                                           | Fixed dusk                             | **5** (solar seeded by #17) |
| Route intelligence (walkability, time windows)            | NN+2-opt only                          | **6**                       |
| Polish / motion / a11y depth                              | Partial                                | **7**                       |
| QA / eval expansion                                       | Mock eval exists                       | **8**                       |
| Prod readiness (observability, keys, deploy)              | Docker + CI                            | **9**                       |

---

## 6. Performance

From `docs/PERFORMANCE.md` (Phase 9 measurements):

- UI shell ~217 kB / Scene chunk ~861 kB (gzip ~66 / ~232 kB).
- Merged building mesh + road LineSegments keep draw calls well under 150.
- Budget: 60fps mid laptop, ≤2000 buildings, adaptive DPR, reduced-motion respected.

**Watch:** GSAP + bloom + future tiles can blow the Scene chunk — code-split and quality gates stay mandatory.

---

## 7. Dependencies — keep / replace / add

| Dep / area                                                 | Verdict                       | Notes                                           |
| ---------------------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| React 18, Vite 6, R3F, drei, three                         | **Keep**                      | Core scene stack                                |
| Zustand, Zod, Express, pino, helmet, rate-limit, lru-cache | **Keep**                      | Fixed stack                                     |
| Tailwind 3                                                 | **Keep**                      | Retokenize; no framework swap                   |
| `@react-three/postprocessing` Bloom                        | **Keep** (tone down)          | PR #16 already softens                          |
| Inter font                                                 | **Replace on brand surfaces** | Expressive display + JP-capable body            |
| Cyan/violet neon tokens                                    | **Replace**                   | Distinct cartographic dusk palette              |
| `gsap`                                                     | **Add** (via #17 or Phase 4)  | FPP MotionPath; landing micro-motion            |
| MapLibre GL                                                | **Add optional** Phase 3      | 2D overview / coverage UI — not R3F replacement |
| Cesium / 3D Tiles                                          | **Add optional** Phase 3      | Key-gated adapter only                          |
| `pg` / `jose` / `bcryptjs` / `ioredis`                     | **Keep optional**             | Auth/cache; generate works without              |
| Duplicate `llm/` providers                                 | **Consolidate later**         | Prefer `ai/` path                               |

---

## 8. Recommended architecture (decision)

**Stay on the monorepo spine. Do not rewrite to Cesium-first or Next.js.**

1. **Primary 3D:** R3F extruded OSM footprints + merged meshes (proven budget).
2. **Additive spatial:** MapLibre for 2D/minimap; optional terrain/tiles provider interface with `coverage: 'none' | 'partial' | 'full'` and UI fallback to extrusions when keys/coverage missing.
3. **Honesty layer:** Single `dataProvenance` story — `live` | `demo` | `local_dev` — badge always visible when not live.
4. **LLM:** One provider interface (`ai/`); retire unused `llm/` after a dedicated hygiene PR.
5. **Route:** Remains deterministic in code; enrichment may score POIs but must not invent geometry.
6. **Product shell:** Cinematic discovery landing → `/app` glass HUD over the scene; design tokens shared via CSS variables.

**R3F decision:** R3F alone **can** meet coverage-aware 3D for v1 tours (footprints). MapLibre/Cesium/terrain are quality upgrades behind adapters — not a prerequisite to ship, and not a stack rip-replace.

---

## 9. Open PRs — recommendations

### PR #16 — `fix(web): opt-in DEMO city + quieter dusk scene`

- **URL:** https://github.com/Jithin-J-Nair/Trail-Forge/pull/16
- **Base:** `main` · **Head:** `cursor/scene-demo-neon-mix-d8dc` @ `edddf85`
- **CI:** check **success** · **mergeable_state:** clean
- **Diff:** ~+29/−18 across GeneratePage, Buildings, Scene, PHASES
- **Verdict: MERGE** (high priority, low risk).
- Restores DEMO opt-in (`isDemoMode()` gate on mount), softens neon windows/bloom, keeps live Generate. Directly fixes the honesty gap on `main`.

### PR #17 — `feat(web): solar day/night + cinematic FPP route walk`

- **URL:** https://github.com/Jithin-J-Nair/Trail-Forge/pull/17
- **Base:** PR #16 head (stacked, GitHub stack #18 pos 2) · **Head:** `cursor/hq-cinematic-fpp-d8dc` @ `a983da4`
- **CI:** check **success** · **mergeable_state:** clean
- **Diff:** ~+425/−144 — adds `solar.ts`, `DayNightLights`, `FppWalk` (GSAP), removes `FlyThrough`
- **Verdict: MERGE after #16** when CI green; else **rebase** onto `main` (or onto Phase 1) surgically.
- Do **not** close — it is real Phase 4/5 groundwork with tests. Expect PHASES.md / Scene conflicts with later design work; rebase rather than rewrite. Geometry remains OSM extrusions (honest).

### PR #19 — `Install curated Cursor agent skills for reconstruction`

- **URL:** https://github.com/Jithin-J-Nair/Trail-Forge/pull/19
- **Status: MERGED** @ `4f32032` (TF-34 Karpathy trim + `.prettierignore` for `.cursor/skills/**`).
- Phase 1 uses in-repo `.cursor/skills/` directly.

### Stacking note

GitHub stack #18: #16 (pos 1) → #17 (pos 2). Preferred order: merge #16 → merge #17 → Phase 0 docs → Phase 1 design. If Phase 1 lands first, rebase #16/#17 afterward; do not silently duplicate their fixes.

---

## 10. Agent skills (installed / planned)

| Skill / source                                                   | Status           | Purpose                                                                                                                   |
| ---------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Karpathy guidelines (plugin)                                     | Available        | Surgical edits, verifiable done                                                                                           |
| GSAP skills (greensock plugin cache)                             | Available        | MotionPath FPP + landing motion                                                                                           |
| `.cursor/skills/*` (PR #19 merged)                               | **On main**      | frontend-design, ui-ux-pro-max, emil-design-eng, animate*, gsap*, vercel-react-best-practices, web-design-guidelines, tdd |
| MapLibre / Cesium / R3F dedicated skills                         | **Gap**          | None in evaluated sources; use `ui-ux-pro-max --stack threejs` + MapLibre UX rows                                         |
| External skill repos (anthropics, impeccable, superpowers, etc.) | Evaluated in #19 | Install only design/Three/R3F/map/GSAP/perf/a11y/test — no blind script exec                                              |

See `docs/AGENT_SKILLS.md` for the living install log.

---

## 11. Honest scorecard

### Phase 0 baseline (2026-11-28 pre-reconstruction)

| Dimension                        | Score (1–5) | Note                                                    |
| -------------------------------- | ----------- | ------------------------------------------------------- |
| Trust / grounding                | 4           | Strong schemas + grounding; DEMO leak on main until #16 |
| Live OSM path                    | 4           | Re-hardened; upstream still flaky from some IPs         |
| 3D product feel                  | 3           | Solid extrusions; neon identity + no FPP on main        |
| Design / brand                   | 2           | Landing underpowered; AI-default palette                |
| Spatial coverage (tiles/terrain) | 1           | Not started; adapters planned                           |
| Prod readiness                   | 3           | CI/Docker/docs; secrets/DB optional                     |

### Reconstruction close (Phase 9 — see `docs/ENGINEERING_REPORT.md`)

| Dimension                        | Score (1–5) | Note                                                               |
| -------------------------------- | ----------- | ------------------------------------------------------------------ |
| Trust / grounding                | 5           | DEMO opt-in; grounding + security tests; Mock eval asserts scoring |
| Live OSM path                    | 4           | Unchanged: solid path; egress 403/504 still possible               |
| 3D product feel                  | 4           | Aerial / Follow / FPP + solar; still footprint extrusions          |
| Design / brand                   | 4           | Brand-first landing; cartographic dusk tokens                      |
| Spatial coverage (tiles/terrain) | 2           | Coverage adapters + badge; no photoreal without keys/adapters      |
| Prod readiness                   | 4           | Deploy/SECURITY docs; JWT fail-fast; no invented live demo URL     |

**Bottom line (Phase 0):** Keep the working generate→3D core. Merge honesty + cinematic PRs (#16/#17). Skills (#19) are on main. Rebuild identity in Phase 1 without a stack rewrite. Photoreal tiles stay key-gated and fallback-honest.

**Bottom line (Phase 9):** Reconstruction complete. Honest demos with Mock + labeled fixtures are production-ready; photoreal twin / keyless Claude / silent SAMPLE are explicitly out of scope.
