import { z } from 'zod';

export const ClaimSourceTagSchema = z.object({
  poiId: z.string().min(1),
  key: z.string().min(1),
});

export type ClaimSourceTag = z.infer<typeof ClaimSourceTagSchema>;

export const ClaimSchema = z.object({
  text: z.string().min(1),
  sourceTags: z.array(ClaimSourceTagSchema),
});

export type Claim = z.infer<typeof ClaimSchema>;
