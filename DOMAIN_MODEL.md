# TrailForge — Domain Model

## 1. Domain Vision

TrailForge's domain models the transformation of **user intent** into **verified geographic experiences**. The model separates *source truth*, *computed decisions*, *AI drafts*, and *verification judgments*.

## 2. Bounded Contexts & Aggregates

### 2.1 Intent / Itinerary Planning

**Aggregate: ItineraryRequest**
- `ItineraryRequest` (root): id, tenantId, userId, queryText, locale, constraints, status, createdAt
- `IntentConstraint`: duration, mode, themes, accessibility, avoidCrowds, startLocation, startTime
- `Itinerary` (root): id, requestId, tenantId, status, currentVersionId
- `ItineraryVersion`: version, places, routePlanId, contentBlocks, verificationSummary, auditId

**Invariants**
- Request is immutable after submission; changes create new version/regeneration.
- Itinerary cannot be marked `VERIFIED` unless verification summary has no unresolved critical failures.

### 2.2 Geospatial / Place Canonicalization

**Aggregate: Place**
- `Place` (root): id, canonicalSource, canonicalSourceId, name, category, location, geometry, tags, confidence, lastVerifiedAt
- `PlaceSource`: sourceType, sourceId, sourceUrl, license, fetchedAt, rawPayloadRef
- `PlaceSnapshot`: snapshotHash, facts, validFrom, validTo

**Invariants**
- Every Place has >=1 PlaceSource with provenance.
- Canonical identity is `(sourceType, sourceId)`; duplicates merge by canonicalization rules.
- Coordinates/geometry come from source data, never LLM output.

### 2.3 Routing

**Aggregate: RoutePlan**
- `RoutePlan` (root): id, itineraryVersionId, mode, geometry, distanceMeters, durationMinutes, optimizationMeta
- `RouteLeg`: order, fromPlaceId, toPlaceId, geometry, distanceMeters, durationMinutes, instructions

**Invariants**
- Route geometry is computed deterministically from place coordinates/network data.
- Route duration/distance are computed values with algorithm metadata.
- AI cannot mutate route geometry or leg ordering.

### 2.4 AI Orchestration

**Aggregate: GenerationJob**
- `GenerationJob` (root): id, itineraryId, purpose, status, modelRuns[]
- `ModelRun`: provider, model, promptVersion, inputHash, outputHash, tokens, latencyMs
- `DraftContent`: content blocks, claims candidates, citations

**Invariants**
- DraftContent is untrusted.
- Prompts include delimited source facts; source facts are data, not instructions.
- Model outputs are logged/redacted per policy and linked to audit.

### 2.5 Verification

**Aggregate: VerificationCase**
- `VerificationCase` (root): id, itineraryVersionId, status, overallConfidence
- `Claim`: id, claimType, text, placeId, sourceSpan, extractedBy
- `VerificationResult`: claimId, status, confidence, reason, matcher
- `Evidence`: sourceType, sourceId, factPath, expected, observed, weight

**Invariants**
- Every user-facing claim has a VerificationResult.
- Status enum: `VERIFIED | PARTIALLY_VERIFIED | NEEDS_REVIEW`.
- Unknown/unsupported facts => `NEEDS_REVIEW`.
- Evidence must reference source records/snapshots.

### 2.6 Knowledge Graph

**Entities/Edges**
- Nodes: `Place`, `City`, `Theme`, `Category`, `Event`, `Landmark`, `Organization`
- Edges: `LOCATED_IN`, `HAS_THEME`, `RELATED_TO`, `NEAR`, `PART_OF`, `SOURCED_FROM`
- Edge metadata: confidence, sourceIds, observedAt

**Invariants**
- Semantic edges do not override canonical spatial truth.
- Graph recommendations must still pass verification before user-facing factual claims.

### 2.7 Identity / Tenancy / Access

**Aggregate: Organization**
- `Organization` (root): id, name, plan, whiteLabelConfig
- `Membership`: userId, role, scopes
- `ApiKey`: hashedKey, scopes, tenantId, expiresAt

**Invariants**
- Tenant isolation on every query/write.
- Object-level authorization for user-owned resources.

## 3. Domain Events

| Event | Producer | Payload (key fields) | Consumers |
|---|---|---|---|
| `itinerary.requested` | Intent | itineraryId, tenantId, query, constraints | Audit, Analytics |
| `places.discovered` | Geospatial | itineraryId, placeIds, sources | Cache, Analytics |
| `route.computed` | Routing | itineraryId, routePlanId, distance, duration | Itinerary, Audit |
| `content.drafted` | AI | itineraryId, modelRunIds, draftId | Verification |
| `claims.verified` | Verification | itineraryId, summary, statuses | Itinerary, Audit, Alerts |
| `itinerary.published` | Itinerary | itineraryId, version, status | Export, Search, Notification |
| `verification.failed` | Verification | itineraryId, reason, severity | Alerting, Audit |

## 4. Value Objects

- `GeoPoint(lat,lng)`, `GeoBounds`, `DistanceMeters`, `DurationMinutes`
- `SourceRef(sourceType, sourceId, url?, license?)`
- `ConfidenceScore(0..1)`
- `VerificationStatus`
- `LocaleCode` (BCP-47), `Money`, `TenantId`, `CorrelationId`

## 5. Anti-Corruption & Integration

- External OSM/Overpass/Nominatim/Wikidata payloads mapped to internal canonical schemas at adapters.
- LLM provider responses normalized to `GenerationResult`.
- Public API DTOs separated from domain aggregates; mapping layer enforces versioning.

## 6. Domain Rules (Non-Negotiable)

- No `Place` without provenance.
- No route without deterministic algorithm metadata.
- No claim marked `VERIFIED` without evidence.
- No user-facing "unknown" promoted as fact.
- All verification decisions auditable and reproducible from snapshots.