import type { AIProvider, GenerationRequest, GenerationResult } from '../types.js';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;
  constructor(
    private readonly apiKey: string,
    private readonly model = process.env['OPENAI_MODEL'] ?? 'gpt-4.1-mini',
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now();
    const res = await this.fetchImpl('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 1024,
        response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
        messages: request.messages,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OpenAI error ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const usage: GenerationResult['usage'] = {};
    if (json.usage?.prompt_tokens !== undefined) usage.inputTokens = json.usage.prompt_tokens;
    if (json.usage?.completion_tokens !== undefined) usage.outputTokens = json.usage.completion_tokens;
    if (json.usage?.total_tokens !== undefined) usage.totalTokens = json.usage.total_tokens;
    return {
      provider: this.name,
      model: this.model,
      text: json.choices?.[0]?.message?.content ?? '',
      ...(Object.keys(usage).length > 0 ? { usage } : {}),
      latencyMs: Date.now() - start,
    };
  }
}
