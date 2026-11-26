import { fetchOverpassBundle } from '../../osm/overpass.js';
import { transformOverpass } from '../../osm/transform.js';
import type { PoiDiscoveryProvider, PoiDiscoveryRequest, PoiDiscoveryResult } from '../types.js';

export class OverpassPoiProvider implements PoiDiscoveryProvider {
  readonly name = 'overpass' as const;
  readonly kind = 'poi_discovery' as const;
  isConfigured() { return true; }
  async discover(req: PoiDiscoveryRequest): Promise<PoiDiscoveryResult> {
    const bundle = await fetchOverpassBundle(
      req.center,
      req.radiusMeters,
      req.theme,
      { ...(req.signal ? { signal: req.signal } : {}) },
    );
    const scene = transformOverpass(req.center, bundle);
    return { scene, provider: this.name };
  }
}
