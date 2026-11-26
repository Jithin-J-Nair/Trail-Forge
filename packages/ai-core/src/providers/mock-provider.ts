import type { AIProvider, GenerationRequest, GenerationResult } from '../types.js';

export class MockAIProvider implements AIProvider {
  readonly name = 'mock' as const;

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now();
    const last = request.messages.at(-1)?.content ?? '';
    const text =
      request.responseFormat === 'json'
        ? JSON.stringify({ ok: true, purpose: request.purpose, echo: last.slice(0, 120) })
        : `MOCK[${request.purpose}]: ${last.slice(0, 200)}`;
    return {
      provider: this.name,
      model: 'mock-1',
      text,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      latencyMs: Date.now() - start,
    };
  }
}
