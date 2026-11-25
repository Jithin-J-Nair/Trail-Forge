export class OsmNotFoundError extends Error {
  readonly code = 'area_not_found' as const;
  constructor(message: string) {
    super(message);
    this.name = 'OsmNotFoundError';
  }
}

export class OsmUpstreamError extends Error {
  readonly code = 'upstream_error' as const;
  constructor(message: string) {
    super(message);
    this.name = 'OsmUpstreamError';
  }
}
