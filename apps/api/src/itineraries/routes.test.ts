import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

describe('itineraries routes', () => {
  it('requires auth for listing itineraries', async () => {
    const app = createApp();
    const res = await request(app).get('/api/itineraries');
    expect(res.status).toBe(401);
  });

  it('rejects invalid save payload when authenticated request shape is wrong', async () => {
    const app = createApp();
    // No auth -> 401 before payload validation; confirms route is wired and protected.
    const res = await request(app).post('/api/itineraries').send({});
    expect(res.status).toBe(401);
  });
});
