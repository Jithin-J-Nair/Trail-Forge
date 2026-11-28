import { useEffect, useState } from 'react';
import { fetchOpenMeteo } from './openmeteo.js';
import { resolveWeather, weatherEnvFromImportMeta } from './resolve-weather.js';
import type { WeatherSnapshot } from './types.js';

/** Resolve + optionally fetch live weather for the tour center. */
export function useWeather(lat: number, lon: number): WeatherSnapshot {
  const [status, setStatus] = useState<WeatherSnapshot>(() =>
    resolveWeather(weatherEnvFromImportMeta()),
  );

  useEffect(() => {
    const initial = resolveWeather(weatherEnvFromImportMeta());
    setStatus(initial);
    if (initial.source !== 'openmeteo') return;

    const ac = new AbortController();
    void fetchOpenMeteo(lat, lon, ac.signal).then(setStatus);
    return () => ac.abort();
  }, [lat, lon]);

  return status;
}
