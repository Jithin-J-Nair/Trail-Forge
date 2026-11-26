import type { AIProvider, GenerationRequest, GenerationResult } from '../types.js';

export class GeminiProvider implements AIProvider {
  readonly name = 'google' as const;
  constructor(
    private readonly apiKey: string,
    private readonly model = process.env['GEMINI_MODEL'] ?? 'gemini-2.0-flash',
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now();
    const system = request.messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');
    const contents = request.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await this.fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: request.maxTokens ?? 1024,
          responseMimeType: request.responseFormat === 'json' ? 'application/json' : undefined,
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini error ${res.status}: ${body.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number };
    };
    const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
    const usage: GenerationResult['usage'] = {};
    if (json.usageMetadata?.promptTokenCount !== undefined) usage.inputTokens = json.usageMetadata.promptTokenCount;
    if (json.usageMetadata?.candidatesTokenCount !== undefined) usage.outputTokens = json.usageMetadata.candidatesTokenCount;
    if (json.usageMetadata?.totalTokenCount !== undefined) usage.totalTokens = json.usageMetadata.totalTokenCount;
    return {
      provider: this.name,
      model: this.model,
      text,
      ...(Object.keys(usage).length > 0 ? { usage } : {}),
      latencyMs: Date.now() - start,
    };
  }
}
