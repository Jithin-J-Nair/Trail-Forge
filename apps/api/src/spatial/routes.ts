import { Router } from 'express';
import { createGoogleTilesSession } from './session.js';
import { proxyGoogleTile } from './proxy.js';

export function createSpatialRouter(): Router {
  const router = Router();

  /**
   * Mint a client-safe photoreal 3D tiles session when GOOGLE_MAPS_API_KEY is set.
   * 503 + labeled body when unset — local/dev without a key keeps OSM extrusions.
   */
  router.get('/google-tiles-session', (_req, res) => {
    const session = createGoogleTilesSession();
    if (!session.available) {
      res.status(503).json(session);
      return;
    }
    res.json(session);
  });

  // Express 4: mount strips /google-tiles so req.path is /v1/3dtiles/...
  router.use('/google-tiles', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    void proxyGoogleTile(req, res);
  });

  return router;
}
