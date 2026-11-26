import type { LonLat } from '@trailforge/shared';
import type { OverpassElement } from '../osm/overpass.js';

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' ? (value as JsonRecord) : null;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Best-effort GeoJSON FeatureCollection → first point + display name. */
export function firstGeoJsonPoint(
  data: unknown,
  fallbackName: string,
): { point: LonLat; displayName: string } | null {
  const root = asRecord(data);
  const features = root?.['features'];
  if (!Array.isArray(features) || features.length === 0) return null;
  const feature = asRecord(features[0]);
  if (!feature) return null;
  const geometry = asRecord(feature['geometry']);
  const coordinates = geometry?.['coordinates'];
  if (!Array.isArray(coordinates)) return null;
  const lon = asNumber(coordinates[0]);
  const lat = asNumber(coordinates[1]);
  if (lat === undefined || lon === undefined) return null;
  const props = asRecord(feature['properties']) ?? {};
  const displayName =
    [asString(props['name']), asString(props['city']), asString(props['country'])]
      .filter(Boolean)
      .join(', ') ||
    asString(props['formatted']) ||
    asString(props['label']) ||
    fallbackName;
  return { point: { lat, lon }, displayName };
}

/** Map GeoJSON place features into Overpass-shaped POI nodes for transformOverpass. */
export function geoJsonFeaturesToPoiElements(data: unknown): OverpassElement[] {
  const root = asRecord(data);
  const features = root?.['features'];
  if (!Array.isArray(features)) return [];
  return features.flatMap((feature, i): OverpassElement[] => {
    const f = asRecord(feature);
    if (!f) return [];
    const props = asRecord(f['properties']) ?? {};
    const geometry = asRecord(f['geometry']);
    const coordinates = geometry?.['coordinates'];
    const lat =
      asNumber(props['lat']) ?? (Array.isArray(coordinates) ? asNumber(coordinates[1]) : undefined);
    const lon =
      asNumber(props['lon']) ?? (Array.isArray(coordinates) ? asNumber(coordinates[0]) : undefined);
    if (lat === undefined || lon === undefined) return [];
    const placeId = asString(props['place_id']) ?? '';
    const id = Number(placeId.replace(/\D/g, '').slice(-9)) || i + 1;
    const categories = props['categories'];
    const category = Array.isArray(categories) ? asString(categories[0]) : undefined;
    const tags: Record<string, string> = {
      name: asString(props['name']) ?? asString(props['address_line1']) ?? 'Unnamed place',
    };
    if (category) tags['category'] = category;
    const website = asString(props['website']);
    if (website) tags['website'] = website;
    return [{ type: 'node', id, lat, lon, tags }];
  });
}
