/** Approximate solar elevation (degrees) and day factor for a lon/lat at `now`. */

export type SolarState = {
  /** Sun altitude above horizon in degrees (negative = night). */
  elevationDeg: number;
  /** 0 night → 1 full day. */
  dayFactor: number;
  /** Local civil clock string using longitude-based UTC offset. */
  localTimeLabel: string;
  isDay: boolean;
};

function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
}

/** Compact solar altitude from lat/lon + UTC (no external tz DB). */
export function solarElevationDeg(lat: number, lon: number, now = new Date()): number {
  const n = dayOfYear(now);
  const decl = 23.44 * Math.sin(((2 * Math.PI) / 365) * (n - 81));
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
  // Equation of time ~ minutes; hour angle from solar noon at this longitude
  const lst = utcHours + lon / 15;
  const hourAngle = (lst - 12) * 15;
  const latR = (lat * Math.PI) / 180;
  const decR = (decl * Math.PI) / 180;
  const haR = (hourAngle * Math.PI) / 180;
  const sinEl = Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(haR);
  return (Math.asin(Math.min(1, Math.max(-1, sinEl))) * 180) / Math.PI;
}

export function dayFactorFromElevation(elevationDeg: number): number {
  // Soft ramp through civil twilight (~±6°)
  return Math.min(1, Math.max(0, (elevationDeg + 6) / 18));
}

export function localTimeFromLongitude(lon: number, now = new Date()): string {
  const offsetMin = Math.round(lon / 15) * 60;
  const local = new Date(now.getTime() + offsetMin * 60_000);
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');
  const sign = offsetMin >= 0 ? '+' : '-';
  const oh = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, '0');
  return `${hh}:${mm} (UTC${sign}${oh})`;
}

export function getSolarState(lat: number, lon: number, now = new Date()): SolarState {
  const elevationDeg = solarElevationDeg(lat, lon, now);
  const dayFactor = dayFactorFromElevation(elevationDeg);
  return {
    elevationDeg,
    dayFactor,
    localTimeLabel: localTimeFromLongitude(lon, now),
    isDay: elevationDeg > 0,
  };
}
