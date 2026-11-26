# TrailForge — API Specification

## 1. Conventions

- Base: `/v1`
- Format: JSON over HTTPS; OpenAPI 3.1 as source of truth.
- Auth: Bearer JWT (user), API key (B2B), OIDC/SSO for enterprise.
- Idempotency: `Idempotency-Key` on POST generate/export.
- Tracing: `X-Correlation-Id` accepted/returned.
- Errors: RFC 7807 `application/problem+json`.

## 2. Core Endpoints

### Itinerary Generation
- `POST /v1/itineraries/generate` — NL request -> async/sync generation job. Returns itinerary id, status, poll/events URLs.
- `GET /v1/itineraries/{id}` — itinerary + latest version + places + route + verification + provenance.
- `GET /v1/itineraries` — list/filter by status/date/query.
- `POST /v1/itineraries/{id}/regenerate` — new version with constraints.
- `GET /v1/itineraries/{id}/events` — SSE progress (`discovery.completed`, `route.computed`, `content.generated`, `verification.completed`, `itinerary.ready`).
- `DELETE /v1/itineraries/{id}` — soft delete / retention policy.

### Geospatial / Places
- `GET /v1/places/search?q=&lat=&lng=&radius_m=&themes=&category=`
- `GET /v1/places/{id}` — canonical place + sources + snapshots.
- `GET /v1/places/{id}/verification` — freshness/confidence.

### Routing
- `POST /v1/routes/optimize` — deterministic route optimization. Input: place IDs/coords, mode, duration, constraints. Output: geometry, legs, metrics, algorithm metadata.

### Verification
- `POST /v1/verification/claims` — verify claims against source facts (B2B).
- `GET /v1/verification/audits/{id}` — audit/provenance record.

### Exports / Sharing
- `POST /v1/itineraries/{id}/exports` — `pdf|geojson|gpx|kml|ics`.
- `GET /v1/exports/{id}` — status + signed URL.
- `POST /v1/itineraries/{id}/share-links` — scoped share link.

### User / Tenant / Admin
- `GET/PATCH /v1/me`
- `GET /v1/me/usage`
- `POST /v1/api-keys`, `DELETE /v1/api-keys/{id}`
- `GET /v1/admin/audit-events` (admin role)

## 3. Generate Request (canonical)

```json
{
  "query": "4 hour cultural walk in Paris focused on architecture and food",
  "locale": "en",
  "constraints": {
    "duration_minutes": 240,
    "mode": "walk",
    "themes": ["culture", "architecture", "food"],
    "accessibility": { "wheelchair": false },
    "avoid_crowds": false
  },
  "options": { "language": "en", "max_places": 8 }
}
```

## 4. Response Contract (key fields)

```json
{
  "id": "uuid",
  "status": "verified",
  "version": {
    "verification_summary": {
      "overall_status": "VERIFIED",
      "overall_confidence": 0.97,
      "counts": { "verified": 10, "partially_verified": 1, "needs_review": 0 }
    },
    "places": [{
      "place_id": "uuid",
      "name": "...",
      "location": { "lat": 0, "lng": 0 },
      "sources": [{ "type": "osm", "id": "node/...", "url": "..." }],
      "verification_status": "VERIFIED",
      "confidence": 0.99
    }],
    "route": {
      "mode": "walk",
      "distance_meters": 5200,
      "duration_minutes": 210,
      "geometry": { "type": "LineString", "coordinates": [] },
      "optimization_meta": { "algorithm": "nearest_neighbor_2opt", "deterministic": true }
    },
    "claims": [{
      "text": "...",
      "status": "VERIFIED",
      "confidence": 0.98,
      "evidence": [{ "source_type": "osm", "source_id": "node/...", "fact_path": "tags.name" }]
    }]
  }
}
```

## 5. Error Model

```json
{
  "type": "https://docs.trailforge.ai/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "...",
  "correlation_id": "uuid"
}
```

## 6. Security / Limits

- TLS 1.2+, HSTS, strict CORS, request size limits.
- RBAC/ABAC; tenant isolation enforced server-side.
- Rate limits per IP/user/API key/tenant; 429 with `Retry-After`.
- All mutating/verification/export actions audited.