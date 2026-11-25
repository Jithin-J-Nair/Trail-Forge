import {
  lonLatToLocalMeters,
  type Building,
  type LonLat,
  type PoiLocal,
  type Road,
  type RoadKind,
} from '@trailforge/shared';
import type { OverpassBundle, OverpassElement } from './overpass.js';
import { isValidPolygon, simplifyPolyline } from './simplify.js';

const MAX_POIS = 12;
const MAX_BUILDINGS = 2000;

export function deriveHeightMeters(tags: Record<string, string> | undefined): number {
  if (!tags) return 9;
  const height = tags['height'];
  if (height) {
    const n = Number.parseFloat(height.replace(/m$/i, '').trim());
    if (Number.isFinite(n) && n > 0) return n;
  }
  const levels = tags['building:levels'];
  if (levels) {
    const n = Number.parseFloat(levels);
    if (Number.isFinite(n) && n > 0) return n * 3.2;
  }
  return 9;
}

function elementCenter(el: OverpassElement): LonLat | null {
  if (typeof el.lat === 'number' && typeof el.lon === 'number') {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  if (el.geometry && el.geometry.length > 0) {
    let lat = 0;
    let lon = 0;
    for (const g of el.geometry) {
      lat += g.lat;
      lon += g.lon;
    }
    const n = el.geometry.length;
    return { lat: lat / n, lon: lon / n };
  }
  return null;
}

function poiName(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  return tags['name'] ?? tags['name:en'] ?? tags['name:ja'] ?? null;
}

function categoryFromTags(tags: Record<string, string>): string {
  return (
    tags['tourism'] ??
    tags['amenity'] ??
    tags['shop'] ??
    tags['leisure'] ??
    tags['historic'] ??
    tags['natural'] ??
    'place'
  );
}

function mapHighwayKind(highway: string | undefined): RoadKind {
  switch (highway) {
    case 'motorway':
    case 'trunk':
      return 'motorway';
    case 'primary':
      return 'primary';
    case 'secondary':
      return 'secondary';
    case 'tertiary':
      return 'tertiary';
    case 'residential':
    case 'living_street':
    case 'service':
      return 'residential';
    case 'footway':
    case 'path':
    case 'pedestrian':
    case 'cycleway':
      return 'path';
    default:
      return 'other';
  }
}

function dist2(center: LonLat, p: LonLat): number {
  const dlat = p.lat - center.lat;
  const dlon = p.lon - center.lon;
  return dlat * dlat + dlon * dlon;
}

export type TransformedScene = {
  center: LonLat;
  pois: PoiLocal[];
  buildings: Building[];
  roads: Road[];
};

export function transformOverpass(center: LonLat, bundle: OverpassBundle): TransformedScene {
  const namedPois = bundle.pois
    .map((el) => {
      const name = poiName(el.tags);
      const c = elementCenter(el);
      if (!name || !c) return null;
      const tags = el.tags ?? {};
      const local = lonLatToLocalMeters(center, c.lon, c.lat);
      return {
        id: `${el.type}/${el.id}`,
        name,
        lat: c.lat,
        lon: c.lon,
        category: categoryFromTags(tags),
        osmTags: tags,
        x: local.x,
        z: local.z,
        tagCount: Object.keys(tags).length,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => b.tagCount - a.tagCount)
    .slice(0, MAX_POIS)
    .map((poi) => ({
      id: poi.id,
      name: poi.name,
      lat: poi.lat,
      lon: poi.lon,
      category: poi.category,
      osmTags: poi.osmTags,
      x: poi.x,
      z: poi.z,
    }));

  const buildings = bundle.buildings
    .map((el) => {
      const c = elementCenter(el);
      if (!c || !el.geometry || el.geometry.length < 3) return null;
      const footprint = el.geometry.map((g) => {
        const local = lonLatToLocalMeters(center, g.lon, g.lat);
        return [local.x, local.z] as [number, number];
      });
      const simplified = simplifyPolyline(footprint, 0.5);
      if (!isValidPolygon(simplified)) return null;
      return {
        id: `${el.type}/${el.id}`,
        footprint: simplified,
        heightMeters: deriveHeightMeters(el.tags),
        dist: dist2(center, c),
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, MAX_BUILDINGS)
    .map((b) => ({
      id: b.id,
      footprint: b.footprint,
      heightMeters: b.heightMeters,
    }));

  const roads = bundle.highways
    .map((el) => {
      if (!el.geometry || el.geometry.length < 2) return null;
      const points = el.geometry.map((g) => {
        const local = lonLatToLocalMeters(center, g.lon, g.lat);
        return [local.x, local.z] as [number, number];
      });
      return {
        id: `${el.type}/${el.id}`,
        kind: mapHighwayKind(el.tags?.['highway']),
        points: simplifyPolyline(points, 0.5),
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return { center, pois: namedPois, buildings, roads };
}
