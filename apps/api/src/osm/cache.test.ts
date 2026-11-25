import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { cacheKey, createOsmCache } from './cache.js';
import type { TransformedScene } from './transform.js';

const sample: TransformedScene = {
  center: { lon: 139.8, lat: 35.7 },
  pois: [],
  buildings: [],
  roads: [],
};

describe('osm cache', () => {
  let dir = '';

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('misses then hits memory/disk', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'tf-cache-'));
    const cache = createOsmCache(dir);
    const key = cacheKey(139.7967, 35.7148, 500, 'culture');
    expect(await cache.get(key)).toBeUndefined();
    await cache.set(key, sample);
    expect(await cache.get(key)).toEqual(sample);

    const cold = createOsmCache(dir);
    expect(await cold.get(key)).toEqual(sample);
  });
});
