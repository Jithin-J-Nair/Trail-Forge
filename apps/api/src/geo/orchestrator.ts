import { logger } from '../logger.js';
import { CircuitBreaker } from './resilience/circuit-breaker.js';
import { geoMetrics } from './resilience/metrics.js';
import { withRetry } from './resilience/retry.js';
import type {
  GeocodeProvider,
  GeocodeRequest,
  GeocodeResult,
  PoiDiscoveryProvider,
  PoiDiscoveryRequest,
  PoiDiscoveryResult,
  ProviderDiagnostic,
  ProviderHealth,
} from './types.js';
import { geoError } from './types.js';

type AnyProvider = GeocodeProvider | PoiDiscoveryProvider;

function nowIso() {
  return new Date().toISOString();
}

function statusFromUnknown(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

function createLimiter(minIntervalMs: number) {
  let last = 0;
  let chain: Promise<void> = Promise.resolve();
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    const run = chain.then(async () => {
      const wait = Math.max(0, minIntervalMs - (Date.now() - last));
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      last = Date.now();
      return fn();
    });
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  };
}

export class GeoOrchestrator {
  private breakers = new Map<string, CircuitBreaker>();
  private limiters = new Map<string, <T>(fn: () => Promise<T>) => Promise<T>>();
  private lastSuccessAt = new Map<string, string>();
  private lastFailureAt = new Map<string, string>();
  private lastLatencyMs = new Map<string, number>();
  private lastError = new Map<string, string>();

  constructor(
    private readonly geocodeProviders: GeocodeProvider[],
    private readonly poiProviders: PoiDiscoveryProvider[],
  ) {}

  private breakerKey(p: AnyProvider): string {
    return `${p.kind}:${p.name}`;
  }
  private breaker(p: AnyProvider): CircuitBreaker {
    const k = this.breakerKey(p);
    let b = this.breakers.get(k);
    if (!b) {
      b = new CircuitBreaker(k);
      this.breakers.set(k, b);
    }
    return b;
  }
  private limiter(p: AnyProvider) {
    const k = this.breakerKey(p);
    let l = this.limiters.get(k);
    if (!l) {
      l = createLimiter(p.name === 'nominatim' ? 1100 : 250);
      this.limiters.set(k, l);
    }
    return l;
  }

  getProviderHealth(): ProviderHealth[] {
    const all: AnyProvider[] = [...this.geocodeProviders, ...this.poiProviders];
    return all.map((p) => {
      const b = this.breaker(p).snapshot();
      const k = this.breakerKey(p);
      const lastSuccessAt = this.lastSuccessAt.get(k);
      const lastFailureAt = this.lastFailureAt.get(k);
      const lastLatencyMs = this.lastLatencyMs.get(k);
      const health: ProviderHealth = {
        provider: p.name,
        kind: p.kind,
        available: p.isConfigured() && b.state !== 'open',
        circuitState: b.state,
        failures: b.failures,
        ...(lastSuccessAt ? { lastSuccessAt } : {}),
        ...(lastFailureAt ? { lastFailureAt } : {}),
        ...(lastLatencyMs !== undefined ? { lastLatencyMs } : {}),
        ...(b.lastError ? { lastError: b.lastError } : {}),
      };
      return health;
    });
  }

  private async execute<T>(
    provider: AnyProvider,
    fn: () => Promise<T>,
  ): Promise<{ value: T; diagnostic: ProviderDiagnostic }> {
    const b = this.breaker(provider);
    if (!b.canExecute()) {
      throw geoError(
        provider.name,
        provider.kind,
        'CIRCUIT_OPEN',
        `Circuit open for ${provider.name}`,
      );
    }
    const start = Date.now();
    geoMetrics.recordRequest(provider.name, provider.kind);
    try {
      const limit = this.limiter(provider);
      const value = await withRetry(async () => limit(() => fn()), {
        retries: 2,
        baseMs: 300,
        maxMs: 2000,
        jitter: true,
        shouldRetry: (err) => {
          const msg = err instanceof Error ? err.message : '';
          return !/NOT_FOUND|invalid query|No results/i.test(msg);
        },
      });
      const latencyMs = Date.now() - start;
      b.onSuccess();
      geoMetrics.recordLatency(provider.name, provider.kind, latencyMs);
      this.lastSuccessAt.set(this.breakerKey(provider), nowIso());
      this.lastLatencyMs.set(this.breakerKey(provider), latencyMs);
      this.lastError.delete(this.breakerKey(provider));
      return {
        value,
        diagnostic: {
          provider: provider.name,
          kind: provider.kind,
          ok: true,
          latencyMs,
          timestamp: nowIso(),
        },
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      b.onFailure(err);
      geoMetrics.recordError(provider.name, provider.kind);
      geoMetrics.recordLatency(provider.name, provider.kind, latencyMs);
      this.lastFailureAt.set(this.breakerKey(provider), nowIso());
      this.lastLatencyMs.set(this.breakerKey(provider), latencyMs);
      this.lastError.set(
        this.breakerKey(provider),
        err instanceof Error ? err.message : String(err),
      );
      const diagnostic: ProviderDiagnostic = {
        provider: provider.name,
        kind: provider.kind,
        ok: false,
        latencyMs,
        timestamp: nowIso(),
        message: err instanceof Error ? err.message : String(err),
      };
      const status = statusFromUnknown(err);
      if (status !== undefined) diagnostic.status = status;
      throw Object.assign(err instanceof Error ? err : new Error(String(err)), { diagnostic });
    }
  }

  async geocode(
    req: GeocodeRequest,
  ): Promise<{ result: GeocodeResult; diagnostics: ProviderDiagnostic[] }> {
    const diagnostics: ProviderDiagnostic[] = [];
    const providers = this.geocodeProviders.filter((p) => p.isConfigured());
    if (providers.length === 0) {
      throw geoError(
        'nominatim',
        'geocode',
        'CONFIG_MISSING',
        'No geocoding providers configured',
        { diagnostics },
      );
    }
    for (const provider of providers) {
      try {
        const { value, diagnostic } = await this.execute(provider, () => provider.geocode(req));
        diagnostics.push(diagnostic);
        this.syncHealth();
        return { result: value, diagnostics };
      } catch (err: unknown) {
        const failed = err as { diagnostic?: ProviderDiagnostic };
        if (failed.diagnostic) diagnostics.push(failed.diagnostic);
        logger.warn({ err, provider: provider.name }, 'geocode provider failed');
      }
    }
    this.syncHealth();
    throw geoError(
      providers[0]!.name,
      'geocode',
      'UPSTREAM_ERROR',
      'All geocoding providers failed',
      { diagnostics },
    );
  }

  async discover(
    req: PoiDiscoveryRequest,
  ): Promise<{ result: PoiDiscoveryResult; diagnostics: ProviderDiagnostic[] }> {
    const diagnostics: ProviderDiagnostic[] = [];
    const providers = this.poiProviders.filter((p) => p.isConfigured());
    if (providers.length === 0) {
      throw geoError(
        'overpass',
        'poi_discovery',
        'CONFIG_MISSING',
        'No POI discovery providers configured',
        { diagnostics },
      );
    }
    for (const provider of providers) {
      try {
        const { value, diagnostic } = await this.execute(provider, () => provider.discover(req));
        diagnostics.push(diagnostic);
        this.syncHealth();
        return { result: value, diagnostics };
      } catch (err: unknown) {
        const failed = err as { diagnostic?: ProviderDiagnostic };
        if (failed.diagnostic) diagnostics.push(failed.diagnostic);
        logger.warn({ err, provider: provider.name }, 'poi discovery provider failed');
      }
    }
    this.syncHealth();
    throw geoError(
      providers[0]!.name,
      'poi_discovery',
      'UPSTREAM_ERROR',
      'All POI discovery providers failed',
      { diagnostics },
    );
  }

  syncHealth(): void {
    for (const h of this.getProviderHealth()) geoMetrics.updateProviderHealth(h);
  }
}
