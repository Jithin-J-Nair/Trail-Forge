import { describe, expect, it } from 'vitest';
import {
  dayFactorFromElevation,
  getSolarState,
  localTimeFromLongitude,
  longitudeUtcOffsetHours,
  solarElevationDeg,
} from './solar.js';

describe('solar', () => {
  it('maps Tokyo longitude to UTC+9 civil offset', () => {
    expect(longitudeUtcOffsetHours(139.76)).toBe(9);
  });

  it('is daytime near Tokyo summer noon UTC+9 (03:00 UTC)', () => {
    // 2024-06-21 03:00 UTC ≈ 12:00 JST
    const noon = new Date(Date.UTC(2024, 5, 21, 3, 0, 0));
    const el = solarElevationDeg(35.68, 139.76, noon);
    expect(el).toBeGreaterThan(20);
    expect(dayFactorFromElevation(el)).toBeGreaterThan(0.7);
    const state = getSolarState(35.68, 139.76, noon);
    expect(state.isDay).toBe(true);
    expect(state.utcOffsetHours).toBe(9);
    expect(localTimeFromLongitude(139.76, noon)).toBe('12:00 (UTC+09)');
  });

  it('is nighttime near Tokyo summer midnight UTC+9 (15:00 UTC)', () => {
    const midnight = new Date(Date.UTC(2024, 5, 21, 15, 0, 0));
    const el = solarElevationDeg(35.68, 139.76, midnight);
    expect(el).toBeLessThan(-5);
    expect(dayFactorFromElevation(el)).toBeLessThan(0.3);
    const state = getSolarState(35.68, 139.76, midnight);
    expect(state.isDay).toBe(false);
    expect(localTimeFromLongitude(139.76, midnight)).toBe('00:00 (UTC+09)');
  });
});
