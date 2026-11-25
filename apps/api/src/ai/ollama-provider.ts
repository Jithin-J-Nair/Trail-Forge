import type { LlmJsonProvider } from './provider.js';

export class OllamaAiProvider implements LlmJsonProvider {
  readonly name = 'ollama';
  private readonly host: string;
  private readonly model: string;

  constructor(host = process.env['OLLAMA_HOST'], model = process.env['OLLAMA_MODEL']) {
    if (!host) throw new Error('OllamaAiProvider requires OLLAMA_HOST');
    this.host = host.replace(/\/$/, '');
    this.model = model ?? 'llama3.2';
  }

  async generateJson(system: string, userDataJson: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: 'json',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userDataJson },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const json = (await res.json()) as { message?: { content?: string } };
      const text = json.message?.content;
      if (!text) throw new Error('Ollama returned empty content');
      return JSON.parse(text);
    } finally {
      clearTimeout(timer);
    }
  }
}
