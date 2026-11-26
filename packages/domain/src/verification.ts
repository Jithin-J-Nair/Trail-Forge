import { z } from 'zod';

export const VerificationStatusSchema = z.enum([
  'VERIFIED',
  'PARTIALLY_VERIFIED',
  'NEEDS_REVIEW',
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const ClaimTypeSchema = z.enum([
  'existence',
  'location',
  'attribute',
  'hours',
  'description',
  'route',
]);
export type ClaimType = z.infer<typeof ClaimTypeSchema>;

export const EvidenceSchema = z.object({
  sourceType: z.string().min(1),
  sourceId: z.string().min(1),
  factPath: z.string().min(1).optional(),
  expected: z.unknown().optional(),
  observed: z.unknown().optional(),
  weight: z.number().min(0).max(1).optional(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const ClaimSchema = z.object({
  id: z.string().uuid(),
  itineraryVersionId: z.string().uuid(),
  placeId: z.string().uuid().nullable(),
  claimType: ClaimTypeSchema,
  text: z.string().min(1),
  sourceSpan: z
    .object({ start: z.number().int().nonnegative(), end: z.number().int().nonnegative() })
    .optional(),
  extractedBy: z.enum(['rule', 'llm', 'hybrid']),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const VerificationResultSchema = z.object({
  claimId: z.string().uuid(),
  status: VerificationStatusSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  matcher: z.enum(['rule', 'semantic', 'hybrid']),
  evidence: z.array(EvidenceSchema),
  verifiedAt: z.string().datetime(),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

export const VerificationSummarySchema = z.object({
  overallStatus: VerificationStatusSchema,
  overallConfidence: z.number().min(0).max(1),
  counts: z.object({
    verified: z.number().int().nonnegative(),
    partiallyVerified: z.number().int().nonnegative(),
    needsReview: z.number().int().nonnegative(),
  }),
});
export type VerificationSummary = z.infer<typeof VerificationSummarySchema>;

export function aggregateVerificationStatus(
  results: readonly Pick<VerificationResult, 'status' | 'confidence'>[],
): VerificationSummary {
  if (results.length === 0) {
    return {
      overallStatus: 'NEEDS_REVIEW',
      overallConfidence: 0,
      counts: { verified: 0, partiallyVerified: 0, needsReview: 0 },
    };
  }

  const counts = { verified: 0, partiallyVerified: 0, needsReview: 0 };
  for (const r of results) {
    if (r.status === 'VERIFIED') counts.verified += 1;
    else if (r.status === 'PARTIALLY_VERIFIED') counts.partiallyVerified += 1;
    else counts.needsReview += 1;
  }

  const overallConfidence =
    results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  let overallStatus: VerificationStatus = 'VERIFIED';
  if (counts.needsReview > 0) overallStatus = 'NEEDS_REVIEW';
  else if (counts.partiallyVerified > 0) overallStatus = 'PARTIALLY_VERIFIED';

  return { overallStatus, overallConfidence, counts };
}
