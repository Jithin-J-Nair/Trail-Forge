import type { LonLat, Theme } from '@trailforge/shared';
import type { TransformedScene } from '../osm/transform.js';

export type GeoProviderName =
  | 'nominatim'
  | 'photon'
  | 'openrouteservice'
  | 'geoapify'
  | 'mapbox'
  | 'overpass'
  | 'local_dev';

export type ProviderKind = 'geocode' | 'poi_discovery';

export interface ProviderDiagnostic {
  provider: GeoProviderName;
  kind: ProviderKind;
  ok: boolean;
  latencyMs: number;
  message?: string;
  status?: number;
  timestamp: string;
}

export interface GeoProviderError extends Error {
  code: 'UPSTREAM_ERROR' | 'RATE_LIMITED' | 'TIMEOUT' | 'CIRCUIT_OPEN' | 'NOT_FOUND' | 'CONFIG_MISSING';
  provider: GeoProviderName;
  kind: ProviderKind;
  diagnostics?: ProviderDiagnostic[];
  cause?: unknown;
}

export function geoError(
  provider: GeoProviderName,
  kind: ProviderKind,
  code: GeoProviderError['code'],
  message: string,
  extras: Partial<Omit<GeoProviderError, 'name' | 'message' | 'provider' | 'kind' | 'code'>> = {},
): GeoProviderError {
  const err = new Error(message) as GeoProviderError;
  err.name = 'GeoProviderError';
  err.provider = provider;
  err.kind = kind;
  err.code = code;
  if (extras.diagnostics) err.diagnostics = extras.diagnostics;
  if (extras.cause) err.cause = extras.cause;
  return err;
}

export interface GeocodeRequest {
  query: string;
  signal?: AbortSignal;
}

export interface GeocodeResult extends LonLat {
  displayName: string;
  provider: GeoProviderName;
}

export interface GeocodeProvider {
  name: GeoProviderName;
  kind: 'geocode';
  isConfigured(): boolean;
  geocode(req: GeocodeRequest): Promise<GeocodeResult>;
}

export interface PoiDiscoveryRequest {
  center: LonLat;
  radiusMeters: number;
  theme: Theme;
  signal?: AbortSignal;
}

export interface PoiDiscoveryResult {
  scene: TransformedScene;
  provider: GeoProviderName;
}

export interface PoiDiscoveryProvider {
  name: GeoProviderName;
  kind: 'poi_discovery';
  isConfigured(): boolean;
  discover(req: PoiDiscoveryRequest): Promise<PoiDiscoveryResult>;
}

export interface ProviderHealth {
  provider: GeoProviderName;
  kind: ProviderKind;
  available: boolean;
  circuitState: 'closed' | 'open' | 'half_open';
  failures: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastLatencyMs?: number;
  lastError?: string;
}

export interface GeoMetricsSnapshot {
  requestsTotal: Record<string, number>;
  errorsTotal: Record<string, number>;
  latencyMs: Record<string, { count: number; totalMs: number; maxMs: number; avgMs: number }>;
  cache: { hits: number; misses: number; staleHits: number; hitRatio: number };
  providers: ProviderHealth[];
}
