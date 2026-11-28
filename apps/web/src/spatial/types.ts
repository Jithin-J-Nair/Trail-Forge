/** How much optional spatial coverage is honestly available for this session. */
export type SpatialCoverage = 'none' | 'partial' | 'full';

/** Active 3D presentation mode. Extrusions are the production default. */
export type SpatialMode = 'extrusions' | 'maplibre' | 'terrain' | 'tiles';

export type SpatialLayerStatus = {
  mode: SpatialMode;
  coverage: SpatialCoverage;
  /** Short UI label — never claims photoreal without keys + adapter. */
  label: string;
  /** Why this mode was chosen (for tests / debug). */
  reason: string;
};

export type SpatialEnv = {
  /** Publishable MapTiler key (optional 2D style). Empty = unset. */
  maptilerKey?: string;
  /** Cesium ion token. Prefer server proxy; empty = unset. */
  cesiumIonToken?: string;
  /** Force mock coverage in tests. */
  forceCoverage?: SpatialCoverage;
};
