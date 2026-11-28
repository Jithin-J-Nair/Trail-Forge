import type { PoiLocal } from '@trailforge/shared';
import type { PedestrianMeasure } from './types.js';

const DETOUR = 1.3;

/** Straight-line path × detour — honest fallback when no pedestrian API key. */
export function measureEuclideanDetour(pois: PoiLocal[]): PedestrianMeasure {
  let total = 0;
  for (let i = 1; i < pois.length; i++) {
    const a = pois[i - 1];
    const b = pois[i];
    if (!a || !b) continue;
    total += Math.hypot(a.x - b.x, a.z - b.z);
  }
  return {
    totalMeters: Math.round(total * DETOUR),
    routing: {
      provider: 'euclidean_detour',
      label: 'Estimated walk (straight-line × 1.3)',
      reason: 'no OpenRouteService/GraphHopper key — euclidean detour fallback',
    },
  };
}
