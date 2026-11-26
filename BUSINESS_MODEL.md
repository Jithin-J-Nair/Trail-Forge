# Business Model — TrailForge

## Summary

TrailForge operates a B2C subscription + B2B API/platform business model. B2C proves product love and generates verified-itinerary data; B2B monetizes the verification and geospatial intelligence layer at higher ACVs.

## Revenue Streams

### 1. B2C Subscriptions (Primary, Year 1-2)

| Plan | Price (USD/mo) | Target | Key Limits / Features |
|---|---:|---|---|
| Explorer (Free) | $0 | Trial / casual users | 3 itinerary generations/month, standard routing, public POI sources, TrailForge watermark on exports |
| Traveler | $12 | Frequent travelers | 50 generations/month, multilingual content, offline PDF export, saved itineraries, priority generation queue |
| Voyager | $29 | Power users / creators | Unlimited fair-use generations, advanced constraints (crowd avoidance, accessibility), multi-day trips, GPX/KML/calendar export, version history |
| Team | $79/seat | Travel agencies / small teams | Shared workspace, brand templates, collaboration, admin controls, usage analytics |

**Pricing rationale:** Anchored below human travel-planning time cost ($50-200/trip equivalent) and above generic AI chat subscriptions; value metric is verified itinerary generation + export.

### 2. B2B API & Platform (Primary, Year 2+)

| Offering | Pricing Model | Indicative Price | Buyer |
|---|---|---:|---|
| Verification API | Per verified claim / per request | $0.01–$0.05/claim or $0.20/request | Travel AI products, publishers |
| Itinerary Generation API | Per itinerary + overage | $499/mo base + $2/itinerary | OTAs, hotels, tourism apps |
| Geospatial Intelligence Data | Annual license | $15k–$100k/yr | Tourism boards, DMOs, research |
| White-label Planner | Platform fee + usage | $2k/mo + usage | Hotels, airlines, destination sites |
| Enterprise | Custom contract | $50k–$500k ACV | Large OTAs, travel platforms |

### 3. Marketplace / Affiliate (Secondary, Year 2+)

- **Booking referrals:** Commission on hotels, experiences, tickets (only from verified partners; never influences verification status).
- **Featured verified experiences:** Clearly labeled sponsored placements, separated from organic verified results.
- **Constraint:** Monetization never compromises the verification label. Sponsored content carries explicit disclosure and does not receive a `VERIFIED` badge unless it passes the same engine.

## Unit Economics (Target, Steady State)

| Metric | B2C Traveler | B2B API Mid-Market |
|---|---:|---:|
| ARPU / ACV | $144/yr | $12,000/yr |
| Gross margin target | 75–80% | 80–85% |
| Blended CAC | $35 (organic-led) | $4,000 (sales-assisted) |
| Payback | <3 months | <6 months |
| Net revenue retention (B2B) | — | 115%+ |

### Cost Drivers

- **LLM inference:** 30–45% of COGS at early scale; reduced via caching, prompt compression, model routing (cheap model for extraction, premium for narrative), and response reuse.
- **Geospatial data & infra:** 15–25% of COGS; OSM is free but requires ingestion/hosting; licensed POI/commercial map data adds variable cost.
- **Compute & storage:** 15–20%; PostGIS/Redis/queue workers scale with generation volume.
- **Verification compute:** 10–15%; rule-based checks are cheap, semantic matching uses embeddings/small models.

## Go-to-Market

### Phase A — Wedge (Months 0–6): Japan Inbound Travelers
- **Why Japan:** dense POI data in OSM, high inbound demand, multilingual need, clear walking-tour use cases (Asakusa, Akihabara, Kyoto).
- **Channels:** SEO ("Akihabara anime walking route", "Asakusa 2 hour itinerary"), travel creator partnerships, Reddit/Discord travel communities, Product Hunt launch.
- **Hook:** "AI itinerary you can actually trust — every place verified."

### Phase B — Expand (Months 6–12): 5 Destination Cities
- Tokyo, Kyoto, Osaka, Seoul, Taipei. Same product, localized content and data pipelines.
- Add B2B pilot with 2–3 boutique hotels/DMOs.

### Phase C — Platform (Months 12–24): Verification API
- Expose verification engine as standalone API.
- Target travel AI startups, publishers, and OTA innovation teams.
- Enterprise compliance features (audit exports, SLA, private deployment option).

## Competitive Moat

1. **Verification dataset:** Every verified/rejected claim builds a proprietary labeled dataset for improving verification accuracy.
2. **Provenance graph:** Linked entity graph connecting user intent, generated claims, source facts, and audit outcomes.
3. **Geo+AI integration depth:** Deterministic spatial engine + LLM orchestration + verification is harder to replicate than a wrapper.
4. **Trust brand:** "Verified by TrailForge" becomes a quality signal, similar to security/compliance badges.
5. **Workflow lock-in (B2B):** API integrations, audit logs, and custom taxonomies create switching costs.

## Financial Assumptions (3-Year Directional)

| Year | B2C MRR (Exit) | B2B ARR (Exit) | Gross Margin | Notes |
|---:|---:|---:|---:|---|
| Y1 | $40k | $100k | 65% | Wedge market, heavy infra/LLM investment |
| Y2 | $180k | $900k | 72% | Multi-city, B2B pilots convert |
| Y3 | $450k | $3.5M | 78% | Platform/API traction, verification moat |

*Directional, not a forecast. Assumes seed funding and disciplined CAC.*

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| LLM cost compression slower than expected | Margin pressure | Model routing, aggressive caching, small-model verification, prompt distillation |
| OSM data gaps in target markets | Verification failures | Multi-source ingestion (licensed POI, government open data), confidence labeling |
| Generic AI assistants improve travel output | Commoditization | Verification/provenance moat; B2B auditability; deterministic routing |
| Trust incident (hallucinated location shipped) | Brand damage | Hard verification gates, "NEEDS_REVIEW" suppression, incident response, public audit log |
| Slow B2B sales cycle | Revenue timing | B2C self-serve revenue base; product-led API trial |
