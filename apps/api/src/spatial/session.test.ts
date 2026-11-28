import { afterEach, describe, expect, it } from 'vitest';
import { createGoogleTilesSession } from './session.js';

describe('createGoogleTilesSession', () => {
  const prev = process.env['GOOGLE_MAPS_API_KEY'];

  afterEach(() => {
    if (prev === undefined) delete process.env['GOOGLE_MAPS_API_KEY'];
    else process.env['GOOGLE_MAPS_API_KEY'] = prev;
  });

  it('returns labeled unavailable when key is unset', () => {
    delete process.env['GOOGLE_MAPS_API_KEY'];
    const session = createGoogleTilesSession({});
    expect(session).toEqual({
      available: false,
      error: 'google_tiles_unavailable',
      reason: 'GOOGLE_MAPS_API_KEY unset',
    });
  });

  it('returns proxied rootUrl without exposing the key', () => {
    const session = createGoogleTilesSession(
      { GOOGLE_MAPS_API_KEY: 'test-secret-key' },
      Date.UTC(2026, 0, 1),
    );
    expect(session.available).toBe(true);
    if (!session.available) return;
    expect(session.provider).toBe('google-photorealistic-3d');
    expect(session.rootUrl).toBe('/api/spatial/google-tiles/v1/3dtiles/root.json');
    expect(session.rootUrl).not.toMatch(/key=/i);
    expect(JSON.stringify(session)).not.toContain('test-secret-key');
    expect(session.expiresAt).toBe(
      new Date(Date.UTC(2026, 0, 1) + 3 * 60 * 60 * 1000).toISOString(),
    );
  });
});
