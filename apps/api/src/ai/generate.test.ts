import type { PoiLocal } from '@trailforge/shared';
import { describe, expect, it } from 'vitest';
import { generatePoiDraft, LlmSchemaError } from './generate.js';
import { MockAiProvider } from './mock-provider.js';
import type { LlmJsonProvider } from './provider.js';

const poi: PoiLocal = {
  id: 'node/1',
  name: 'Cafe',
  lat: 35,
  lon: 139,
  category: 'cafe',
  osmTags: { name: 'Cafe', amenity: 'cafe' },
  x: 0,
  z: 0,
};

describe('generatePoiDraft', () => {
  it('parses MockAiProvider output', async () => {
    const draft = await generatePoiDraft(new MockAiProvider(), [poi]);
    expect(draft.pois[0]?.poiId).toBe('node/1');
    expect(draft.titleEn).toBeTruthy();
  });

  it('retries once with repair then fails', async () => {
    let calls = 0;
    const flaky: LlmJsonProvider = {
      name: 'flaky',
      async generateJson() {
        calls += 1;
        return { bad: true };
      },
    };
    await expect(generatePoiDraft(flaky, [poi])).rejects.toBeInstanceOf(LlmSchemaError);
    expect(calls).toBe(2);
  });

  it('accepts repaired second response', async () => {
    let calls = 0;
    const repair: LlmJsonProvider = {
      name: 'repair',
      async generateJson() {
        calls += 1;
        if (calls === 1) return { nope: true };
        return {
          pois: [
            {
              poiId: 'node/1',
              ja: [],
              en: [
                {
                  text: 'Cafe is amenity=cafe',
                  sourceTags: [{ poiId: 'node/1', key: 'amenity' }],
                },
              ],
            },
          ],
          titleJa: 'カフェ',
          titleEn: 'Cafe walk',
        };
      },
    };
    const draft = await generatePoiDraft(repair, [poi]);
    expect(calls).toBe(2);
    expect(draft.pois).toHaveLength(1);
  });
});
