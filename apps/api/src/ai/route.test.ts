import type { PoiLocal } from '@trailforge/shared';
import { describe, expect, it } from 'vitest';
import { planRoute } from './route.js';

function poi(id: string, x: number, z: number): PoiLocal {
  return {
    id,
    name: id,
    lat: 0,
    lon: 0,
    category: 'place',
    osmTags: { name: id },
    x,
    z,
  };
}

describe('planRoute', () => {
  it('orders nearest-neighbor from closest-to-center then improves', () => {
    const pois = [poi('a', 100, 0), poi('b', 0, 0), poi('c', 50, 0)];
    const plan = planRoute(pois, 240);
    expect(plan.orderedPoiIds[0]).toBe('b');
    expect(plan.orderedPoiIds).toHaveLength(3);
    expect(plan.totalMeters).toBeGreaterThan(0);
  });

  it('trims POIs to fit durationMinutes', () => {
    const pois = [poi('a', 0, 0), poi('b', 500, 0), poi('c', 1000, 0), poi('d', 1500, 0)];
    const plan = planRoute(pois, 5); // 5 min * 80 m/min = 400m budget with detour
    expect(plan.orderedPoiIds.length).toBeLessThan(4);
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(5 + 1);
  });

  it('uses deterministic fallback titles', () => {
    const plan = planRoute([poi('gate', 0, 0)], 60);
    expect(plan.titleEn).toContain('gate');
    expect(plan.titleJa.length).toBeGreaterThan(0);
  });
});
