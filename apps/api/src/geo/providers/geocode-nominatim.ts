import { OsmNotFoundError, OsmUpstreamError } from '../../osm/errors.js';
import { geocode } from '../../osm/geocode.js';
import type { GeocodeProvider, GeocodeRequest, GeocodeResult } from '../types.js';

export class NominatimGeocodeProvider implements GeocodeProvider {
  readonly name = 'nominatim' as const;
  readonly kind = 'geocode' as const;
  isConfigured() { return true; }
  async geocode(req: GeocodeRequest): Promise<GeocodeResult> {
    try {
      const r = await geocode(req.query, { ...(req.signal ? { signal: req.signal } : {}) });
      return { ...r, provider: this.name };
    } catch (err) {
      if (err instanceof OsmNotFoundError) throw Object.assign(new Error(err.message), { code: 'NOT_FOUND', status: 404 });
      if (err instanceof OsmUpstreamError) throw err;
      throw err;
    }
  }
}
