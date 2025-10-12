# Catalyst Prediction Platform - Production Infrastructure

> **Production-grade biotech catalyst prediction system with lakehouse architecture, ML models, and complete AWS infrastructure.**

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Poetry (Python package manager)
- AWS CLI configured (for deployment)
- Terraform 1.5+ (for infrastructure)

### Local Development Setup

```bash
# 1. Install dependencies
npm install
poetry install

# 2. Set up environment
cp .env.example .env
# Edit .env with your API keys and database credentials

# 3. Initialize database
poetry run alembic upgrade head
poetry run python scripts/seed_historical_data.py

# 4. Start services
npm run dev:backend     # FastAPI at :8000
npm run dev:terminal    # React app at :3000

# 5. Start Dagster (separate terminal)
poetry run dagster dev  # Dagster UI at :3001
```

## 📁 Project Structure

```
terminal-ui-biotech-GG/
├── infrastructure/          # AWS infrastructure (Terraform)
│   └── terraform/
│       ├── main.tf          # Main config
│       ├── modules/         # Reusable modules
│       │   ├── storage/     # S3 + Iceberg lakehouse
│       │   ├── database/    # RDS Postgres with Timescale/pgvector
│       │   ├── secrets/     # AWS Secrets Manager
│       │   ├── github_oidc/ # GitHub Actions OIDC (no long-lived keys)
│       │   └── networking/  # VPC, subnets, NAT gateways
│       └── environments/    # Dev/staging/prod configs
│
├── platform/                # FastAPI backend
│   ├── core/
│   │   ├── app.py           # FastAPI application
│   │   ├── schema.py        # SQLAlchemy models (NEW comprehensive schema)
│   │   ├── contracts.py     # Pydantic contracts (NEW)
│   │   └── endpoints/       # API routes
│   ├── providers/           # External data providers
│   └── scrapers/            # Web scrapers
│
├── ingest/                  # Dagster orchestration (NEW)
│   ├── assets/              # Software-defined assets
│   │   └── catalyst_pipeline.py  # Main ingestion pipeline
│   └── providers/           # Provider connectors
│       ├── ctgov/           # ClinicalTrials.gov
│       ├── fda/             # FDA APIs
│       ├── sec/             # SEC EDGAR
│       └── market/          # Market data
│
├── ml/                      # ML models (NEW)
│   ├── models/
│   │   └── prediction_pipeline.py  # Bayesian + GBM + Quantile + Conformal
│   ├── features/            # Feature engineering
│   ├── calibration/         # Model calibration
│   ├── backtesting/         # Walk-forward backtests
│   └── monitoring/          # Drift detection
│
├── frontend-components/     # React component library
├── terminal/                # Full terminal application
├── docs/                    # Documentation
│   ├── PREDICTION_SYSTEM.md # Architecture overview (NEW)
│   ├── FEATURES.md          # Feature definitions (NEW)
│   ├── ONCALL.md            # On-call runbook (NEW)
│   └── DATA_SOURCES.md      # Data licensing (NEW)
│
└── .github/
    └── workflows/
        └── ci-cd.yml        # CI/CD pipeline (NEW)
```

## 🏗️ Architecture

### Data Flow

```
External APIs → Dagster Assets → S3/Iceberg (raw) + Postgres (normalized)
                      ↓
              Feature Engineering → FeatureSnapshots (versioned)
                      ↓
              ML Models → Predictions (p, U, D, scores, CIs)
                      ↓
              FastAPI Endpoints → Frontend UI
```

### Key Components

1. **Lakehouse (S3 + Iceberg)**: Raw provider data in Parquet format
2. **Postgres OLTP**: Normalized entities, system of record
3. **Dagster**: Orchestration with asset checks, retries, lineage
4. **ML Pipeline**: Bayesian + GBM for success probability, Quantile GBM for returns
5. **FastAPI**: RESTful API with search, ranked catalysts, predictions
6. **React UI**: Terminal-style interface with next-12-months tables

## 🔧 Infrastructure Deployment

### Deploy to AWS

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Deploy dev environment
terraform workspace select dev
terraform plan -var-file=environments/dev/terraform.tfvars
terraform apply

# Deploy staging
terraform workspace select staging
terraform apply -var-file=environments/staging/terraform.tfvars

# Deploy production (requires manual approval)
terraform workspace select prod
terraform apply -var-file=environments/prod/terraform.tfvars
```

### Infrastructure Includes

- ✅ Multi-AZ RDS Postgres with Timescale + pgvector
- ✅ S3 buckets with lifecycle policies
- ✅ GitHub OIDC for CI/CD (no long-lived keys)
- ✅ AWS Secrets Manager for credentials
- ✅ ECS Fargate for compute
- ✅ VPC with private subnets

## 📊 Database Schema

### Canonical Tables

- **Company**: Biotech/pharma entities with market data
- **Program**: Drug development programs
- **Trial**: Clinical trials from ClinicalTrials.gov
- **CatalystEvent**: Primary prediction target (FDA dates, data readouts, etc.)
- **Evidence**: Supporting documents and sources
- **ProviderRaw**: Raw API responses (with lineage tracking)
- **FeatureSnapshot**: Versioned feature vectors (content-addressable)
- **Prediction**: ML model outputs (p, U, D, scores, CIs)
- **PriceBar**: Price and volume data
- **OptionsSnapshot**: Options-implied volatility
- **Filing**: SEC filings (10-K, 8-K, etc.)
- **Transcript**: Earnings calls and conference presentations

### Migrations

```bash
# Create new migration
poetry run alembic revision -m "Add new feature column"

# Apply migrations
poetry run alembic upgrade head

# Rollback
poetry run alembic downgrade -1
```

## 🤖 Dagster Orchestration

### Run Assets

```bash
# Materialize all assets
poetry run dagster asset materialize --select "*"

# Materialize specific asset
poetry run dagster asset materialize --select raw_clinicaltrials_data

# Backfill partitioned assets
poetry run dagster asset materialize --select raw_market_data --partition-keys 2024-01-01 to 2024-12-31
```

### Asset Groups

- **ingestion**: Raw provider data connectors
- **normalization**: Transform raw → normalized schema
- **features**: Feature engineering and snapshots
- **models**: ML model training and predictions
- **validation**: Backtesting and drift detection

## 🧪 Testing

### Unit Tests

```bash
# Python tests
poetry run pytest tests/ -v

# Frontend tests
npm run test:components
npm run test:terminal

# With coverage
poetry run pytest --cov=platform --cov=ml --cov-report=html
```

### Integration Tests

```bash
# API integration tests (requires running services)
poetry run pytest tests/integration/ -v

# Dagster integration tests
poetry run pytest tests/integration/test_dagster_assets.py
```

### Smoke Tests

```bash
# Quick validation after deployment
curl https://api.biotech-terminal.com/health
curl https://api.biotech-terminal.com/api/v1/biotech/catalysts/ranked?days=30
```

## 🚢 CI/CD Pipeline

### GitHub Actions Workflow

- **test-python**: Pytest with Postgres + Redis services
- **test-frontend**: Vitest for React components
- **dagster-validate**: Dry-run Dagster assets
- **security-scan**: Trivy vulnerability scanning
- **build**: Docker images for API and Dagster
- **deploy-staging**: Auto-deploy to staging (develop branch)
- **deploy-production**: Manual approval required (main branch)

### Required Secrets

```yaml
AWS_ROLE_ARN_STAGING: arn:aws:iam::123456789:role/github-actions-staging
AWS_ROLE_ARN_PROD: arn:aws:iam::123456789:role/github-actions-prod
SLACK_WEBHOOK: https://hooks.slack.com/services/XXX
```

## 📈 ML Model Pipeline

### Training

```bash
# Train models with historical data
poetry run python ml/training/train_models.py --start-date 2020-01-01 --end-date 2024-12-31

# Evaluate on test set
poetry run python ml/training/evaluate.py --model-version v1.0
```

### Prediction

```bash
# Generate predictions for upcoming catalysts
poetry run dagster asset materialize --select model_predictions

# View predictions in database
psql $DATABASE_URL -c "SELECT * FROM predictions WHERE predicted_at > now() - interval '1 day' ORDER BY final_rank_score DESC LIMIT 10;"
```

### Backtesting

```bash
# Run expanding-window backtest
poetry run python ml/backtesting/run_backtest.py --start 2020-01-01 --end 2024-12-31 --output backtest_results.json

# Generate metrics report
poetry run python ml/backtesting/generate_report.py --input backtest_results.json
```

## 🔍 API Endpoints

### Search

```bash
# Fuzzy search for companies, programs, catalysts
curl "https://api.biotech-terminal.com/api/v1/biotech/search?q=keytruda&types=company,program,catalyst"
```

### Ranked Catalysts

```bash
# Get top-ranked catalysts for next 12 months
curl "https://api.biotech-terminal.com/api/v1/biotech/catalysts/ranked?days=365&min_conf=0.6"
```

### Prediction Detail

```bash
# Get detailed prediction with features and explanation
curl "https://api.biotech-terminal.com/api/v1/biotech/predictions/123"
```

### Benchmarks

```bash
# Get historical distributions for event type
curl "https://api.biotech-terminal.com/api/v1/biotech/benchmarks/PDUFA_DATE"
```

### Export

```bash
# Export predictions as CSV
curl "https://api.biotech-terminal.com/api/v1/biotech/exports/csv?start_date=2024-01-01&end_date=2024-12-31" > predictions.csv
```

## 📚 Documentation

- **[PREDICTION_SYSTEM.md](docs/PREDICTION_SYSTEM.md)**: Architecture, math, endpoints
- **[FEATURES.md](docs/FEATURES.md)**: Feature definitions, drift detection
- **[ONCALL.md](docs/ONCALL.md)**: Runbooks, debugging procedures
- **[DATA_SOURCES.md](docs/DATA_SOURCES.md)**: Licensing, TOS compliance

## 🔐 Security

### Secrets Management

- ✅ AWS Secrets Manager for API keys and credentials
- ✅ GitHub OIDC for AWS authentication (no long-lived keys)
- ✅ KMS encryption for secrets at rest
- ✅ Secrets rotation via AWS Secrets Manager

### Data Privacy

- ✅ No PII collected or stored
- ✅ Clinical trial data aggregated only
- ✅ GDPR/CCPA compliant (no personal data)
- ✅ HIPAA-compliant data handling

## 📊 Monitoring

### Dashboards

- **Grafana**: https://metrics.biotech-terminal.com/d/catalyst-platform
- **Dagster UI**: https://dagster.biotech-terminal.com
- **CloudWatch**: AWS Console → CloudWatch → Dashboards

### Alerts

- **PagerDuty**: On-call rotation for P0/P1 incidents
- **Slack**: #alerts channel for non-critical notifications
- **Email**: Critical failures to engineering-oncall@biotech-terminal.com

### Key Metrics

- API latency (p50 < 100ms, p99 < 500ms)
- Error rate (< 1%)
- Dagster job success rate (> 95%)
- Database connections (< 80% max)
- Redis hit rate (> 90%)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Python**: Ruff (linting), Black (formatting), mypy (type checking)
- **TypeScript**: ESLint, Prettier
- **Commits**: Conventional Commits format

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Acknowledgments

- **ClinicalTrials.gov**: U.S. National Library of Medicine
- **FDA OpenData**: U.S. Food and Drug Administration
- **SEC EDGAR**: U.S. Securities and Exchange Commission
- **OpenBB Platform**: Financial data aggregation
- **Dagster**: Data orchestration framework

---

**Maintained by**: Data Platform Team  
**Contact**: data-platform@biotech-terminal.com  
**Documentation**: https://docs.biotech-terminal.com
