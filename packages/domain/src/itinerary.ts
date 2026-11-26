import { z } from 'zod';
import { GeoPointSchema } from './place.js';
import { VerificationStatusSchema, VerificationSummarySchema } from './verification.js';

export const ItineraryStatusSchema = z.enum([
  'pending',
  'generating',
  'verified',
  'partial',
  'needs_review',
  'failed',
]);
export type ItineraryStatus = z.infer<typeof ItineraryStatusSchema>;

export const ItineraryRequestSchema = z.object({
  query: z.string().min(3).max(1000),
  locale: z.string().min(2).max(16).default('en'),
  constraints: z
    .object({
      durationMinutes: z.number().int().min(15).max(1440).optional(),
      mode: z.enum(['walk', 'transit', 'bike', 'mixed']).default('walk'),
      themes: z.array(z.string().min(1)).max(8).default([]),
      avoidCrowds: z.boolean().default(false),
      startLocation: GeoPointSchema.optional(),
      startTime: z.string().datetime().optional(),
    })
    .default({}),
});
export type ItineraryRequest = z.infer<typeof ItineraryRequestSchema>;

export const ItineraryPlaceSchema = z.object({
  placeId: z.string().uuid(),
  sequence: z.number().int().positive(),
  name: z.string().min(1),
  location: GeoPointSchema,
  stayMinutes: z.number().int().nonnegative().optional(),
  verificationStatus: VerificationStatusSchema,
  confidence: z.number().min(0).max(1),
  sources: z.array(z.object({ type: z.string(), id: z.string(), url: z.string().url().optional() })),
});
export type ItineraryPlace = z.infer<typeof ItineraryPlaceSchema>;

export const ItineraryVersionSchema = z.object({
  version: z.number().int().positive(),
  status: VerificationStatusSchema,
  title: z.string().min(1),
  summary: z.string().optional(),
  language: z.string().min(2),
  places: z.array(ItineraryPlaceSchema),
  verificationSummary: VerificationSummarySchema,
  createdAt: z.string().datetime(),
});
export type ItineraryVersion = z.infer<typeof ItineraryVersionSchema>;
