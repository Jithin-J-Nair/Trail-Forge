import type { LlmJsonProvider } from './provider.js';

/** Deterministic provider for tests/CI. */
export class MockAiProvider implements LlmJsonProvider {
  readonly name = 'mock';

  async generateJson(_system: string, userDataJson: string): Promise<unknown> {
    const match = userDataJson.match(/<<<OSM_DATA_BEGIN>>>\s*([\s\S]*?)\s*<<<OSM_DATA_END>>>/);
    const raw = match?.[1] ?? '{"pois":[]}';
    const parsed = JSON.parse(raw) as {
      pois: Array<{ poiId: string; name: string; tags: Record<string, string> }>;
    };

    const pois = parsed.pois.map((p) => {
      const keys = Object.keys(p.tags);
      const key = keys[0] ?? 'name';
      const value = p.tags[key] ?? p.name;
      return {
        poiId: p.poiId,
        ja: [
          {
            text: `${p.name}は「${key}=${value}」に基づく場所です。`,
            sourceTags: [{ poiId: p.poiId, key }],
          },
        ],
        en: [
          {
            text: `${p.name} is described from OSM tag ${key}=${value}.`,
            sourceTags: [{ poiId: p.poiId, key }],
          },
        ],
      };
    });

    const names = parsed.pois.map((p) => p.name).join(' / ') || 'Tour';
    return {
      pois,
      titleJa: `${names} の散策`,
      titleEn: `Walk: ${names}`,
    };
  }
}
