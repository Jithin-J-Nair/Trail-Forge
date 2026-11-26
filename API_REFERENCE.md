# API Reference — TrailForge

Detailed spec: [`docs/architecture/API_SPEC.md`](docs/architecture/API_SPEC.md).

## Base URLs

| Environment | Base URL |
|---|---|
| Local | `http://localhost:3001/v1` |
| Staging | `https://api-staging.trailforge.ai/v1` |
| Production | `https://api.trailforge.ai/v1` |

## Authentication

```http
Authorization: Bearer <jwt_or_api_key>
X-Correlation-Id: <uuid>   # optional
Idempotency-Key: <string>  # required for generate/export in B2B flows
```

## Core Resources

### Itineraries

| Method | Path | Description |
|---|---|---|
| POST | `/itineraries/generate` | Generate a verified itinerary from natural language |
| GET | `/itineraries/{id}` | Get itinerary, latest version, verification, provenance |
| GET | `/itineraries` | List itineraries |
| POST | `/itineraries/{id}/regenerate` | Create new version with updated constraints |
| GET | `/itineraries/{id}/events` | SSE progress events |
| DELETE | `/itineraries/{id}` | Soft delete |

### Places

| Method | Path | Description |
|---|---|---|
| GET | `/places/search` | Search canonical places by text/geo/theme |
| GET | `/places/{id}` | Place details + provenance |
| GET | `/places/{id}/verification` | Freshness/verification metadata |

### Routing

| Method | Path | Description |
|---|---|---|
| POST | `/routes/optimize` | Deterministic route optimization |

### Verification (B2B)

| Method | Path | Description |
|---|---|---|
| POST | `/verification/claims` | Verify claims against source facts |
| GET | `/verification/audits/{id}` | Retrieve audit record |

### Exports

| Method | Path | Description |
|---|---|---|
| POST | `/itineraries/{id}/exports` | Create export (`pdf`,`geojson`,`gpx`,`kml`,`ics`) |
| GET | `/exports/{id}` | Export status + signed download URL |

## Example: Generate Itinerary

```bash
curl -X POST https://api.trailforge.ai/v1/itineraries/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "2-hour cultural walk in Asakusa",
    "locale": "en",
    "constraints": { "duration_minutes": 120, "mode": "walk", "themes": ["culture"] }
  }'
```

## Verification Object

```json
{
  "status": "VERIFIED",
  "confidence": 0.98,
  "evidence": [
    {
      "source_type": "osm",
      "source_id": "node/123",
      "fact_path": "tags.name",
      "observed": "Senso-ji"
    }
  ],
  "audit_id": "uuid"
}
```

Status values:
- `VERIFIED` — claim matches source evidence with high confidence.
- `PARTIALLY_VERIFIED` — some evidence matches; caveats remain.
- `NEEDS_REVIEW` — insufficient or conflicting evidence; do not present as factual certainty.

## Errors

RFC 7807 Problem Details:

```json
{
  "type": "https://docs.trailforge.ai/errors/rate-limit",
  "title": "Rate Limit Exceeded",
  "status": 429,
  "detail": "Generation quota exceeded",
  "correlation_id": "..."
}
```

## Rate Limits

Rate limits vary by plan. Responses include standard rate-limit headers and `Retry-After` on 429.
