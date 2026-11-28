import type { Request, Response } from 'express';
import { readGoogleMapsApiKey } from './google-key.js';
import { logger } from '../logger.js';

const GOOGLE_TILE_HOST = 'https://tile.googleapis.com';

/** Max upstream wait — keep UI responsive if Google is slow. */
const UPSTREAM_TIMEOUT_MS = 20_000;

/**
 * Proxy Map Tiles API paths under /api/spatial/google-tiles/*
 * Appends the server key; never echoes it to logs or the client.
 */
export async function proxyGoogleTile(req: Request, res: Response): Promise<void> {
  const key = readGoogleMapsApiKey();
  if (!key) {
    res.status(503).json({
      available: false,
      error: 'google_tiles_unavailable',
      reason: 'GOOGLE_MAPS_API_KEY unset',
    });
    return;
  }

  // Mounted at /google-tiles — path is /v1/3dtiles/...
  const suffix = req.path;
  if (!suffix.startsWith('/v1/3dtiles')) {
    res.status(400).json({ error: 'invalid_google_tiles_path' });
    return;
  }

  const upstream = new URL(`${GOOGLE_TILE_HOST}${suffix}`);
  for (const [k, v] of Object.entries(req.query)) {
    if (typeof v === 'string' && k !== 'key') upstream.searchParams.set(k, v);
  }
  // Attach key last so client query cannot override it.
  upstream.searchParams.set('key', key);

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstreamRes = await fetch(upstream, {
      method: 'GET',
      signal: ac.signal,
      headers: { Accept: req.headers.accept ?? '*/*' },
    });
    res.status(upstreamRes.status);
    const contentType = upstreamRes.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    const buf = Buffer.from(await upstreamRes.arrayBuffer());
    res.send(buf);
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    logger.warn(
      { err: aborted ? 'timeout' : 'upstream_error', path: suffix },
      'Google tiles proxy failed',
    );
    res.status(502).json({ error: 'google_tiles_proxy_error' });
  } finally {
    clearTimeout(timer);
  }
}
