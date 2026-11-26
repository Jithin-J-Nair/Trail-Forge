import { z } from 'zod';

export const ModelProviderSchema = z.enum(['openai', 'anthropic', 'google', 'mock']);
export type ModelProvider = z.infer<typeof ModelProviderSchema>;

export const GenerationPurposeSchema = z.enum([
  'extract',
  'narrate',
  'translate',
  'summarize',
  'classify',
]);
export type GenerationPurpose = z.infer<typeof GenerationPurposeSchema>;

export interface GenerationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerationRequest {
  purpose: GenerationPurpose;
  messages: GenerationMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  metadata?: Record<string, string>;
}

export interface GenerationResult {
  provider: ModelProvider;
  model: string;
  text: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  latencyMs: number;
}

export interface AIProvider {
  readonly name: ModelProvider;
  generate(request: GenerationRequest): Promise<GenerationResult>;
}

export interface ModelRoute {
  purpose: GenerationPurpose;
  provider: ModelProvider;
  model: string;
}
