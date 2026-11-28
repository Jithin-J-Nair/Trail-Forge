import { z } from 'zod';

/** Successful Google Photorealistic 3D Tiles session (key stays on the API). */
export const GoogleTilesSessionAvailableSchema = z.object({
  available: z.literal(true),
  provider: z.literal('google-photorealistic-3d'),
  /** Same-origin proxy path — never includes the API key. */
  rootUrl: z.string().min(1),
  /** ISO timestamp when the client should refresh the root tileset (~3h Google window). */
  expiresAt: z.string().min(1),
});

/** Labeled unavailable when GOOGLE_MAPS_API_KEY is unset or invalid. */
export const GoogleTilesSessionUnavailableSchema = z.object({
  available: z.literal(false),
  error: z.literal('google_tiles_unavailable'),
  reason: z.string().min(1),
});

export const GoogleTilesSessionResponseSchema = z.discriminatedUnion('available', [
  GoogleTilesSessionAvailableSchema,
  GoogleTilesSessionUnavailableSchema,
]);

export type GoogleTilesSessionAvailable = z.infer<typeof GoogleTilesSessionAvailableSchema>;
export type GoogleTilesSessionUnavailable = z.infer<typeof GoogleTilesSessionUnavailableSchema>;
export type GoogleTilesSessionResponse = z.infer<typeof GoogleTilesSessionResponseSchema>;
