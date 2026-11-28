import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Express, Request, RequestHandler } from 'express';
import express from 'express';

/** Resolve monorepo `apps/web/dist` (override with `WEB_DIST_PATH`). */
export function resolveWebDist(): string {
  const fromEnv = process.env['WEB_DIST_PATH'];
  if (fromEnv) return path.resolve(fromEnv);
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '../../../apps/web/dist');
}

/**
 * Serve the Vite build when `SERVE_WEB=true`, or in production when `index.html` exists.
 * Explicit `SERVE_WEB=false` disables even in production.
 */
export function shouldServeWeb(options: { serveWeb?: boolean; webDist?: string } = {}): boolean {
  if (options.serveWeb === true) return true;
  if (options.serveWeb === false) return false;
  if (process.env['SERVE_WEB'] === 'true') return true;
  if (process.env['SERVE_WEB'] === 'false') return false;
  if (process.env['NODE_ENV'] !== 'production') return false;
  const dist = options.webDist ?? resolveWebDist();
  return existsSync(path.join(dist, 'index.html'));
}

/** True when the browser Origin host matches this request's Host (same-origin SPA). */
export function isSameOriginRequest(origin: string, req: Request): boolean {
  const raw = req.headers['x-forwarded-host'] ?? req.headers.host;
  if (typeof raw !== 'string' || raw.length === 0) return false;
  const host = raw.split(',')[0]?.trim();
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Mount `express.static` + SPA fallback (non-`/api` → index.html). Call after API routes. */
export function mountWebStatic(app: Express, webDist: string): void {
  const indexHtml = path.join(webDist, 'index.html');
  app.use(express.static(webDist, { index: false, fallthrough: true }));

  const spaFallback: RequestHandler = (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(indexHtml, (err) => {
      if (err) next(err);
    });
  };
  app.use(spaFallback);
}
