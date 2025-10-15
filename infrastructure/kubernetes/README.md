# Kubernetes Deployment Guide

## Overview

This directory contains Kubernetes manifests for deploying the Biotech Terminal Platform in a production environment.

## Architecture

- **API Deployment**: FastAPI backend with auto-scaling (3-10 replicas)
- **ML Worker Deployment**: Dedicated pods for ML inference (2 replicas)
- **PostgreSQL StatefulSet**: Persistent database
- **Redis Deployment**: Caching layer
- **Ingress**: External access with TLS

## Prerequisites

1. **Kubernetes Cluster** (v1.24+)
   - Managed cluster (EKS, GKE, AKS) or self-hosted
   - At least 3 worker nodes with 8GB RAM each

2. **kubectl** configured with cluster access

3. **Storage Class** named `standard` for persistent volumes

4. **Ingress Controller** (nginx recommended)
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
   ```

5. **Cert Manager** (optional, for TLS)
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
   ```

## Quick Start

### 1. Create Namespace
```bash
kubectl apply -f namespace.yaml
```

### 2. Configure Secrets
Edit `configmap.yaml` and update the secrets:
```yaml
# In biotech-terminal-secrets
DATABASE_PASSWORD: "your-secure-password"
JWT_SECRET: "your-jwt-secret"
OPENBB_API_KEY: "your-openbb-key"
FDA_API_KEY: "your-fda-key"
```

Apply configuration:
```bash
kubectl apply -f configmap.yaml
```

### 3. Deploy Database and Cache
```bash
kubectl apply -f statefulsets.yaml
```

Wait for PostgreSQL to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n biotech-terminal --timeout=300s
```

### 4. Deploy Application
```bash
kubectl apply -f deployment-api.yaml
kubectl apply -f deployment-ml.yaml
```

### 5. Configure Ingress
Update `ingress.yaml` with your domain:
```yaml
- host: api.your-domain.com  # Change this
```

Apply ingress:
```bash
kubectl apply -f ingress.yaml
```

## Deployment Order

**Important**: Apply manifests in this order to ensure dependencies are met:

1. `namespace.yaml` - Create namespace
2. `configmap.yaml` - Configuration and secrets
3. `statefulsets.yaml` - Database and cache
4. `deployment-api.yaml` - API servers
5. `deployment-ml.yaml` - ML workers
6. `ingress.yaml` - External access

## Verification

### Check Pod Status
```bash
kubectl get pods -n biotech-terminal
```

Expected output:
```
NAME                                        READY   STATUS    RESTARTS
biotech-terminal-api-xxxxx                  1/1     Running   0
biotech-terminal-api-xxxxx                  1/1     Running   0
biotech-terminal-api-xxxxx                  1/1     Running   0
biotech-terminal-ml-worker-xxxxx            1/1     Running   0
biotech-terminal-ml-worker-xxxxx            1/1     Running   0
postgres-0                                  1/1     Running   0
redis-xxxxx                                 1/1     Running   0
```

### Check Services
```bash
kubectl get svc -n biotech-terminal
```

### Test API Health
```bash
# Port forward to test locally
kubectl port-forward svc/biotech-terminal-api 8000:8000 -n biotech-terminal

# Test health endpoint
curl http://localhost:8000/health
```

### Check Logs
```bash
# API logs
kubectl logs -f deployment/biotech-terminal-api -n biotech-terminal

# ML worker logs
kubectl logs -f deployment/biotech-terminal-ml-worker -n biotech-terminal

# Database logs
kubectl logs -f statefulset/postgres -n biotech-terminal
```

## Scaling

### Manual Scaling
```bash
# Scale API to 5 replicas
kubectl scale deployment biotech-terminal-api --replicas=5 -n biotech-terminal

# Scale ML workers to 4 replicas
kubectl scale deployment biotech-terminal-ml-worker --replicas=4 -n biotech-terminal
```

### Auto-Scaling
The API deployment includes HorizontalPodAutoscaler (HPA):
- Min replicas: 3
- Max replicas: 10
- Target CPU: 70%
- Target Memory: 80%

Check HPA status:
```bash
kubectl get hpa -n biotech-terminal
```

## Resource Requirements

### Minimum Cluster Resources
- **Nodes**: 3 worker nodes
- **CPU**: 12 cores total
- **Memory**: 24GB total
- **Storage**: 100GB total

### Per-Component Resources

| Component | Replicas | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-----------|----------|-------------|----------------|-----------|--------------|
| API       | 3-10     | 1 core      | 2GB           | 2 cores   | 4GB         |
| ML Worker | 2        | 2 cores     | 4GB           | 4 cores   | 8GB         |
| PostgreSQL| 1        | 0.5 core    | 2GB           | 1 core    | 4GB         |
| Redis     | 1        | 0.25 core   | 512MB         | 0.5 core  | 1GB         |

## Storage

### Persistent Volumes
- **PostgreSQL**: 50GB (ReadWriteOnce)
- **ML Models**: 10GB (ReadOnlyMany)
- **Redis Cache**: 5GB (emptyDir)

### Backup Strategy
```bash
# Backup PostgreSQL
kubectl exec -n biotech-terminal postgres-0 -- \
  pg_dump -U biotech_user biotech_terminal > backup.sql

# Restore PostgreSQL
kubectl exec -i -n biotech-terminal postgres-0 -- \
  psql -U biotech_user biotech_terminal < backup.sql
```

## Monitoring

### Metrics
If using Prometheus:
```bash
# Port forward Prometheus
kubectl port-forward svc/prometheus-k8s 9090:9090 -n monitoring

# View metrics
curl http://localhost:9090/metrics
```

### Dashboard
If using Kubernetes Dashboard:
```bash
kubectl proxy
# Access at: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

## Troubleshooting

### Pod Not Starting
```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n biotech-terminal

# Check logs
kubectl logs <pod-name> -n biotech-terminal --previous
```

### Database Connection Issues
```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:15 --restart=Never -n biotech-terminal -- \
  psql -h postgres-service -U biotech_user -d biotech_terminal
```

### Memory Issues
```bash
# Check resource usage
kubectl top pods -n biotech-terminal
kubectl top nodes
```

### API Not Responding
```bash
# Check service endpoints
kubectl get endpoints biotech-terminal-api -n biotech-terminal

# Test internal connectivity
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n biotech-terminal -- \
  curl http://biotech-terminal-api:8000/health
```

## Security Best Practices

1. **Secrets Management**
   - Use external secret management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate secrets regularly
   - Never commit secrets to version control

2. **Network Policies**
   ```bash
   # Example: Restrict database access to API pods only
   kubectl apply -f - <<EOF
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: postgres-network-policy
     namespace: biotech-terminal
   spec:
     podSelector:
       matchLabels:
         app: postgres
     ingress:
     - from:
       - podSelector:
           matchLabels:
             component: api
   EOF
   ```

3. **RBAC**
   - Use service accounts with minimal permissions
   - Enable Pod Security Standards

4. **Image Security**
   - Use private container registry
   - Scan images for vulnerabilities
   - Use specific image tags (not `:latest`)

## Production Checklist

Before deploying to production:

- [ ] Update all secrets in `configmap.yaml`
- [ ] Configure domain name in `ingress.yaml`
- [ ] Set up TLS certificates (Let's Encrypt or custom)
- [ ] Configure backup strategy for PostgreSQL
- [ ] Set up monitoring and alerting
- [ ] Configure resource limits appropriately
- [ ] Enable network policies
- [ ] Review security settings
- [ ] Test disaster recovery procedures
- [ ] Document runbooks for common issues
- [ ] Set up log aggregation (ELK, Loki, etc.)

## Updates and Rollbacks

### Rolling Update
```bash
# Update API image
kubectl set image deployment/biotech-terminal-api \
  api=biotech-terminal/api:v2.0.0 \
  -n biotech-terminal

# Watch rollout
kubectl rollout status deployment/biotech-terminal-api -n biotech-terminal
```

### Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/biotech-terminal-api -n biotech-terminal

# Rollback to specific revision
kubectl rollout undo deployment/biotech-terminal-api --to-revision=2 -n biotech-terminal
```

## Clean Up

```bash
# Delete all resources
kubectl delete namespace biotech-terminal

# Or delete specific resources
kubectl delete -f ingress.yaml
kubectl delete -f deployment-ml.yaml
kubectl delete -f deployment-api.yaml
kubectl delete -f statefulsets.yaml
kubectl delete -f configmap.yaml
kubectl delete -f namespace.yaml
```

## Support

For issues or questions:
- Check logs: `kubectl logs -n biotech-terminal`
- Review events: `kubectl get events -n biotech-terminal`
- Open an issue on GitHub
- Contact platform team

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [PostgreSQL on Kubernetes](https://www.postgresql.org/docs/current/index.html)
- [Ingress-NGINX Controller](https://kubernetes.github.io/ingress-nginx/)
