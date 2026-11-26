import type { AIProvider, GenerationPurpose, GenerationRequest, GenerationResult, ModelProvider } from './types.js';
import { AnthropicProvider } from './providers/anthropic-provider.js';
import { GeminiProvider } from './providers/gemini-provider.js';
import { MockAIProvider } from './providers/mock-provider.js';
import { OpenAIProvider } from './providers/openai-provider.js';

export type ProviderRegistry = Partial<Record<ModelProvider, AIProvider>>;

export function createProviderRegistry(env: NodeJS.ProcessEnv = process.env): ProviderRegistry {
  const registry: ProviderRegistry = { mock: new MockAIProvider() };
  if (env['OPENAI_API_KEY']) registry.openai = new OpenAIProvider(env['OPENAI_API_KEY']);
  if (env['ANTHROPIC_API_KEY']) registry.anthropic = new AnthropicProvider(env['ANTHROPIC_API_KEY']);
  if (env['GEMINI_API_KEY'] || env['GOOGLE_API_KEY']) {
    registry.google = new GeminiProvider((env['GEMINI_API_KEY'] ?? env['GOOGLE_API_KEY'])!);
  }
  return registry;
}

const DEFAULT_ROUTE: Record<GenerationPurpose, ModelProvider> = {
  extract: 'openai',
  narrate: 'anthropic',
  translate: 'google',
  summarize: 'openai',
  classify: 'openai',
};

export class ModelRouter {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly routes: Record<GenerationPurpose, ModelProvider> = DEFAULT_ROUTE,
  ) {}

  resolve(purpose: GenerationPurpose): AIProvider {
    const preferred = this.routes[purpose];
    const provider = this.registry[preferred] ?? this.registry.openai ?? this.registry.anthropic ?? this.registry.google ?? this.registry.mock;
    if (!provider) throw new Error('No AI providers configured');
    return provider;
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const primary = this.resolve(request.purpose);
    try {
      return await primary.generate(request);
    } catch (err) {
      // Fallback: try any other configured provider for resilience.
      for (const [name, provider] of Object.entries(this.registry)) {
        if (!provider || name === primary.name) continue;
        try {
          return await provider.generate(request);
        } catch {
          // continue
        }
      }
      throw err;
    }
  }
}
