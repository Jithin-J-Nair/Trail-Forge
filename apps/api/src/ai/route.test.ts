import type { PoiLocal } from '@trailforge/shared';
import { describe, expect, it } from 'vitest';
import { groundedRouteTitles, planRoute } from './route.js';

function poi(
  id: string,
  x: number,
  z: number,
  tags: Record<string, string> = { name: id },
  category = 'place',
): PoiLocal {
  return {
    id,
    name: id,
    lat: 0,
    lon: 0,
    category,
    osmTags: tags,
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

  it('trims POIs to fit durationMinutes and reports trimmedCount', () => {
    const pois = [poi('a', 0, 0), poi('b', 500, 0), poi('c', 1000, 0), poi('d', 1500, 0)];
    const plan = planRoute(pois, 5); // 5 min * 80 m/min = 400m budget with detour
    expect(plan.orderedPoiIds.length).toBeLessThan(4);
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(5 + 1);
    expect(plan.scoring?.trimmedCount).toBeGreaterThan(0);
    expect(plan.scoring?.candidateCount).toBe(4);
  });

  it('uses deterministic fallback titles from real POI names', () => {
    const plan = planRoute([poi('gate', 0, 0)], 60);
    expect(plan.titleEn).toContain('gate');
    expect(plan.titleJa.length).toBeGreaterThan(0);
  });

  it('rejects invented LLM titles that cite no real POI name', () => {
    const ordered = [poi('Senso-ji', 0, 0)];
    const titles = groundedRouteTitles(ordered, {
      titleEn: 'Magical Hidden Temple Trail',
      titleJa: '架空の名所めぐり',
    });
    expect(titles.titleEn).toContain('Senso-ji');
    expect(titles.titleJa).toContain('Senso-ji');
  });

  it('keeps LLM titles that include a real POI name', () => {
    const ordered = [poi('Senso-ji', 0, 0)];
    const titles = groundedRouteTitles(ordered, {
      titleEn: 'Senso-ji morning walk',
      titleJa: 'Senso-ji の朝散歩',
    });
    expect(titles.titleEn).toBe('Senso-ji morning walk');
  });

  it('prefers theme-matching stops when ranking candidates', () => {
    const pois = [
      poi('park', 5, 0, { leisure: 'park' }, 'nature'),
      poi('cafe-far', 80, 0, { amenity: 'cafe', cuisine: 'coffee' }, 'food'),
      poi('cafe-near', 20, 0, { amenity: 'restaurant' }, 'food'),
    ];
    const food = planRoute(pois, 240, { theme: 'food' });
    expect(food.orderedPoiIds).toContain('cafe-near');
    expect(food.routing?.provider).toBe('euclidean_detour');
  });
});
