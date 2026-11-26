import type { Theme } from '@trailforge/shared';
import { logger } from '../logger.js';
import type { TransformedScene } from '../osm/transform.js';
import { GeoOrchestrator } from './orchestrator.js';
import { GeoapifyGeocodeProvider } from './providers/geocode-geoapify.js';
import { MapboxGeocodeProvider } from './providers/geocode-mapbox.js';
import { NominatimGeocodeProvider } from './providers/geocode-nominatim.js';
import { OrsGeocodeProvider } from './providers/geocode-ors.js';
import { PhotonGeocodeProvider } from './providers/geocode-photon.js';
import {
  LocalDevGeocodeProvider,
  LocalDevPoiProvider,
  isLocalDevDataSourceEnabled,
} from './providers/local-dev.js';
import { GeoapifyPoiProvider } from './providers/poi-geoapify.js';
import { MapboxPoiProvider } from './providers/poi-mapbox.js';
import { OverpassPoiProvider } from './providers/poi-overpass.js';
import { SwrCache } from './resilience/cache.js';
import { geoMetrics } from './resilience/metrics.js';
import type { GeocodeResult, PoiDiscoveryResult, ProviderDiagnostic } from './types.js';

export { geoMetrics } from './resilience/metrics.js';
export type { ProviderDiagnostic };

const redisUrl = process.env['REDIS_URL'];
const geocodeCache = new SwrCache<GeocodeResult>({
  ttlMs: 10 * 60_000,
  staleTtlMs: 60 * 60_000,
  max: 500,
  redisUrl,
  namespace: 'geo:geocode',
});
const poiCache = new SwrCache<PoiDiscoveryResult>({
  ttlMs: 5 * 60_000,
  staleTtlMs: 30 * 60_000,
  max: 500,
  redisUrl,
  namespace: 'geo:poi',
});

function buildOrchestrator() {
  const dev = isLocalDevDataSourceEnabled();
  const geocodeProviders = [
    ...(dev ? [new LocalDevGeocodeProvider()] : []),
    new NominatimGeocodeProvider(),
    new PhotonGeocodeProvider(),
    new GeoapifyGeocodeProvider(),
    new MapboxGeocodeProvider(),
    new OrsGeocodeProvider(),
  ];
  const poiProviders = [
    ...(dev ? [new LocalDevPoiProvider()] : []),
    new OverpassPoiProvider(),
    new GeoapifyPoiProvider(),
    new MapboxPoiProvider(),
  ];
  return new GeoOrchestrator(geocodeProviders, poiProviders);
}

let orchestrator: GeoOrchestrator | null = null;
export function getOrchestrator(): GeoOrchestrator {
  if (!orchestrator) orchestrator = buildOrchestrator();
  return orchestrator;
}

export type GeoResolveResult = {
  center: { lat: number; lon: number };
  displayName: string;
  scene: TransformedScene;
  provenance: {
    mode: 'live_osm' | 'local_dev';
    source: string;
    license: string;
    attribution: string;
    area?: string;
    capturedAt?: string;
    note?: string;
  };
  diagnostics: ProviderDiagnostic[];
  devMode: boolean;
};

export async function resolveAreaScene(
  query: string,
  theme: Theme,
  radiusMeters: number,
  signal?: AbortSignal,
): Promise<GeoResolveResult> {
  const orch = getOrchestrator();
  const diagnostics: ProviderDiagnostic[] = [];
  const devMode = isLocalDevDataSourceEnabled();

  const geocodeKey = SwrCache.key({ type: 'geocode', query });
  const geo = await geocodeCache.getOrLoad(geocodeKey, async () => {
    const r = await orch.geocode({ query, ...(signal ? { signal } : {}) });
    diagnostics.push(...r.diagnostics);
    return r.result;
  });
  // if cache hit, diagnostics may be empty; that's ok

  const poiKey = SwrCache.key({
    type: 'poi',
    lat: geo.value.lat,
    lon: geo.value.lon,
    radiusMeters,
    theme,
    devMode,
  });
  const poi = await poiCache.getOrLoad(poiKey, async () => {
    const r = await orch.discover({
      center: { lat: geo.value.lat, lon: geo.value.lon },
      radiusMeters,
      theme,
      ...(signal ? { signal } : {}),
    });
    diagnostics.push(...r.diagnostics);
    return r.result;
  });

  const mode =
    devMode || geo.value.provider === 'local_dev' || poi.value.provider === 'local_dev'
      ? 'local_dev'
      : 'live_osm';
  const provenance =
    mode === 'local_dev'
      ? {
          mode: 'local_dev' as const,
          source: 'LOCAL_DEV_DATA_SOURCE fixture',
          license: 'N/A (dev fixture)',
          attribution: 'DEV MODE - local fixture data, not real geographic data',
          area: geo.value.displayName,
          capturedAt: new Date().toISOString(),
          note: 'DEV MODE: clearly marked local fixture dataset for UI testing without internet access.',
        }
      : {
          mode: 'live_osm' as const,
          source: 'OpenStreetMap/Overpass/Nominatim and configured providers',
          license: 'ODbL-1.0',
          attribution: '© OpenStreetMap contributors',
          area: geo.value.displayName,
          capturedAt: new Date().toISOString(),
        };

  if (devMode) logger.warn({ query }, 'LOCAL_DEV_DATA_SOURCE enabled - returning dev fixture data');

  return {
    center: { lat: geo.value.lat, lon: geo.value.lon },
    displayName: geo.value.displayName,
    scene: poi.value.scene,
    provenance,
    diagnostics,
    devMode: mode === 'local_dev',
  };
}

export function getGeoHealth() {
  const orch = getOrchestrator();
  orch.syncHealth();
  return geoMetrics.snapshot();
}
