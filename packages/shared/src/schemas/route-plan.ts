import { z } from 'zod';

export const RoutePlanSchema = z.object({
  orderedPoiIds: z.array(z.string().min(1)),
  totalMeters: z.number().nonnegative(),
  estimatedMinutes: z.number().nonnegative(),
  titleJa: z.string().min(1),
  titleEn: z.string().min(1),
});

export type RoutePlan = z.infer<typeof RoutePlanSchema>;
