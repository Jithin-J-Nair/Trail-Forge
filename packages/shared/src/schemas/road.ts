import { z } from 'zod';
import { LocalXZSchema, RoadKindSchema } from './primitives.js';

export const RoadSchema = z.object({
  id: z.string().min(1),
  kind: RoadKindSchema,
  points: z.array(LocalXZSchema).min(2),
});

export type Road = z.infer<typeof RoadSchema>;
