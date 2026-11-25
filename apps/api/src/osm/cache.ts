import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LRUCache } from 'lru-cache';
import type { Theme } from '@trailforge/shared';
import type { TransformedScene } from './transform.js';

const TTL_MS = 24 * 60 * 60 * 1000;
const memory = new LRUCache<string, TransformedScene>({ max: 100, ttl: TTL_MS });

const defaultDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.cache');

export function cacheKey(lon: number, lat: number, radiusMeters: number, theme: Theme): string {
  const rounded = `${lon.toFixed(4)}:${lat.toFixed(4)}:${radiusMeters}:${theme}`;
  return createHash('sha256').update(rounded).digest('hex').slice(0, 24);
}

export type OsmCache = {
  get(key: string): Promise<TransformedScene | undefined>;
  set(key: string, value: TransformedScene): Promise<void>;
};

export function createOsmCache(cacheDir = defaultDir): OsmCache {
  return {
    async get(key) {
      const hit = memory.get(key);
      if (hit) return hit;
      try {
        const raw = await readFile(path.join(cacheDir, `${key}.json`), 'utf8');
        const parsed = JSON.parse(raw) as { savedAt: number; value: TransformedScene };
        if (Date.now() - parsed.savedAt > TTL_MS) return undefined;
        memory.set(key, parsed.value);
        return parsed.value;
      } catch {
        return undefined;
      }
    },
    async set(key, value) {
      memory.set(key, value);
      await mkdir(cacheDir, { recursive: true });
      await writeFile(
        path.join(cacheDir, `${key}.json`),
        JSON.stringify({ savedAt: Date.now(), value }),
        'utf8',
      );
    },
  };
}
