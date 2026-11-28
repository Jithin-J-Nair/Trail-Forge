import type { WeatherEnv, WeatherSnapshot } from './types.js';

/** Resolve whether weather may be fetched. No provider → unavailable, never fake. */
export function resolveWeather(env: WeatherEnv = {}): WeatherSnapshot {
  const provider = env.provider ?? 'off';
  if (provider === 'openmeteo') {
    return {
      state: 'loading',
      label: 'Weather loading…',
      reason: 'Open-Meteo opted in — awaiting live fetch',
      source: 'openmeteo',
    };
  }
  return {
    state: 'unavailable',
    label: 'Weather unavailable',
    reason: 'no weather provider configured (set VITE_WEATHER_PROVIDER=openmeteo)',
  };
}

/** Read Vite env for browser resolve. */
export function weatherEnvFromImportMeta(): WeatherEnv {
  const raw = import.meta.env.VITE_WEATHER_PROVIDER;
  if (typeof raw === 'string' && raw.trim().toLowerCase() === 'openmeteo') {
    return { provider: 'openmeteo' };
  }
  return { provider: 'off' };
}
