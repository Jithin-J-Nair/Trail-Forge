# TrailForge File Structure

## Target Monorepo Layout

```text
Trail-Forge/
├── .github/
│   └── workflows/
│       ├── ci.yml                      # PR/main checks: lint, typecheck, test, build
│       ├── deploy.yml                  # Build/push/deploy skeleton
│       └── eval-nightly.yml            # Verification/generation evals
├── apps/
│   ├── web/                            # Next.js production web app (target)
│   │   ├── src/app/                    # App Router pages
│   │   ├── src/components/             # UI components
│   │   ├── src/features/               # itinerary/map/profile features
│   │   ├── src/lib/                    # API client, query hooks
│   │   └── src/styles/
│   └── api/                            # Legacy prototype API (being evolved)
├── services/
│   ├── itinerary-service/              # Orchestration of generation lifecycle
│   │   ├── src/modules/itinerary/
│   │   ├── src/modules/audit/
│   │   └── src/main.ts
│   ├── geospatial-service/             # OSM/Overpass/Nominatim, place canonicalization
│   │   ├── src/modules/places/
│   │   ├── src/modules/ingestion/
│   │   └── src/main.ts
│   ├── routing-service/                # Deterministic route optimization
│   │   ├── src/modules/routing/
│   │   └── src/main.ts
│   ├── ai-orchestrator/                # Prompting, model routing, grounded generation
│   │   ├── src/modules/generation/
│   │   ├── src/modules/prompts/
│   │   └── src/main.ts
│   └── verification-service/           # Claim verification, confidence, audit
│       ├── src/modules/verification/
│       └── src/main.ts
├── packages/
│   ├── domain/                         # Core domain models + verification engine
│   │   └── src/
│   │       ├── place.ts
│   │       ├── itinerary.ts
│   │       ├── verification.ts
│   │       └── verification-engine.ts
│   ├── ai-core/                        # Multi-provider AI abstraction
│   │   └── src/
│   │       ├── types.ts
│   │       ├── router.ts
│   │       └── providers/
│   ├── shared/                         # Legacy shared schemas (prototype)
│   └── config/                         # Shared eslint/tsconfig/build config (planned)
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml          # Local PostGIS, Redis, OTel
│   │   ├── initdb/001_extensions.sql
│   │   └── otel-collector.yaml
│   └── terraform/
│       ├── envs/dev|staging|prod/
│       └── modules/network|rds_postgis|redis|s3|...
├── docs/
│   ├── strategy/                       # Product/business strategy
│   ├── architecture/                   # Architecture/data/API/security
│   ├── implementation/                 # Implementation plan, file structure
│   └── ops/                            # Runbooks/operational docs
├── scripts/                            # Eval/smoke/migration scripts
├── ARCHITECTURE.md
├── ROADMAP.md
├── DATABASE.md
├── SECURITY.md
├── DEPLOYMENT.md
├── API_REFERENCE.md
└── README.md
```

## Ownership Boundaries

- `packages/domain` — pure domain logic, no infrastructure dependencies.
- `packages/ai-core` — provider abstraction; no business rules.
- `services/*` — application/use-case orchestration, transport, persistence adapters.
- `apps/web` — UX only; no verification authority.
- `infra/*` — environment provisioning and runtime wiring.

## Naming Conventions

- TypeScript: strict, ESM, `*.ts`.
- Tests: `*.test.ts` near source or in `__tests__`.
- Domain events: `domain.event_name.v1`.
- API paths: `/v1/<resource>`.
- DB tables: snake_case, plural.
- Env vars: UPPER_SNAKE_CASE; never commit secrets.
