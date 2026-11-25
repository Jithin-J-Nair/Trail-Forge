import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { MockLlmProvider } from './llm/mock-provider.js';

describe('API health', () => {
  it('returns {status:"ok"} from /api/health', async () => {
    const app = createApp({ llm: new MockLlmProvider() });
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('validates tour requests with shared Zod schema', async () => {
    const app = createApp({ llm: new MockLlmProvider() });
    const res = await request(app).post('/api/v1/tour/validate').send({
      area: 'Osaka',
      theme: 'food',
      durationMinutes: 90,
      locale: 'en',
    });
    expect(res.status).toBe(200);
    expect(res.body.request.area).toBe('Osaka');
  });
});
