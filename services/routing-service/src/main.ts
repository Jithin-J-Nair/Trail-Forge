/**
 * Routing Service scaffold.
 * Responsibilities: deterministic route optimization, walk/transit/bike modes,
 * duration/distance constraints, PostGIS geometry persistence.
 */
export interface RouteRequest {
  placeIds: string[];
  mode: 'walk' | 'transit' | 'bike' | 'mixed';
  durationMinutes: number;
}

export function optimizeRoute(request: RouteRequest) {
  return { ...request, status: 'scaffold', distanceMeters: 0, legs: [] };
}
