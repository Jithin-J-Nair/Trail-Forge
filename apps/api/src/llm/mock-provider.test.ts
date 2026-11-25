import { describe, expect, it } from 'vitest';
import { MockLlmProvider } from './mock-provider.js';

describe('MockLlmProvider', () => {
  it('builds a description from OSM tags only', async () => {
    const provider = new MockLlmProvider();
    const result = await provider.generate({
      locale: 'en',
      place: {
        osmId: 'node/1',
        name: 'Sample Cafe',
        tags: { amenity: 'cafe', cuisine: 'coffee_shop' },
      },
    });

    expect(result.description).toContain('Sample Cafe');
    expect(result.description).toContain('amenity=cafe');
    expect(result.claimedTags).toEqual(['amenity', 'cuisine']);
  });
});
