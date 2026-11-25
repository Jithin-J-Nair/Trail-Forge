import { z } from 'zod';
import { LocalXZSchema } from './primitives.js';

export const BuildingSchema = z.object({
  id: z.string().min(1),
  footprint: z.array(LocalXZSchema).min(3),
  heightMeters: z.number().positive(),
});

export type Building = z.infer<typeof BuildingSchema>;
