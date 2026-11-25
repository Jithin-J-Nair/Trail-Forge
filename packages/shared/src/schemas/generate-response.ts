import { z } from 'zod';
import { BuildingSchema } from './building.js';
import { PoiContentSchema } from './poi-content.js';
import { PoiLocalSchema } from './poi.js';
import { LonLatSchema } from './primitives.js';
import { RoadSchema } from './road.js';
import { RoutePlanSchema } from './route-plan.js';

export const SceneSchema = z.object({
  buildings: z.array(BuildingSchema),
  roads: z.array(RoadSchema),
});

export type Scene = z.infer<typeof SceneSchema>;

export const VerificationSummarySchema = z.object({
  verified: z.number().int().nonnegative(),
  needsReview: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export type VerificationSummary = z.infer<typeof VerificationSummarySchema>;

export const GenerateResponseSchema = z.object({
  center: LonLatSchema,
  scene: SceneSchema,
  pois: z.array(PoiLocalSchema),
  content: z.array(PoiContentSchema),
  route: RoutePlanSchema,
  verification: VerificationSummarySchema,
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
