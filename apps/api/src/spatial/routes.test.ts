import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { MockLlmProvider } from '../llm/mock-provider.js';

describe('GET /api/spatial/google-tiles-session', () => {
  const prev = process.env['GOOGLE_MAPS_API_KEY'];

  afterEach(() => {
    if (prev === undefined) delete process.env['GOOGLE_MAPS_API_KEY'];
    else process.env['GOOGLE_MAPS_API_KEY'] = prev;
  });

  it('returns 503 when GOOGLE_MAPS_API_KEY is unset', async () => {
    delete process.env['GOOGLE_MAPS_API_KEY'];
    const app = createApp({ llm: new MockLlmProvider() });
    const res = await request(app).get('/api/spatial/google-tiles-session');
    expect(res.status).toBe(503);
    expect(res.body.available).toBe(false);
    expect(res.body.error).toBe('google_tiles_unavailable');
    expect(res.body.reason).toMatch(/GOOGLE_MAPS_API_KEY unset/);
  });

  it('returns available session with proxy rootUrl when key is set', async () => {
    process.env['GOOGLE_MAPS_API_KEY'] = 'test-secret-key';
    const app = createApp({ llm: new MockLlmProvider() });
    const res = await request(app).get('/api/spatial/google-tiles-session');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.rootUrl).toBe('/api/spatial/google-tiles/v1/3dtiles/root.json');
    expect(JSON.stringify(res.body)).not.toContain('test-secret-key');
  });

  it('proxies tile path 503 when key unset', async () => {
    delete process.env['GOOGLE_MAPS_API_KEY'];
    const app = createApp({ llm: new MockLlmProvider() });
    const res = await request(app).get('/api/spatial/google-tiles/v1/3dtiles/root.json');
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('google_tiles_unavailable');
  });
});
