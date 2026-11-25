import type { LlmGenerateInput, LlmGenerateOutput } from '../schemas/llm.js';

export interface LlmProvider {
  readonly name: string;
  generate(input: LlmGenerateInput): Promise<LlmGenerateOutput>;
}
