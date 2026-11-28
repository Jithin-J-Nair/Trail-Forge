import type { SpatialEnv, SpatialLayerStatus } from './types.js';

/**
 * Resolve which spatial layer to use.
 * Without provider keys (or without a wired adapter), always fall back to OSM
 * footprint extrusions and report coverage honestly — never fake photoreal.
 * `full` is reserved for Google tiles that have actually loaded in the scene.
 */
export function resolveSpatialLayer(env: SpatialEnv = {}): SpatialLayerStatus {
  if (env.forceCoverage === 'none') {
    return extrusionStatus('forced none for tests');
  }

  const google = env.googleTiles ?? 'unset';
  if (google === 'loaded') {
    return {
      mode: 'tiles',
      coverage: 'full',
      label: 'Google Photorealistic 3D Tiles',
      reason: 'proxied Google Map Tiles session loaded tiles in scene',
    };
  }

  if (env.forceCoverage === 'partial') {
    return {
      mode: 'extrusions',
      coverage: 'partial',
      label: 'OSM extrusions · tiles unavailable',
      reason: 'forced partial — extrusions remain primary',
    };
  }

  if (env.forceCoverage === 'full') {
    // Still extrusions until tiles actually load; label stays honest.
    return {
      mode: 'extrusions',
      coverage: 'partial',
      label: 'OSM extrusions · photoreal not wired',
      reason: 'full coverage requested but tiles not loaded',
    };
  }

  if (google === 'available' || google === 'loading') {
    return {
      mode: 'extrusions',
      coverage: 'partial',
      label: 'OSM extrusions · photoreal loading',
      reason: 'Google tiles session available — awaiting tile load',
    };
  }

  if (google === 'failed') {
    return {
      mode: 'extrusions',
      coverage: 'partial',
      label: 'OSM extrusions · photoreal failed',
      reason: 'Google tiles session or load failed — footprints only',
    };
  }

  const hasMaptiler = Boolean(env.maptilerKey?.trim());
  const hasCesium = Boolean(env.cesiumIonToken?.trim());

  if (!hasMaptiler && !hasCesium) {
    return extrusionStatus('no MapTiler/Cesium/Google tiles — OSM extrusions only');
  }

  // Keys present but tile/terrain renderers not active: stay on extrusions.
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

/** Read Vite env for browser resolve (no Google secret — that stays on the API). */
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
