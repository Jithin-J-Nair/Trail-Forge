import { describe, expect, it } from 'vitest';
import { localMetersToLonLat, lonLatToLocalMeters } from './projection.js';

/** Rough Tokyo Station area. */
const TOKYO: { lon: number; lat: number } = { lon: 139.7671, lat: 35.6812 };

function horizDistanceMeters(a: { x: number; z: number }, b: { x: number; z: number }): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

describe('lonLatToLocalMeters', () => {
  it('maps the center to the origin', () => {
    const local = lonLatToLocalMeters(TOKYO, TOKYO.lon, TOKYO.lat);
    expect(local.x).toBeCloseTo(0, 6);
    expect(local.z).toBeCloseTo(0, 6);
  });

  it('is accurate within 1m at ~500m east of Tokyo', () => {
    const targetEast = 500;
    const scaleLon = (Math.PI / 180) * 6_371_000 * Math.cos((TOKYO.lat * Math.PI) / 180);
    const lon = TOKYO.lon + targetEast / scaleLon;
    const local = lonLatToLocalMeters(TOKYO, lon, TOKYO.lat);
    expect(Math.abs(local.x - targetEast)).toBeLessThan(1);
    expect(Math.abs(local.z)).toBeLessThan(1);

    const back = localMetersToLonLat(TOKYO, local.x, local.z);
    const roundTrip = lonLatToLocalMeters(TOKYO, back.lon, back.lat);
    expect(horizDistanceMeters(local, roundTrip)).toBeLessThan(1);
  });

  it('is accurate within 1m at ~500m south of Tokyo', () => {
    const targetSouth = 500;
    const scaleLat = (Math.PI / 180) * 6_371_000;
    const lat = TOKYO.lat - targetSouth / scaleLat;
    const local = lonLatToLocalMeters(TOKYO, TOKYO.lon, lat);
    expect(Math.abs(local.z - targetSouth)).toBeLessThan(1);
    expect(Math.abs(local.x)).toBeLessThan(1);

    const back = localMetersToLonLat(TOKYO, local.x, local.z);
    const roundTrip = lonLatToLocalMeters(TOKYO, back.lon, back.lat);
    expect(horizDistanceMeters(local, roundTrip)).toBeLessThan(1);
  });
});
