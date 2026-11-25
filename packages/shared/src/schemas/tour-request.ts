import { z } from 'zod';

export const TourRequestSchema = z.object({
  area: z.string().min(1).max(200),
  theme: z.string().min(1).max(100),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60),
  locale: z.enum(['en', 'ja']).default('en'),
});

export type TourRequest = z.infer<typeof TourRequestSchema>;
