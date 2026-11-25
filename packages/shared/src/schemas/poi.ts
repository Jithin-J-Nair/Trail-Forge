import { z } from 'zod';

export const PoiSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  category: z.string().min(1),
  osmTags: z.record(z.string(), z.string()),
});

export type Poi = z.infer<typeof PoiSchema>;

/** POI placed in the local meter frame (+x east, +z south). */
export const PoiLocalSchema = PoiSchema.extend({
  x: z.number(),
  z: z.number(),
});

export type PoiLocal = z.infer<typeof PoiLocalSchema>;
