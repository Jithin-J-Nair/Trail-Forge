import { createHash } from 'node:crypto';
import IORedis from 'ioredis';
import { LRUCache } from 'lru-cache';
import { logger } from '../../logger.js';
import { geoMetrics } from './metrics.js';

type CacheEntry<T> = { value: T; savedAt: number; staleAt: number; expiresAt: number };

export interface SwrCacheOptions {
  ttlMs: number;
  staleTtlMs: number;
  max?: number;
  redisUrl?: string | undefined;
  namespace?: string;
}

export class SwrCache<T> {
  private memory: LRUCache<string, CacheEntry<T>>;
  private redis: any = null;
  private redisReady = false;
  private inflight = new Map<string, Promise<T>>();

  constructor(private readonly opts: SwrCacheOptions) {
    this.memory = new LRUCache<string, CacheEntry<T>>({ max: opts.max ?? 500 });
    if (opts.redisUrl) {
      try {
        const RedisCtor: any = (IORedis as any).default ?? IORedis;
        this.redis = new RedisCtor(opts.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
        this.redis.on('error', (err: unknown) => logger.warn({ err }, 'redis cache error'));
        void this.redis.connect().then(() => { this.redisReady = true; }).catch(() => { this.redisReady = false; });
      } catch {
        this.redis = null;
      }
    }
  }

  static key(input: unknown): string {
    return createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 32);
  }

  private redisKey(key: string): string {
    return `${this.opts.namespace ?? 'geo'}:${key}`;
  }

  private async getRedis(key: string): Promise<CacheEntry<T> | undefined> {
    if (!this.redis || !this.redisReady) return undefined;
    try {
      const raw = await this.redis.get(this.redisKey(key));
      if (!raw) return undefined;
      return JSON.parse(raw) as CacheEntry<T>;
    } catch {
      return undefined;
    }
  }

  private async setRedis(key: string, entry: CacheEntry<T>): Promise<void> {
    if (!this.redis || !this.redisReady) return;
    try {
      await this.redis.set(this.redisKey(key), JSON.stringify(entry), 'PX', this.opts.ttlMs + this.opts.staleTtlMs);
    } catch {
      // ignore redis failures; memory cache remains
    }
  }

  async get(key: string): Promise<CacheEntry<T> | undefined> {
    const mem = this.memory.get(key);
    if (mem) return mem;
    const redisEntry = await this.getRedis(key);
    if (redisEntry) this.memory.set(key, redisEntry);
    return redisEntry;
  }

  async set(key: string, value: T): Promise<void> {
    const now = Date.now();
    const entry: CacheEntry<T> = { value, savedAt: now, staleAt: now + this.opts.ttlMs, expiresAt: now + this.opts.ttlMs + this.opts.staleTtlMs };
    this.memory.set(key, entry);
    await this.setRedis(key, entry);
  }

  async getOrLoad(key: string, loader: () => Promise<T>): Promise<{ value: T; cache: 'hit' | 'miss' | 'stale' }> {
    const entry = await this.get(key);
    const now = Date.now();
    if (entry && now < entry.staleAt) {
      geoMetrics.recordCache('hit');
      return { value: entry.value, cache: 'hit' };
    }
    if (entry && now < entry.expiresAt) {
      geoMetrics.recordCache('stale');
      // stale-while-revalidate: return stale, refresh in background
      if (!this.inflight.has(key)) {
        const p = loader().then(async (v) => { await this.set(key, v); return v; }).catch((err) => {
          logger.warn({ err, key }, 'swr background refresh failed');
          return entry.value;
        }).finally(() => { this.inflight.delete(key); });
        this.inflight.set(key, p);
      }
      return { value: entry.value, cache: 'stale' };
    }
    geoMetrics.recordCache('miss');
    const existing = this.inflight.get(key);
    if (existing) return { value: await existing, cache: 'miss' };
    const p = loader().then(async (v) => { await this.set(key, v); return v; }).finally(() => { this.inflight.delete(key); });
    this.inflight.set(key, p);
    return { value: await p, cache: 'miss' };
  }
}
