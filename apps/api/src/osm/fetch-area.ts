import type { Theme } from '@trailforge/shared';
import { resolveAreaScene, type GeoResolveResult } from '../geo/index.js';
import type { TransformedScene } from './transform.js';

export type DataProvenance = {
  mode: 'live_osm' | 'local_dev';
  source: string;
  license: string;
  attribution: string;
  area?: string;
  capturedAt?: string;
  note?: string;
};

export type FetchAreaResult = TransformedScene & {
  displayName: string;
  fromCache: boolean;
  provenance: DataProvenance;
  devMode?: boolean;
  diagnostics?: GeoResolveResult['diagnostics'];
};

export async function fetchAreaScene(
  query: string,
  theme: Theme,
  radiusMeters: number,
  options: {
    fetchImpl?: typeof fetch;
    signal?: AbortSignal;
  } = {},
): Promise<FetchAreaResult> {
  const r = await resolveAreaScene(query, theme, radiusMeters, options.signal);
  return {
    ...r.scene,
    displayName: r.displayName,
    fromCache: false,
    provenance: r.provenance,
    devMode: r.devMode,
    diagnostics: r.diagnostics,
  };
}
