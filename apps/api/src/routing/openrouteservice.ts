import type { PoiLocal } from '@trailforge/shared';
import type { PedestrianMeasure } from './types.js';

type OrsResponse = {
  routes?: Array<{ summary?: { distance?: number } }>;
};

/** ORS foot-walking directions for ordered lon/lat stops. */
export async function measureOpenRouteService(
  pois: PoiLocal[],
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PedestrianMeasure | null> {
  if (pois.length < 2) {
    return {
      totalMeters: 0,
      routing: {
        provider: 'openrouteservice',
        label: 'OpenRouteService foot',
        reason: 'single stop — zero distance',
      },
    };
  }

  const coordinates = pois.map((p) => [p.lon, p.lat]);
  try {
    const res = await fetchImpl('https://api.openrouteservice.org/v2/directions/foot-walking', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ coordinates }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OrsResponse;
    const meters = data.routes?.[0]?.summary?.distance;
    if (typeof meters !== 'number' || !Number.isFinite(meters)) return null;
    return {
      totalMeters: Math.round(meters),
      routing: {
        provider: 'openrouteservice',
        label: 'OpenRouteService foot',
        reason: 'live ORS foot-walking directions',
      },
    };
  } catch {
    return null;
  }
}
