import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOpenMeteo } from './openmeteo.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchOpenMeteo', () => {
  it('maps a live payload to an honest live snapshot', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current: { temperature_2m: 22.4, weather_code: 0, precipitation: 0 },
        }),
      }),
    );
    const s = await fetchOpenMeteo(35.68, 139.76);
    expect(s.state).toBe('live');
    expect(s.condition).toBe('Clear');
    expect(s.tempC).toBe(22.4);
    expect(s.label).toContain('22°C');
  });

  it('returns error on HTTP failure — never invents weather', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );
    const s = await fetchOpenMeteo(35.68, 139.76);
    expect(s.state).toBe('error');
    expect(s.label).toMatch(/unavailable/i);
  });
});
