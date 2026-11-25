import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lonLatToLocalMeters, localMetersToLonLat } from '@trailforge/shared';
import type { OverpassBundle } from './overpass.js';
import { deriveHeightMeters, transformOverpass } from './transform.js';

const fixture = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/overpass-sample.json'),
    'utf8',
  ),
) as OverpassBundle;

const ASAKUSA = { lon: 139.7967, lat: 35.7148 };

describe('deriveHeightMeters', () => {
  it('prefers height tag, then levels*3.2, else 9', () => {
    expect(deriveHeightMeters({ height: '18 m' })).toBe(18);
    expect(deriveHeightMeters({ 'building:levels': '3' })).toBeCloseTo(9.6);
    expect(deriveHeightMeters({})).toBe(9);
  });
});

describe('transformOverpass', () => {
  it('drops unnamed POIs, caps, projects, and builds roads', () => {
    const scene = transformOverpass(ASAKUSA, fixture);
    expect(scene.pois.every((p) => p.name)).toBe(true);
    expect(scene.pois.find((p) => p.id === 'node/2')).toBeUndefined();
    expect(scene.pois.length).toBeLessThanOrEqual(12);
    expect(scene.buildings.length).toBe(2);
    expect(scene.buildings[0]?.heightMeters).toBeGreaterThan(0);
    expect(scene.roads).toHaveLength(1);
    const poi = scene.pois[0];
    expect(poi).toBeDefined();
    if (!poi) return;
    const back = localMetersToLonLat(ASAKUSA, poi.x, poi.z);
    const round = lonLatToLocalMeters(ASAKUSA, back.lon, back.lat);
    expect(Math.hypot(round.x - poi.x, round.z - poi.z)).toBeLessThan(1);
  });

  it('caps buildings at 2000 preferring nearest', () => {
    const many: OverpassBundle = {
      pois: [],
      highways: [],
      buildings: Array.from({ length: 5 }, (_, i) => ({
        type: 'way',
        id: i + 100,
        tags: { building: 'yes' },
        geometry: [
          { lat: ASAKUSA.lat + i * 0.001, lon: ASAKUSA.lon },
          { lat: ASAKUSA.lat + i * 0.001, lon: ASAKUSA.lon + 0.0001 },
          { lat: ASAKUSA.lat + i * 0.001 + 0.0001, lon: ASAKUSA.lon + 0.0001 },
          { lat: ASAKUSA.lat + i * 0.001 + 0.0001, lon: ASAKUSA.lon },
          { lat: ASAKUSA.lat + i * 0.001, lon: ASAKUSA.lon },
        ],
      })),
    };
    const scene = transformOverpass(ASAKUSA, many);
    expect(scene.buildings[0]?.id).toBe('way/100');
  });
});
