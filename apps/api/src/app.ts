import {
  GenerateRequestSchema,
  LlmGenerateInputSchema,
  TourRequestSchema,
  type LlmProvider,
} from '@trailforge/shared';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { LlmJsonProvider } from './ai/provider.js';
import { responseCache } from './cache.js';
import { requestIdMiddleware } from './http/request-id.js';
import { createLlmProvider } from './llm/create-provider.js';
import { logger } from './logger.js';
import type { GenerateDeps } from './pipeline/generate-tour.js';
import { createGenerateRouter } from './routes/generate.js';
import { createAuthRouter } from './auth/routes.js';
import { createItinerariesRouter } from './itineraries/routes.js';
import { createProfileRouter } from './profile/routes.js';
import { createAnalyticsRouter } from './analytics/routes.js';
import { getGeoHealth } from './geo/index.js';
import { dbHealthcheck } from './db/pool.js';
import { createSpatialRouter } from './spatial/routes.js';

export type CreateAppOptions = {
  llm?: LlmProvider;
  ai?: LlmJsonProvider;
  corsOrigin?: string;
  generateDeps?: GenerateDeps;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const llm = options.llm ?? createLlmProvider('mock');
  const corsOrigin = options.corsOrigin ?? process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';

  app.set('cache', responseCache);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Reflect only the configured origin — never echo arbitrary Origin headers.
        if (!origin || origin === corsOrigin) {
          callback(null, corsOrigin);
          return;
        }
        callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      autoLogging: process.env['NODE_ENV'] !== 'test',
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: true,
      legacyHeaders: false,
      // Tile fan-out exceeds the general API budget; Google enforces its own quotas.
      skip: (req) => req.path.startsWith('/api/spatial/google-tiles/'),
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/spatial', createSpatialRouter());

  app.get('/api/geo/health', (_req, res) => {
    res.json(getGeoHealth());
  });

  app.get('/api/ready', async (_req, res) => {
    const dbOk = process.env['DATABASE_URL'] ? await dbHealthcheck() : true;
    const ok = dbOk;
    res
      .status(ok ? 200 : 503)
      .json({ status: ok ? 'ready' : 'degraded', checks: { database: dbOk } });
  });

  app.use('/api/auth', createAuthRouter());
  app.use('/api/itineraries', createItinerariesRouter());
  app.use('/api/profile', createProfileRouter());
  app.use('/api/analytics', createAnalyticsRouter());

  const generateLlm = options.ai ?? options.generateDeps?.llm;
  app.use(
    '/api',
    createGenerateRouter({
      ...(generateLlm ? { llm: generateLlm } : {}),
      ...(options.generateDeps?.loadScene ? { loadScene: options.generateDeps.loadScene } : {}),
      ...(options.generateDeps?.fetchImpl ? { fetchImpl: options.generateDeps.fetchImpl } : {}),
    }),
  );

  app.post('/api/v1/tour/validate', (req, res) => {
    const parsed = TourRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_tour_request', details: parsed.error.flatten() });
      return;
    }
    res.json({ ok: true, request: parsed.data });
  });

  app.post('/api/v1/generate/validate', (req, res) => {
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_generate_request', details: parsed.error.flatten() });
      return;
    }
    res.json({ ok: true, request: parsed.data });
  });

  app.post('/api/v1/llm/generate', async (req, res) => {
    const parsed = LlmGenerateInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_llm_input', details: parsed.error.flatten() });
      return;
    }
    try {
      const output = await llm.generate(parsed.data);
      res.json(output);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'llm_error';
      logger.error({ err }, 'LLM generate failed');
      res.status(502).json({ error: 'llm_error', message });
    }
  });

  return app;
}
