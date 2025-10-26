# Catalyst Prediction System Architecture

## Overview

The Biotech Terminal Catalyst Prediction Platform is a production-grade system for predicting biotech/pharmaceutical catalyst outcomes using a lakehouse architecture, machine learning models, and rigorous backtesting.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Data Sources                               │
├─────────────────────────────────────────────────────────────────┤
│ CT.gov │ FDA │ EMA │ SEC │ Conferences │ Market │ Options │ News │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Dagster Orchestration Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  • Software-defined assets with lineage tracking                 │
│  • Rate-limited, idempotent provider connectors                  │
│  • Content hashing for deduplication                             │
│  • Asset checks and retries                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Lakehouse Storage                            │
├─────────────────────────────────────────────────────────────────┤
│  S3 + Apache Iceberg                                              │
│  • Raw provider payloads (Parquet format)                        │
│  • Schema evolution & time travel                                │
│  • Partition by provider/date                                    │
│  • Model artifacts and feature snapshots                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Postgres OLTP (System of Record)                  │
├─────────────────────────────────────────────────────────────────┤
│  • Timescale for time-series (price data)                        │
│  • pgvector for semantic search                                  │
│  • Normalized entities: Company, Program, Trial                  │
│  • CatalystEvent (primary prediction target)                     │
│  • FeatureSnapshot (versioned features)                          │
│  • Prediction (p, U, D, scores, CIs)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Feature Store                                │
├─────────────────────────────────────────────────────────────────┤
│  Materialized nightly with deterministic FeatureSnapshots        │
│  • Phase, sample size, endpoint hardness                         │
│  • Class priors, enrollment velocity                             │
│  • Options implied move, short interest                          │
│  • Consensus dispersion, PR cadence                              │
│  • Prior effect size, safety score                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       ML Model Stack                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Hierarchical Bayesian Logistic (indication/class random fx)  │
│  2. Gradient-Boosted Trees (event success probability)           │
│  3. Quantile GBM (idiosyncratic returns in [-1,+3] days)         │
│  4. Isotonic Regression (calibration)                            │
│  5. Conformal Prediction (honest confidence intervals)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Ranking & Scoring                            │
├─────────────────────────────────────────────────────────────────┤
│  • ExpectedTorque = p*U + (1-p)*D                                │
│  • Market baseline = max(options_implied, historical)            │
│  • SurpriseAlpha = ExpectedTorque - baseline                     │
│  • FinalRankScore = w1*Torque + w2*Alpha + w3*Leverage           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Endpoints                            │
├─────────────────────────────────────────────────────────────────┤
│  /api/v1/biotech/search              (fuzzy + embeddings)        │
│  /api/v1/biotech/catalysts/ranked    (ranked predictions)        │
│  /api/v1/biotech/predictions/{id}    (detailed prediction)       │
│  /api/v1/biotech/benchmarks/{type}   (historical distributions)  │
│  /api/v1/biotech/exports/csv         (auditable dumps)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Frontend UI                                 │
├─────────────────────────────────────────────────────────────────┤
│  • Enhanced search bar with type routing                         │
│  • Next-12-Months table on company pages                         │
│  • Radar with options-implied vs model toggle                    │
│  • Sparkline deltas for visual comparison                        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Ingestion (Dagster Assets)

**Raw Data Collection:**
- Provider connectors fetch data via APIs (CT.gov, FDA, SEC, etc.)
- Rate limiting enforced per provider (10 req/s for CT.gov, 5 req/s for FDA, 9 req/s for SEC)
- Content hashing (SHA256) for deduplication
- Raw JSON written to S3/Iceberg (Parquet format)
- Metadata stored in `ProviderRaw` table with lineage tracking

**Normalization:**
- Raw data validated against Pydantic contracts
- Transformed into canonical schema (Company, Program, Trial, CatalystEvent)
- Idempotent writes using content hashes
- Failed validations logged but don't block pipeline

**Schedule:**
- Daily partitioned ingestion for incremental loads
- Historical backfills via Dagster backfill operations

### 2. Feature Engineering

**Feature Store:**
- Materialized nightly as FeatureSnapshots
- Deterministic: same inputs → same features (reproducibility)
- Versioned schema (v1.0, v1.1, etc.)
- Content-addressed via hash of feature vector

**Features (20+ dimensions):**
- **Clinical**: Phase encoding, sample size, endpoint hardness, enrollment velocity
- **Market**: Options implied move, short interest %, historical volatility
- **Sentiment**: PR cadence, analyst consensus dispersion
- **Historical**: Class priors (success rate by indication/phase), prior effect sizes
- **Risk**: Safety score (FAERS signals), discontinuation rate
- **Timing**: Days to event, timing clarity score (PDUFA vs event-driven)

### 3. Model Pipeline

**Success Probability (p):**
```
Level 1: Hierarchical Bayesian Logistic Regression
  - Indication random effects (Oncology, Immunology, etc.)
  - Phase random effects (I, II, III)
  - Company type effects (Big Pharma vs Biotech)

Level 2: Gradient-Boosted Trees (XGBoost)
  - Stacked on Bayesian posterior samples
  - Captures non-linear interactions
  - Hyperparameters: max_depth=6, learning_rate=0.01, n_estimators=500
```

**Return Predictions (U, D):**
```
Quantile GBM for conditional distributions:
  - Q90 for upside (U)
  - Q10 for downside (D)
  - Residualized vs XBI to isolate idiosyncratic moves
  - Window: [-1, +3] trading days around event
```

**Calibration:**
```
Isotonic Regression:
  - Monotonic mapping of raw probabilities to calibrated p
  - Trained on expanding windows

Conformal Prediction:
  - Honest confidence intervals via split conformal
  - Coverage guarantee: 90% CI contains true outcome 90% of time
```

### 4. Ranking and Scoring

**Expected Torque (Risk-Neutral Return):**
```
ExpectedTorque = p * U + (1 - p) * D
```

**Market Baseline:**
```
baseline = max(options_implied_move, historical_avg_move[event_type])
```

**Surprise Alpha (Edge):**
```
SurpriseAlpha = ExpectedTorque - baseline
```

**Final Ranking Score:**
```
FinalRankScore = w1*ExpectedTorque + w2*SurpriseAlpha + w3*EventLeverage
where:
  w1 = 0.40  (absolute opportunity)
  w2 = 0.35  (vs market expectations)
  w3 = 0.25  (endpoint quality)

Weights learned via walk-forward optimization
```

### 5. Backtesting

**Methodology:**
- Expanding-window splits (train on all data up to T, test on T to T+30d)
- Cluster by company/indication to avoid look-ahead bias
- Residualize vs XBI to isolate idiosyncratic moves
- Account for borrow costs and 1-3 bps slippage

**Metrics:**
- **AUC-PR**: Area under precision-recall curve for |move| ≥ 10-15%
- **Brier Score**: Probability calibration (lower = better)
- **Pinball Loss**: Quantile prediction accuracy
- **Spearman IC**: Rank correlation with actual returns
- **Top-Decile Hit Rate**: % of top-ranked events with |move| ≥ threshold
- **Long/Short IR**: Information ratio of long top-decile, short bottom-decile

**Acceptance Criteria:**
- Out-of-sample AUC-PR ≥ baseline + 10%
- Pinball loss ≤ baseline - 10%
- Decile reliability within ±5% (calibration check)
- Stable IR > 0.5 over 3+ years

## Infrastructure

### AWS Stack (Terraform)

**Compute:**
- ECS Fargate for Dagster and FastAPI
- Auto-scaling based on load

**Storage:**
- S3 for lakehouse (lifecycle policies: IA after 90d, Glacier after 365d)
- RDS Postgres 16 with Timescale + pgvector extensions
- ElastiCache Redis for hot query caching

**Security:**
- GitHub OIDC for CI/CD (no long-lived keys)
- AWS Secrets Manager for API keys and DB credentials
- KMS encryption at rest
- VPC with private subnets for databases

**Observability:**
- OpenTelemetry for distributed tracing
- Prometheus + Grafana for metrics
- CloudWatch Logs for centralized logging
- Sentry for error tracking

### Environments

- **dev**: Single-AZ, small instances, short retention
- **staging**: Multi-AZ, production-like config for testing
- **prod**: Multi-AZ, backup retention 30d, deletion protection

## API Endpoints

### 1. Search
```
GET /api/v1/biotech/search?q=keytruda&types=company,program,catalyst
```
Returns:
- Companies (fuzzy match on ticker/name)
- Programs (drug names)
- Catalyst events
Uses pg_trgm for fuzzy text search + pgvector for semantic search

### 2. Ranked Catalysts
```
GET /api/v1/biotech/catalysts/ranked?days=365&min_conf=0.6
```
Returns top N catalysts by FinalRankScore:
```json
{
  "catalysts": [
    {
      "event_id": 123,
      "company_ticker": "ABBV",
      "company_name": "AbbVie Inc.",
      "event_type": "PDUFA_DATE",
      "title": "Rinvoq PDUFA Decision",
      "expected_date": "2025-03-15",
      "p": 0.82,
      "p_ci_low": 0.75,
      "p_ci_high": 0.88,
      "U": 0.15,
      "D": -0.08,
      "implied_move": 0.08,
      "expected_torque": 0.109,
      "surprise_alpha": 0.029,
      "final_rank_score": 0.091
    }
  ]
}
```

### 3. Prediction Detail
```
GET /api/v1/biotech/predictions/{event_id}
```
Returns:
- Full catalyst event details
- Feature inputs used
- Model explanation (SHAP values)
- Evidence links (trial data, filings, etc.)

### 4. Benchmarks
```
GET /api/v1/biotech/benchmarks/PDUFA_DATE
```
Returns historical distributions for radar/spider overlays:
```json
{
  "event_type": "PDUFA_DATE",
  "stats": {
    "mean_move": 0.12,
    "median_move": 0.09,
    "p90_move": 0.25,
    "success_rate": 0.78
  },
  "distribution": [...]
}
```

### 5. Export
```
GET /api/v1/biotech/exports/csv?start_date=2024-01-01&end_date=2024-12-31
```
Auditable CSV export with all predictions and actuals for compliance.

## Security and Governance

### Data Sources
- **TOS Compliance**: All sources used within their Terms of Service
- **robots.txt**: Respected for scraped sites
- **Rate Limiting**: Provider-specific throttles (configurable per source)
- **Attribution**: Provenance headers in API responses (`X-Data-Sources: CT.gov,FDA`)

### Privacy
- No PII collected or stored
- Patient-level data aggregated before storage
- HIPAA-compliant data handling where applicable

### Licenses
See [docs/DATA_SOURCES.md](./DATA_SOURCES.md) for detailed license information.

## Performance

### Latency
- Search: < 100ms (cached queries)
- Ranked catalysts: < 200ms (pre-computed rankings)
- Prediction detail: < 150ms (single DB query)

### Throughput
- 1000 req/s sustained (with caching)
- 10,000 events processed daily
- 100+ companies tracked

### Storage
- ~10 GB/month raw data growth
- ~1 GB/month normalized data
- Model artifacts: ~500 MB per version

## Deployment

### CI/CD (GitHub Actions)
```yaml
on: [push]
jobs:
  test:
    - poetry run pytest
    - npm run test

  build:
    - docker build -t catalyst-api:${{ github.sha }}
    - docker push

  deploy:
    - terraform apply
    - dagster deploy
```

### Monitoring
- Health checks: `/health` endpoint
- Metrics dashboard: Grafana at `https://metrics.biotech-terminal.com`
- Alerts: PagerDuty integration for critical failures

## Future Enhancements

1. **Real-time updates**: WebSocket for live prediction updates
2. **Multi-asset portfolios**: Correlation-aware basket predictions
3. **Sentiment analysis**: NLP on conference call transcripts
4. **Deep learning**: Transformer models for text analysis
5. **Causal inference**: Synthetic control for actual vs counterfactual

## References

- Dagster: https://dagster.io/
- Apache Iceberg: https://iceberg.apache.org/
- Conformal Prediction: https://arxiv.org/abs/2107.07511
- Bayesian Hierarchical Models: Gelman et al., BDA3
