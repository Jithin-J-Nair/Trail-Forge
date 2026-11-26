import type { Theme } from '@trailforge/shared';
import type { OverpassBundle } from '../../osm/overpass.js';
import { transformOverpass } from '../../osm/transform.js';
import { geoJsonFeaturesToPoiElements } from '../parse-geojson.js';
import type { PoiDiscoveryProvider, PoiDiscoveryRequest, PoiDiscoveryResult } from '../types.js';

const THEME_CATEGORIES: Record<Theme, string> = {
  culture: 'entertainment.culture,tourism.sights',
  food: 'catering.restaurant,catering.cafe,catering.fast_food',
  nature: 'natural,leisure.park',
  shopping: 'commercial.shopping_mall,commercial.marketplace',
  nightlife: 'catering.bar,adult.nightclub,entertainment',
};

export class GeoapifyPoiProvider implements PoiDiscoveryProvider {
  readonly name = 'geoapify' as const;
  readonly kind = 'poi_discovery' as const;
  constructor(private readonly apiKey = process.env['GEOAPIFY_API_KEY']) {}
  isConfigured() {
    return Boolean(this.apiKey);
  }
  async discover(req: PoiDiscoveryRequest): Promise<PoiDiscoveryResult> {
    const url = new URL('https://api.geoapify.com/v2/places');
    url.searchParams.set('categories', THEME_CATEGORIES[req.theme]);
    url.searchParams.set(
      'filter',
      `circle:${req.center.lon},${req.center.lat},${req.radiusMeters}`,
    );
    url.searchParams.set('limit', '20');
    url.searchParams.set('apiKey', this.apiKey!);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      ...(req.signal ? { signal: req.signal } : {}),
    });
    if (!res.ok)
      throw Object.assign(new Error(`Geoapify places HTTP ${res.status}`), { status: res.status });
    const pois = geoJsonFeaturesToPoiElements(await res.json());
    const bundle: OverpassBundle = { pois, buildings: [], highways: [] };
    return { scene: transformOverpass(req.center, bundle), provider: this.name };
  }
}
