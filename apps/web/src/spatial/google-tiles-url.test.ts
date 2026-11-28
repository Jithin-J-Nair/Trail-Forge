import { describe, expect, it } from 'vitest';
import { preprocessGoogleTilesUrl } from './google-tiles-url.js';

describe('preprocessGoogleTilesUrl', () => {
  it('rewrites Google host URLs onto the API proxy', () => {
    expect(
      preprocessGoogleTilesUrl('https://tile.googleapis.com/v1/3dtiles/root.json?session=abc'),
    ).toBe('/api/spatial/google-tiles/v1/3dtiles/root.json?session=abc');
  });

  it('rewrites path-absolute Google tile URIs onto the proxy', () => {
    expect(preprocessGoogleTilesUrl('/v1/3dtiles/datasets/CgA/files/x.json?session=s')).toBe(
      '/api/spatial/google-tiles/v1/3dtiles/datasets/CgA/files/x.json?session=s',
    );
  });

  it('leaves already-proxied paths unchanged', () => {
    expect(preprocessGoogleTilesUrl('/api/spatial/google-tiles/v1/3dtiles/root.json')).toBe(
      '/api/spatial/google-tiles/v1/3dtiles/root.json',
    );
  });
});
