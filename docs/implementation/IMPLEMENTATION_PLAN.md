# TrailForge Implementation Plan

## Objective

Deliver TrailForge as a production-ready SaaS platform that converts natural-language travel requests into verified, source-grounded itineraries.

## Delivery Principles

- **Verification-first:** no unverifiable location claim is presented as verified.
- **Deterministic spatial core:** routing and spatial filtering are computed, not hallucinated.
- **Thin vertical slices:** ship end-to-end verified flows before broad feature expansion.
- **Production from day one:** observability, security, CI/CD, and auditability are not phase-2 add-ons.

## Workstreams

| Workstream | Scope | Key Outputs |
|---|---|---|
| Platform Foundation | Monorepo, CI/CD, IaC, environments, secrets, observability | CI, Terraform, OTel dashboards, runbooks |
| Geospatial Engine | OSM ingestion, Overpass/Nominatim connectors, canonical places, PostGIS | `places`, spatial indexes, ingestion jobs |
| Routing Engine | Deterministic route optimizer, constraints, travel-time model | route plans/legs, optimizer service |
| AI Orchestration | Provider abstraction, prompt templates, model routing, grounding | `@trailforge/ai-core`, generation pipelines |
| Verification Engine | Claim extraction, fact matching, confidence scoring, audit trail | `@trailforge/domain` verification, verification service |
| Web Experience | Next.js app, MapLibre map, generator UX, itinerary review/export | web app, design system, map UI |
| Security & Compliance | AuthN/AuthZ, rate limits, audit logs, GDPR, secrets | auth, RBAC, DSAR flows, audit events |
| B2B API | API keys, scopes, verification API, SLAs | public API, docs, metering |

## Milestone Plan

### M0 — Foundation (Weeks 1-6)
- Repo structure, package boundaries, lint/type/test/build CI.
- Terraform baseline: network, RDS PostGIS, Redis, S3.
- Auth scaffold, RBAC model, audit event schema.
- PostGIS schema and migrations.
- OTel/Prometheus/Grafana baseline.

**Acceptance:** staging environment deployable; CI gates enforced.

### M1 — Verified MVP (Weeks 7-16)
- OSM ingestion for Tokyo/Kyoto/Osaka.
- Spatial search and place canonicalization.
- Walk-route optimizer with duration constraints.
- AI orchestration with grounded prompts and provider fallback.
- Verification engine v1 with rule-based matching.
- Next.js generator + map + itinerary detail.
- Audit trail and verification status UI.

**Acceptance:** golden-set verification pass >95%; P95 generation <12s.

### M2 — B2C Launch (Weeks 17-28)
- Multilingual output, saved itineraries, exports.
- Billing, quotas, profile/preferences.
- Verification v2 semantic matching and evidence UI.
- SEO/city landing pages, analytics instrumentation.

**Acceptance:** public launch; hallucination escape <0.5%.

### M3 — B2B Platform (Weeks 29-40)
- Public verification/generation APIs, API keys, scopes.
- Team workspaces, webhooks, audit exports.
- Pilot onboarding and SLA monitoring.

**Acceptance:** 3 paid pilots; <3-day integration.

## Team Topology (Suggested)

- **Platform/Infra:** Terraform, CI/CD, observability, security.
- **Geo/Routing:** PostGIS, ingestion, spatial/routing algorithms.
- **AI/Verification:** model routing, prompts, claim verification, evaluation.
- **Product/Web:** Next.js UX, MapLibre, design system, exports.
- **Data/Compliance:** audit, analytics, GDPR, data governance.

## Quality Gates

- TypeScript strict mode; no `any` in domain core without justification.
- Unit tests for domain/verification/routing logic.
- Integration tests for API contracts and DB queries.
- Golden-set evaluation for verification accuracy by city/theme.
- Security scans (SAST/SCA/secret/container) in CI.
- SLO dashboards and alerts before production launch.

## Risk Controls

- Feature flags for generation/verification rollouts.
- Kill switch for verification pipeline failures.
- Conservative fallback: `NEEDS_REVIEW` rather than unverified certainty.
- Provider fallback for LLM outages.
- Backups, PITR, and restore drills.
