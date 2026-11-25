import type { LocalXZ } from '@trailforge/shared';

function perpDistance(p: LocalXZ, a: LocalXZ, b: LocalXZ): number {
  const [x, z] = p;
  const [x1, z1] = a;
  const [x2, z2] = b;
  const dx = x2 - x1;
  const dz = z2 - z1;
  if (dx === 0 && dz === 0) return Math.hypot(x - x1, z - z1);
  const t = ((x - x1) * dx + (z - z1) * dz) / (dx * dx + dz * dz);
  const projX = x1 + t * dx;
  const projZ = z1 + t * dz;
  return Math.hypot(x - projX, z - projZ);
}

/** Douglas–Peucker polyline simplification in local meters. */
export function simplifyPolyline(points: LocalXZ[], toleranceM: number): LocalXZ[] {
  if (points.length < 3) return points.slice();

  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return points.slice();

  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    if (!p) continue;
    const d = perpDistance(p, first, last);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }

  if (maxDist > toleranceM) {
    const left = simplifyPolyline(points.slice(0, index + 1), toleranceM);
    const right = simplifyPolyline(points.slice(index), toleranceM);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

export function isValidPolygon(points: LocalXZ[]): boolean {
  if (points.length < 3) return false;
  let area2 = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if (!a || !b) return false;
    area2 += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(area2) > 0.5; // > 0.25 m²
}
