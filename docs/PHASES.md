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
