import { describe, expect, it, vi } from 'vitest';
import { fetchWikidataEntity } from './wikidata.js';
import { fetchWikipediaSummary } from './wikipedia.js';

describe('enrichment adapters', () => {
  it('fetches Wikidata entity with provenance URL', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        entities: {
          Q277408: {
            labels: { en: { value: 'Sensō-ji' } },
            descriptions: { en: { value: 'Buddhist temple in Tokyo' } },
            claims: { P18: [{ mainsnak: { datavalue: { value: 'Sensoji.jpg' } } }] },
          },
        },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    const result = await fetchWikidataEntity('Q277408', { fetchImpl: fetchImpl as any });
    expect(result?.qid).toBe('Q277408');
    expect(result?.label).toBe('Sensō-ji');
    expect(result?.sourceUrl).toContain('wikidata.org');
  });

  it('fetches Wikipedia summary', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        title: 'Sensō-ji',
        extract: 'Sensō-ji is an ancient Buddhist temple in Asakusa, Tokyo.',
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Sens%C5%8D-ji' } },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    const result = await fetchWikipediaSummary('Sensō-ji', { fetchImpl: fetchImpl as any });
    expect(result?.title).toBe('Sensō-ji');
    expect(result?.url).toContain('wikipedia.org');
  });
});
