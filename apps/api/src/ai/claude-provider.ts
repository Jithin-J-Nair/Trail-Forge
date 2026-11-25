import Anthropic from '@anthropic-ai/sdk';
import type { LlmJsonProvider } from './provider.js';

export class ClaudeAiProvider implements LlmJsonProvider {
  readonly name = 'claude';
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey = process.env['ANTHROPIC_API_KEY'], model = process.env['ANTHROPIC_MODEL']) {
    if (!apiKey) {
      throw new Error('ClaudeAiProvider requires ANTHROPIC_API_KEY');
    }
    this.client = new Anthropic({ apiKey, timeout: 30_000 });
    this.model = model ?? 'claude-3-5-haiku-latest';
  }

  async generateJson(system: string, userDataJson: string): Promise<unknown> {
    const res = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: userDataJson }],
    });
    const block = res.content.find((c) => c.type === 'text');
    if (!block || block.type !== 'text') {
      throw new Error('Claude returned no text');
    }
    return JSON.parse(stripFences(block.text));
  }
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}
