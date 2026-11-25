import { z } from 'zod';

/** WGS84 geographic point. */
export const LonLatSchema = z.object({
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
});

export type LonLat = z.infer<typeof LonLatSchema>;

/** Local meters: +x east, +z south (Y-up scene). */
export const LocalXZSchema = z.tuple([z.number(), z.number()]);

export type LocalXZ = z.infer<typeof LocalXZSchema>;

export const ThemeSchema = z.enum(['culture', 'food', 'nature', 'shopping', 'nightlife']);

export type Theme = z.infer<typeof ThemeSchema>;

export const RoadKindSchema = z.enum([
  'motorway',
  'primary',
  'secondary',
  'tertiary',
  'residential',
  'path',
  'other',
]);

export type RoadKind = z.infer<typeof RoadKindSchema>;

export const ContentStatusSchema = z.enum(['verified', 'needs_review', 'rejected']);

export type ContentStatus = z.infer<typeof ContentStatusSchema>;
