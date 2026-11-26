import type { GeocodeProvider, GeocodeRequest, GeocodeResult } from '../types.js';

export class OrsGeocodeProvider implements GeocodeProvider {
  readonly name = 'openrouteservice' as const;
  readonly kind = 'geocode' as const;
  constructor(private readonly apiKey = process.env['OPENROUTESERVICE_API_KEY']) {}
  isConfigured() { return Boolean(this.apiKey); }
  async geocode(req: GeocodeRequest): Promise<GeocodeResult> {
    const url = new URL('https://api.openrouteservice.org/geocode/search');
    url.searchParams.set('text', req.query);
    url.searchParams.set('size', '1');
    const res = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: this.apiKey! },
      ...(req.signal ? { signal: req.signal } : {}),
    });
    if (!res.ok) throw Object.assign(new Error(`ORS geocode HTTP ${res.status}`), { status: res.status });
    const data = await res.json() as any;
    const f = data?.features?.[0];
    const [lon, lat] = f?.geometry?.coordinates ?? [];
    if (typeof lat !== 'number' || typeof lon !== 'number') throw Object.assign(new Error(`No results for "${req.query}"`), { code: 'NOT_FOUND' });
    return { lat, lon, displayName: f?.properties?.label ?? req.query, provider: this.name };
  }
}
