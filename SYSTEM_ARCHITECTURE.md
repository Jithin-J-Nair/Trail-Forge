# TrailForge — System Architecture

## 1. Mission

TrailForge converts natural-language intent into **verified, real-world, location-based experiences** anywhere on Earth. It is a trust layer between AI and geographic truth.

## 2. Core Invariants

1. **Never hallucinate locations.** Every place must resolve to a canonical geographic source record.
2. **AI does not invent facts.** LLMs generate drafts from retrieved evidence; they are not authorities.
3. **Everything is traceable.** Descriptions, claims, recommendations, routes, places, categories, and insights carry provenance.
4. **Routing is deterministic.** Algorithms compute routes; AI only enhances content.
5. **Unknown facts are `NEEDS_REVIEW`.** The system never fabricates missing facts.

## 3. Reference Research (Patterns, Not Clones)

| Project | Patterns Studied | TrailForge Application |
|---|---|---|
| MapLibre GL JS | Vector-tile rendering pipeline, source/layer separation, GeoJSON sources, camera/state control | MapLibre GL for interactive itinerary maps; GeoJSON route/place layers; deterministic camera fitting to verified route bounds |
| OpenStreetMap website | OSM data model, changesets/provenance, public editing discipline, tile/data separation | Canonical OSM IDs, provenance snapshots, license/attribution, separation of source data from derived content |
| PostGIS | Spatial indexing (GIST), geography vs geometry, ST_DWithin/ST_Intersects/ST_Distance, SRID discipline | PostGIS as spatial source of truth; GIST indexes; geography for distance, geometry for rendering |
| OpenTripPlanner | Multi-modal routing graphs, itinerary legs, constraint-based planning, deterministic graph algorithms | Deterministic routing engine with walk/cycle/transit/drive modes; AI excluded from route computation |

## 4. High-Level Architecture

```mermaid
flowchart TB
  subgraph Clients
    Web[Next.js Web]
    Mobile[Mobile Clients]
    APIClients[B2B / White-label API Clients]
  end

  subgraph Edge
    CDN[CloudFront CDN/WAF]
    GW[API Gateway / BFF]
  end

  subgraph Core Services
    Intent[Intent & Orchestration Service]
    Geo[Geospatial Engine]
    Route[Routing Engine]
    AI[AI Orchestration Service]
    Verify[Verification Engine]
    KG[Knowledge Graph Service]
    Export[Export Service]
    Search[Search/Discovery Service]
  end

  subgraph Platform
    Auth[Identity/RBAC]
    Audit[Audit & Compliance]
    Analytics[Analytics]
    Billing[Billing/Quota]
    Admin[Admin/Business Dashboard]
  end

  subgraph Data
    PG[(PostgreSQL + PostGIS)]
    Redis[(Redis)]
    OS[(OpenSearch)]
    S3[(S3/Object Store)]
    Bus[Event Bus: Kafka/SQS]
  end

  subgraph External Sources
    OSM[OSM/Overpass/Nominatim]
    Wiki[Wikipedia/Wikidata]
    OTM[OpenTripMap]
    Gov[Gov/Tourism Open Data]
  end

  Clients --> CDN --> GW
  GW --> Auth
  GW --> Intent
  Intent --> Geo
  Intent --> Route
  Intent --> AI
  Intent --> Verify
  Intent --> KG
  Intent --> Export
  Geo --> OSM
  Geo --> Wiki
  Geo --> OTM
  Geo --> Gov
  Core Services --> PG
  Core Services --> Redis
  Search --> OS
  Export --> S3
  Core Services --> Bus
  Bus --> Audit
  Bus --> Analytics
  Bus --> Search
```

## 5. Bounded Contexts (DDD)

| Context | Owns | Core Rules |
|---|---|---|
| Intent | NL request parsing, constraints, job lifecycle | Extract intent; never invent constraints |
| Geospatial | Canonical places, sources, snapshots, spatial queries | Every place has provenance; PostGIS authoritative |
| Routing | Route plans, legs, optimization, accessibility | Deterministic algorithms only; no AI routing |
| AI Orchestration | Prompts, model routing, drafts, translations | Drafts are untrusted until verified |
| Verification | Claims, evidence, confidence, statuses, audit | Unknown => NEEDS_REVIEW; verified requires evidence |
| Knowledge Graph | Place/theme/city relationships, semantic discovery | Graph edges cite sources/confidence |
| Export | GeoJSON/GPX/KML/PDF/ICS/share artifacts | Exports include verification/provenance metadata |
| Identity/Tenancy | Users, orgs, roles, API keys, white-label config | Multi-tenant isolation, RBAC/ABAC |
| Audit/Compliance | Immutable events, DSAR, provenance logs | Append-only, tamper-evident |

## 6. End-to-End Request Flow

1. **NL Request** received via API/BFF; idempotency key assigned.
2. **Intent extraction** produces structured constraints (area, duration, themes, mode, accessibility). Low-confidence fields marked for clarification/review.
3. **Geospatial discovery** queries PostGIS + external sources (OSM/Overpass/Nominatim/Wikidata/OpenTripMap). Results canonicalized with source IDs.
4. **Relevance scoring** ranks candidates using deterministic signals (distance, theme match, opening hours, popularity proxies, diversity).
5. **Routing engine** computes optimized route using spatial algorithms (nearest-neighbor + 2-opt / graph shortest path / OTP integration for transit). No LLM involved.
6. **AI description** generates multilingual content grounded on retrieved facts only; prompt includes delimited source data and citation requirements.
7. **Verification engine** extracts claims, matches evidence, scores confidence, assigns `VERIFIED`/`PARTIALLY_VERIFIED`/`NEEDS_REVIEW`.
8. **Response assembly** returns itinerary, route geometry, map layers, verification summary, provenance, audit ID.
9. **Export/share** produces artifacts with embedded provenance and verification labels.

## 7. Event-Driven Architecture

- **Bus:** Kafka/MSK for production; SNS/SQS acceptable early; abstraction via publisher interface.
- **Outbox pattern:** domain write + event in same transaction.
- **Key events:** `intent.parsed`, `places.canonicalized`, `route.computed`, `content.drafted`, `claims.verified`, `itinerary.published`, `export.created`, `audit.recorded`.
- **Consumers:** search indexing, analytics, audit, notifications, cache invalidation.
- **Idempotency:** event ID dedupe; consumers safe to retry.

## 8. Multi-Tenancy

- Tenant ID on all tenant-scoped records; row-level isolation + application enforcement.
- White-label config: branding, domain, theme, API quotas, data-source policies.
- Enterprise orgs: RBAC roles, SSO/SAML/OIDC, audit exports.

## 9. Deployment (AWS)

- CloudFront + WAF + Route53 at edge.
- EKS/ECS Fargate for stateless services; managed services for data.
- RDS PostGIS Multi-AZ; ElastiCache Redis; OpenSearch; S3; MSK/SQS.
- Secrets Manager/KMS; OTel -> Prometheus/Grafana/CloudWatch.
- Blue/green or canary deploys; auto-rollback on SLO burn.

## 10. Observability & SLOs

- Traces/metrics/logs correlated by `correlation_id`, `tenant_id`, `itinerary_id`.
- SLOs: availability 99.9%, P95 generation <12s, hallucination escape <0.5%, provenance completeness 100%.
- Trust alerts page on-call: verification failure spike, ungrounded claim escape, source ingestion failure.

## 11. First Working Vertical Slice

**NL Request → Real Geographic Data → Route Generation → AI Description → Verification → Interactive Map → Export**

Implemented in the existing prototype workspaces with real adapters and provenance-aware data flow; production services evolve from this slice by extracting bounded contexts into deployable services.