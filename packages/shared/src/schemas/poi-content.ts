import { z } from 'zod';
import { ClaimSchema } from './claim.js';
import { ContentStatusSchema } from './primitives.js';

export const PoiContentSchema = z.object({
  poiId: z.string().min(1),
  ja: z.array(ClaimSchema),
  en: z.array(ClaimSchema),
  status: ContentStatusSchema,
  issues: z.array(z.string()),
});

export type PoiContent = z.infer<typeof PoiContentSchema>;
