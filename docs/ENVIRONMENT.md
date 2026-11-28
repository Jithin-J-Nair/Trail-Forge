# Environment intelligence (Phase 5)

## Solar / civil time

`apps/web/src/scene/solar.ts` approximates sun elevation from lat/lon + UTC (no IANA timezone database). Local clock labels use a **longitude-based whole-hour UTC offset** — honest civil approximation, not a true timezone.

- `dayFactor` (0–1) drives `DayNightLights` and building window `uDay`.
- Scene HUD shows local civil time, Day/Night, and sun elevation degrees.

## Weather

`apps/web/src/weather/` resolves availability before any fetch:

| State         | Meaning                                                              |
| ------------- | -------------------------------------------------------------------- |
| `unavailable` | No provider opted in (default). Badge says weather unavailable.      |
| `loading`     | `VITE_WEATHER_PROVIDER=openmeteo` — awaiting live Open-Meteo.        |
| `live`        | Real current conditions from Open-Meteo (temp + WMO condition code). |
| `error`       | Fetch failed — still labeled unavailable, never invents rain/snow.   |

Open-Meteo needs **no API key**. Secret-keyed providers (e.g. OpenWeather) stay server-side (`OPENWEATHER_API_KEY` in root `.env.example`) for a future API proxy — never silent fake weather in the browser.
