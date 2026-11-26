import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

describe('auth routes', () => {
  it('rejects invalid registration payload', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
  });

  it('rejects invalid login payload', async () => {
    const app = createApp();
    const res = await request(app).post('/api/auth/login').send({ email: 'x', password: '' });
    expect(res.status).toBe(400);
  });

  it('requires auth for /api/auth/me', async () => {
    const app = createApp();
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
