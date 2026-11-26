# Success Metrics — TrailForge

## North Star Metric

**Verified Itineraries Completed (VIC) per week** — the number of itineraries generated that pass verification gates and are saved/exported/followed by a user.

Why: it captures real value delivery (not just generation), encodes trust (verification passed), and correlates with retention and revenue.

## Metric Framework

We use an AARRR + Trust overlay. Trust metrics are first-class because a single hallucination incident can destroy the brand.

## 1. Acquisition

| Metric | Definition | Target (6 mo) | Target (12 mo) |
|---|---|---:|---:|
| Website unique visitors | Weekly unique visitors to landing/docs | 15k/wk | 50k/wk |
| Signup conversion rate | Signups / unique visitors | 3% | 5% |
| CAC (blended B2C) | Total marketing spend / new paying users | <$50 | <$35 |
| Organic share of signups | Non-paid signups / total signups | 50% | 65% |

## 2. Activation

| Metric | Definition | Target (6 mo) | Target (12 mo) |
|---|---|---:|---:|
| Time to first verified itinerary | Median time from signup to first VIC | <5 min | <3 min |
| First-session generation rate | New users who generate >=1 itinerary in first session | 55% | 70% |
| First-session verification pass rate | Generated itineraries passing verification gate | >92% | >95% |
| Onboarding completion | Users completing intent/profile setup | 60% | 75% |

## 3. Retention

| Metric | Definition | Target (6 mo) | Target (12 mo) |
|---|---|---:|---:|
| W4 retention (B2C) | Users active in week 4 after signup | 20% | 30% |
| W12 retention (B2C) | Users active in week 12 | 10% | 18% |
| Monthly active planners | Users generating >=1 itinerary/month | 5k | 20k |
| Itineraries per active user/month | Mean VICs per MAP | 2.5 | 4.0 |

## 4. Revenue

| Metric | Definition | Target (6 mo) | Target (12 mo) |
|---|---|---:|---:|
| Free-to-paid conversion | Paying users / eligible free users | 3% | 5% |
| B2C MRR | Monthly recurring revenue from subscriptions | $15k | $40k |
| B2B ARR | Annualized contract value signed | $50k | $100k |
| ARPU (B2C paid) | MRR / paid users | $14 | $16 |
| Gross margin | (Revenue - COGS) / Revenue | 65% | 72% |
| Payback period | CAC / gross-margin ARPU | <4 mo | <3 mo |

## 5. Referral

| Metric | Definition | Target (6 mo) | Target (12 mo) |
|---|---|---:|---:|
| Share/export rate | VICs shared or exported / total VICs | 25% | 35% |
| Referral signups | Signups from shared itinerary links | 5% of signups | 12% of signups |
| NPS | Net Promoter Score (quarterly survey) | 35 | 50 |

## 6. Trust & Quality (Product-Critical)

| Metric | Definition | Target | Alert Threshold |
|---|---|---:|---:|
| Location accuracy rate | Verified places confirmed real / total places in VICs | >99% | <97% |
| Claim verification pass rate | Claims labeled VERIFIED / total claims | >90% | <85% |
| Hallucination escape rate | Unverifiable/false location claims reaching user without flag | <0.5% | >1% |
| Needs-review rate | Itineraries requiring manual review / total | <8% | >15% |
| Provenance completeness | Claims with valid source pointers / total claims | 100% | <99.5% |
| Verification audit coverage | Itineraries with full audit trail / total VICs | 100% | <99.9% |

## 7. Platform & Reliability

| Metric | Definition | Target | Alert |
|---|---|---:|---:|
| API availability | Successful requests / total (monthly) | 99.9% | <99.5% |
| P95 generation latency | Request to verified itinerary ready | <12s | >20s |
| P95 route compute | Route optimization latency | <1.5s | >3s |
| Verification pipeline latency | Added latency by verification stage | <2s | >5s |
| Error budget burn | SLO error budget consumed per month | <50% | >80% |

## 8. B2B / API

| Metric | Definition | Target (12 mo) |
|---|---|---:|
| Pilot-to-contract conversion | Pilots converting to paid | >40% |
| API integration time | Time from signup to first production call | <3 days |
| B2B net revenue retention | NRR across B2B accounts | >115% |
| API error rate (customer-facing) | 5xx / total API calls | <0.5% |

## Instrumentation Principles

- **Event taxonomy owned by product analytics.** All events versioned, schema-validated, and documented.
- **Trust metrics are non-negotiable dashboards.** Hallucination escape rate has paging alerts.
- **Every itinerary carries an audit ID.** Metrics can be traced back to source data and model outputs.
- **Segment by market, language, theme, and model.** Verification quality may vary by domain; aggregate metrics hide risk.
