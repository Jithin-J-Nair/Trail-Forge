# Deployment

## Demo URL

Placeholder: `https://trailforge.example.com` (web) · `https://api.trailforge.example.com` (API)

Replace after first deploy.

## Web (Vercel / static host)

1. Build: `npm ci && npm run build -w @trailforge/web`
2. Publish `apps/web/dist`
3. Set rewrite/proxy so `/api/*` forwards to the API origin (or configure Vercel rewrites)

Env (public only): none required for LLM (keys stay on API).

## API (Render / Fly / Railway)

1. Use the root `Dockerfile` (non-root user, `/api/health` healthcheck)
2. Env vars (from `apps/api/.env.example`):
   - `PORT`
   - `CORS_ORIGIN` (exact web origin)
   - `LLM_PROVIDER` (`mock` | `claude` | `ollama`)
   - `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` (if Claude)
   - `OLLAMA_HOST` / `OLLAMA_MODEL` (if Ollama)
3. Platform healthcheck: `GET /api/health` → `{ "status": "ok" }`
4. Secrets: inject via the host’s secret store; never commit `.env`

## Security checklist

- [x] Helmet headers
- [x] Rate limits (global + generate)
- [x] JSON body size limit
- [x] Zod validation on inputs / LLM drafts / responses
- [x] No stack traces or API keys in client error payloads
- [x] Dependency versions locked via `package-lock.json`
