import { Router } from 'express';
import { z } from 'zod';
import { attachAuth, requireAuth } from '../auth/middleware.js';
import { getPool } from '../db/pool.js';

const saveSchema = z.object({
  query: z.string().min(1),
  theme: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  radiusMeters: z.number().int().positive(),
  response: z.record(z.unknown()),
});

export function createItinerariesRouter(): Router {
  const router = Router();
  router.use(attachAuth);
  router.use(requireAuth);

  router.post('/', async (req, res) => {
    const parsed = saveSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: 'invalid_request', message: 'Invalid itinerary payload' } });
      return;
    }
    const { query, theme, durationMinutes, radiusMeters, response } = parsed.data;
    const r = response as {
      center?: { lon?: unknown; lat?: unknown };
      provenance?: { area?: unknown };
      verification?: unknown;
      pois?: Array<{
        id?: unknown;
        lon?: unknown;
        lat?: unknown;
        name?: unknown;
        category?: unknown;
        osmTags?: unknown;
      }>;
    };
    const centerLon = Number(r.center?.lon ?? 0);
    const centerLat = Number(r.center?.lat ?? 0);
    const pool = getPool();
    const { rows } = await pool.query(
      `INSERT INTO itineraries
       (user_id, query, theme, duration_minutes, radius_meters, center_lon, center_lat, center_geog, center_display_name, response, verification_summary, provenance)
       VALUES ($1,$2,$3,$4,$5,$6,$7,ST_SetSRID(ST_MakePoint($6,$7),4326)::geography,$8,$9::jsonb,$10::jsonb,$11::jsonb)
       RETURNING id, query, theme, duration_minutes as "durationMinutes", radius_meters as "radiusMeters",
                 center_lon as "centerLon", center_lat as "centerLat", center_display_name as "centerDisplayName",
                 verification_summary as "verificationSummary", provenance, created_at as "createdAt"`,
      [
        req.authUser!.id,
        query,
        theme,
        durationMinutes,
        radiusMeters,
        centerLon,
        centerLat,
        typeof r.provenance?.area === 'string' ? r.provenance.area : null,
        JSON.stringify(response),
        JSON.stringify(r.verification ?? {}),
        r.provenance ? JSON.stringify(r.provenance) : null,
      ],
    );
    const pois = Array.isArray(r?.pois) ? r.pois : [];
    for (const poi of pois) {
      const sourceId = String(poi.id ?? '');
      if (!sourceId) continue;
      const lon = Number(poi.lon);
      const lat = Number(poi.lat);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
      await pool.query(
        `INSERT INTO places (source, source_id, name, category, tags, location, provenance)
         VALUES ('osm', $1, $2, $3, $4::jsonb, ST_SetSRID(ST_MakePoint($5,$6),4326)::geography, $7::jsonb)
         ON CONFLICT (source, source_id) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           tags = EXCLUDED.tags,
           location = EXCLUDED.location,
           provenance = EXCLUDED.provenance,
           updated_at = now()`,
        [
          sourceId,
          String(poi.name ?? sourceId),
          poi.category ?? null,
          JSON.stringify(poi.osmTags ?? {}),
          lon,
          lat,
          JSON.stringify({ source: 'openstreetmap', saved_from_itinerary: rows[0].id }),
        ],
      );
    }
    res.status(201).json({ itinerary: rows[0] });
  });

  router.get('/', async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, query, theme, duration_minutes as "durationMinutes", radius_meters as "radiusMeters",
              center_lon as "centerLon", center_lat as "centerLat", center_display_name as "centerDisplayName",
              verification_summary as "verificationSummary", provenance, created_at as "createdAt"
       FROM itineraries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.authUser!.id],
    );
    res.json({ itineraries: rows });
  });

  router.get('/:id', async (req, res) => {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, query, theme, duration_minutes as "durationMinutes", radius_meters as "radiusMeters",
              center_lon as "centerLon", center_lat as "centerLat", center_display_name as "centerDisplayName",
              response, verification_summary as "verificationSummary", provenance, created_at as "createdAt"
       FROM itineraries WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.authUser!.id],
    );
    if (!rows[0]) {
      res.status(404).json({ error: { code: 'not_found', message: 'Itinerary not found' } });
      return;
    }
    res.json({ itinerary: rows[0] });
  });

  router.delete('/:id', async (req, res) => {
    const pool = getPool();
    const { rowCount } = await pool.query(
      `DELETE FROM itineraries WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.authUser!.id],
    );
    if (!rowCount) {
      res.status(404).json({ error: { code: 'not_found', message: 'Itinerary not found' } });
      return;
    }
    res.status(204).send();
  });

  return router;
}
