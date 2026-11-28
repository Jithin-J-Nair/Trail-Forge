import type { PoiLocal } from '@trailforge/shared';
import { describe, expect, it, vi } from 'vitest';
import { measureEuclideanDetour } from './euclidean.js';
import { measurePedestrianRoute } from './measure.js';

function poi(id: string, x: number, lon = 139.7, lat = 35.7): PoiLocal {
  return {
    id,
    name: id,
    lat,
    lon,
    category: 'place',
    osmTags: { name: id },
    x,
    z: 0,
  };
}

describe('measurePedestrianRoute', () => {
  it('falls back to euclidean when no keys', async () => {
    const pois = [poi('a', 0), poi('b', 100)];
    const m = await measurePedestrianRoute(pois, {});
    expect(m.routing.provider).toBe('euclidean_detour');
    expect(m.totalMeters).toBe(measureEuclideanDetour(pois).totalMeters);
  });

  it('uses ORS when key + fetch succeed', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [{ summary: { distance: 420.4 } }] }),
    });
    const m = await measurePedestrianRoute([poi('a', 0), poi('b', 100)], {
      openRouteServiceKey: 'test-key',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(m.routing.provider).toBe('openrouteservice');
    expect(m.totalMeters).toBe(420);
  });

  it('falls back when ORS fails', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    const pois = [poi('a', 0), poi('b', 50)];
    const m = await measurePedestrianRoute(pois, {
      openRouteServiceKey: 'bad',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(m.routing.provider).toBe('euclidean_detour');
  });
});
