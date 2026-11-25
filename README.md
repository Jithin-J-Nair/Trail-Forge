# TrailForge

Plan themed walking tours from real OpenStreetMap places, with grounded bilingual place descriptions and an interactive 3D city preview.

## Monorepo

| Workspace         | Role                                     |
| ----------------- | ---------------------------------------- |
| `apps/web`        | Vite + React + R3F client                |
| `apps/api`        | Express API (LLM calls stay server-side) |
| `packages/shared` | Shared Zod schemas + LLM provider types  |

## Scripts

```bash
npm install
npm run dev          # web + api concurrently
npm run build
npm run typecheck
npm run lint
npm test
```

Copy `apps/api/.env.example` to `apps/api/.env` for local overrides (`CORS_ORIGIN`, LLM keys).

Vite proxies `/api` → `http://localhost:3001` (e.g. `GET /api/health` → `{ "status": "ok" }`).

## Attribution

Map data © OpenStreetMap contributors.
