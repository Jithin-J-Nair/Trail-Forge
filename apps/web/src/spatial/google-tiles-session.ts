import {
  GoogleTilesSessionResponseSchema,
  type GoogleTilesSessionResponse,
} from '@trailforge/shared';

/** Fetch a client-safe Google Photorealistic 3D Tiles session from the API. */
export async function fetchGoogleTilesSession(
  signal?: AbortSignal,
): Promise<GoogleTilesSessionResponse> {
  const res = await fetch('/api/spatial/google-tiles-session', signal ? { signal } : undefined);
  const json: unknown = await res.json().catch(() => null);
  const parsed = GoogleTilesSessionResponseSchema.safeParse(json);
  if (parsed.success) return parsed.data;
  if (res.status === 503) {
    return {
      available: false,
      error: 'google_tiles_unavailable',
      reason: 'GOOGLE_MAPS_API_KEY unset',
    };
  }
  return {
    available: false,
    error: 'google_tiles_unavailable',
    reason: 'invalid google tiles session response',
  };
}
