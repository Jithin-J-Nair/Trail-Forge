# Spatial coverage

TrailForge’s default 3D path is **R3F extruded OSM building footprints** (merged meshes). That path needs no commercial tiles keys and must stay honest.

## Coverage enum

| Coverage  | Meaning                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `none`    | No MapTiler/Cesium/Google session. Scene = OSM extrusions only.                                                                |
| `partial` | A key/session may exist, or tiles are loading/failed — **3D still uses extrusions** until photoreal tiles actually render.     |
| `full`    | Google Photorealistic 3D Tiles loaded successfully through the API proxy. Never claimed from keys alone or before tiles paint. |

`resolveSpatialLayer()` / `useGoogleTiles()` never claim photoreal `full` without a live tileset load. Keys alone do not imply coverage.

## Google Photorealistic 3D Tiles

- **Secret:** `GOOGLE_MAPS_API_KEY` on the API only (`process.env`). Never `VITE_*`. Never logged.
- **Session:** `GET /api/spatial/google-tiles-session`
  - Key set → `{ available: true, rootUrl: "/api/spatial/google-tiles/v1/3dtiles/root.json", expiresAt }`
  - Key unset → **503** `{ available: false, error: "google_tiles_unavailable", reason: "GOOGLE_MAPS_API_KEY unset" }`
- **Proxy:** `GET /api/spatial/google-tiles/v1/3dtiles/*` forwards to `tile.googleapis.com` and attaches the server key. Browser URLs never include the key.
- **Note:** Map Tiles `createSession` is for 2D / Street View. Photorealistic 3D Tiles use `root.json`; Google’s ~3h tile window starts at that fetch. TrailForge refreshes via `expiresAt`.
- **Renderer:** `3d-tiles-renderer` inside the existing R3F canvas, reoriented to the tour center (+X east / +Z south). OSM extrusions hide only after tiles load; routes/pins stay.
- **Local/dev without key:** session 503 → extrusions + `CoverageBadge` `none`/`partial` as appropriate. App still runs.

## Env

| Location               | Variable                 | Purpose                                        |
| ---------------------- | ------------------------ | ---------------------------------------------- |
| `apps/api/.env` / root | `GOOGLE_MAPS_API_KEY=`   | Map Tiles API key (server-side only)           |
| `apps/web/.env`        | `VITE_MAPTILER_KEY=`     | Optional future MapLibre (does not claim full) |
| `apps/web/.env`        | `VITE_CESIUM_ION_TOKEN=` | Optional; prefer server proxy                  |

See also root `.env.example` and `apps/api/.env.example`.

## UI

`CoverageBadge` over the scene states the active mode. Footprints-only copy applies until photoreal tiles load; `full` adds Google attribution.
