/** Honest weather availability for this session. */
export type WeatherState = 'unavailable' | 'loading' | 'live' | 'error';

export type WeatherSnapshot = {
  state: WeatherState;
  /** Short UI label — never invents rain/snow without a live source. */
  label: string;
  reason: string;
  tempC?: number;
  condition?: string;
  source?: 'openmeteo';
};

export type WeatherEnv = {
  /**
   * Opt-in provider. Empty/off = unavailable (no silent fake weather).
   * `openmeteo` needs no API key (public forecast API).
   */
  provider?: 'off' | 'openmeteo';
};
