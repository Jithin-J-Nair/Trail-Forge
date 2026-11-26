import type { Theme } from '@trailforge/shared';
import type { OverpassBundle, OverpassElement } from '../../osm/overpass.js';
import { transformOverpass } from '../../osm/transform.js';
import type { PoiDiscoveryProvider, PoiDiscoveryRequest, PoiDiscoveryResult } from '../types.js';

const THEME_QUERY: Record<Theme, string> = {
  culture: 'museum',
  food: 'restaurant',
  nature: 'park',
  shopping: 'market',
  nightlife: 'bar',
};

type MapboxFeature = {
  center?: number[];
  text?: string;
  place_name?: string;
};

export class MapboxPoiProvider implements PoiDiscoveryProvider {
  readonly name = 'mapbox' as const;
  readonly kind = 'poi_discovery' as const;
  constructor(private readonly token = process.env['MAPBOX_ACCESS_TOKEN']) {}
  isConfigured() {
    return Boolean(this.token);
  }
  async discover(req: PoiDiscoveryRequest): Promise<PoiDiscoveryResult> {
    const q = THEME_QUERY[req.theme];
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`,
    );
    url.searchParams.set('proximity', `${req.center.lon},${req.center.lat}`);
    url.searchParams.set('limit', '10');
    url.searchParams.set('access_token', this.token!);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      ...(req.signal ? { signal: req.signal } : {}),
    });
    if (!res.ok)
      throw Object.assign(new Error(`Mapbox places HTTP ${res.status}`), { status: res.status });
    const data = (await res.json()) as { features?: MapboxFeature[] };
    const pois: OverpassElement[] = (data.features ?? []).flatMap((f, i): OverpassElement[] => {
      const lat = f.center?.[1];
      const lon = f.center?.[0];
      if (typeof lat !== 'number' || typeof lon !== 'number') return [];
      return [
        {
          type: 'node',
          id: i + 1,
          lat,
          lon,
          tags: { name: f.text ?? f.place_name ?? 'Unnamed place', category: q },
        },
      ];
    });
    const bundle: OverpassBundle = { pois, buildings: [], highways: [] };
    return { scene: transformOverpass(req.center, bundle), provider: this.name };
  }
}
