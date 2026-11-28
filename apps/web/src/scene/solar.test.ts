import { describe, expect, it } from 'vitest';
import { dayFactorFromElevation, solarElevationDeg } from './solar.js';

describe('solar', () => {
  it('is daytime near Tokyo summer noon UTC+9 (03:00 UTC)', () => {
    // 2024-06-21 03:00 UTC ≈ 12:00 JST
    const noon = new Date(Date.UTC(2024, 5, 21, 3, 0, 0));
    const el = solarElevationDeg(35.68, 139.76, noon);
    expect(el).toBeGreaterThan(20);
    expect(dayFactorFromElevation(el)).toBeGreaterThan(0.7);
  });

  it('is nighttime near Tokyo summer midnight UTC+9 (15:00 UTC)', () => {
    const midnight = new Date(Date.UTC(2024, 5, 21, 15, 0, 0));
    const el = solarElevationDeg(35.68, 139.76, midnight);
    expect(el).toBeLessThan(-5);
    expect(dayFactorFromElevation(el)).toBeLessThan(0.3);
  });
});
