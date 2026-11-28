import type { WeatherSnapshot } from './types.js';

/** WMO weather interpretation codes → short English labels (Open-Meteo). */
export function conditionFromWmo(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

type OpenMeteoCurrent = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    precipitation?: number;
  };
};

/**
 * Fetch current conditions from Open-Meteo (no API key).
 * On failure returns an explicit error snapshot — never invents weather.
 */
export async function fetchOpenMeteo(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,weather_code,precipitation');
  url.searchParams.set('timezone', 'auto');

  try {
    const init: RequestInit = { headers: { Accept: 'application/json' } };
    if (signal) init.signal = signal;
    const res = await fetch(url.toString(), init);
    if (!res.ok) {
      return {
        state: 'error',
        label: 'Weather unavailable',
        reason: `Open-Meteo HTTP ${res.status}`,
        source: 'openmeteo',
      };
    }
    const data = (await res.json()) as OpenMeteoCurrent;
    const cur = data.current;
    const temp = cur?.temperature_2m;
    const code = cur?.weather_code;
    if (typeof temp !== 'number' || typeof code !== 'number') {
      return {
        state: 'error',
        label: 'Weather unavailable',
        reason: 'Open-Meteo response missing current fields',
        source: 'openmeteo',
      };
    }
    const condition = conditionFromWmo(code);
    const precip = cur?.precipitation ?? 0;
    const precipNote = precip > 0 ? ` · ${precip} mm` : '';
    return {
      state: 'live',
      label: `${condition} ${Math.round(temp)}°C${precipNote}`,
      reason: 'live Open-Meteo current conditions',
      tempC: temp,
      condition,
      source: 'openmeteo',
    };
  } catch (err) {
    if (signal?.aborted) {
      return {
        state: 'unavailable',
        label: 'Weather unavailable',
        reason: 'fetch aborted',
        source: 'openmeteo',
      };
    }
    const msg = err instanceof Error ? err.message : 'fetch failed';
    return {
      state: 'error',
      label: 'Weather unavailable',
      reason: msg,
      source: 'openmeteo',
    };
  }
}
