import type { PoiLocal, RoutePlan, Theme } from '@trailforge/shared';
import { measureEuclideanDetour } from '../routing/euclidean.js';
import { ROUTE_OBJECTIVES, rankPoisForTheme } from './score.js';

const WALK_M_PER_MIN = 80;
/** Cap candidates so large Overpass sets stay tractable. */
const MAX_CANDIDATES = 24;

function dist(a: PoiLocal, b: PoiLocal): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function pathLengthEuclidean(order: PoiLocal[]): number {
  return measureEuclideanDetour(order).totalMeters;
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
    if (pathLengthEuclidean(candidate) <= budget) {
      kept.push(next);
    } else {
      break;
    }
  }
  return kept;
}

/** Titles must cite a real POI name from the ordered stop list — no invented places. */
export function groundedRouteTitles(
  ordered: PoiLocal[],
  titles?: { titleJa?: string; titleEn?: string },
): { titleJa: string; titleEn: string } {
  const names = ordered.map((p) => p.name).filter((n) => n.trim().length > 0);
  const fallbackJa = names.length ? `${names[0]} ほかの散歩` : '散策ルート';
  const fallbackEn = names.length ? `Walk from ${names[0]}` : 'Walking route';
  const usesRealName = (title: string | undefined): boolean =>
    Boolean(title?.trim() && names.some((n) => title.includes(n)));
  return {
    titleJa: usesRealName(titles?.titleJa) ? titles!.titleJa!.trim() : fallbackJa,
    titleEn: usesRealName(titles?.titleEn) ? titles!.titleEn!.trim() : fallbackEn,
  };
}

export type PlanRouteOptions = {
  theme?: Theme;
  titles?: { titleJa?: string; titleEn?: string };
};

/**
 * Deterministic multi-objective planner — never LLM-ordered.
 * Theme/walkability rank → NN + 2-opt → duration trim → grounded titles.
 */
export function planRoute(
  pois: PoiLocal[],
  durationMinutes: number,
  options: PlanRouteOptions = {},
): RoutePlan {
  const theme = options.theme ?? 'culture';
  const ranked = rankPoisForTheme(pois, theme);
  const candidates = ranked.slice(0, MAX_CANDIDATES).map((r) => r.poi);
  const orderedFull = twoOpt(nearestNeighbor(candidates));
  const ordered = trimToDuration(orderedFull, durationMinutes);
  const euclidean = measureEuclideanDetour(ordered);
  const estimatedMinutes = Math.max(1, Math.round(euclidean.totalMeters / WALK_M_PER_MIN));
  const titles = groundedRouteTitles(ordered, options.titles);

  return {
    orderedPoiIds: ordered.map((p) => p.id),
    totalMeters: euclidean.totalMeters,
    estimatedMinutes,
    titleJa: titles.titleJa,
    titleEn: titles.titleEn,
    scoring: {
      objectives: ROUTE_OBJECTIVES,
      candidateCount: pois.length,
      selectedCount: ordered.length,
      trimmedCount: Math.max(0, orderedFull.length - ordered.length),
    },
    routing: euclidean.routing,
  };
}
