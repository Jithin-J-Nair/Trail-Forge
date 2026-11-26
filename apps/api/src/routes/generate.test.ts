import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GenerateResponseSchema } from '@trailforge/shared';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockAiProvider } from '../ai/mock-provider.js';
import { createApp } from '../app.js';
import { OsmNotFoundError, OsmUpstreamError } from '../osm/errors.js';
import type { OverpassBundle } from '../osm/overpass.js';
import { transformOverpass } from '../osm/transform.js';

const fixture = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '../osm/fixtures/overpass-sample.json'),
    'utf8',
  ),
) as OverpassBundle;

const center = { lon: 139.7967, lat: 35.7148 };

function fixtureScene() {
  const scene = transformOverpass(center, fixture);
  return {
    ...scene,
    displayName: 'Asakusa',
    fromCache: false,
    provenance: {
      mode: 'live_osm' as const,
      source: 'OpenStreetMap (test fixture)',
      license: 'ODbL-1.0',
      attribution: '© OpenStreetMap contributors',
    },
  };
}

describe('POST /api/generate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('happy path returns GenerateResponse', async () => {
    const app = createApp({
      ai: new MockAiProvider(),
      generateDeps: {
        llm: new MockAiProvider(),
        loadScene: async () => fixtureScene(),
      },
    });
    const res = await request(app).post('/api/generate').send({
      query: 'Asakusa, Tokyo',
      theme: 'culture',
      durationMinutes: 90,
      radiusMeters: 500,
    });
    expect(res.status).toBe(200);
    expect(() => GenerateResponseSchema.parse(res.body)).not.toThrow();
    expect(res.body.pois.length).toBeGreaterThan(0);
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('rejects invalid input', async () => {
    const app = createApp({ ai: new MockAiProvider() });
    const res = await request(app).post('/api/generate').send({ query: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
  });

  it('returns 404 when area not found', async () => {
    const app = createApp({
      generateDeps: {
        llm: new MockAiProvider(),
        loadScene: async () => {
          throw new OsmNotFoundError('No results');
        },
      },
    });
    const res = await request(app).post('/api/generate').send({
      query: 'Nowhereville',
      theme: 'food',
      durationMinutes: 60,
    });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('area_not_found');
  });

  it('returns 502 on upstream failure without demo fallback', async () => {
    const app = createApp({
      generateDeps: {
        llm: new MockAiProvider(),
        loadScene: async () => {
          throw new OsmUpstreamError('boom');
        },
      },
    });
    const res = await request(app).post('/api/generate').send({
      query: 'Unknown Place XYZ',
      theme: 'nature',
      durationMinutes: 60,
    });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('upstream_error');
  });

  it('rate limits generate to 10/min', async () => {
    const app = createApp({
      generateDeps: {
        llm: new MockAiProvider(),
        loadScene: async () => fixtureScene(),
      },
    });
    const body = {
      query: 'Asakusa, Tokyo',
      theme: 'culture',
      durationMinutes: 90,
    };
    let lastStatus = 200;
    for (let i = 0; i < 12; i++) {
      const res = await request(app)
        .post('/api/generate')
        .send({ ...body, durationMinutes: 90 + i });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
