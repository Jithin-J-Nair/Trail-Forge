import { ClaudeAiProvider } from './claude-provider.js';
import { MockAiProvider } from './mock-provider.js';
import { OllamaAiProvider } from './ollama-provider.js';
import { resolveProviderName, type LlmJsonProvider, type LlmProviderName } from './provider.js';

export function createAiProvider(name: LlmProviderName = resolveProviderName()): LlmJsonProvider {
  switch (name) {
    case 'mock':
      return new MockAiProvider();
    case 'claude':
      return new ClaudeAiProvider();
    case 'ollama':
      return new OllamaAiProvider();
    default: {
      const _exhaustive: never = name;
      throw new Error(`Unknown provider ${String(_exhaustive)}`);
    }
  }
}
