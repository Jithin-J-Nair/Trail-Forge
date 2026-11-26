# TrailForge — Database Architecture

## 1. Primary Stores

| Store | Role | Data |
|---|---|---|
| PostgreSQL + PostGIS | System of record | users, tenants, places, itineraries, routes, claims, verification, audit |
| Redis | Low-latency ephemeral/cache | sessions/cache, rate limits, idempotency keys, job progress, dedupe |
| OpenSearch | Search index | place/itinerary full-text + semantic discovery facets |
| S3 | Object storage | exports, snapshots, raw payload archives, audit exports |

## 2. PostgreSQL + PostGIS Design

### 2.1 Extensions
`postgis`, `pgcrypto`, `citext`, `pg_trgm`, optionally `vector` (pgvector) for semantic embeddings.

### 2.2 Key Tables

#### Tenancy & Identity
- `tenants(id, name, plan, white_label_config, created_at)`
- `users(id, tenant_id, email, status, auth_provider, created_at)`
- `memberships(user_id, tenant_id, role, scopes)`
- `api_keys(id, tenant_id, hash, scopes, expires_at, revoked_at)`

#### Geospatial
- `places(id, tenant_id nullable, canonical_source, canonical_source_id, name, name_local, category, tags jsonb, location geography(Point,4326), geometry geometry(Geometry,4326), confidence numeric, last_verified_at, created_at)`
- `place_sources(id, place_id, source_type, source_id, source_url, license, raw_payload_ref, fetched_at)`
- `place_snapshots(id, place_id, snapshot_hash, facts jsonb, valid_from, valid_to)`

#### Itinerary / Routing
- `itineraries(id, tenant_id, user_id, status, request_text, request_locale, constraints jsonb, center geography(Point,4326), created_at)`
- `itinerary_versions(id, itinerary_id, version, status, title, summary, language, content jsonb, verification_summary jsonb, audit_id, created_at)`
- `itinerary_places(itinerary_version_id, place_id, sequence_order, stay_minutes, role)`
- `route_plans(id, itinerary_version_id, mode, geometry geometry(LineString,4326), distance_meters int, duration_minutes int, optimization_meta jsonb)`
- `route_legs(id, route_plan_id, leg_order, from_place_id, to_place_id, geometry geometry(LineString,4326), distance_meters int, duration_minutes int)`

#### AI / Verification / Audit
- `model_runs(id, itinerary_id, provider, model, purpose, prompt_version, input_hash, output_hash, token_usage jsonb, latency_ms, created_at)`
- `claims(id, itinerary_version_id, place_id, claim_type, text, source_span jsonb, extracted_by, created_at)`
- `verification_results(id, claim_id unique, status, confidence numeric, reason, matcher, verified_at)`
- `verification_evidence(id, verification_result_id, source_type, source_id, fact_path, expected jsonb, observed jsonb, weight numeric)`
- `audit_events(id, tenant_id, actor_type, actor_id, action, entity_type, entity_id, correlation_id, payload jsonb, created_at)` — append-only.

#### Reliability / Billing
- `event_outbox(id, event_type, payload jsonb, status, created_at, published_at)`
- `event_inbox(event_id, consumer, processed_at)` for idempotent consumers.
- `subscriptions`, `usage_records` for quotas/billing.

## 3. Spatial & Query Design

- **GIST** on `places.location`, `places.geometry`, `route_plans.geometry`, `route_legs.geometry`.
- **GIN** on `places.tags`, JSONB metadata where needed.
- **B-tree** on tenant/user/status/created_at/fk columns.
- **pg_trgm / FTS** for place name search; OpenSearch for richer discovery.
- Typical queries:
  - discovery: `ST_DWithin(location, ST_MakePoint($lng,$lat)::geography, $radius)`
  - bbox: `geometry && ST_MakeEnvelope(...)`
  - route persistence: LineString geometry with SRID 4326.

## 4. Provenance & Versioning

- Places are canonicalized by `(canonical_source, canonical_source_id)`.
- `place_snapshots` preserve fact sets used for verification reproducibility.
- `itinerary_versions` are immutable; new generation = new version.
- `audit_events` are append-only; no in-place mutation.

## 5. Scaling & Performance

- Read replicas for heavy read/search support endpoints.
- Partition `audit_events`, `event_outbox`, `model_runs` by time.
- Materialized views for hot city/theme discovery.
- Redis cache for geocode, place search, route results, idempotency.
- Connection pooling (PgBouncer), statement timeouts, slow-query monitoring.

## 6. Backup, DR, Compliance

- RDS Multi-AZ, automated backups, PITR.
- Cross-region backup copy for prod; quarterly restore drills.
- RPO <15 min, RTO <1 hr (prod target).
- PII encrypted at rest; field-level minimization; retention policies by data class.
- GDPR DSAR: export/delete workflows with audit trail.