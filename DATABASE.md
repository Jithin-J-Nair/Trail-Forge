# TrailForge Database

Detailed schema: [`docs/architecture/DATA_MODEL.md`](docs/architecture/DATA_MODEL.md).

## Database Strategy

TrailForge uses **PostgreSQL + PostGIS** as the primary system of record, with **Redis** for caching, rate limiting, ephemeral job state, and idempotency/dedupe support.

## Why PostgreSQL + PostGIS

- **Spatial correctness:** native geometry/geography types, distance/intersection/containment queries.
- **Transactional integrity:** itinerary generation, verification records, and audit pointers need ACID guarantees.
- **Operational maturity:** backups, PITR, replication, extensions, tooling.
- **Extensibility:** PostGIS, pg_trgm/full-text, JSONB for flexible metadata.

## Core Data Domains

| Domain | Key Tables | Notes |
|---|---|---|
| Identity | `users`, `user_profiles`, `api_keys` | PII isolated, keys hashed |
| Geospatial | `places`, `place_sources`, `place_snapshots` | Canonical place + provenance + versioned facts |
| Itineraries | `itineraries`, `itinerary_versions`, `itinerary_places` | Versioned, immutable-ish outputs |
| Routing | `route_plans`, `route_legs` | Deterministic geometry and leg metadata |
| AI/Verification | `model_runs`, `claims`, `verification_results`, `verification_evidence` | Full auditability |
| Audit/Compliance | `audit_events` | Append-only |
| Billing | `subscriptions`, `usage_records` | Quotas and metering |
| Async reliability | `event_outbox`, `event_inbox` | Outbox/inbox pattern |

## Spatial Design

- `places.location`: `geography(Point,4326)` with GIST index.
- `places.geometry`: `geometry(Geometry,4326)` for polygons/lines.
- `route_plans.geometry` / `route_legs.geometry`: `geometry(LineString,4326)`.
- Common queries: `ST_DWithin`, `ST_Intersects`, `ST_Distance`, bounding-box prefilters.

## Indexing Guidelines

- GIST on all spatial columns used in filters/joins.
- B-tree on foreign keys, status, created_at, user_id.
- GIN for JSONB tags/metadata where queried.
- Partial indexes for hot statuses (`status IN ('generating','pending')`).
- Composite indexes aligned to access patterns (e.g., `user_id, created_at desc`).

## Data Integrity Rules

- No itinerary place without a canonical `place_id`.
- No verified claim without evidence rows or rule-based evidence reference.
- Verification status enum constrained at DB/application layer.
- Audit events append-only (no updates/deletes in normal operation).
- Outbox writes in same transaction as domain state change.

## Scaling Strategy

- **Vertical first**, then read replicas for read-heavy endpoints.
- **Partitioning** for large append-only tables (`audit_events`, `event_outbox`, `model_runs`) by time.
- **Caching**: Redis for hot place lookups, geocode results, route responses, idempotency keys.
- **Materialized views** for popular discovery areas/themes; refresh asynchronously.
- **Archival**: cold storage for old audit/raw payloads per retention policy.

## Backup & Recovery

- Automated daily snapshots + PITR.
- Cross-region backup copy in prod.
- Quarterly restore drills.
- RPO target: <15 min (prod). RTO target: <1 hr (prod).
