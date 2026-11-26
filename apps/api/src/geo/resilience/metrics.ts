import type { GeoMetricsSnapshot, GeoProviderName, ProviderHealth, ProviderKind } from '../types.js';

type LatBucket = { count: number; totalMs: number; maxMs: number };

export class GeoMetrics {
  private requests = new Map<string, number>();
  private errors = new Map<string, number>();
  private latency = new Map<string, LatBucket>();
  private cacheHits = 0;
  private cacheMisses = 0;
  private cacheStaleHits = 0;
  private providerHealth = new Map<string, ProviderHealth>();

  private key(provider: GeoProviderName, kind: ProviderKind): string {
    return `${kind}:${provider}`;
  }

  recordRequest(provider: GeoProviderName, kind: ProviderKind): void {
    const k = this.key(provider, kind);
    this.requests.set(k, (this.requests.get(k) ?? 0) + 1);
  }

  recordError(provider: GeoProviderName, kind: ProviderKind): void {
    const k = this.key(provider, kind);
    this.errors.set(k, (this.errors.get(k) ?? 0) + 1);
  }

  recordLatency(provider: GeoProviderName, kind: ProviderKind, latencyMs: number): void {
    const k = this.key(provider, kind);
    const b = this.latency.get(k) ?? { count: 0, totalMs: 0, maxMs: 0 };
    b.count += 1;
    b.totalMs += latencyMs;
    b.maxMs = Math.max(b.maxMs, latencyMs);
    this.latency.set(k, b);
  }

  recordCache(kind: 'hit' | 'miss' | 'stale'): void {
    if (kind === 'hit') this.cacheHits += 1;
    else if (kind === 'miss') this.cacheMisses += 1;
    else this.cacheStaleHits += 1;
  }

  updateProviderHealth(health: ProviderHealth): void {
    this.providerHealth.set(this.key(health.provider, health.kind), health);
  }

  snapshot(): GeoMetricsSnapshot {
    const latencyMs: GeoMetricsSnapshot['latencyMs'] = {};
    for (const [k, b] of this.latency) latencyMs[k] = { ...b, avgMs: b.count ? b.totalMs / b.count : 0 };
    const totalCache = this.cacheHits + this.cacheMisses + this.cacheStaleHits;
    return {
      requestsTotal: Object.fromEntries(this.requests),
      errorsTotal: Object.fromEntries(this.errors),
      latencyMs,
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        staleHits: this.cacheStaleHits,
        hitRatio: totalCache ? (this.cacheHits + this.cacheStaleHits) / totalCache : 0,
      },
      providers: [...this.providerHealth.values()],
    };
  }
}

export const geoMetrics = new GeoMetrics();
