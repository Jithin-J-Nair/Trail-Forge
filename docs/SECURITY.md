# Security checklist (Phase 8)

## Secrets

| Secret                     | Where                         | Browser? |
| -------------------------- | ----------------------------- | -------- |
| `ANTHROPIC_API_KEY`        | `apps/api` env only           | Never    |
| `JWT_SECRET`               | `apps/api` when auth enabled  | Never    |
| `OPENROUTESERVICE_API_KEY` | `apps/api` pedestrian routing | Never    |
| `GRAPHHOPPER_API_KEY`      | `apps/api` pedestrian routing | Never    |
| `VITE_MAPTILER_KEY`        | Publishable map style (opt)   | Yes      |
| `VITE_WEATHER_PROVIDER`    | Opt-in Open-Meteo (no key)    | Yes      |

LLM and routing keys must never appear in Vite `VITE_*` vars or generate JSON.

## HTTP controls

- **Helmet** on all API responses
- **CORS** allows only `CORS_ORIGIN` (default `http://localhost:5173`); other origins get no ACAO header
- **Global rate limit** 60 req/min/IP
- **Generate rate limit** 10 req/min/IP (`POST /api/generate`)
- **Auth routes** have a tighter limiter
- JSON body limit **32kb**
- Request id on generate errors

## Trust boundary

OSM tag text is untrusted data (prompt-injection defense). Grounding rejects uncited claims. Route order is never LLM-authored.

## Tests

- `apps/api/src/security.test.ts` — Helmet, CORS, key non-leak, global rate limit
- `apps/api/src/routes/generate.test.ts` — generate 429 + body key scan
- `apps/web/src/security-client.test.ts` — no server secret names on `import.meta.env`
