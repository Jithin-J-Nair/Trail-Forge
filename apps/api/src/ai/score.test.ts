import type { PoiLocal } from '@trailforge/shared';
import { describe, expect, it } from 'vitest';
import { rankPoisForTheme, themeMatchScore, walkabilityScore } from './score.js';

function poi(
  id: string,
  x: number,
  z: number,
  tags: Record<string, string>,
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

describe('score', () => {
  it('scores walkability from OSM tags only', () => {
    expect(walkabilityScore(poi('a', 0, 0, { wheelchair: 'yes', foot: 'yes' }))).toBeGreaterThan(
      walkabilityScore(poi('b', 0, 0, { access: 'private' })),
    );
  });

  it('prefers theme-matching tags for food', () => {
    const cafe = poi('c', 10, 0, { amenity: 'cafe', cuisine: 'ramen' }, 'food');
    const random = poi('r', 10, 0, { name: 'x' }, 'place');
    expect(themeMatchScore(cafe, 'food')).toBeGreaterThan(themeMatchScore(random, 'food'));
  });

  it('ranks stably for a fixed set', () => {
    const pois = [
      poi('far', 200, 0, { name: 'far' }),
      poi('near-food', 5, 0, { amenity: 'restaurant', cuisine: 'sushi' }, 'food'),
      poi('mid', 40, 0, { amenity: 'cafe' }, 'food'),
    ];
    const ranked = rankPoisForTheme(pois, 'food');
    expect(ranked[0]?.poi.id).toBe('near-food');
    expect(ranked.map((r) => r.poi.id)).toEqual(
      rankPoisForTheme(pois, 'food').map((r) => r.poi.id),
    );
  });
});
