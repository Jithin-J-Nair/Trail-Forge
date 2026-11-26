import { Router } from 'express';
import { z } from 'zod';
import { attachAuth, requireAuth } from '../auth/middleware.js';
import { getPool } from '../db/pool.js';

export function createAnalyticsRouter(): Router {
  const router = Router();
  router.use(attachAuth);

  router.post('/events', async (req, res) => {
    const body = z.object({ eventType: z.string().min(1), payload: z.record(z.unknown()).optional() }).safeParse(req.body);
    if (!body.success) { res.status(400).json({ error: { code: 'invalid_request', message: 'Invalid event' } }); return; }
    try {
      const pool = getPool();
      await pool.query(`INSERT INTO analytics_events (user_id, event_type, payload) VALUES ($1,$2,$3::jsonb)`, [req.authUser?.id ?? null, body.data.eventType, JSON.stringify(body.data.payload ?? {})]);
    } catch { /* analytics should not break UX */ }
    res.status(202).json({ ok: true });
  });

  router.get('/summary', requireAuth, async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT event_type as "eventType", count(*)::int as count
       FROM analytics_events WHERE created_at > now() - interval '30 days'
       GROUP BY event_type ORDER BY count DESC LIMIT 50`,
    );
    res.json({ summary: rows });
  });

  return router;
}
