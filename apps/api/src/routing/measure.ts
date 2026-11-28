import type { PoiLocal } from '@trailforge/shared';
import { measureEuclideanDetour } from './euclidean.js';
import { measureGraphHopper } from './graphhopper.js';
import { measureOpenRouteService } from './openrouteservice.js';
import type { PedestrianMeasure, RoutingEnv } from './types.js';

/**
 * Measure ordered pedestrian distance.
 * Prefer ORS, then GraphHopper; otherwise honest euclidean×detour — never invent roads.
 */
export async function measurePedestrianRoute(
  orderedPois: PoiLocal[],
  env: RoutingEnv = {},
): Promise<PedestrianMeasure> {
  const fetchImpl = env.fetchImpl ?? fetch;
  const orsKey = env.openRouteServiceKey?.trim();
  if (orsKey) {
    const ors = await measureOpenRouteService(orderedPois, orsKey, fetchImpl);
    if (ors) return ors;
  }
  const ghKey = env.graphHopperKey?.trim();
  if (ghKey) {
    const gh = await measureGraphHopper(orderedPois, ghKey, fetchImpl);
    if (gh) return gh;
  }
  return measureEuclideanDetour(orderedPois);
}

export function resolveRoutingEnvFromProcess(source: NodeJS.ProcessEnv = process.env): RoutingEnv {
  const env: RoutingEnv = {};
  const ors = source['OPENROUTESERVICE_API_KEY'];
  const gh = source['GRAPHHOPPER_API_KEY'];
  if (typeof ors === 'string' && ors.length > 0) env.openRouteServiceKey = ors;
  if (typeof gh === 'string' && gh.length > 0) env.graphHopperKey = gh;
  return env;
}
