# API Specification — TrailForge

## 1. API Principles

- **REST + JSON** over HTTPS. OpenAPI 3.1 source of truth.
- **Versioned:** `/v1` prefix. Additive changes within major version.
- **Authenticated:** Bearer JWT (user/session) or API key (B2B). Public endpoints explicitly marked.
- **Idempotent writes:** `Idempotency-Key` supported on generation/export endpoints.
- **Traceable:** Every response includes `X-Correlation-Id`; clients may supply it.
- **Errors:** RFC 7807 Problem Details (`application/problem+json`).

## 2. Authentication

| Method | Use | Header |
|---|---|---|
| Bearer JWT | Web/mobile user sessions | `Authorization: Bearer <jwt>` |
| API Key | B2B server-to-server | `Authorization: Bearer tf_live_...` or `X-API-Key` |
| OAuth 2.0 / OIDC | Enterprise SSO | Standard OIDC flows |

## 3. Common Conventions

### Pagination
Cursor-based: `?limit=20&cursor=...` → response includes `next_cursor`.

### Error Format
```json
{
  "type": "https://docs.trailforge.ai/errors/validation",
  "title": "Validation Error",
  "status": 400,
  "detail": "duration_minutes must be between 15 and 1440",
  "instance": "/v1/itineraries/generate",
  "correlation_id": "..."
}
```

### Verification Status Enum
`VERIFIED | PARTIALLY_VERIFIED | NEEDS_REVIEW`

## 4. Core Endpoints

### 4.1 Itineraries

#### `POST /v1/itineraries/generate`
Generate a verified itinerary from natural language.

**Request**
```json
{
  "query": "2-hour cultural walk in Asakusa",
  "locale": "en",
  "constraints": {
    "duration_minutes": 120,
    "mode": "walk",
    "themes": ["culture", "history"],
    "avoid_crowds": false,
    "accessibility": { "wheelchair": false },
    "start_location": { "lat": 35.7148, "lng": 139.7967 },
    "start_time": "2026-11-27T10:00:00+09:00"
  },
  "options": {
    "language": "en",
    "include_alternatives": false,
    "max_places": 6
  }
}
```

**Response 202**
```json
{
  "itinerary_id": "uuid",
  "status": "generating",
  "poll_url": "/v1/itineraries/{id}",
  "events_url": "/v1/itineraries/{id}/events"
}
```

**Notes:** Long-running generation returns 202; client polls or subscribes to SSE. Sync mode (`Prefer: respond-sync`) available for short requests with timeout.

#### `GET /v1/itineraries/{id}`
Returns itinerary with latest verified version, route, places, verification summary, and provenance links.

**Response 200 (shape)**
```json
{
  "id": "uuid",
  "status": "verified",
  "request": { "query": "...", "constraints": {} },
  "version": {
    "version": 1,
    "title": "2-Hour Cultural Walk in Asakusa",
    "summary": "...",
    "language": "en",
    "verification_summary": {
      "overall_status": "VERIFIED",
      "overall_confidence": 0.96,
      "counts": { "verified": 12, "partially_verified": 1, "needs_review": 0 }
    },
    "places": [
      {
        "place_id": "uuid",
        "sequence": 1,
        "name": "Senso-ji",
        "source": { "type": "osm", "id": "node/123", "url": "..." },
        "location": { "lat": 35.7148, "lng": 139.7967 },
        "stay_minutes": 25,
        "verification_status": "VERIFIED",
        "confidence": 0.99
      }
    ],
    "route": {
      "mode": "walk",
      "distance_meters": 3200,
      "duration_minutes": 45,
      "geometry": { "type": "LineString", "coordinates": [] },
      "legs": []
    },
    "claims": [
      {
        "id": "uuid",
        "text": "Senso-ji is a Buddhist temple in Asakusa.",
        "status": "VERIFIED",
        "confidence": 0.99,
        "evidence": [{ "source_type": "osm", "source_id": "node/123", "fact_path": "tags.historic" }]
      }
    ]
  }
}
```

#### `GET /v1/itineraries`
List user itineraries. Filters: `status`, `created_after`, `created_before`, `q`.

#### `POST /v1/itineraries/{id}/regenerate`
Create a new version with modified constraints. Idempotent with key.

#### `DELETE /v1/itineraries/{id}`
Soft-delete; schedules PII/content retention per policy.

### 4.2 Places / Geospatial

#### `GET /v1/places/search`
Spatial/text search over canonical places.
Query params: `q`, `lat`, `lng`, `radius_m`, `category`, `themes`, `limit`, `cursor`.

#### `GET /v1/places/{id}`
Canonical place with provenance, tags, geometry, snapshots.

#### `GET /v1/places/{id}/verification`
Verification/freshness metadata for a place.

### 4.3 Routing

#### `POST /v1/routes/optimize`
Deterministic route optimization (internal/B2B).

```json
{
  "place_ids": ["uuid1", "uuid2"],
  "mode": "walk",
  "duration_minutes": 120,
  "start": { "lat": 35.7, "lng": 139.7 },
  "constraints": { "avoid_stairs": false }
}
```

### 4.4 Verification

#### `POST /v1/verification/claims`
Verify claims against provided or resolved source facts (B2B API).

**Request**
```json
{
  "claims": [
    { "text": "Senso-ji is in Asakusa, Tokyo.", "place_ref": { "source": "osm", "id": "node/123" } }
  ],
  "options": { "strict": true }
}
```

**Response**
```json
{
  "results": [
    {
      "claim": "...",
      "status": "VERIFIED",
      "confidence": 0.98,
      "evidence": [],
      "audit_id": "uuid"
    }
  ]
}
```

### 4.5 Exports

#### `POST /v1/itineraries/{id}/exports`
Create export artifact. Body: `{ "format": "pdf" | "geojson" | "gpx" | "kml" | "ics" }`

#### `GET /v1/exports/{id}`
Export status + signed download URL.

### 4.6 User / Profile

- `GET /v1/me` — current user profile.
- `PATCH /v1/me` — update preferences/locale.
- `GET /v1/me/usage` — quota/usage.

### 4.7 Health / Ops

- `GET /health/live` — liveness.
- `GET /health/ready` — readiness (DB, Redis, critical deps).
- `GET /metrics` — Prometheus (internal/authenticated).

## 5. SSE / Progress Events

`GET /v1/itineraries/{id}/events` (text/event-stream)

Events:
- `status` — state change
- `discovery.completed` — places found
- `route.computed`
- `content.generated`
- `verification.completed`
- `itinerary.ready`
- `error`

## 6. Rate Limits (Default)

| Tier | Generate | Read | Verification API |
|---|---:|---:|---:|
| Free | 3/day | 60/min | N/A |
| Traveler | 50/month | 120/min | N/A |
| Voyager | 500/month fair use | 300/min | N/A |
| B2B | Contract | Contract | Contract |

429 responses include `Retry-After` and rate limit headers.

## 7. Security Controls

- TLS 1.2+ only; HSTS.
- JWT signature validation (RS256/ES256), short-lived access tokens, refresh token rotation.
- API keys hashed at rest, scoped, expirable, revocable.
- Request body size limits; strict schema validation (Zod/class-validator).
- WAF rules, bot protection, per-user and per-IP rate limits.
- Audit log on all mutating and verification actions.
