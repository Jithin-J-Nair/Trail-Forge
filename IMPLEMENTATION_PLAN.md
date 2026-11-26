# TrailForge — Implementation Plan

## 1. Execution Strategy

Build in **thin vertical slices**. Finish one working end-to-end slice before expanding. Every slice must preserve the trust invariants: real source data, deterministic routing, AI draft only, verification gate, provenance/audit.

## 2. First Working Slice (Mandatory)

**Natural Language Request → Real Geographic Data → Route Generation → AI Description → Verification → Interactive Map → Export**

### Slice Scope
- Input: NL query + theme/duration/radius.
- Geospatial: geocode + OSM/Overpass fetch (real adapters) with provenance; snapshot fallback clearly labeled with source metadata.
- Routing: deterministic nearest-neighbor + 2-opt, duration budget.
- AI description: provider abstraction; grounded prompt; mock/local provider allowed only for dev when no key configured, but grounding/verification still enforced.
- Verification: claim extraction/grounding, `VERIFIED`/`NEEDS_REVIEW` statuses, evidence/issues.
- Map: interactive MapLibre/scene view with route and places.
- Export: GeoJSON and CSV with provenance/verification fields.

### Acceptance Criteria
- Real OSM IDs/coords/tags visible in output.
- Route computed by algorithm, metadata present.
- Every content claim has status and evidence/issues.
- Unknown/ungrounded claims marked `NEEDS_REVIEW`.
- Export contains provenance and verification status.
- End-to-end flow runs locally.

## 3. Phase Plan

| Phase | Duration | Outcome | Key Work |
|---|---:|---|---|
| P0 Foundation | 2-4 wks | CI/CD, IaC, schema, observability | monorepo, Terraform, PostGIS, OTel, auth scaffold |
| P1 Vertical Slice | 4-6 wks | Working verified itinerary flow | geo adapters, deterministic route, grounding, map, export |
| P2 Product Hardening | 6-8 wks | B2C-ready | multilingual, saved itineraries, profiles, billing, exports, SEO |
| P3 Platform/API | 6-8 wks | B2B-ready | public API, keys/scopes, webhooks, audit exports, white-label |
| P4 Scale/Intelligence | 8-12 wks | 1M-user readiness | OpenSearch, Kafka, transit routing, KG, semantic search, canary, DR |
| P5 Enterprise/Global | ongoing | enterprise | SSO/SCIM, data residency, SOC2, marketplace integrations |

## 4. Workstream Breakdown

- **Geospatial:** Overpass/Nominatim connectors, canonicalization, PostGIS ingestion, snapshots, freshness.
- **Routing:** walk/cycle/transit/drive, constraints, OTP integration, deterministic metadata.
- **AI:** model router, prompt templates, grounding context, evals, cost controls.
- **Verification:** claim extraction, rule+semantic matcher, confidence calibration, audit trail.
- **Web:** Next.js app, MapLibre layers, verification UI, export/share, accessibility.
- **Platform:** auth/RBAC, tenancy, billing, quotas, admin, audit/compliance.
- **DevOps:** Terraform, CI/CD, observability, runbooks, DR.

## 5. Quality Gates

- TS strict, lint, tests, build green in CI.
- Verification golden sets per city/theme; hallucination escape <0.5%.
- Security scans: SCA/SAST/secrets/container/IaC.
- Performance: P95 generation <12s, route <1.5s, verification <2s.
- Provenance completeness 100% for verified claims.

## 6. Risks

| Risk | Mitigation |
|---|---|
| OSM data quality/gaps | multi-source ingestion, freshness checks, NEEDS_REVIEW |
| LLM hallucination | grounding, verification gate, kill switch, evals |
| Routing complexity | deterministic core first; OTP integration phased |
| Cost growth | caching, model routing, quotas, batch/async |
| Scope creep | vertical-slice discipline, phase exit criteria |