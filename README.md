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
npm run typecheck
npm run lint
npm test
npm run dev:web
npm run dev:api
```

## Attribution

Map data © OpenStreetMap contributors.
