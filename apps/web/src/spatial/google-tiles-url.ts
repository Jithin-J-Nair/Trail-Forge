const PROXY_PREFIX = '/api/spatial/google-tiles';

/**
 * Rewrite Google tile URIs (host or path-absolute /v1/3dtiles/...) onto the
 * same-origin API proxy so the Maps API key never enters the browser bundle.
 */
export function preprocessGoogleTilesUrl(uri: string): string {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(uri, base);
    if (u.pathname.startsWith(PROXY_PREFIX)) {
      return `${u.pathname}${u.search}`;
    }
    if (u.hostname === 'tile.googleapis.com' || u.pathname.startsWith('/v1/3dtiles')) {
      return `${PROXY_PREFIX}${u.pathname}${u.search}`;
    }
    return uri;
  } catch {
    return uri;
  }
}
