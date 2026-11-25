import type { PoiLocal, RoutePlan } from '@trailforge/shared';

const DETOUR = 1.3;
const WALK_M_PER_MIN = 80;

function dist(a: PoiLocal, b: PoiLocal): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function pathLength(order: PoiLocal[]): number {
  let total = 0;
  for (let i = 1; i < order.length; i++) {
    const prev = order[i - 1];
    const cur = order[i];
    if (!prev || !cur) continue;
    total += dist(prev, cur);
  }
  return total * DETOUR;
}

function nearestNeighbor(pois: PoiLocal[]): PoiLocal[] {
  if (pois.length === 0) return [];
  const start = [...pois].sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))[0];
  if (!start) return [];
  const remaining = new Set(pois.filter((p) => p.id !== start.id));
  const order = [start];
  while (remaining.size > 0) {
    const last = order[order.length - 1];
    if (!last) break;
    let best: PoiLocal | undefined;
    let bestD = Infinity;
    for (const p of remaining) {
      const d = dist(last, p);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) break;
    remaining.delete(best);
    order.push(best);
  }
  return order;
}

/** 2-opt improvement on tour order (open path). */
function twoOpt(order: PoiLocal[]): PoiLocal[] {
  const path = order.slice();
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < path.length - 2; i++) {
      for (let k = i + 1; k < path.length - 1; k++) {
        const a = path[i];
        const b = path[i + 1];
        const c = path[k];
        const d = path[k + 1];
        if (!a || !b || !c || !d) continue;
        const before = dist(a, b) + dist(c, d);
        const after = dist(a, c) + dist(b, d);
        if (after + 1e-6 < before) {
          const reversed = path.slice(i + 1, k + 1).reverse();
          path.splice(i + 1, k - i, ...reversed);
          improved = true;
        }
      }
    }
  }
  return path;
}

function trimToDuration(order: PoiLocal[], durationMinutes: number): PoiLocal[] {
  if (order.length === 0) return [];
  const budget = durationMinutes * WALK_M_PER_MIN;
  const kept = [order[0]!];
  for (let i = 1; i < order.length; i++) {
    const next = order[i];
    if (!next) continue;
    const candidate = [...kept, next];
    if (pathLength(candidate) <= budget) {
      kept.push(next);
    } else {
      break;
    }
  }
  return kept;
}

export function planRoute(
  pois: PoiLocal[],
  durationMinutes: number,
  titles?: { titleJa?: string; titleEn?: string },
): RoutePlan {
  const ordered = trimToDuration(twoOpt(nearestNeighbor(pois)), durationMinutes);
  const totalMeters = Math.round(pathLength(ordered));
  const estimatedMinutes = Math.max(1, Math.round(totalMeters / WALK_M_PER_MIN));
  const names = ordered.map((p) => p.name);
  const fallbackJa = names.length ? `${names[0]} ほかの散歩` : '散策ルート';
  const fallbackEn = names.length ? `Walk from ${names[0]}` : 'Walking route';

  return {
    orderedPoiIds: ordered.map((p) => p.id),
    totalMeters,
    estimatedMinutes,
    titleJa: titles?.titleJa?.trim() || fallbackJa,
    titleEn: titles?.titleEn?.trim() || fallbackEn,
  };
}
