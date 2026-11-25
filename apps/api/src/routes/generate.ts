import { GenerateRequestSchema } from '@trailforge/shared';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createAiProvider } from '../ai/create-provider.js';
import { ApiError } from '../http/errors.js';
import { logger } from '../logger.js';
import { dedupeInflight } from '../pipeline/dedupe.js';
import { generateTour, type GenerateDeps } from '../pipeline/generate-tour.js';

export function createGenerateRouter(deps: GenerateDeps = {}) {
  const router = Router();

  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'rate_limited', message: 'Too many generate requests' },
      });
    },
  });

  router.post('/generate', limiter, async (req, res) => {
    const requestId = req.requestId;
    const parsed = GenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_request',
          message: 'Invalid generate request',
          ...(requestId ? { requestId } : {}),
        },
      });
      return;
    }

    const key = JSON.stringify(parsed.data);
    const timer = setTimeout(() => undefined, 60_000);

    try {
      const { response, timings } = await dedupeInflight(key, () =>
        generateTour(parsed.data, {
          llm: deps.llm ?? createAiProvider(),
          ...(deps.loadScene ? { loadScene: deps.loadScene } : {}),
          ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
        }),
      );

      logger.info({ requestId, timings, stage: 'generate' }, 'generate complete');
      res.json(response);
    } catch (err) {
      if (err instanceof ApiError) {
        res.status(err.status).json(err.toJSON(requestId));
        return;
      }
      logger.error({ err, requestId }, 'generate failed');
      res.status(500).json({
        error: {
          code: 'internal_error',
          message: 'Unexpected server error',
          ...(requestId ? { requestId } : {}),
        },
      });
    } finally {
      clearTimeout(timer);
    }
  });

  return router;
}
