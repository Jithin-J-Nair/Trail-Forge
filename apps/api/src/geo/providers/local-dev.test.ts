import { afterEach, describe, expect, it } from 'vitest';
import { LocalDevGeocodeProvider, LocalDevPoiProvider } from './local-dev.js';

describe('LOCAL_DEV_DATA_SOURCE', () => {
  const prev = process.env['LOCAL_DEV_DATA_SOURCE'];
  afterEach(() => {
    if (prev === undefined) delete process.env['LOCAL_DEV_DATA_SOURCE'];
    else process.env['LOCAL_DEV_DATA_SOURCE'] = prev;
  });

  it('is disabled by default', () => {
    delete process.env['LOCAL_DEV_DATA_SOURCE'];
    expect(new LocalDevGeocodeProvider().isConfigured()).toBe(false);
  });

  it('returns clearly marked dev fixture data when enabled', async () => {
    process.env['LOCAL_DEV_DATA_SOURCE'] = 'true';
    const geo = new LocalDevGeocodeProvider();
    const g = await geo.geocode({ query: 'Paris' });
    expect(g.displayName).toContain('DEV MODE');
    const poi = new LocalDevPoiProvider();
    const p = await poi.discover({ center: { lat: g.lat, lon: g.lon }, radiusMeters: 1000, theme: 'culture' });
    expect(p.scene.pois.length).toBeGreaterThan(0);
    expect(p.scene.pois[0].name).toContain('DEV MODE');
  });
});
