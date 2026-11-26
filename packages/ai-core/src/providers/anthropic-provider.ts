import type { AIProvider, GenerationRequest, GenerationResult } from '../types.js';

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const;
  constructor(
    private readonly apiKey: string,
    private readonly model = process.env['ANTHROPIC_MODEL'] ?? 'claude-sonnet-4-20250514',
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now();
    const system = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const messages = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await this.fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature ?? 0.2,
        system: system || undefined,
        messages,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Anthropic error ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = (json.content ?? [])
      .filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('');
    const usage: GenerationResult['usage'] = {};
    if (json.usage?.input_tokens !== undefined) usage.inputTokens = json.usage.input_tokens;
    if (json.usage?.output_tokens !== undefined) usage.outputTokens = json.usage.output_tokens;
    if (json.usage?.input_tokens !== undefined || json.usage?.output_tokens !== undefined) {
      usage.totalTokens = (json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0);
    }
    return {
      provider: this.name,
      model: this.model,
      text,
      ...(Object.keys(usage).length > 0 ? { usage } : {}),
      latencyMs: Date.now() - start,
    };
  }
}
