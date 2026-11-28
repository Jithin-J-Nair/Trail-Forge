# Spatial coverage (Phase 3)

TrailForge’s primary 3D path is **R3F extruded OSM building footprints** (merged meshes). That path needs no commercial tiles keys and must stay honest.

## Coverage enum

| Coverage  | Meaning                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `none`    | No MapTiler/Cesium keys (or forced none). Scene = OSM extrusions only.                                                 |
| `partial` | A key may be present, or a future 2D/terrain adapter is planned — **3D still uses extrusions** until a renderer ships. |
| `full`    | Reserved for a working tiles/terrain adapter with verified coverage. Not claimed without implementation.               |

`resolveSpatialLayer()` never switches the scene to photoreal Google/Cesium tiles without a real adapter. Keys alone do not imply coverage.

## Env

See `apps/web/.env.example` (`VITE_MAPTILER_KEY`, `VITE_CESIUM_ION_TOKEN`) and root `.env.example` for optional server-side proxies. Without keys the app matches Phase 2 behavior (extrusions).

## UI

`CoverageBadge` over the scene states the active mode and that footprints are used when tiles/terrain are unavailable.
