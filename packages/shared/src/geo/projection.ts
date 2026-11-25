import type { LonLat } from '../schemas/primitives.js';

/** Mean Earth radius (m) — enough for ~1m accuracy within a 500m city radius. */
const EARTH_RADIUS_M = 6_371_000;

function metersPerDegree(center: LonLat): { east: number; north: number } {
  const latRad = (center.lat * Math.PI) / 180;
  const north = (Math.PI / 180) * EARTH_RADIUS_M;
  const east = north * Math.cos(latRad);
  return { east, north };
}

/**
 * Project WGS84 lon/lat into local meters relative to `center`.
 * +x = east, +z = south (Y-up Three.js convention).
 */
export function lonLatToLocalMeters(
  center: LonLat,
  lon: number,
  lat: number,
): { x: number; z: number } {
  const scale = metersPerDegree(center);
  const x = (lon - center.lon) * scale.east;
  const z = (center.lat - lat) * scale.north;
  return { x, z };
}

/** Inverse of `lonLatToLocalMeters`. */
export function localMetersToLonLat(center: LonLat, x: number, z: number): LonLat {
  const scale = metersPerDegree(center);
  return {
    lon: center.lon + x / scale.east,
    lat: center.lat - z / scale.north,
  };
}
