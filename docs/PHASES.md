# TrailForge phases

## Assumptions

- Node.js current LTS (engines require >=22); package manager is npm workspaces.
- Default git branch is `main`.
- Claude and Ollama providers are interface stubs that fail clearly without `ANTHROPIC_API_KEY` / `OLLAMA_HOST`; Mock is the default and is used in tests/CI.
- English and Japanese UI/copy placeholders are acceptable in Phase 1.
- Phase 1 does not call Overpass/Nominatim, does not build a full 3D city, and does not run real LLM generation beyond the Mock provider.
- LLM API keys never ship to the browser; all provider code lives in `apps/api`.

## Phase 1 summary

1. Scaffolded an npm-workspaces monorepo (`apps/web`, `apps/api`, `packages/shared`) with strict TypeScript, Vitest, ESLint, and Prettier.
2. Shared Zod schemas validate tour requests and LLM I/O; the API wires Express, Helmet, rate limiting, Pino, and an LRU cache behind a `/health` check.
3. Three LLM providers implement one interface: Mock (works in CI), Claude stub, and Ollama stub.
4. The web app is a minimal Vite/React/Tailwind form plus a tiny R3F placeholder scene, with “© OpenStreetMap contributors” in the footer (and README).
5. Interview line: “Phase 1 proves the production skeleton—typed contracts, server-only LLM boundary, and CI-green tooling—before any OSM or generation logic.”
