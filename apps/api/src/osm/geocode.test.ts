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

  it('falls back to Photon when Nominatim returns upstream error', async () => {
    const fetchImpl = vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.includes('nominatim')) {
        return new Response('denied', { status: 403 });
      }
      return Response.json({
        features: [
          {
            geometry: { coordinates: [139.7, 35.66] },
            properties: { name: 'Shibuya', city: 'Tokyo', country: 'Japan' },
          },
        ],
      });
    }) as unknown as typeof fetch;
    const result = await geocode('Shibuya', { fetchImpl });
    expect(result.lat).toBeCloseTo(35.66);
    expect(result.displayName).toContain('Shibuya');
  });
});
