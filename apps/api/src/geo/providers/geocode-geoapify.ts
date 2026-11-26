import type { GeocodeProvider, GeocodeRequest, GeocodeResult } from '../types.js';

type GeoapifyResult = { lat?: unknown; lon?: unknown; formatted?: unknown };

export class GeoapifyGeocodeProvider implements GeocodeProvider {
  readonly name = 'geoapify' as const;
  readonly kind = 'geocode' as const;
  constructor(private readonly apiKey = process.env['GEOAPIFY_API_KEY']) {}
  isConfigured() {
    return Boolean(this.apiKey);
  }
  async geocode(req: GeocodeRequest): Promise<GeocodeResult> {
    const url = new URL('https://api.geoapify.com/v1/geocode/search');
    url.searchParams.set('text', req.query);
    url.searchParams.set('limit', '1');
    url.searchParams.set('format', 'json');
    url.searchParams.set('apiKey', this.apiKey!);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      ...(req.signal ? { signal: req.signal } : {}),
    });
    if (!res.ok)
      throw Object.assign(new Error(`Geoapify HTTP ${res.status}`), { status: res.status });
    const data = (await res.json()) as { results?: GeoapifyResult[] };
    const r = data.results?.[0];
    if (!r || typeof r.lat !== 'number' || typeof r.lon !== 'number') {
      throw Object.assign(new Error(`No results for "${req.query}"`), { code: 'NOT_FOUND' });
    }
    return {
      lat: r.lat,
      lon: r.lon,
      displayName: typeof r.formatted === 'string' ? r.formatted : req.query,
      provider: this.name,
    };
  }
}
