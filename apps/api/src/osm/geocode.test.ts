import { describe, expect, it, vi } from 'vitest';
import { OsmNotFoundError } from './errors.js';
import { geocode } from './geocode.js';

describe('geocode', () => {
  it('parses Nominatim fixture response', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json([{ lat: '35.71', lon: '139.79', display_name: 'Asakusa' }]),
    ) as unknown as typeof fetch;
    const result = await geocode('Asakusa', { fetchImpl });
    expect(result.displayName).toBe('Asakusa');
    expect(result.lat).toBeCloseTo(35.71);
  });

  it('throws NotFound on empty results', async () => {
    const fetchImpl = vi.fn(async () => Response.json([])) as unknown as typeof fetch;
    await expect(geocode('nowhere-xyz', { fetchImpl })).rejects.toBeInstanceOf(OsmNotFoundError);
  });
});
