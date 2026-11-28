# Route intelligence (Phase 6)

## Ordering (deterministic)

`planRoute` never asks the LLM for stop order:

1. Rank POIs by multi-objective score (proximity · theme tags · OSM walkability).
2. Nearest-neighbor + 2-opt on up to 24 candidates.
3. Trim the path to `durationMinutes` at 80 m/min with a 1.3× straight-line detour budget.
4. Titles must include a real ordered POI name — invented LLM titles are replaced.

`RoutePlan.scoring` exposes objective weights, candidate/selected counts, and `trimmedCount`.

## Pedestrian distance

| Provider           | When                                                |
| ------------------ | --------------------------------------------------- |
| `openrouteservice` | `OPENROUTESERVICE_API_KEY` set and ORS call works   |
| `graphhopper`      | ORS missing/failed and `GRAPHHOPPER_API_KEY` works  |
| `euclidean_detour` | Default / fallback — labeled in `RoutePlan.routing` |

Keys stay server-side. Failures fall back to the labeled euclidean estimate — never invent walk geometries.
