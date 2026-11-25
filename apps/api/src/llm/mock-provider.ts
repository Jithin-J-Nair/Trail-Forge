import {
  LlmGenerateInputSchema,
  LlmGenerateOutputSchema,
  type LlmGenerateInput,
  type LlmGenerateOutput,
  type LlmProvider,
} from '@trailforge/shared';

/**
 * Deterministic provider for tests/CI. Uses only provided OSM tags.
 */
export class MockLlmProvider implements LlmProvider {
  readonly name = 'mock';

  async generate(raw: LlmGenerateInput): Promise<LlmGenerateOutput> {
    const input = LlmGenerateInputSchema.parse(raw);
    const name = input.place.name ?? input.place.osmId;
    const tagKeys = Object.keys(input.place.tags);
    const preface =
      input.locale === 'ja'
        ? `${name}はOpenStreetMapのタグに基づく場所です。`
        : `${name} is a place described only from OpenStreetMap tags.`;
    const tagSummary =
      tagKeys.length === 0
        ? input.locale === 'ja'
          ? '追加タグはありません。'
          : 'No additional tags were provided.'
        : tagKeys.map((key) => `${key}=${input.place.tags[key]}`).join(', ');

    return LlmGenerateOutputSchema.parse({
      description: `${preface} ${tagSummary}`,
      claimedTags: tagKeys,
    });
  }
}
