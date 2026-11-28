import type { WeatherSnapshot } from './types.js';

/** Honest weather status — unavailable/error never look like live rain. */
export function WeatherBadge({ status }: { status: WeatherSnapshot }) {
  return (
    <p
      className="pointer-events-none absolute bottom-[7.5rem] left-1/2 z-20 max-w-[min(90vw,28rem)] -translate-x-1/2 rounded-md border border-trail-border bg-black/40 px-3 py-1 text-center text-[10px] tracking-wide text-trail-muted backdrop-blur-md md:bottom-[7.75rem]"
      role="status"
      data-testid="weather-status"
      data-weather={status.state}
      title={status.reason}
    >
      {status.label}
      {status.state !== 'live' ? (
        <span className="mt-0.5 block text-trail-muted/80">No invented rain or snow</span>
      ) : (
        <span className="mt-0.5 block text-trail-muted/80">Open-Meteo · live</span>
      )}
    </p>
  );
}
