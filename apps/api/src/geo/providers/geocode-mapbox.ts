import type { GeocodeProvider, GeocodeRequest, GeocodeResult } from '../types.js';

export class MapboxGeocodeProvider implements GeocodeProvider {
  readonly name = 'mapbox' as const;
  readonly kind = 'geocode' as const;
  constructor(private readonly token = process.env['MAPBOX_ACCESS_TOKEN']) {}
  isConfigured() { return Boolean(this.token); }
  async geocode(req: GeocodeRequest): Promise<GeocodeResult> {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(req.query)}.json`);
    url.searchParams.set('limit', '1');
    url.searchParams.set('access_token', this.token!);
    const res = await fetch(url, { headers: { Accept: 'application/json' }, ...(req.signal ? { signal: req.signal } : {}) });
    if (!res.ok) throw Object.assign(new Error(`Mapbox HTTP ${res.status}`), { status: res.status });
    const data = await res.json() as any;
    const f = data?.features?.[0];
    const [lon, lat] = f?.center ?? [];
    if (typeof lat !== 'number' || typeof lon !== 'number') throw Object.assign(new Error(`No results for "${req.query}"`), { code: 'NOT_FOUND' });
    return { lat, lon, displayName: f?.place_name ?? req.query, provider: this.name };
  }
}
