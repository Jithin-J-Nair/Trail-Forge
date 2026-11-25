import { describe, expect, it } from 'vitest';
import { TourRequestSchema } from './tour-request.js';

describe('TourRequestSchema', () => {
  it('accepts a valid request', () => {
    const parsed = TourRequestSchema.parse({
      area: 'Kyoto',
      theme: 'temples',
      durationMinutes: 120,
      locale: 'ja',
    });
    expect(parsed.area).toBe('Kyoto');
  });

  it('rejects empty area', () => {
    expect(() =>
      TourRequestSchema.parse({
        area: '',
        theme: 'temples',
        durationMinutes: 60,
      }),
    ).toThrow();
  });
});
