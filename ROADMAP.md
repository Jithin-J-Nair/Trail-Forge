# TrailForge Roadmap

## Planning Horizon

18-month roadmap from foundation to platform scale. Dates are relative to program start (T0).

## Guiding Priorities

1. **Trust before breadth** — verification correctness and provenance completeness before feature expansion.
2. **Wedge before platform** — win Japan inbound walking-tour use case before broad global expansion.
3. **Operational excellence** — observability, SLOs, and incident response from day one.

## Phase 0 — Foundation (T0–T+6 weeks)

**Goal:** Production-ready repository, architecture, and delivery baseline.

- [ ] Finalize DDD boundaries, API contracts, event schemas.
- [ ] Set up monorepo structure, CI, lint/type/test gates, secret scanning.
- [ ] Provision baseline AWS infra via Terraform (dev/staging).
- [ ] Implement auth, RBAC skeleton, audit event plumbing.
- [ ] Establish PostGIS schema, migrations, seed/place ingestion scaffold.
- [ ] Define OTel standards, dashboards, SLOs, alert rules.

**Exit criteria:** CI green; staging deployable; core schemas versioned; observability baseline live.

## Phase 1 — MVP Wedge: Verified Walking Tours, Japan (T+6–T+16 weeks)

**Goal:** Ship trustworthy NL-to-itinerary for Tokyo/Kyoto/Osaka walking use cases.

- [ ] Geospatial ingestion: OSM/Overpass connector, Nominatim geocoding, place canonicalization.
- [ ] PostGIS spatial search and candidate ranking.
- [ ] Deterministic route optimizer (walk mode, duration constraints).
- [ ] AI orchestration: prompt templates, provider abstraction, GPT/Claude/Gemini adapters (at least 2 live).
- [ ] Verification engine v1: claim extraction, rule-based fact matching, confidence scoring, statuses.
- [ ] Next.js web app: landing, auth, generator, interactive map (MapLibre), itinerary detail, export.
- [ ] Audit trail for every generation.
- [ ] Rate limiting, quotas, abuse protection.

**Exit criteria:** >95% verification pass on golden set; P95 generation <12s; first 100 beta users.

## Phase 2 — Product Hardening & B2C Launch (T+16–T+28 weeks)

**Goal:** Public B2C launch with paid plans.

- [ ] Multilingual generation/translation (EN/JA/KO/ZH-TW initial).
- [ ] Saved itineraries, version history, sharing links.
- [ ] Export center: PDF, GeoJSON, GPX, KML, ICS.
- [ ] User profiles, preferences, accessibility constraints.
- [ ] Billing (Stripe), plan quotas, usage metering.
- [ ] Verification engine v2: semantic matcher, improved evidence UI, "needs review" workflow.
- [ ] Caching strategy: place snapshots, route cache, prompt/result cache.
- [ ] SEO landing pages for city/theme combinations.

**Exit criteria:** Public launch; <0.5% hallucination escape rate; W4 retention >20%.

## Phase 3 — B2B Pilot & Platform API (T+28–T+40 weeks)

**Goal:** Validate B2B demand and expose verification/generation APIs.

- [ ] Public B2B API: generate, verify, places, exports; API keys and scopes.
- [ ] Team/workspace features, brand templates, collaboration.
- [ ] White-label embed option for hotels/DMOs.
- [ ] Webhooks and async job events.
- [ ] Enterprise audit export, SLA dashboards, support tooling.
- [ ] Data pipeline for verification feedback labeling.

**Exit criteria:** 3+ paid pilots; API integration <3 days; pilot-to-contract >40%.

## Phase 4 — Scale & Intelligence (T+40–T+60 weeks)

**Goal:** Scale to 1M+ users and deepen moat.

- [ ] Multi-region read strategy, CDN optimization, global tile strategy.
- [ ] Event streaming (Kafka/MSK) at full production; analytics lakehouse feed.
- [ ] Advanced routing: transit/mixed mode, opening-hours-aware scheduling, crowd heuristics.
- [ ] Verification engine v3: learned matcher calibrated on labeled dataset, active learning loop.
- [ ] Personalization/ranking based on user prefs and verified outcomes.
- [ ] SOC 2 Type I readiness, enterprise security review package.

**Exit criteria:** 1M registered users capacity validated; 99.9% availability; B2B ARR growth on track.

## Phase 5 — Platform Expansion (T+60–T+78 weeks)

**Goal:** Establish TrailForge as verification infrastructure for geo-AI.

- [ ] Verification API as standalone product.
- [ ] Marketplace/partner integrations with strict verification labeling.
- [ ] Additional markets beyond initial 5 cities.
- [ ] Data residency / EU deployment option.
- [ ] SOC 2 Type II, continuous compliance automation.

## Key Metrics by Phase

| Phase | Primary Metric | Target |
|---|---|---:|
| 0 | CI/CD success, staging readiness | 100% green deploys |
| 1 | Verification pass rate (golden set) | >95% |
| 2 | Hallucination escape rate | <0.5% |
| 2 | W4 retention | >20% |
| 3 | Pilot-to-contract conversion | >40% |
| 4 | Availability / P95 generation | 99.9% / <12s |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Verification quality insufficient in new domains | Golden sets per city/theme, human review loop, conservative NEEDS_REVIEW gating |
| LLM cost spikes | Model routing, caching, smaller models for extraction, token budgets |
| OSM data gaps | Multi-source ingestion, freshness checks, explicit uncertainty labels |
| Over-building microservices early | Start with modular monolith boundaries / few services, split on clear scaling seams |
| Trust incident | Kill switches, audit trail, incident playbook, transparent status labeling |
