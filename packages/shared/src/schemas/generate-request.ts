import { z } from 'zod';
import { ThemeSchema } from './primitives.js';

export const GenerateRequestSchema = z.object({
  query: z.string().trim().min(2).max(120),
  theme: ThemeSchema,
  durationMinutes: z.number().int().min(30).max(240),
  radiusMeters: z.number().int().min(300).max(800).default(500),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
