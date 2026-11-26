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

export const DataProvenanceSchema = z.object({
  mode: z.enum(['live_osm', 'local_dev']),
  source: z.string().min(1),
  license: z.string().min(1),
  attribution: z.string().min(1),
  area: z.string().optional(),
  capturedAt: z.string().optional(),
  note: z.string().optional(),
});

export type DataProvenance = z.infer<typeof DataProvenanceSchema>;

export const PoiEnrichmentSchema = z.object({
  poiId: z.string().min(1),
  wikidata: z
    .object({
      qid: z.string(),
      label: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().url().optional(),
      sourceUrl: z.string().url(),
    })
    .optional(),
  wikipedia: z
    .object({
      title: z.string(),
      extract: z.string().optional(),
      url: z.string().url(),
      lang: z.string(),
    })
    .optional(),
});

export type PoiEnrichment = z.infer<typeof PoiEnrichmentSchema>;

export const TrustScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  verificationCoverage: z.number().min(0).max(1),
  sourceQuality: z.number().min(0).max(1),
  unsupportedClaims: z.number().int().nonnegative(),
  missingMetadata: z.number().int().nonnegative(),
});

export type TrustScore = z.infer<typeof TrustScoreSchema>;

export const GenerateResponseSchema = z.object({
  center: LonLatSchema,
  scene: SceneSchema,
  pois: z.array(PoiLocalSchema),
  content: z.array(PoiContentSchema),
  route: RoutePlanSchema,
  verification: VerificationSummarySchema,
  /** Present when the area resolved but no themed POIs matched. */
  message: z.string().min(1).optional(),
  /** True when the response is fixture data (DEMO_MODE). */
  demo: z.boolean().optional(),
  /** Data provenance for geographic/source traceability. */
  provenance: DataProvenanceSchema.optional(),
  /** Best-effort external enrichment from Wikidata/Wikipedia. */
  enrichment: z.array(PoiEnrichmentSchema).optional(),
  /** True when LOCAL_DEV_DATA_SOURCE mode is enabled. */
  devMode: z.boolean().optional(),
  /** Trust score computed from verification and source quality. */
  trustScore: TrustScoreSchema.optional(),
});

export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
