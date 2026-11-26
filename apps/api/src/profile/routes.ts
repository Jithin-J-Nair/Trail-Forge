import { Router } from 'express';
import { z } from 'zod';
import { attachAuth, requireAuth } from '../auth/middleware.js';
import { getPool } from '../db/pool.js';

const profileSchema = z.object({
  interests: z.array(z.string()).optional(),
  preferredThemes: z.array(z.string()).optional(),
  preferredDurationMinutes: z.number().int().positive().optional(),
  accessibility: z.record(z.unknown()).optional(),
  languages: z.array(z.string()).optional(),
});

export function createProfileRouter(): Router {
  const router = Router();
  router.use(attachAuth, requireAuth);

  router.get('/', async (req, res) => {
    const pool = getPool();
    await pool.query(
      `INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
      [req.authUser!.id],
    );
    const { rows } = await pool.query(
      `SELECT interests, preferred_themes as "preferredThemes", preferred_duration_minutes as "preferredDurationMinutes", accessibility, languages FROM user_profiles WHERE user_id=$1`,
      [req.authUser!.id],
    );
    res.json({ profile: rows[0] ?? null });
  });

  router.put('/', async (req, res) => {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'invalid_request', message: 'Invalid profile' } });
      return;
    }
    const p = parsed.data;
    const pool = getPool();
    await pool.query(
      `INSERT INTO user_profiles (user_id, interests, preferred_themes, preferred_duration_minutes, accessibility, languages, updated_at)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,now())
       ON CONFLICT (user_id) DO UPDATE SET
         interests=COALESCE($2,user_profiles.interests),
         preferred_themes=COALESCE($3,user_profiles.preferred_themes),
         preferred_duration_minutes=COALESCE($4,user_profiles.preferred_duration_minutes),
         accessibility=COALESCE($5::jsonb,user_profiles.accessibility),
         languages=COALESCE($6,user_profiles.languages),
         updated_at=now()`,
      [
        req.authUser!.id,
        p.interests ?? null,
        p.preferredThemes ?? null,
        p.preferredDurationMinutes ?? null,
        p.accessibility ? JSON.stringify(p.accessibility) : null,
        p.languages ?? null,
      ],
    );
    const { rows } = await pool.query(
      `SELECT interests, preferred_themes as "preferredThemes", preferred_duration_minutes as "preferredDurationMinutes", accessibility, languages FROM user_profiles WHERE user_id=$1`,
      [req.authUser!.id],
    );
    res.json({ profile: rows[0] });
  });

  return router;
}
