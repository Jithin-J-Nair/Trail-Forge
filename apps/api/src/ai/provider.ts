export type LlmJsonProvider = {
  readonly name: string;
  generateJson(system: string, userDataJson: string): Promise<unknown>;
};

export type LlmProviderName = 'mock' | 'claude' | 'ollama';

export function resolveProviderName(env = process.env): LlmProviderName {
  const raw = (env['LLM_PROVIDER'] ?? 'mock').toLowerCase();
  if (raw === 'claude' || raw === 'ollama' || raw === 'mock') return raw;
  return 'mock';
}
