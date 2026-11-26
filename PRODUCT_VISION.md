# Product Vision — TrailForge

## Vision Statement

TrailForge is the trusted AI-powered geospatial intelligence platform that turns natural-language travel intent into verified, real-world experiences. We make generative travel planning reliable by grounding every place, claim, route, and recommendation in authoritative geographic data.

## The Problem

Travel planning is broken in two opposite ways:

1. **Traditional tools** (maps, listicles, OTAs) are factual but fragmented. Users stitch together Google Maps, blogs, reviews, and spreadsheets to build a single day plan.
2. **Generative AI tools** are fluid but untrustworthy. They hallucinate places, invent hours, misplace landmarks, and produce plausible-sounding itineraries that fail in the real world.

The cost of a hallucinated location is not a bad answer — it is a wasted afternoon in a foreign city, a missed reservation, or a broken trust relationship with the product.

## The Insight

The missing layer is not a better LLM and not a better map. It is a **verification layer between generative AI and geographic knowledge**. TrailForge occupies that layer.

> **Core principle: Never hallucinate locations.** Every place, route, description, and recommendation must be traceable to real-world source data.

## Product Definition

TrailForge converts requests like:

- "2-hour cultural walk in Asakusa"
- "Anime day trip in Akihabara"
- "Photography route in Kyoto avoiding crowds"

into:

- **Discovered real locations** sourced from OpenStreetMap, curated POI datasets, and licensed geographic providers.
- **Optimized routes** computed by deterministic spatial algorithms (not LLM guesses).
- **Multilingual content** generated with source-grounded prompts and citation requirements.
- **Verified claims** scored by a claim-verification engine against geographic facts.
- **Trustworthy itineraries** exportable to maps, calendars, and travel companions.

## Target Outcomes

| Outcome | User Value | Business Value |
|---|---|---|
| Verified itineraries | Confidence to follow the plan in the real world | Trust, retention, word-of-mouth |
| Natural-language planning | No manual research or map stitching | Lower activation friction, higher conversion |
| Multilingual grounded content | Accessible travel for global users | International TAM expansion |
| Auditable AI outputs | Transparency on what is known vs. inferred | Enterprise/compliance readiness, defensibility |
| Route optimization | Time-efficient, realistic plans | Differentiation vs. generic chatbots |

## Product Pillars

### 1. Ground Truth First
All geographic entities resolve to canonical source records (OSM ID, coordinates, geometry, tags, provenance). No entity without provenance enters a user-facing itinerary.

### 2. AI as Narrator, Not Authority
LLMs generate descriptions, translations, and summaries — never coordinates, existence claims, or route geometry. AI output is a draft until verified.

### 3. Verification by Design
Every generated claim is extracted, matched against source facts, scored, and labeled `VERIFIED`, `PARTIALLY_VERIFIED`, or `NEEDS_REVIEW`. Audit trails are first-class data.

### 4. Composable Geospatial Intelligence
Discovery, routing, content, and verification are independent services with explicit contracts. This enables independent scaling, testing, and vendor substitution.

### 5. Premium Trust UX
The product communicates confidence, sources, and uncertainty clearly. Users see why a place is recommended and what evidence supports it.

## Non-Goals (v1)

- Real-time crowd density prediction from proprietary sensors (we use heuristic/third-party signals where available; no false precision).
- Booking/transaction marketplace in v1 (integrations planned post-PMF).
- User-generated location creation without source verification.
- Fully autonomous travel agent that acts without user confirmation for high-impact actions.

## 12-Month Vision

By 12 months post-launch, TrailForge is:

- The default "trustworthy AI travel planner" for Japan inbound travel, with expansion to 5 major destination markets.
- Serving verified itineraries with >95% location-accuracy audit rate.
- Powering B2B itinerary generation APIs for tourism boards, hotels, and travel publishers.
- Operating a verification dataset and audit trail that becomes a defensibility moat.

## Guiding Decisions

- **PostGIS is the system of record for spatial truth.** AI systems never become the source of truth for geography.
- **Deterministic before generative for spatial operations.** Routing, distance, containment, and opening-hours math are computed, not prompted.
- **Every claim has a provenance pointer.** If we cannot cite it, we do not ship it.
- **Ship trust, not demos.** A smaller feature that is verifiable beats a larger feature that is plausible.
