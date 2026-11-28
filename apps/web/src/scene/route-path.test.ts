import { describe, expect, it } from 'vitest';
import type { PoiLocal } from '@trailforge/shared';
import { densifyPath, nearestStopId, orderedStops } from './route-path.js';

const pois: PoiLocal[] = [
  {
    id: 'a',
    name: 'A',
    category: 'tourism',
    osmTags: {},
    lon: 0,
    lat: 0,
    x: 0,
    z: 0,
  },
  {
    id: 'b',
    name: 'B',
    category: 'tourism',
    osmTags: {},
    lon: 0,
    lat: 0,
    x: 40,
    z: 0,
  },
  {
    id: 'c',
    name: 'C',
    category: 'tourism',
    osmTags: {},
    lon: 0,
    lat: 0,
    x: 80,
    z: 10,
  },
];

describe('route-path', () => {
  it('orders stops and densifies a multi-stop path', () => {
    const stops = orderedStops(pois, ['a', 'c', 'b']);
    expect(stops.map((s) => s.id)).toEqual(['a', 'c', 'b']);
    const path = densifyPath(stops);
    expect(path.length).toBeGreaterThan(24);
    expect(path[0]?.x).toBe(0);
  });

  it('picks nearest stop by xz', () => {
    expect(nearestStopId(pois, 38, 1)).toBe('b');
    expect(nearestStopId(pois, 2, 0)).toBe('a');
  });
});
