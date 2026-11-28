import type { PoiLocal, RouteObjective, Theme } from '@trailforge/shared';

/** Fixed objective weights — transparent in every RoutePlan.scoring. */
export const ROUTE_OBJECTIVES: RouteObjective[] = [
  {
    id: 'proximity',
    weight: 0.35,
    description: 'Closer to tour center and shorter legs preferred',
  },
  {
    id: 'theme',
    weight: 0.35,
    description: 'OSM tags/category matching the requested theme',
  },
  {
    id: 'walkability',
    weight: 0.2,
    description: 'OSM foot/wheelchair/access tags only — no invented scores',
  },
  {
    id: 'duration',
    weight: 0.1,
    description: 'Trim path to fit durationMinutes budget',
  },
];

const THEME_TAG_HINTS: Record<Theme, string[]> = {
  culture: ['tourism', 'historic', 'amenity', 'artwork'],
  food: ['amenity', 'cuisine', 'diet'],
  nature: ['leisure', 'natural', 'landuse'],
  shopping: ['shop', 'tourism', 'amenity'],
  nightlife: ['amenity', 'tourism'],
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Theme affinity from category + OSM tag keys only (no invented places). */
export function themeMatchScore(poi: PoiLocal, theme: Theme): number {
  let s = 0;
  if (poi.category === theme) s += 0.45;
  const hints = THEME_TAG_HINTS[theme];
  let hits = 0;
  for (const key of hints) {
    if (key in poi.osmTags) hits += 1;
  }
  s += Math.min(0.45, hits * 0.15);
  if (poi.osmTags['name'] || poi.osmTags['name:en'] || poi.osmTags['name:ja']) s += 0.1;
  return clamp01(s);
}

/** Walkability from OSM tags only — never invents sidewalks. */
export function walkabilityScore(poi: PoiLocal): number {
  const t = poi.osmTags;
  let s = 0.5;
  if (t['wheelchair'] === 'yes') s += 0.25;
  if (t['wheelchair'] === 'no') s -= 0.2;
  if (t['foot'] === 'yes' || t['foot'] === 'designated') s += 0.15;
  if (t['highway'] === 'pedestrian' || t['highway'] === 'footway' || t['highway'] === 'path') {
    s += 0.15;
  }
  if (t['access'] === 'private' || t['access'] === 'no') s -= 0.35;
  return clamp01(s);
}

function proximityScore(poi: PoiLocal, maxR: number): number {
  const r = Math.hypot(poi.x, poi.z);
  if (maxR <= 0) return 1;
  return clamp01(1 - r / maxR);
}

export type ScoredPoi = { poi: PoiLocal; score: number };

/** Rank POIs by multi-objective score for a theme. Stable for identical inputs. */
export function rankPoisForTheme(pois: PoiLocal[], theme: Theme): ScoredPoi[] {
  const maxR = Math.max(1, ...pois.map((p) => Math.hypot(p.x, p.z)));
  const proxW = ROUTE_OBJECTIVES.find((o) => o.id === 'proximity')!.weight;
  const themeW = ROUTE_OBJECTIVES.find((o) => o.id === 'theme')!.weight;
  const walkW = ROUTE_OBJECTIVES.find((o) => o.id === 'walkability')!.weight;
  const scored = pois.map((poi) => ({
    poi,
    score:
      proxW * proximityScore(poi, maxR) +
      themeW * themeMatchScore(poi, theme) +
      walkW * walkabilityScore(poi),
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.poi.id.localeCompare(b.poi.id);
  });
  return scored;
}
