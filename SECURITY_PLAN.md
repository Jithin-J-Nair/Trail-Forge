# Security Plan — TrailForge

## 1. Security Objectives

- **Protect user and B2B data** (confidentiality, integrity, availability).
- **Preserve trust**: prevent hallucinated/unverified content from being served as verified.
- **Meet compliance expectations**: GDPR, SOC 2-ready controls, OWASP ASVS-aligned practices.
- **Enable enterprise adoption**: auditability, RBAC, key management, incident response.

## 2. Threat Model (STRIDE Summary)

| Threat | Surface | Mitigation |
|---|---|---|
| Spoofing | User/B2B auth, service-to-service | OIDC/JWT, short-lived tokens, mTLS/internal auth, API key hashing |
| Tampering | Itinerary/verification/audit records | Immutable audit log, DB constraints, signed artifacts, outbox integrity |
| Repudiation | Admin/B2B actions | Append-only audit events with actor/correlation IDs |
| Information disclosure | PII, API keys, prompts, source data | Encryption in transit/at rest, secrets manager, redaction, least privilege |
| Denial of service | Generate endpoints, LLM/Overpass abuse | WAF, rate limits, quotas, queues, circuit breakers, backpressure |
| Elevation of privilege | RBAC flaws, IDOR | RBAC/ABAC, object-level authz checks, scoped API keys, tests |

## 3. Identity & Access Management

### Authentication
- Web: OAuth 2.0/OIDC (Auth.js/NextAuth or Cognito) with email/password + social/SSO options.
- B2B: API keys (`tf_live_...`) hashed with Argon2id; shown once; scoped; expirable; revocable.
- Internal services: short-lived JWTs minted by identity provider or mTLS via service mesh (phase 2).

### Authorization
- RBAC roles: `user`, `creator`, `team_admin`, `org_admin`, `support_readonly`, `internal_operator`.
- ABAC for object ownership: users can access only their itineraries unless explicitly shared/org-scoped.
- B2B scopes: `itineraries:read`, `itineraries:generate`, `verification:write`, `exports:write`, etc.

### Session Security
- Access tokens: 15 min TTL. Refresh tokens: rotating, revocable, stored hashed.
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax/Strict`.
- MFA for admin and enterprise accounts.

## 4. Application Security

- **Input validation:** Zod/class-validator at API boundary; strict schemas; reject unknown fields on external APIs.
- **Output encoding:** React escaping by default; sanitize any rich HTML exports.
- **SQL injection:** Parameterized queries/ORM; no raw string interpolation.
- **SSRF:** Allowlists for outbound fetchers; OSM/Nominatim/LLM endpoints only through configured clients.
- **Prompt injection:** OSM/user content treated as untrusted data; delimited context; no tool execution from untrusted text; grounding/verification gate.
- **Dependency security:** Dependabot/Renovate, `npm audit` in CI, SCA, pinned lockfiles, SBOM generation.
- **Secrets:** Never in repo. AWS Secrets Manager/SSM Parameter Store; runtime injection; rotation.

## 5. API & Infrastructure Security

- TLS 1.2+ everywhere; HSTS at edge; internal TLS preferred.
- AWS WAF + CloudFront + Shield for edge protection.
- Rate limiting: per-IP, per-user, per-API-key; stricter on generate/verify endpoints.
- Request size limits (32KB default; export/generation payload bounds).
- Network segmentation: public subnets for ALB only; services/DB in private subnets; no public DB.
- Security groups: least-privilege ingress/egress.
- Container hardening: minimal base images, non-root user, read-only FS where possible, image scanning (Trivy).

## 6. Data Protection

- **Encryption at rest:** RDS, S3, ElastiCache, MSK, backups encrypted with KMS.
- **Encryption in transit:** TLS for all external and internal service communication.
- **PII classification:** email, name, IP, billing identifiers marked PII; access logged.
- **Data minimization:** raw LLM prompts/outputs redacted and retention-limited.
- **Backups:** automated RDS snapshots, PITR enabled, cross-region backup for prod, restore tested quarterly.

## 7. GDPR & Privacy

- **Lawful basis:** contract/performance for service; consent for marketing.
- **Data subject rights:** export, rectification, erasure, restriction workflows.
- **DSAR process:** ticketed, identity-verified, audited, completed within SLA.
- **Retention policy:** documented per data class; automated deletion/anonymization jobs.
- **DPA/subprocessors:** documented; LLM providers configured with no-training/data-retention options where available.
- **Data residency:** EU deployment option on roadmap for enterprise.

## 8. Audit Logging & Compliance

- Append-only `audit_events` for: auth events, itinerary generation, verification decisions, exports, admin actions, key lifecycle, permission changes.
- Audit records include actor, action, entity, correlation ID, timestamp, redacted payload.
- Logs shipped to centralized immutable storage; tamper-evident controls for enterprise tier.
- SOC 2 readiness: access reviews, change management, incident response, vendor management.

## 9. Verification & AI Safety Controls

- **No direct LLM-to-user geographic facts.** Claims pass verification gate.
- **Verification statuses enforced:** `VERIFIED`, `PARTIALLY_VERIFIED`, `NEEDS_REVIEW`; UI and API must display status.
- **Hard suppression rule:** location existence claims that are not verified cannot be presented as verified stops.
- **Model input/output logging:** redacted, sampled, retention-limited.
- **Provider fallback:** if verification fails or provider unavailable, return safe degraded response, not fabricated content.

## 10. Incident Response

- Severity levels SEV1-SEV4 with on-call paging.
- SEV1 trust incident (hallucinated location served as verified): immediate kill switch for affected pipeline, user notification, audit export, postmortem.
- Playbooks: credential leak, data breach, DDoS, verification failure spike, model provider outage.
- Postmortem required for SEV1/SEV2 within 5 business days.

## 11. Security Testing & SDLC

- PR checks: lint, typecheck, unit/integration tests, SAST, dependency scan, secret scan.
- DAST/staging scans before release.
- Threat modeling for new services/features.
- Quarterly penetration test (post-launch).
- Security champions in each team; secure coding guidelines.
