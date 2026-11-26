import type { Theme } from '@trailforge/shared';
import type { OverpassBundle } from '../../osm/overpass.js';
import { transformOverpass } from '../../osm/transform.js';
import type {
  GeocodeProvider,
  GeocodeRequest,
  GeocodeResult,
  PoiDiscoveryProvider,
  PoiDiscoveryRequest,
  PoiDiscoveryResult,
} from '../types.js';

const DEV_LABEL = '[DEV MODE - LOCAL FIXTURE DATA]';

function hashNum(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function devCenter(query: string): { lat: number; lon: number; displayName: string } {
  // Deterministic, clearly-labeled dev fixture coordinates. Not a real geocoding result.
  const h = hashNum(query.toLowerCase().trim());
  const lat = -60 + (h % 1200) / 10;
  const lon = -180 + ((h / 1200) % 3600) / 10;
  return { lat, lon, displayName: `${DEV_LABEL} ${query}` };
}

export class LocalDevGeocodeProvider implements GeocodeProvider {
  readonly name = 'local_dev' as const;
  readonly kind = 'geocode' as const;
  isConfigured() {
    return process.env['LOCAL_DEV_DATA_SOURCE'] === 'true';
  }
  async geocode(req: GeocodeRequest): Promise<GeocodeResult> {
    const c = devCenter(req.query);
    return { ...c, provider: this.name };
  }
}

const THEME_NAMES: Record<Theme, string[]> = {
  culture: ['Museum', 'Gallery', 'Historic Site', 'Theater', 'Monument'],
  food: ['Cafe', 'Restaurant', 'Market', 'Bakery', 'Food Hall'],
  nature: ['Park', 'Garden', 'Trailhead', 'Viewpoint', 'Reserve'],
  shopping: ['Market', 'Boutique', 'Bookstore', 'Craft Shop', 'Arcade'],
  nightlife: ['Music Venue', 'Night Market', 'Lounge', 'Plaza', 'Theater'],
};

export class LocalDevPoiProvider implements PoiDiscoveryProvider {
  readonly name = 'local_dev' as const;
  readonly kind = 'poi_discovery' as const;
  isConfigured() {
    return process.env['LOCAL_DEV_DATA_SOURCE'] === 'true';
  }
  async discover(req: PoiDiscoveryRequest): Promise<PoiDiscoveryResult> {
    const names = THEME_NAMES[req.theme];
    const pois = names.map((n, i) => {
      const angle = (i / names.length) * Math.PI * 2;
      const r = 0.003 + i * 0.001;
      return {
        type: 'node',
        id: 900000 + i,
        lat: req.center.lat + Math.cos(angle) * r,
        lon: req.center.lon + Math.sin(angle) * r,
        tags: {
          name: `${DEV_LABEL} ${n} ${i + 1}`,
          category: req.theme,
          note: 'Local dev fixture - not a real place',
        },
      };
    });
    const bundle: OverpassBundle = { pois, buildings: [], highways: [] };
    return { scene: transformOverpass(req.center, bundle), provider: this.name };
  }
}

export function isLocalDevDataSourceEnabled(): boolean {
  return process.env['LOCAL_DEV_DATA_SOURCE'] === 'true';
}
