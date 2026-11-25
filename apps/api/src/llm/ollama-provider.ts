import type { LlmGenerateInput, LlmGenerateOutput, LlmProvider } from '@trailforge/shared';

/**
 * Ollama stub for Phase 1. Fails clearly without OLLAMA_HOST.
 * Real calls are deferred to a later phase.
 */
export class OllamaLlmProvider implements LlmProvider {
  readonly name = 'ollama';

  async generate(input: LlmGenerateInput): Promise<LlmGenerateOutput> {
    void input;
    if (!process.env['OLLAMA_HOST']) {
      throw new Error('OllamaLlmProvider is not configured: set OLLAMA_HOST (server-side only).');
    }
    throw new Error('OllamaLlmProvider.generate is not implemented in Phase 1.');
  }
}
