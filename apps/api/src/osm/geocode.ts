import type { LonLat } from '@trailforge/shared';
import { OsmNotFoundError, OsmUpstreamError } from './errors.js';
import { createRateLimiter } from './rate-limit.js';

const USER_AGENT =
  'TrailForge/0.1 (https://github.com/Jithin-J-Nair/Trail-Forge; contact: trailforge-dev@example.com)';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const PHOTON = 'https://photon.komoot.io/api/';
const scheduleNominatim = createRateLimiter(1000);

export type GeocodeResult = LonLat & { displayName: string };

async function geocodeNominatim(
  query: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
): Promise<GeocodeResult> {
  const url = new URL(NOMINATIM);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const res = await fetchImpl(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new OsmUpstreamError(`Nominatim HTTP ${res.status}`);
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new OsmNotFoundError(`No results for "${query}"`);
    }
    const first = data[0] as { lat?: string; lon?: string; display_name?: string };
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new OsmUpstreamError('Nominatim returned invalid coordinates');
    }
    return {
      lat,
      lon,
      displayName: first.display_name ?? query,
    };
  } catch (err) {
    if (err instanceof OsmNotFoundError || err instanceof OsmUpstreamError) throw err;
    throw new OsmUpstreamError(err instanceof Error ? err.message : 'Nominatim failed');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

async function geocodePhoton(
  query: string,
  fetchImpl: typeof fetch,
  signal?: AbortSignal,
): Promise<GeocodeResult> {
  const url = new URL(PHOTON);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '1');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  try {
    const res = await fetchImpl(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new OsmUpstreamError(`Photon HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      features?: Array<{
        geometry?: { coordinates?: number[] };
        properties?: { name?: string; city?: string; country?: string };
      }>;
    };
    const feature = data.features?.[0];
    const coords = feature?.geometry?.coordinates;
    const lon = coords?.[0];
    const lat = coords?.[1];
    if (typeof lon !== 'number' || typeof lat !== 'number') {
      throw new OsmNotFoundError(`No results for "${query}"`);
    }
    const props = feature?.properties;
    const displayName =
      [props?.name, props?.city, props?.country].filter(Boolean).join(', ') || query;
    return { lat, lon, displayName };
  } catch (err) {
    if (err instanceof OsmNotFoundError || err instanceof OsmUpstreamError) throw err;
    throw new OsmUpstreamError(err instanceof Error ? err.message : 'Photon failed');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

export async function geocode(
  query: string,
  options: { fetchImpl?: typeof fetch; signal?: AbortSignal } = {},
): Promise<GeocodeResult> {
  const fetchImpl = options.fetchImpl ?? fetch;

  return scheduleNominatim(async () => {
    try {
      return await geocodeNominatim(query, fetchImpl, options.signal);
    } catch (err) {
      if (err instanceof OsmNotFoundError) throw err;
      // Cloud egress often gets Nominatim 403; Photon is the live fallback.
      return geocodePhoton(query, fetchImpl, options.signal);
    }
  });
}
