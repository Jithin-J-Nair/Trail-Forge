import type { LlmProvider } from '@trailforge/shared';
import { ClaudeLlmProvider } from './claude-provider.js';
import { MockLlmProvider } from './mock-provider.js';
import { OllamaLlmProvider } from './ollama-provider.js';

export type LlmProviderName = 'mock' | 'claude' | 'ollama';

export function createLlmProvider(name: LlmProviderName = 'mock'): LlmProvider {
  switch (name) {
    case 'mock':
      return new MockLlmProvider();
    case 'claude':
      return new ClaudeLlmProvider();
    case 'ollama':
      return new OllamaLlmProvider();
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown LLM provider: ${String(_exhaustive)}`);
    }
  }
}
