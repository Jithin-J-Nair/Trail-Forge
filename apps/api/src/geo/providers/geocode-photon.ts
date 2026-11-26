import { OsmNotFoundError, OsmUpstreamError } from '../../osm/errors.js';
import { firstGeoJsonPoint } from '../parse-geojson.js';
import type { GeocodeProvider, GeocodeRequest, GeocodeResult } from '../types.js';

const PHOTON = 'https://photon.komoot.io/api/';
const USER_AGENT =
  'TrailForge/0.1 (https://github.com/Jithin-J-Nair/Trail-Forge; contact: trailforge-dev@example.com)';

export class PhotonGeocodeProvider implements GeocodeProvider {
  readonly name = 'photon' as const;
  readonly kind = 'geocode' as const;
  isConfigured() {
    return true;
  }
  async geocode(req: GeocodeRequest): Promise<GeocodeResult> {
    const url = new URL(PHOTON);
    url.searchParams.set('q', req.query);
    url.searchParams.set('limit', '1');
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
      ...(req.signal ? { signal: req.signal } : {}),
    });
    if (!res.ok) throw new OsmUpstreamError(`Photon HTTP ${res.status}`);
    const parsed = firstGeoJsonPoint(await res.json(), req.query);
    if (!parsed) {
      throw Object.assign(new OsmNotFoundError(`No results for "${req.query}"`), {
        code: 'NOT_FOUND',
      });
    }
    return {
      lat: parsed.point.lat,
      lon: parsed.point.lon,
      displayName: parsed.displayName,
      provider: this.name,
    };
  }
}
