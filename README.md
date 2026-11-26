# TrailForge

TrailForge turns an area + theme + duration into a grounded walking tour: real OpenStreetMap places, a dusk 3D city preview, and Japanese/English blurbs that may only cite OSM tags. Claims are verified in code before they reach export.

![Screenshot placeholder](docs/media/screenshot-placeholder.svg)

## Quick start

```bash
npm ci
cp apps/api/.env.example apps/api/.env
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to the API on port 3001.

## Architecture

```mermaid
flowchart LR
  Web[Web UI] --> API
  API --> OSM[Nominatim + Overpass]
  API --> LLM[Mock / Claude / Ollama]
  LLM --> Ground[Grounding]
  OSM --> Route[Deterministic route]
  Ground --> Web
  Route --> Web
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the threat model and grounding rules.

## Workspaces

| Path              | Role                     |
| ----------------- | ------------------------ |
| `apps/web`        | Vite + React + R3F       |
| `apps/api`        | Express generate API     |
| `packages/shared` | Zod schemas + projection |

## Scripts

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run eval          # MockProvider fixture eval → docs/EVAL.md
```

## Env

See `apps/api/.env.example`. LLM keys never go to the browser. Default `LLM_PROVIDER=mock`.

- `?demo=1` or `VITE_DEMO_MODE=true` — UI fixture with a **DEMO DATA** badge (never silent).
- `LOCAL_DEV_DATA_SOURCE=true` — API returns labeled local fixtures (**DEV MODE**), not live OSM.

## Docs

| Doc                                          | Purpose                            |
| -------------------------------------------- | ---------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Data flow, grounding, threat model |
| [docs/PHASES.md](docs/PHASES.md)             | What each phase shipped            |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md)   | 3D budgets                         |
| [docs/DEPLOY.md](docs/DEPLOY.md)             | Docker / deploy                    |
| [docs/EVAL.md](docs/EVAL.md)                 | Mock eval output                   |

## Data & licenses

Map data © OpenStreetMap contributors (ODbL). See `NOTICE`. App code is MIT (`LICENSE`).

## Limitations (honest)

- Nominatim/Overpass may rate-limit or block some cloud IPs; use DEMO_MODE or LOCAL_DEV for offline UI — both are labeled.
- Mock LLM is deterministic for CI; Claude/Ollama need keys/hosts.
- 3D scene uses merged meshes but is not a full city twin; building caps apply.

## Deploy

[docs/DEPLOY.md](docs/DEPLOY.md) · Docker: `docker compose up --build api`
