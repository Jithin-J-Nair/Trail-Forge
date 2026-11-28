import { z } from 'zod';

export const RouteObjectiveSchema = z.object({
  id: z.enum(['proximity', 'theme', 'walkability', 'duration']),
  weight: z.number().min(0).max(1),
  description: z.string().min(1),
});

export type RouteObjective = z.infer<typeof RouteObjectiveSchema>;

/** Transparent multi-objective scoring summary — never invents places. */
export const RouteScoringSchema = z.object({
  objectives: z.array(RouteObjectiveSchema).min(1),
  candidateCount: z.number().int().nonnegative(),
  selectedCount: z.number().int().nonnegative(),
  trimmedCount: z.number().int().nonnegative(),
});

export type RouteScoring = z.infer<typeof RouteScoringSchema>;

/** How walking distance was measured — honest fallback when no routing key. */
export const RouteRoutingSchema = z.object({
  provider: z.enum(['euclidean_detour', 'openrouteservice', 'graphhopper']),
  label: z.string().min(1),
  reason: z.string().min(1),
});

export type RouteRouting = z.infer<typeof RouteRoutingSchema>;

export const RoutePlanSchema = z.object({
  orderedPoiIds: z.array(z.string().min(1)),
  totalMeters: z.number().nonnegative(),
  estimatedMinutes: z.number().nonnegative(),
  titleJa: z.string().min(1),
  titleEn: z.string().min(1),
  scoring: RouteScoringSchema.optional(),
  routing: RouteRoutingSchema.optional(),
});

export type RoutePlan = z.infer<typeof RoutePlanSchema>;
