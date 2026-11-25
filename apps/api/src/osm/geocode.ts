import type { LonLat } from '@trailforge/shared';
import { OsmNotFoundError, OsmUpstreamError } from './errors.js';
import { createRateLimiter } from './rate-limit.js';

const USER_AGENT =
  'TrailForge/0.1 (https://github.com/Jithin-J-Nair/Trail-Forge; contact: trailforge-dev@example.com)';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const scheduleNominatim = createRateLimiter(1000);

export type GeocodeResult = LonLat & { displayName: string };

export async function geocode(
  query: string,
  options: { fetchImpl?: typeof fetch; signal?: AbortSignal } = {},
): Promise<GeocodeResult> {
  const fetchImpl = options.fetchImpl ?? fetch;

  return scheduleNominatim(async () => {
    const url = new URL(NOMINATIM);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const onAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onAbort);

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
      options.signal?.removeEventListener('abort', onAbort);
    }
  });
}
