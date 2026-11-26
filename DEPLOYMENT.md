# Deployment — TrailForge

Detailed ops notes: [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) and `infra/`.

## Deployment Strategy

TrailForge targets **AWS** with containerized services, Terraform-managed infrastructure, and GitHub Actions CI/CD.

## Environments

| Env | Purpose | Deployment | Data |
|---|---|---|---|
| `dev` | Developer integration | on PR merge / manual | synthetic / limited |
| `staging` | Pre-prod validation | on main merge | anonymized/sanitized |
| `prod` | Customer traffic | release promotion / approved workflow | live, encrypted, backed up |

## Runtime Topology (Production)

- **Edge:** CloudFront + WAF + Route53
- **Compute:** EKS (preferred) or ECS Fargate for services; Next.js on managed container runtime
- **Data:** RDS PostgreSQL + PostGIS (Multi-AZ), ElastiCache Redis, S3
- **Async:** MSK (Kafka) or SNS/SQS (phase-dependent)
- **Secrets:** AWS Secrets Manager / SSM Parameter Store
- **Observability:** OTel Collector → Prometheus/Grafana/CloudWatch/Loki

## CI/CD Pipeline

### Pull Request
1. Lint (`eslint`, `prettier --check`)
2. Typecheck (`tsc --noEmit`)
3. Unit/integration tests
4. Build
5. Security scans: dependency audit, secret scan, SAST, container scan (where applicable)
6. Terraform `fmt` + `validate` + `plan` (infra changes)

### Main / Release
1. Build & push images to ECR (SHA + semver tags)
2. Run DB migrations in controlled step
3. Deploy to staging
4. Smoke tests + synthetic checks
5. Manual approval for prod (or automated for low-risk changes)
6. Blue/green or canary deploy to prod
7. Post-deploy health/SLO checks; auto-rollback on failure

## Deployment Pattern

### Blue/Green (Default for services)
- Provision new version alongside old.
- Shift traffic gradually via ALB target groups / service mesh.
- Monitor error rate, latency, verification-failure rate.
- Rollback by traffic shift back to previous target group.

### Database Migrations
- **Expand → migrate → contract**.
- Backward-compatible schema changes first.
- Destructive changes only after all consumers migrated.
- Migration job runs as a gated pipeline step with backup/PITR confirmation.

## Local Development

```bash
# prototype workspaces
npm ci
cp apps/api/.env.example apps/api/.env
npm run dev

# production-style local infra (scaffold)
docker compose -f infra/docker/docker-compose.yml up -d
```

## Infrastructure as Code

Terraform layout:

```text
infra/terraform/
  modules/
    network/
    ecs_or_eks/
    rds_postgis/
    redis/
    s3/
    observability/
  envs/
    dev/
    staging/
    prod/
```

Principles:
- Remote state in S3 + DynamoDB lock.
- Least-privilege IAM per service.
- All infra changes via PR-reviewed Terraform.

## Secrets & Config

- Secrets in AWS Secrets Manager; referenced by runtime env injection.
- Non-secret config in SSM/ConfigMaps/env files per environment.
- Rotation for DB credentials, API keys, and third-party keys.

## Rollback

- **App rollback:** redeploy previous image tag; shift traffic back.
- **Config rollback:** revert config version / feature flag.
- **Schema rollback:** forward-fix preferred; backward-compatible migrations minimize need.
- **Trust incident:** disable generation/verification path via kill switch; serve safe error state.

## Operational Readiness Checklist

- [ ] Dashboards: latency, errors, saturation, verification quality
- [ ] Alerts: SLO burn, hallucination escape, queue lag, DB health
- [ ] Runbooks: deploy, rollback, incident, DSAR, key rotation
- [ ] Backups and restore drill passed
- [ ] Load test for target traffic profile
- [ ] Security scans clean or risk-accepted
