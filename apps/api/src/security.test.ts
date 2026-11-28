import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { MockLlmProvider } from './llm/mock-provider.js';

describe('API security baseline', () => {
  afterEach(() => {
    delete process.env['ANTHROPIC_API_KEY'];
  });

  it('sets Helmet security headers on health', async () => {
    const app = createApp({ llm: new MockLlmProvider() });
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('reflects configured CORS origin and omits for other origins', async () => {
    const app = createApp({
      llm: new MockLlmProvider(),
      corsOrigin: 'http://localhost:5173',
    });
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const denied = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('never echoes ANTHROPIC_API_KEY in health or ready JSON', async () => {
    process.env['ANTHROPIC_API_KEY'] = 'sk-secret-must-not-leak';
    const app = createApp({ llm: new MockLlmProvider() });
    const health = await request(app).get('/api/health');
    const ready = await request(app).get('/api/ready');
    const blob = JSON.stringify({ health: health.body, ready: ready.body });
    expect(blob).not.toContain('sk-secret-must-not-leak');
    expect(blob).not.toMatch(/ANTHROPIC/i);
  });

  it('applies a global request rate limit (60/min)', async () => {
    const app = createApp({ llm: new MockLlmProvider() });
    let saw429 = false;
    for (let i = 0; i < 65; i++) {
      const res = await request(app).get('/api/health');
      if (res.status === 429) {
        saw429 = true;
        break;
      }
    }
    expect(saw429).toBe(true);
  });
});
