import { describe, expect, it } from 'vitest';

/** Browser must never ship server LLM/routing secrets via VITE_*. */
describe('client env security', () => {
  it('does not expose server secret names on import.meta.env', () => {
    const env = import.meta.env as Record<string, string | undefined>;
    const keys = Object.keys(env);
    expect(keys.some((k) => k.includes('ANTHROPIC'))).toBe(false);
    expect(keys.some((k) => k.includes('JWT_SECRET'))).toBe(false);
    expect(keys.some((k) => k.includes('OPENROUTESERVICE'))).toBe(false);
    expect(keys.some((k) => k.includes('GRAPHHOPPER'))).toBe(false);
    expect(env['VITE_ANTHROPIC_API_KEY']).toBeUndefined();
  });
});
