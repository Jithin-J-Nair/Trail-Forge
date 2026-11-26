import type { Theme } from '@trailforge/shared';
import { transformOverpass } from '../../osm/transform.js';
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
  isConfigured() { return Boolean(this.apiKey); }
  async discover(req: PoiDiscoveryRequest): Promise<PoiDiscoveryResult> {
    const url = new URL('https://api.geoapify.com/v2/places');
    url.searchParams.set('categories', THEME_CATEGORIES[req.theme]);
    url.searchParams.set('filter', `circle:${req.center.lon},${req.center.lat},${req.radiusMeters}`);
    url.searchParams.set('limit', '20');
    url.searchParams.set('apiKey', this.apiKey!);
    const res = await fetch(url, { headers: { Accept: 'application/json' }, ...(req.signal ? { signal: req.signal } : {}) });
    if (!res.ok) throw Object.assign(new Error(`Geoapify places HTTP ${res.status}`), { status: res.status });
    const data = await res.json() as any;
    const pois = (data?.features ?? []).map((f: any, i: number) => ({
      type: 'node',
      id: Number(f?.properties?.place_id?.replace(/\D/g, '').slice(-9)) || i + 1,
      lat: f?.properties?.lat ?? f?.geometry?.coordinates?.[1],
      lon: f?.properties?.lon ?? f?.geometry?.coordinates?.[0],
      tags: {
        name: f?.properties?.name ?? f?.properties?.address_line1 ?? 'Unnamed place',
        ...(f?.properties?.categories?.[0] ? { category: f.properties.categories[0] } : {}),
        ...(f?.properties?.website ? { website: f.properties.website } : {}),
      },
    }));
    const scene = transformOverpass(req.center, { pois, buildings: [], highways: [] } as any);
    return { scene, provider: this.name };
  }
}
