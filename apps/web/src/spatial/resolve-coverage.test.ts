import { describe, expect, it } from 'vitest';
import { resolveSpatialLayer } from './resolve-coverage.js';

describe('resolveSpatialLayer', () => {
  it('defaults to extrusions with coverage none when keys missing', () => {
    const status = resolveSpatialLayer({});
    expect(status.mode).toBe('extrusions');
    expect(status.coverage).toBe('none');
    expect(status.label).toMatch(/OSM extrusions/i);
  });

  it('falls back to extrusions with coverage none when forced', () => {
    const status = resolveSpatialLayer({
      maptilerKey: 'pk.test',
      forceCoverage: 'none',
    });
    expect(status.mode).toBe('extrusions');
    expect(status.coverage).toBe('none');
  });

  it('never claims photoreal full when tiles adapter has not loaded', () => {
    const status = resolveSpatialLayer({
      cesiumIonToken: 'ion-test',
      forceCoverage: 'full',
    });
    expect(status.mode).toBe('extrusions');
    expect(status.coverage).not.toBe('full');
    expect(status.label.toLowerCase()).not.toMatch(/photoreal city/);
  });

  it('reports partial when a key is set but enhanced layers are inactive', () => {
    const status = resolveSpatialLayer({ maptilerKey: 'pk.test' });
    expect(status.mode).toBe('extrusions');
    expect(status.coverage).toBe('partial');
  });

  it('reports partial while Google tiles session is loading', () => {
    const status = resolveSpatialLayer({ googleTiles: 'loading' });
    expect(status.mode).toBe('extrusions');
    expect(status.coverage).toBe('partial');
  });

  it('reports full only after Google tiles have loaded', () => {
    const status = resolveSpatialLayer({ googleTiles: 'loaded' });
    expect(status.mode).toBe('tiles');
    expect(status.coverage).toBe('full');
    expect(status.label).toMatch(/Google Photorealistic/i);
  });
});
