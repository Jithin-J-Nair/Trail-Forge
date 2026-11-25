import { describe, expect, it } from 'vitest';
import { createLlmProvider } from './create-provider.js';

describe('createLlmProvider', () => {
  it('returns mock by default', () => {
    expect(createLlmProvider().name).toBe('mock');
  });

  it('claude stub fails clearly without a key', async () => {
    const previous = process.env['ANTHROPIC_API_KEY'];
    delete process.env['ANTHROPIC_API_KEY'];
    const provider = createLlmProvider('claude');
    await expect(
      provider.generate({
        locale: 'en',
        place: { osmId: 'node/1', tags: {} },
      }),
    ).rejects.toThrow(/ANTHROPIC_API_KEY/);
    if (previous !== undefined) {
      process.env['ANTHROPIC_API_KEY'] = previous;
    }
  });

  it('ollama stub fails clearly without a host', async () => {
    const previous = process.env['OLLAMA_HOST'];
    delete process.env['OLLAMA_HOST'];
    const provider = createLlmProvider('ollama');
    await expect(
      provider.generate({
        locale: 'en',
        place: { osmId: 'node/1', tags: {} },
      }),
    ).rejects.toThrow(/OLLAMA_HOST/);
    if (previous !== undefined) {
      process.env['OLLAMA_HOST'] = previous;
    }
  });
});
