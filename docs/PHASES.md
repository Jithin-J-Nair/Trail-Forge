# TrailForge phases

## Assumptions

- Node.js current LTS (engines require >=22); package manager is npm workspaces.
- Default git branch is `main`.
- Claude and Ollama providers are interface stubs that fail clearly without `ANTHROPIC_API_KEY` / `OLLAMA_HOST`; Mock is the default and is used in tests/CI.
- English and Japanese UI/copy placeholders are acceptable in Phase 1.
- Phase 1 does not call Overpass/Nominatim, does not build a full 3D city, and does not run real LLM generation beyond the Mock provider.
- LLM API keys never ship to the browser; all provider code lives in `apps/api`.
- Local API CORS origin defaults to `http://localhost:5173`; Vite proxies `/api` to the API.

## Phase 1 summary

1. Built an npm-workspaces monorepo with strict TypeScript, ESLint, Prettier, Vitest, concurrent `npm run dev`, and GitHub Actions CI.
2. The API validates env with Zod at boot, serves `/api/health` → `{status:"ok"}`, and wires Helmet, CORS, Pino, rate limits, LRU cache, plus Mock/Claude/Ollama LLM providers.
3. The web app is a dark Tailwind shell (header + OSM footer) with a tiny R3F placeholder; Vite proxies `/api` so the browser can hit health without CORS friction.
4. Shared Zod schemas are the contract between web, API, and LLM I/O; secrets stay server-side.
5. Interview line: “Phase 1 is the production skeleton—typed contracts, proxied health check, fail-fast env, and CI—before any OSM fetch or grounded generation.”
