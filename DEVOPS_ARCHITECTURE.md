# TrailForge — DevOps Architecture

## 1. Goals

- Reproducible environments, safe deployments, fast rollback, and observable operations.
- Support 1M+ users with multi-AZ, autoscaling, and global edge delivery.

## 2. Infrastructure (AWS + Terraform)

```text
infra/terraform/
  modules/  network, eks_or_ecs, rds_postgis, redis, opensearch, s3, kms, observability, waf
  envs/     dev, staging, prod
```

- **State:** S3 + DynamoDB lock.
- **Network:** VPC, public/private subnets, NAT, security groups, private endpoints.
- **Compute:** EKS (preferred) or ECS Fargate; HPA/cluster autoscaler.
- **Data:** RDS PostGIS Multi-AZ, ElastiCache Redis, OpenSearch, S3, MSK/SQS.
- **Edge:** CloudFront, WAF, Route53, ACM TLS.
- **Secrets:** Secrets Manager/SSM, KMS encryption.

## 3. CI/CD (GitHub Actions)

### CI (PR/main)
- Checkout, Node 22, `npm ci`
- Lint, typecheck, unit/integration tests, build
- Dependency audit / secret scan / SAST
- Terraform fmt/validate/plan for infra changes

### CD
- Build image per service, tag with SHA+semver, push to ECR.
- Run migrations (expand/contract safe) as gated step.
- Deploy to staging; smoke tests + synthetic checks.
- Manual approval for prod (or policy-based auto for low risk).
- Blue/green or canary rollout; monitor SLOs; auto-rollback.

## 4. Deployment Strategy

| Strategy | Use |
|---|---|
| Blue/green | Default for stateless services |
| Canary | High-risk changes, model/routing/verification changes |
| Feature flags | Gradual rollout, kill switches |

Rollback: shift traffic to previous target; redeploy prior image; disable feature flag. DB: forward-fix preferred.

## 5. Observability

- **OpenTelemetry** SDKs in all services; collector as DaemonSet/sidecar.
- **Metrics:** Prometheus/Managed Prometheus; Grafana dashboards.
- **Logs:** structured JSON, correlation IDs, CloudWatch/Loki.
- **Traces:** request -> intent -> geo -> route -> AI -> verify -> export.
- **Alerts:** SLO burn, 5xx, latency, queue lag, DB saturation, verification escape rate.

## 6. Reliability & DR

- Multi-AZ for RDS/Redis; backups + PITR; cross-region backup for prod.
- RPO <15 min, RTO <1 hr.
- Disaster recovery runbook; quarterly restore drills.
- Rate limits/circuit breakers/bulkheads/timeouts on all external calls.

## 7. Runtime Configuration

- Non-secret config: env/SSM/ConfigMap per environment.
- Secrets: Secrets Manager injected at runtime.
- Feature flags: LaunchDarkly/Unleash/self-hosted (abstracted).
- Tenant config: DB-driven with cache invalidation.

## 8. Developer Experience

- `docker compose` for local PostGIS/Redis/OTel.
- Makefile/scripts for common tasks.
- Preview environments per PR (optional).
- ADRs for major decisions; runbooks for ops.