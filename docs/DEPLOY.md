# Deployment checklist

## Demo URL

Placeholder (not live): `https://trailforge.example.com` (web) · `https://api.trailforge.example.com` (API)

Replace after first real deploy. Do not invent a public URL.

## Pre-flight

- [ ] `npm ci && npm run typecheck && npm run lint && npm test && npm run build`
- [ ] `npm run eval` (MockProvider) regenerates `docs/EVAL.md`
- [ ] Optional: `npx playwright install chromium && npm run test:e2e` (FPP walk skipped)
- [ ] Secrets only via host secret store — never commit `.env`
- [ ] `CORS_ORIGIN` equals the exact web origin (scheme + host + port)
- [ ] If using saved itineraries: set both `DATABASE_URL` and `JWT_SECRET` (≥16 chars) — API **fails fast** otherwise
- [ ] `LLM_PROVIDER=mock` unless Claude/Ollama keys/hosts are configured
- [ ] Read `docs/SECURITY.md`

## Local Docker API

```bash
docker compose up --build api
curl -s http://localhost:3001/api/health   # → {"status":"ok"}
curl -s http://localhost:3001/api/ready    # → {"status":"ready",...} (DB check only if DATABASE_URL set)
```

`docker compose` profile `ollama` is optional for local models.

## Web (Vercel / static host)

1. `npm ci && npm run build -w @trailforge/web`
2. Publish `apps/web/dist`
3. Proxy `/api/*` to the API origin (or Vercel rewrites)
4. Public env only from `apps/web/.env.example` (`VITE_*`) — no LLM/routing secrets

## API (Render / Fly / Railway)

1. Root `Dockerfile` (non-root user; healthcheck `/api/health`)
2. Env from `apps/api/.env.example` (see also root `.env.example`)
3. Platform healthcheck: `GET /api/health` → `{ "status": "ok" }`
4. Readiness: `GET /api/ready` → `ready` or `503 degraded` when `DATABASE_URL` is set and DB fails

## Security checklist

- [x] Helmet headers
- [x] CORS allow-list (`CORS_ORIGIN` only)
- [x] Rate limits (global 60/min + generate 10/min)
- [x] JSON body size limit 32kb
- [x] Zod validation on inputs / LLM drafts / responses
- [x] No stack traces or API keys in client error payloads
- [x] Auth fail-fast when `DATABASE_URL` without `JWT_SECRET`
- [x] Dependency lockfile (`package-lock.json`); CI runs `npm audit --omit=dev || true` (advisory, non-blocking)

## Honest deploy notes

- Nominatim/Overpass may 403/504 from some cloud egress IPs — use labeled `?demo=1` / `LOCAL_DEV_DATA_SOURCE` for offline demos.
- Photoreal MapTiler/Cesium tiles are **not** shipped; keys alone do not enable tiles (see `docs/SPATIAL.md`).
- Default LLM is **Mock** — not a production copywriter without Claude/Ollama.
