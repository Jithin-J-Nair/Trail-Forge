import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { MockLlmProvider } from './llm/mock-provider.js';
import { isSameOriginRequest, shouldServeWeb } from './static-web.js';

describe('static web serving', () => {
  const prevServe = process.env['SERVE_WEB'];
  const prevNodeEnv = process.env['NODE_ENV'];

  afterEach(() => {
    if (prevServe === undefined) delete process.env['SERVE_WEB'];
    else process.env['SERVE_WEB'] = prevServe;
    if (prevNodeEnv === undefined) delete process.env['NODE_ENV'];
    else process.env['NODE_ENV'] = prevNodeEnv;
  });

  it('shouldServeWeb respects SERVE_WEB and production+dist', () => {
    delete process.env['SERVE_WEB'];
    process.env['NODE_ENV'] = 'development';
    expect(shouldServeWeb({ webDist: '/no/such/dist' })).toBe(false);

    process.env['SERVE_WEB'] = 'true';
    expect(shouldServeWeb({ webDist: '/no/such/dist' })).toBe(true);

    process.env['SERVE_WEB'] = 'false';
    process.env['NODE_ENV'] = 'production';
    expect(shouldServeWeb({ webDist: '/no/such/dist' })).toBe(false);
  });

  it('serves index.html and SPA fallback when serveWeb is on', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'tf-web-'));
    writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>TrailForge</title>');
    writeFileSync(path.join(dir, 'asset.js'), 'console.log(1)');

    const app = createApp({
      llm: new MockLlmProvider(),
      serveWeb: true,
      webDist: dir,
    });

    const asset = await request(app).get('/asset.js');
    expect(asset.status).toBe(200);
    expect(asset.text).toContain('console.log');

    const spa = await request(app).get('/app');
    expect(spa.status).toBe(200);
    expect(spa.text).toContain('TrailForge');

    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body).toEqual({ status: 'ok' });
  });

  it('allows same-origin CORS when serving the SPA', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'tf-web-'));
    writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>ok</title>');

    const app = createApp({
      llm: new MockLlmProvider(),
      corsOrigin: 'http://localhost:5173',
      serveWeb: true,
      webDist: dir,
    });

    const res = await request(app)
      .get('/api/health')
      .set('Host', 'app.example:3001')
      .set('Origin', 'http://app.example:3001');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://app.example:3001');

    const denied = await request(app)
      .get('/api/health')
      .set('Host', 'app.example:3001')
      .set('Origin', 'https://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('isSameOriginRequest matches Host / X-Forwarded-Host', () => {
    const req = {
      headers: { host: 'localhost:3001' },
    } as unknown as Parameters<typeof isSameOriginRequest>[1];
    expect(isSameOriginRequest('http://localhost:3001', req)).toBe(true);
    expect(isSameOriginRequest('http://evil.example', req)).toBe(false);

    const fwd = {
      headers: { 'x-forwarded-host': 'trailforge.example', host: 'internal:3001' },
    } as unknown as Parameters<typeof isSameOriginRequest>[1];
    expect(isSameOriginRequest('https://trailforge.example', fwd)).toBe(true);
  });
});
