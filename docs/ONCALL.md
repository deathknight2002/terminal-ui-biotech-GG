# Catalyst Prediction Platform - On-Call Runbook

## Table of Contents
1. [System Overview](#system-overview)
2. [Common Alerts](#common-alerts)
3. [Debugging Procedures](#debugging-procedures)
4. [Incident Response](#incident-response)
5. [Escalation](#escalation)
6. [Maintenance Windows](#maintenance-windows)

---

## System Overview

### Architecture Components
- **Dagster**: Orchestration (ECS Fargate)
- **FastAPI**: Web service (ECS Fargate, behind ALB)
- **RDS Postgres**: Primary database (Multi-AZ in prod)
- **S3 + Iceberg**: Lakehouse storage
- **ElastiCache Redis**: Caching layer
- **Secrets Manager**: Configuration and credentials

### Key Metrics
- **API Latency**: p50 < 100ms, p99 < 500ms
- **Error Rate**: < 1%
- **Dagster Job Success Rate**: > 95%
- **Database Connections**: < 80% of max
- **Redis Hit Rate**: > 90%

### Monitoring Dashboards
- **Grafana**: `https://metrics.biotech-terminal.com/d/catalyst-platform`
- **Dagster UI**: `https://dagster.biotech-terminal.com`
- **AWS CloudWatch**: Console → CloudWatch → Dashboards → `BiotechTerminal-{env}`

---

## Common Alerts

### 1. Alert: High API Error Rate

**Severity**: P1 (Critical)  
**Threshold**: Error rate > 5% for 5 minutes  
**Impact**: Users experiencing failures

#### Triage
```bash
# Check error logs in CloudWatch
aws logs tail /aws/ecs/catalyst-api-prod --since 5m --follow

# Check specific error types in Sentry
# Go to https://sentry.io/biotech-terminal/catalyst-api
# Filter by last 5 minutes, group by error type
```

#### Common Causes
1. **Database connection pool exhausted**
   ```bash
   # Check active connections
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
   
   # If > 90% of max_connections, scale up or restart API
   aws ecs update-service --cluster catalyst-prod --service api --desired-count 2
   ```

2. **Provider API rate limits hit**
   ```bash
   # Check Dagster logs for rate limit errors
   grep "RateLimitExceeded" /var/log/dagster/*.log
   
   # Temporarily disable aggressive polling
   dagster asset materialize --select "raw_*" --tags "priority=low"
   ```

3. **Redis cache failure**
   ```bash
   # Check Redis health
   redis-cli -h $REDIS_ENDPOINT ping
   
   # If down, failover to database (cache-aside pattern handles this)
   # Monitor database load carefully
   ```

#### Resolution
- Identify root cause via logs
- Apply hotfix or scale resources
- Monitor for 15 minutes to confirm stability
- Post-incident: Review and add safeguards

---

### 2. Alert: Dagster Job Failure

**Severity**: P2 (High)  
**Threshold**: Job fails 2 consecutive times  
**Impact**: Data freshness degraded

#### Triage
```bash
# View failed run in Dagster UI
# https://dagster.biotech-terminal.com/runs

# Get run logs
dagster run show <run_id>

# Check asset health
dagster asset list --status
```

#### Common Causes
1. **Provider API outage**
   ```bash
   # Check provider status pages
   curl -I https://clinicaltrials.gov
   curl -I https://api.fda.gov/healthcheck
   
   # If provider is down, skip and retry later
   dagster job execute --preset retry_failed
   ```

2. **Data validation failure**
   ```bash
   # Find validation errors in logs
   grep "ValidationError" /var/log/dagster/ingestion.log
   
   # Check data contract schema
   # Often caused by upstream schema changes
   # Fix: Update Pydantic contract in platform/core/contracts.py
   ```

3. **S3 write failure**
   ```bash
   # Check S3 bucket permissions
   aws s3 ls s3://biotech-terminal-lakehouse-prod/raw/
   
   # Check IAM role policies
   aws iam get-role-policy --role-name dagster-execution-role --policy-name S3Access
   ```

#### Resolution
- Fix underlying issue (update contract, wait for provider, fix permissions)
- Re-run failed asset: `dagster asset materialize --select <asset_name>`
- Monitor downstream assets for cascade failures
- Update documentation if schema changes are permanent

---

### 3. Alert: High Database CPU

**Severity**: P2 (High)  
**Threshold**: CPU > 80% for 10 minutes  
**Impact**: Slow queries, potential timeouts

#### Triage
```bash
# Connect to database
psql $DATABASE_URL

# Check active queries
SELECT pid, now() - query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND now() - query_start > interval '30 seconds'
ORDER BY duration DESC;

# Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

#### Common Causes
1. **Missing indexes**
   ```sql
   -- Find slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   
   -- Add index if needed (e.g., on catalyst_events.expected_date)
   CREATE INDEX CONCURRENTLY idx_catalyst_expected_date 
   ON catalyst_events(expected_date) 
   WHERE status = 'UPCOMING';
   ```

2. **Long-running analytics query**
   ```sql
   -- Terminate if necessary
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
   WHERE query LIKE '%analytics%' AND now() - query_start > interval '5 minutes';
   ```

3. **Vacuum/analyze needed**
   ```sql
   -- Check table bloat
   SELECT schemaname, tablename, last_vacuum, last_autovacuum
   FROM pg_stat_user_tables
   WHERE last_autovacuum IS NULL OR last_autovacuum < now() - interval '7 days';
   
   -- Manual vacuum (use CONCURRENTLY to avoid locks)
   VACUUM ANALYZE VERBOSE catalyst_events;
   ```

#### Resolution
- Optimize or terminate problematic queries
- Add indexes for frequently queried columns
- Scale database instance if consistently high load
- Schedule maintenance vacuum during low-traffic hours

---

### 4. Alert: Feature Drift Detected

**Severity**: P3 (Medium)  
**Threshold**: PSI > 0.25 for key features  
**Impact**: Model predictions may be inaccurate

#### Triage
```bash
# Run drift analysis script
poetry run python ml/monitoring/drift_analysis.py --days 30

# View drift report
cat /tmp/drift_report_$(date +%Y%m%d).json
```

#### Common Causes
1. **Market regime change**
   - Sudden volatility spike (e.g., COVID-19, financial crisis)
   - Action: Retrain model with recent data emphasizing new regime

2. **Data source schema change**
   - Provider API response format changed
   - Action: Update parser, validate historical data integrity

3. **Seasonal pattern**
   - Conference season, end-of-year filings
   - Action: Add seasonal features or temporal model variants

#### Resolution
1. **Investigate root cause**
   ```python
   from ml.monitoring import DriftDetector
   
   detector = DriftDetector()
   report = detector.analyze(start_date="2024-01-01", end_date="2024-12-31")
   report.visualize()  # Generates HTML report
   ```

2. **Retrain model if necessary**
   ```bash
   # Trigger retraining pipeline
   dagster job execute --config retrain_config.yaml backfill_predictions
   
   # Monitor training metrics
   mlflow ui --backend-store-uri $MLFLOW_TRACKING_URI
   ```

3. **Update feature definitions**
   - Edit `docs/FEATURES.md`
   - Update `ml/features/engineer.py`
   - Increment schema version
   - Backfill historical snapshots

---

### 5. Alert: Prediction Latency High

**Severity**: P3 (Medium)  
**Threshold**: p99 > 1s for `/api/v1/biotech/catalysts/ranked`  
**Impact**: Slow user experience

#### Triage
```bash
# Check API logs for slow queries
aws logs tail /aws/ecs/catalyst-api-prod --filter-pattern "duration > 1000" --since 10m

# Check database query performance
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements WHERE mean_time > 500 ORDER BY mean_time DESC LIMIT 10;"
```

#### Common Causes
1. **Cache miss**
   ```bash
   # Check Redis hit rate
   redis-cli -h $REDIS_ENDPOINT info stats | grep hit_rate
   
   # If low (<90%), warm cache
   curl -X POST https://api.biotech-terminal.com/admin/cache/warm
   ```

2. **Expensive feature computation**
   ```python
   # Profile feature engineering
   python -m cProfile -o profile.stats ml/features/engineer.py
   python -m pstats profile.stats
   # (pstats) sort cumtime
   # (pstats) stats 20
   ```

3. **Model inference slow**
   ```bash
   # Check model size
   ls -lh ml/models/production/*.pkl
   
   # If >100MB, consider quantization or pruning
   ```

#### Resolution
- Increase Redis cache TTL for hot queries
- Pre-compute expensive features nightly
- Optimize model (quantization, feature selection)
- Add CDN for static assets

---

## Debugging Procedures

### Accessing Production Systems

**Prerequisites:**
- AWS CLI configured with production credentials
- kubectl configured for ECS (if applicable)
- Database credentials from Secrets Manager

```bash
# Get database password
aws secretsmanager get-secret-value --secret-id biotech-terminal/prod/db/master-password --query SecretString --output text

# Connect to database
psql postgresql://dbadmin:$PASSWORD@<RDS_ENDPOINT>:5432/biotech_terminal

# View Dagster logs
aws logs tail /aws/ecs/dagster-prod --follow

# SSH into ECS task (if enabled)
aws ecs execute-command --cluster catalyst-prod --task <task_id> --container api --interactive --command "/bin/bash"
```

### Reading Logs

**Log Levels:**
- **ERROR**: Immediate attention required
- **WARNING**: Investigate within 24 hours
- **INFO**: Normal operation
- **DEBUG**: Verbose (disabled in prod by default)

**Key Log Locations:**
- API: `/aws/ecs/catalyst-api-{env}`
- Dagster: `/aws/ecs/dagster-{env}`
- Database: RDS → Logs tab → `postgresql.log`

**Useful grep patterns:**
```bash
# Find errors with context
grep -C 5 "ERROR" catalyst-api.log

# Find specific event IDs
grep "catalyst_event_id=123" *.log

# Find slow queries
grep "duration.*[5-9][0-9][0-9][0-9]" api.log  # >5000ms
```

### Testing Changes

**Staging environment:**
```bash
# Deploy to staging
terraform workspace select staging
terraform apply

# Run smoke tests
poetry run pytest tests/integration/test_api.py --env=staging

# If successful, promote to prod
terraform workspace select prod
terraform apply
```

**Canary deployment:**
```bash
# Deploy to 10% of prod traffic
aws ecs update-service --cluster catalyst-prod --service api --deployment-configuration "deploymentController={type=CODE_DEPLOY}" --desired-count 10

# Monitor error rate for 30 minutes
# If stable, scale to 100%
```

---

## Incident Response

### Severity Levels

| Severity | Response Time | Example |
|----------|---------------|---------|
| P0 (Critical) | 15 minutes | Complete outage |
| P1 (High) | 1 hour | API errors > 5%, data pipeline down |
| P2 (Medium) | 4 hours | Slow queries, partial degradation |
| P3 (Low) | 1 business day | Feature drift, minor bugs |

### Incident Process

1. **Acknowledge** (within response time)
   - Respond to page in PagerDuty
   - Post in #incidents Slack channel

2. **Assess** (5 minutes)
   - Check dashboards
   - Identify affected components
   - Estimate user impact

3. **Mitigate** (varies by severity)
   - Apply immediate fix (scale, rollback, cache clear)
   - Communicate status to stakeholders

4. **Resolve**
   - Verify fix with monitoring
   - Mark incident as resolved in PagerDuty

5. **Post-Mortem** (within 48 hours for P0/P1)
   - Root cause analysis
   - Timeline of events
   - Action items to prevent recurrence

### Rollback Procedure

```bash
# Rollback API deployment
aws ecs update-service --cluster catalyst-prod --service api --task-definition catalyst-api:PREVIOUS_VERSION

# Rollback database migration (use Alembic)
poetry run alembic downgrade -1

# Rollback Dagster code (via CI/CD)
git revert <commit_sha>
git push origin main
# CI/CD will auto-deploy
```

---

## Escalation

### On-Call Rotation
- **Primary**: Data Engineer
- **Secondary**: ML Engineer
- **Escalation**: Engineering Manager

### Escalation Criteria
- P0 incident not resolved in 1 hour
- P1 incident not resolved in 4 hours
- Data integrity issue suspected
- Security incident

### Contact Information
- **Engineering Manager**: manager@biotech-terminal.com, +1-555-0100
- **CTO**: cto@biotech-terminal.com, +1-555-0101
- **AWS Support**: Enterprise support tier, Case creation via Console

---

## Maintenance Windows

### Scheduled Maintenance
- **Day**: Sundays, 02:00-04:00 UTC (off-peak hours)
- **Frequency**: Monthly
- **Activities**:
  - Database vacuum and reindex
  - Model retraining
  - Dependency updates
  - Performance tuning

### Pre-Maintenance Checklist
- [ ] Announce maintenance 48 hours in advance
- [ ] Backup database
- [ ] Tag current production state in git
- [ ] Prepare rollback plan
- [ ] Test changes in staging

### Post-Maintenance Checklist
- [ ] Verify all services healthy
- [ ] Run smoke tests
- [ ] Check key metrics (latency, error rate)
- [ ] Post completion message

### Emergency Maintenance
- Requires CTO approval
- Communicate immediately via status page
- Follow rollback plan if issues arise

---

## Useful Commands Cheat Sheet

```bash
# Check API health
curl https://api.biotech-terminal.com/health

# Warm cache
curl -X POST https://api.biotech-terminal.com/admin/cache/warm -H "Authorization: Bearer $ADMIN_TOKEN"

# Run Dagster asset
dagster asset materialize --select raw_clinicaltrials_data -c dagster.yaml

# Check database replication lag (if Multi-AZ)
psql $DATABASE_URL -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS replication_lag_seconds;"

# Restart API service
aws ecs update-service --cluster catalyst-prod --service api --force-new-deployment

# View recent deployments
aws ecs describe-services --cluster catalyst-prod --services api --query "services[0].deployments"

# Check S3 lakehouse size
aws s3 ls s3://biotech-terminal-lakehouse-prod/ --recursive --summarize | grep "Total Size"

# Export recent predictions for audit
psql $DATABASE_URL -c "COPY (SELECT * FROM predictions WHERE predicted_at > now() - interval '7 days') TO STDOUT CSV HEADER" > predictions_export.csv
```

---

## Additional Resources

- **Internal Wiki**: https://wiki.biotech-terminal.com/platform
- **API Docs**: https://api.biotech-terminal.com/docs
- **Dagster Docs**: https://docs.dagster.io/
- **AWS RDS Best Practices**: https://aws.amazon.com/rds/postgresql/best-practices/
- **Incident Response Playbook**: https://wiki.biotech-terminal.com/incident-response

---

**Last Updated**: 2024-01-15  
**Maintained By**: Data Platform Team  
**Feedback**: #data-platform Slack channel
