/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_API_ORIGIN?: string;
  /** Optional publishable MapTiler key — does not enable photoreal by itself. */
  readonly VITE_MAPTILER_KEY?: string;
  /** Optional Cesium ion token — prefer server proxy; unused until tiles adapter ships. */
  readonly VITE_CESIUM_ION_TOKEN?: string;
  /** Optional weather provider: `openmeteo` (keyless) or unset = unavailable. */
  readonly VITE_WEATHER_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
