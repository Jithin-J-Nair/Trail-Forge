import { CatmullRomCurve3, Vector3 } from 'three';
import type { PoiLocal } from '@trailforge/shared';

export const EYE_Y = 1.7;

/** Sample a Catmull-Rom route at eye height for MotionPath walks. */
export function densifyPath(stops: PoiLocal[], y = EYE_Y): { x: number; y: number; z: number }[] {
  if (stops.length === 0) return [];
  if (stops.length === 1) {
    const s = stops[0]!;
    return [{ x: s.x, y, z: s.z }];
  }
  const pts = stops.map((s) => new Vector3(s.x, y, s.z));
  const curve = new CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
  const len = curve.getLength();
  const samples = Math.max(24, Math.min(160, Math.ceil(len / 4)));
  const out: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const p = curve.getPoint(i / samples);
    out.push({ x: p.x, y, z: p.z });
  }
  return out;
}

export function nearestStopId(pois: PoiLocal[], x: number, z: number): string | null {
  let best: PoiLocal | null = null;
  let bestD = Infinity;
  for (const p of pois) {
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best?.id ?? null;
}

export function orderedStops(pois: PoiLocal[], orderedPoiIds: string[]): PoiLocal[] {
  const byId = new Map(pois.map((p) => [p.id, p]));
  return orderedPoiIds.map((id) => byId.get(id)).filter((p): p is PoiLocal => Boolean(p));
}
