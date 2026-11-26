import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { CircuitBreaker } from './circuit-breaker.js';
import { withRetry } from './retry.js';

describe('circuit breaker', () => {
  it('opens after failures and recovers', async () => {
    const cb = new CircuitBreaker('test', { failureThreshold: 2, successThreshold: 1, openMs: 10 });
    expect(cb.canExecute()).toBe(true);
    cb.onFailure(new Error('fail1'));
    expect(cb.canExecute()).toBe(true);
    cb.onFailure(new Error('fail2'));
    expect(cb.canExecute()).toBe(false);
    await new Promise((r) => setTimeout(r, 15));
    expect(cb.canExecute()).toBe(true);
    cb.onSuccess();
    expect(cb.getState()).toBe('closed');
  });
});

describe('retry', () => {
  it('retries with backoff and eventually succeeds', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('transient');
      return 'ok';
    }, { retries: 3, baseMs: 1, maxMs: 5, jitter: false });
    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });
});

describe('geo health endpoint', () => {
  it('returns provider health and metrics', async () => {
    const app = createApp();
    const res = await request(app).get('/api/geo/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('providers');
    expect(res.body).toHaveProperty('cache');
    expect(res.body).toHaveProperty('requestsTotal');
  });
});
