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
import { responseCache } from './cache.js';
import { createLlmProvider } from './llm/create-provider.js';
import { logger } from './logger.js';

export type CreateAppOptions = {
  llm?: LlmProvider;
  corsOrigin?: string;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const llm = options.llm ?? createLlmProvider('mock');
  const corsOrigin = options.corsOrigin ?? process.env['CORS_ORIGIN'] ?? 'http://localhost:5173';

  app.set('cache', responseCache);
  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '32kb' }));
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
    }),
  );

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

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
