import { OsmNotFoundError, OsmUpstreamError } from '../../osm/errors.js';
import type { GeocodeProvider, GeocodeRequest, GeocodeResult } from '../types.js';

const PHOTON = 'https://photon.komoot.io/api/';

export class PhotonGeocodeProvider implements GeocodeProvider {
  readonly name = 'photon' as const;
  readonly kind = 'geocode' as const;
  isConfigured() { return true; }
  async geocode(req: GeocodeRequest): Promise<GeocodeResult> {
    const url = new URL(PHOTON);
    url.searchParams.set('q', req.query);
    url.searchParams.set('limit', '1');
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'TrailForge/0.1' }, ...(req.signal ? { signal: req.signal } : {}) });
    if (!res.ok) throw new OsmUpstreamError(`Photon HTTP ${res.status}`);
    const data = await res.json() as any;
    const f = data?.features?.[0];
    const [lon, lat] = f?.geometry?.coordinates ?? [];
    if (typeof lat !== 'number' || typeof lon !== 'number') throw Object.assign(new OsmNotFoundError(`No results for "${req.query}"`), { code: 'NOT_FOUND' });
    const name = [f?.properties?.name, f?.properties?.city, f?.properties?.country].filter(Boolean).join(', ') || req.query;
    return { lat, lon, displayName: name, provider: this.name };
  }
}
