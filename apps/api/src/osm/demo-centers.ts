import type { LonLat } from '@trailforge/shared';

/** Offline/demo centers when Nominatim blocks the host (e.g. cloud egress 403). */
export const DEMO_CENTERS: Record<string, LonLat & { displayName: string }> = {
  'asakusa, tokyo': {
    lon: 139.7967,
    lat: 35.7148,
    displayName: 'Asakusa, Tokyo (demo center)',
  },
};

export function lookupDemoCenter(query: string) {
  return DEMO_CENTERS[query.trim().toLowerCase()];
}
