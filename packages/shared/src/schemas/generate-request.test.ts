import { describe, expect, it } from 'vitest';
import { GenerateRequestSchema } from './generate-request.js';

describe('GenerateRequestSchema', () => {
  it('trims query and defaults radiusMeters', () => {
    const parsed = GenerateRequestSchema.parse({
      query: '  Kyoto  ',
      theme: 'culture',
      durationMinutes: 90,
    });
    expect(parsed.query).toBe('Kyoto');
    expect(parsed.radiusMeters).toBe(500);
  });

  it('rejects short query and invalid theme', () => {
    expect(() =>
      GenerateRequestSchema.parse({
        query: 'a',
        theme: 'culture',
        durationMinutes: 90,
      }),
    ).toThrow();
    expect(() =>
      GenerateRequestSchema.parse({
        query: 'Tokyo',
        theme: 'temples',
        durationMinutes: 90,
      }),
    ).toThrow();
  });
});
