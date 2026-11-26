import { z } from 'zod';

export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const PlaceSourceSchema = z.object({
  sourceType: z.enum(['osm', 'overpass', 'nominatim', 'licensed_poi', 'gov_open_data']),
  sourceId: z.string().min(1),
  sourceUrl: z.string().url().optional(),
  license: z.string().optional(),
  fetchedAt: z.string().datetime(),
});
export type PlaceSource = z.infer<typeof PlaceSourceSchema>;

export const CanonicalPlaceSchema = z.object({
  id: z.string().uuid(),
  canonicalSource: z.string().min(1),
  canonicalSourceId: z.string().min(1),
  name: z.string().min(1),
  nameLocal: z.string().optional(),
  category: z.string().min(1),
  tags: z.record(z.string()),
  location: GeoPointSchema,
  address: z.record(z.string()).optional(),
  confidence: z.number().min(0).max(1),
  sources: z.array(PlaceSourceSchema).min(1),
  lastVerifiedAt: z.string().datetime(),
});
export type CanonicalPlace = z.infer<typeof CanonicalPlaceSchema>;

export function canonicalPlaceKey(source: string, sourceId: string): string {
  return `${source}:${sourceId}`;
}
