import type { SpatialEnv, SpatialLayerStatus } from './types.js';

/**
 * Resolve which spatial layer to use.
 * Without provider keys (or without a wired adapter), always fall back to OSM
 * footprint extrusions and report coverage honestly — never fake photoreal.
 */
export function resolveSpatialLayer(env: SpatialEnv = {}): SpatialLayerStatus {
  if (env.forceCoverage === 'none') {
    return extrusionStatus('forced none for tests');
  }

  const hasMaptiler = Boolean(env.maptilerKey?.trim());
  const hasCesium = Boolean(env.cesiumIonToken?.trim());

  // Phase 3: adapters are declared but not rendering tiles/terrain yet.
  // Keys alone must not flip the scene to a dishonest "full coverage" claim.
  if (env.forceCoverage === 'partial') {
    return {
      mode: 'extrusions',
      coverage: 'partial',
      label: 'OSM extrusions · tiles unavailable',
      reason: 'forced partial — extrusions remain primary',
    };
  }

  if (env.forceCoverage === 'full') {
    // Still extrusions until a real tiles adapter ships; label stays honest.
    return {
      mode: 'extrusions',
      coverage: 'partial',
      label: 'OSM extrusions · photoreal not wired',
      reason: 'full coverage requested but tiles adapter not implemented',
    };
  }

  if (!hasMaptiler && !hasCesium) {
    return extrusionStatus('no MapTiler/Cesium keys — OSM extrusions only');
  }

  // Keys present but tile/terrain renderers not shipped: stay on extrusions,
  // advertise partial so the UI can show an honest upgrade path.
  return {
    mode: 'extrusions',
    coverage: 'partial',
    label: 'OSM extrusions · enhanced layers pending',
    reason: hasCesium
      ? 'Cesium token set but tiles adapter not active'
      : 'MapTiler key set but MapLibre layer not active',
  };
}

function extrusionStatus(reason: string): SpatialLayerStatus {
  return {
    mode: 'extrusions',
    coverage: 'none',
    label: 'OSM extrusions',
    reason,
  };
}

/** Read Vite env for browser resolve (no secrets required for default path). */
export function spatialEnvFromImportMeta(): SpatialEnv {
  const env: SpatialEnv = {};
  const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;
  const cesiumIonToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
  if (typeof maptilerKey === 'string' && maptilerKey.length > 0) env.maptilerKey = maptilerKey;
  if (typeof cesiumIonToken === 'string' && cesiumIonToken.length > 0) {
    env.cesiumIonToken = cesiumIonToken;
  }
  return env;
}
