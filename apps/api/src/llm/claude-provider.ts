import type { LlmGenerateInput, LlmGenerateOutput, LlmProvider } from '@trailforge/shared';

/**
 * Claude API stub for Phase 1. Fails clearly without ANTHROPIC_API_KEY.
 * Real calls are deferred to a later phase.
 */
export class ClaudeLlmProvider implements LlmProvider {
  readonly name = 'claude';

  async generate(input: LlmGenerateInput): Promise<LlmGenerateOutput> {
    void input;
    if (!process.env['ANTHROPIC_API_KEY']) {
      throw new Error(
        'ClaudeLlmProvider is not configured: set ANTHROPIC_API_KEY (server-side only).',
      );
    }
    throw new Error('ClaudeLlmProvider.generate is not implemented in Phase 1.');
  }
}
