import type { SpatialLayerStatus } from './types.js';

/** Honest spatial coverage status over the 3D scene. */
export function CoverageBadge({ status }: { status: SpatialLayerStatus }) {
  const coverageNote =
    status.coverage === 'none'
      ? 'No terrain/tiles keys — footprints only'
      : status.coverage === 'partial'
        ? 'Enhanced layers not active — footprints only'
        : 'Photoreal tiles loaded · © Google';

  return (
    <p
      className="pointer-events-none absolute bottom-16 left-1/2 z-20 max-w-[min(90vw,28rem)] -translate-x-1/2 rounded-md border border-trail-border bg-black/40 px-3 py-1 text-center text-[10px] tracking-wide text-trail-muted backdrop-blur-md md:bottom-20"
      role="status"
      data-testid="spatial-coverage"
      data-coverage={status.coverage}
      data-mode={status.mode}
      title={status.reason}
    >
      {status.label}
      <span className="mt-0.5 block text-trail-muted/80">{coverageNote}</span>
    </p>
  );
}
