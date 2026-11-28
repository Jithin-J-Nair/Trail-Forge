# TrailForge engineering report (reconstruction complete)

**Track:** TF-43 (Phase 9) · parent TF-32  
**Repo tip at report time:** reconstruction Phases 0–8 on `main` through #28 (`192f4ff`); this report lands with Phase 9.  
**Date:** 2026-11-28 (Asia/Tokyo)  
**Method:** repository inspection after phases 0–9 — no invented deploy URLs, no inflated scores.

---

## What was built

TrailForge is a monorepo (`apps/web`, `apps/api`, `packages/shared`) that turns **area + theme + duration** into a grounded walking tour:

1. Geocode (Nominatim → Photon) + Overpass fetch → transform to local meters
2. LLM draft (Mock / Claude / Ollama) with OSM tags in a delimited data block
3. Grounding rejects uncited claims; route order is deterministic in code
4. R3F dusk city (merged extrusions), Aerial / Follow / FPP cameras
5. Export GeoJSON/CSV; optional auth + Postgres itineraries

Honesty rules held: no silent SAMPLE on production paths; DEMO / LOCAL_DEV always labeled; tiles/weather/pedestrian meters never fake success without a real provider.

---

## Architecture (post-reconstruction)

```text
Browser (Vite/React/R3F/Zustand)
  POST /api/generate ──► Express API
        osm/ → ai/ (LLM + grounding + route) → Zod GenerateResponse
        optional: auth/itineraries (DATABASE_URL + JWT_SECRET)
Web spatial/ → coverage-aware extrusions (tiles adapters = none without keys)
Web weather/ → Open-Meteo only when VITE_WEATHER_PROVIDER=openmeteo
```

Secrets stay server-side. Browser may only see `VITE_*` publishable flags (`apps/web/.env.example`).

---

## Phases delivered (reconstruction)

| Phase          | PR / tip | Outcome                                                 |
| -------------- | -------- | ------------------------------------------------------- |
| 0 Audit        | #20      | PRODUCT_AUDIT + MASTER plan                             |
| 1 Design       | #21      | Cartographic dusk landing + tokens                      |
| 2 Core honesty | #22      | Empty canvas; DEMO opt-in                               |
| 3 Spatial      | #23      | Coverage adapters; extrusions default                   |
| 4 Cameras      | #24      | Aerial / Follow / FPP                                   |
| 5 Environment  | #25      | Solar HUD + opt-in weather                              |
| 6 Routing      | #26      | Multi-objective + ORS/GH fallback                       |
| 7 Polish       | #27      | A11y, motion-safe, mobile HUD                           |
| 8 QA/security  | #28      | Eval, Helmet/CORS/rate tests, e2e smoke                 |
| 9 Prod         | this PR  | Env checklist, deploy docs, auth fail-fast, this report |

---

## Honest scorecard (§11 / reconstruction close)

Scores are 1–5. Compared to Phase 0 audit (bracketed).

| Dimension                        | Score | Was | Note                                                                      |
| -------------------------------- | ----- | --- | ------------------------------------------------------------------------- |
| Trust / grounding                | **5** | 4   | DEMO leak fixed; security tests; grounding + Mock eval assert scoring     |
| Live OSM path                    | **4** | 4   | Still solid; upstream 403/504 from some egress IPs remains                |
| 3D product feel                  | **4** | 3   | FPP + Follow + solar dayFactor; still extrusions, not a city twin         |
| Design / brand                   | **4** | 2   | Landing brand-first; dusk tokens; not AI-default purple                   |
| Spatial coverage (tiles/terrain) | **2** | 1   | Adapters + coverage badge exist; no photoreal tiles without keys/adapters |
| Prod readiness                   | **4** | 3   | CI/Docker/docs/SECURITY; JWT fail-fast; no claimed live demo URL          |

**Overall:** production-ready for demos and CI with Mock + labeled fixtures. Not a photoreal twin. Not keyless Claude. Not silently resilient to every OSM IP block.

---

## Verification commands (must stay green)

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run eval          # Mock → docs/EVAL.md
# optional: npx playwright install chromium && npm run test:e2e
```

Auth env: `assertAuthEnv()` in `apps/api/src/auth-env.ts` — if `DATABASE_URL` is set, boot requires `JWT_SECRET` ≥16 characters.

---

## Limitations (do not soft-pedal)

1. **No production demo URL** is claimed — placeholder only in `docs/DEPLOY.md`.
2. **MapTiler / Cesium keys alone do not enable tiles** — adapters fall back to OSM extrusions (`docs/SPATIAL.md`).
3. **Default LLM is Mock** — Claude/Ollama need configuration.
4. **Weather is off** until Open-Meteo is opted in; failures stay unavailable.
5. **Pedestrian meters** fall back to labeled euclidean×1.3 without ORS/GraphHopper keys.
6. **Playwright FPP walk is skipped** in headless WebGL (documented).
7. **Dual `ai/` + `llm/` stacks** remain technical debt — generate uses `ai/`.

---

## Interview line

“We rebuilt TrailForge end-to-end without lying about coverage: grounded OSM tours, cinematic cameras on real routes, and a scorecard that admits extrusions aren’t Google Earth.”
