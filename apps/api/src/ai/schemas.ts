import { ClaimSchema } from '@trailforge/shared';
import { z } from 'zod';

export const LlmPoiDraftSchema = z.object({
  poiId: z.string().min(1),
  ja: z.array(ClaimSchema).default([]),
  en: z.array(ClaimSchema).default([]),
});

export const LlmGenerateDraftSchema = z.object({
  pois: z.array(LlmPoiDraftSchema),
  titleJa: z.string().min(1).optional(),
  titleEn: z.string().min(1).optional(),
});

export type LlmGenerateDraft = z.infer<typeof LlmGenerateDraftSchema>;
