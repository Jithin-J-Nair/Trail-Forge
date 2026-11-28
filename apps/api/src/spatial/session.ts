import type {
  GoogleTilesSessionAvailable,
  GoogleTilesSessionUnavailable,
} from '@trailforge/shared';
import { hasGoogleMapsApiKey } from './google-key.js';

/** Client fetches the root tileset through this same-origin proxy path. */
export const GOOGLE_TILES_ROOT_PATH = '/api/spatial/google-tiles/v1/3dtiles/root.json';

/** Google documents ≥3h of tile requests per root tileset fetch. */
const ROOT_SESSION_TTL_MS = 3 * 60 * 60 * 1000;

export function unavailableSession(reason: string): GoogleTilesSessionUnavailable {
  return {
    available: false,
    error: 'google_tiles_unavailable',
    reason,
  };
}

/**
 * Build a client-safe session descriptor when the server key is present.
 * Photorealistic 3D Tiles do not use Map Tiles createSession (2D/SV only);
 * the root.json fetch establishes Google's ~3h tile window.
 */
export function createGoogleTilesSession(
  source: NodeJS.ProcessEnv = process.env,
  nowMs: number = Date.now(),
): GoogleTilesSessionAvailable | GoogleTilesSessionUnavailable {
  if (!hasGoogleMapsApiKey(source)) {
    return unavailableSession('GOOGLE_MAPS_API_KEY unset');
  }
  return {
    available: true,
    provider: 'google-photorealistic-3d',
    rootUrl: GOOGLE_TILES_ROOT_PATH,
    expiresAt: new Date(nowMs + ROOT_SESSION_TTL_MS).toISOString(),
  };
}
