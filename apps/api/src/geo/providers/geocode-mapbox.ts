import { firstGeoJsonPoint } from '../parse-geojson.js';
import type { GeocodeProvider, GeocodeRequest, GeocodeResult } from '../types.js';

export class MapboxGeocodeProvider implements GeocodeProvider {
  readonly name = 'mapbox' as const;
  readonly kind = 'geocode' as const;
  constructor(private readonly token = process.env['MAPBOX_ACCESS_TOKEN']) {}
  isConfigured() {
    return Boolean(this.token);
  }
  async geocode(req: GeocodeRequest): Promise<GeocodeResult> {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(req.query)}.json`,
    );
    url.searchParams.set('limit', '1');
    url.searchParams.set('access_token', this.token!);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      ...(req.signal ? { signal: req.signal } : {}),
    });
    if (!res.ok)
      throw Object.assign(new Error(`Mapbox HTTP ${res.status}`), { status: res.status });
    const data = await res.json();
    // Mapbox uses center on features; also try GeoJSON coordinates.
    const root = data as {
      features?: Array<{
        center?: number[];
        place_name?: string;
        geometry?: { coordinates?: number[] };
      }>;
    };
    const f = root.features?.[0];
    const lon = f?.center?.[0] ?? f?.geometry?.coordinates?.[0];
    const lat = f?.center?.[1] ?? f?.geometry?.coordinates?.[1];
    if (typeof lat === 'number' && typeof lon === 'number') {
      return {
        lat,
        lon,
        displayName: f?.place_name ?? req.query,
        provider: this.name,
      };
    }
    const parsed = firstGeoJsonPoint(data, req.query);
    if (!parsed) {
      throw Object.assign(new Error(`No results for "${req.query}"`), { code: 'NOT_FOUND' });
    }
    return {
      lat: parsed.point.lat,
      lon: parsed.point.lon,
      displayName: parsed.displayName,
      provider: this.name,
    };
  }
}
