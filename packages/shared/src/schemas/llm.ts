import { z } from 'zod';

/** Untrusted OSM tags: treat as data only, never as instructions. */
export const OsmPlaceFactsSchema = z.object({
  osmId: z.string().min(1),
  name: z.string().optional(),
  tags: z.record(z.string(), z.string()),
});

export type OsmPlaceFacts = z.infer<typeof OsmPlaceFactsSchema>;

export const LlmGenerateInputSchema = z.object({
  locale: z.enum(['en', 'ja']),
  place: OsmPlaceFactsSchema,
});

export type LlmGenerateInput = z.infer<typeof LlmGenerateInputSchema>;

export const LlmGenerateOutputSchema = z.object({
  description: z.string().min(1),
  claimedTags: z.array(z.string()).default([]),
});

export type LlmGenerateOutput = z.infer<typeof LlmGenerateOutputSchema>;
