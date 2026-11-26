# Security — TrailForge

Detailed security plan: [`docs/architecture/SECURITY_PLAN.md`](docs/architecture/SECURITY_PLAN.md).

## Security Posture

TrailForge handles user data, API keys, location-related requests, and AI-generated content. Security is designed around two invariants:

1. **Data protection:** user and enterprise data is protected by strong auth, encryption, least privilege, and auditing.
2. **Trust protection:** unverifiable AI-generated location claims are never presented as verified.

## Key Controls

### Authentication & Authorization
- OIDC/OAuth 2.0 for user auth; short-lived JWT access tokens; rotating refresh tokens.
- B2B API keys hashed at rest (Argon2id), scoped, expirable, revocable.
- RBAC + object-level authorization for itinerary/resource access.

### Data Security
- TLS 1.2+ in transit; KMS-backed encryption at rest for RDS/S3/Redis/MSK/secrets.
- PII classification, minimization, retention policies, GDPR DSAR workflows.
- Secrets managed in AWS Secrets Manager/SSM; never committed to git.

### Application Security
- Strict schema validation at boundaries (Zod/class-validator).
- Parameterized DB access; output encoding; CSRF protections where cookie auth used.
- SSRF allowlists for external calls (OSM/Nominatim/LLM providers).
- Prompt-injection mitigation: untrusted data delimiters, no tool execution from source content, verification gate.

### AI / Verification Safety
- LLM output treated as draft until verified.
- Verification statuses: `VERIFIED`, `PARTIALLY_VERIFIED`, `NEEDS_REVIEW`.
- Hard gate: non-verified existence/location claims cannot be labeled verified.
- Audit trail for model runs, claims, evidence, and verification decisions.

### Infrastructure Security
- AWS WAF, private subnets, security groups, least-privilege IAM.
- Container image scanning, dependency scanning, secret scanning in CI.
- Rate limiting, quotas, circuit breakers, DLQs.

## Compliance Alignment

- **GDPR:** lawful basis, DSAR, retention, deletion/anonymization, DPA/subprocessor tracking.
- **SOC 2 readiness:** access controls, change management, logging, incident response, vendor risk.
- **OWASP ASVS:** used as application security baseline.

## Incident Response

- Severity-based on-call (SEV1-SEV4).
- Hallucination escape treated as trust SEV; kill switch, audit, user comms, postmortem.
- Postmortems for SEV1/SEV2 within 5 business days.

## Reporting Security Issues

Please report vulnerabilities privately to the maintainers/security contact configured for the deployment. Do not open public issues for sensitive security reports.
