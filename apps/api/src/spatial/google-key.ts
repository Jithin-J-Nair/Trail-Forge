/**
 * Read Map Tiles API key from the environment.
 * Never log or return the raw value to callers that might print it.
 */
export function hasGoogleMapsApiKey(source: NodeJS.ProcessEnv = process.env): boolean {
  const key = source['GOOGLE_MAPS_API_KEY'];
  return typeof key === 'string' && key.trim().length > 0;
}

/** Internal use only — do not log the return value. */
export function readGoogleMapsApiKey(source: NodeJS.ProcessEnv = process.env): string | undefined {
  const key = source['GOOGLE_MAPS_API_KEY'];
  if (typeof key !== 'string') return undefined;
  const trimmed = key.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
