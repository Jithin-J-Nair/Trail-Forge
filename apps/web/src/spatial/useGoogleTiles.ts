import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchGoogleTilesSession } from './google-tiles-session.js';
import { resolveSpatialLayer, spatialEnvFromImportMeta } from './resolve-coverage.js';
import type { SpatialEnv, SpatialLayerStatus } from './types.js';

export type GoogleTilesRuntime = {
  status: SpatialLayerStatus;
  /** Proxied root URL when a server session exists; null when unavailable. */
  rootUrl: string | null;
  tilesActive: boolean;
  onTilesLoad: () => void;
  onTilesError: (reason: string) => void;
};

type GoogleTilesState = NonNullable<SpatialEnv['googleTiles']>;

/**
 * Probe the API for a Google tiles session and only claim `full` coverage
 * after the renderer reports a successful tileset load.
 */
export function useGoogleTiles(): GoogleTilesRuntime {
  const baseEnv = useMemo(() => spatialEnvFromImportMeta(), []);
  const [googleTiles, setGoogleTiles] = useState<GoogleTilesState>('unset');
  const [rootUrl, setRootUrl] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    setGoogleTiles('unset');
    setRootUrl(null);
    void fetchGoogleTilesSession(ac.signal).then((session) => {
      if (ac.signal.aborted) return;
      if (!session.available) {
        setGoogleTiles('unset');
        setRootUrl(null);
        return;
      }
      setRootUrl(session.rootUrl);
      setGoogleTiles('loading');
    });
    return () => ac.abort();
  }, []);

  const onTilesLoad = useCallback(() => {
    setGoogleTiles('loaded');
  }, []);

  const onTilesError = useCallback((reason: string) => {
    void reason;
    setGoogleTiles('failed');
    setRootUrl(null);
  }, []);

  const status = useMemo(
    () => resolveSpatialLayer({ ...baseEnv, googleTiles }),
    [baseEnv, googleTiles],
  );

  return {
    status,
    rootUrl,
    tilesActive: googleTiles === 'loaded',
    onTilesLoad,
    onTilesError,
  };
}
