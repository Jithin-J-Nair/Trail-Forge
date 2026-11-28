import type { PoiLocal } from '@trailforge/shared';
import type { PedestrianMeasure } from './types.js';

type GhResponse = {
  paths?: Array<{ distance?: number }>;
};

/** GraphHopper foot profile for ordered lat/lon stops. */
export async function measureGraphHopper(
  pois: PoiLocal[],
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PedestrianMeasure | null> {
  if (pois.length < 2) {
    return {
      totalMeters: 0,
      routing: {
        provider: 'graphhopper',
        label: 'GraphHopper foot',
        reason: 'single stop — zero distance',
      },
    };
  }

  const url = new URL('https://graphhopper.com/api/1/route');
  url.searchParams.set('profile', 'foot');
  url.searchParams.set('locale', 'en');
  url.searchParams.set('points_encoded', 'false');
  url.searchParams.set('key', apiKey);
  for (const p of pois) {
    url.searchParams.append('point', `${p.lat},${p.lon}`);
  }

  try {
    const res = await fetchImpl(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as GhResponse;
    const meters = data.paths?.[0]?.distance;
    if (typeof meters !== 'number' || !Number.isFinite(meters)) return null;
    return {
      totalMeters: Math.round(meters),
      routing: {
        provider: 'graphhopper',
        label: 'GraphHopper foot',
        reason: 'live GraphHopper foot profile',
      },
    };
  } catch {
    return null;
  }
}
