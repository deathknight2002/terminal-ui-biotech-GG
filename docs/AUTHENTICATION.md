# API Token Authentication Guide

This guide covers the API token authentication system for protecting write operations in the Biotech Terminal Platform.

## Overview

The platform implements optional API token authentication for write operations:
- **Read operations** (GET, HEAD, OPTIONS) are always public
- **Write operations** (POST, PUT, DELETE, PATCH) require authentication when enabled
- **Public endpoints** (health, docs, metrics) are always accessible
- **Token-based**: Simple bearer token or API key authentication

## Quick Start

### 1. Enable Authentication

Set environment variables:

```bash
# Enable API token authentication
API_TOKEN_ENABLED=true

# Set your secure token (change this!)
API_TOKEN=your-secure-random-token-here-change-me
```

### 2. Generate a Secure Token

```bash
# Generate a random token (32 characters)
openssl rand -hex 32

# Or use Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Make Authenticated Requests

#### Using Bearer Token (Recommended)

```bash
curl -X POST http://localhost:8000/api/v1/evidence-graph/nodes \
  -H "Authorization: Bearer your-secure-random-token-here-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-node",
    "type": "thesis",
    "company": "Test Company"
  }'
```

#### Using X-API-Key Header

```bash
curl -X POST http://localhost:8000/api/v1/evidence-graph/nodes \
  -H "X-API-Key: your-secure-random-token-here-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-node",
    "type": "thesis",
    "company": "Test Company"
  }'
```

## Configuration

### Environment Variables

```bash
# Enable/disable authentication
API_TOKEN_ENABLED=false  # Default: false (authentication disabled)

# API token for write operations
API_TOKEN=  # Default: empty (no token required)
```

### Configuration File

In `bt_platform/core/config.py`:

```python
class Settings(BaseSettings):
    # Authentication
    API_TOKEN_ENABLED: bool = False
    API_TOKEN: str = ""
```

## How It Works

### Middleware

The `APITokenAuthMiddleware` in `bt_platform/core/middleware/auth.py` intercepts requests:

```python
from bt_platform.core.middleware.auth import APITokenAuthMiddleware

# Added automatically in app.py
app.add_middleware(
    APITokenAuthMiddleware,
    enabled=settings.API_TOKEN_ENABLED,
    api_token=settings.API_TOKEN
)
```

### Protected Methods

Only these HTTP methods require authentication:
- `POST` - Create resources
- `PUT` - Update resources
- `DELETE` - Delete resources
- `PATCH` - Partial update resources

### Public Methods

These methods are always allowed without authentication:
- `GET` - Read data
- `HEAD` - Check resources
- `OPTIONS` - CORS preflight

### Public Paths

These paths are always accessible without authentication:
- `/health` - Health check
- `/docs` - API documentation
- `/redoc` - Alternative API docs
- `/openapi.json` - OpenAPI schema
- `/metrics` - Prometheus metrics

## Authentication Flow

```mermaid
graph TD
    A[Request] --> B{Auth Enabled?}
    B -->|No| C[Allow Request]
    B -->|Yes| D{Public Path?}
    D -->|Yes| C
    D -->|No| E{GET/HEAD/OPTIONS?}
    E -->|Yes| C
    E -->|No| F{Token Present?}
    F -->|No| G[401 Unauthorized]
    F -->|Yes| H{Token Valid?}
    H -->|No| I[403 Forbidden]
    H -->|Yes| C
```

## Error Responses

### 401 Unauthorized (Missing Token)

```json
{
  "detail": "Authentication required. Provide API token via Authorization or X-API-Key header.",
  "error_code": "missing_token"
}
```

Response headers:
```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer
Content-Type: application/json
```

### 403 Forbidden (Invalid Token)

```json
{
  "detail": "Invalid API token",
  "error_code": "invalid_token"
}
```

### 503 Service Unavailable (Configuration Error)

```json
{
  "detail": "Server configuration error. Contact administrator.",
  "error_code": "config_error"
}
```

This occurs when `API_TOKEN_ENABLED=true` but `API_TOKEN` is not set.

## Usage Examples

### JavaScript/TypeScript

```typescript
const API_TOKEN = 'your-secure-random-token-here-change-me';

// Using fetch with Bearer token
async function createNode(nodeData) {
  const response = await fetch('http://localhost:8000/api/v1/evidence-graph/nodes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nodeData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Using fetch with X-API-Key
async function updateNode(nodeId, updates) {
  const response = await fetch(`http://localhost:8000/api/v1/evidence-graph/nodes/${nodeId}`, {
    method: 'PUT',
    headers: {
      'X-API-Key': API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
  
  return await response.json();
}
```

### Python

```python
import requests

API_TOKEN = 'your-secure-random-token-here-change-me'
BASE_URL = 'http://localhost:8000/api/v1'

# Using Bearer token
def create_node(node_data):
    response = requests.post(
        f'{BASE_URL}/evidence-graph/nodes',
        headers={
            'Authorization': f'Bearer {API_TOKEN}',
            'Content-Type': 'application/json'
        },
        json=node_data
    )
    response.raise_for_status()
    return response.json()

# Using X-API-Key
def update_node(node_id, updates):
    response = requests.put(
        f'{BASE_URL}/evidence-graph/nodes/{node_id}',
        headers={
            'X-API-Key': API_TOKEN,
            'Content-Type': 'application/json'
        },
        json=updates
    )
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
# Create node
curl -X POST http://localhost:8000/api/v1/evidence-graph/nodes \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"id": "node-1", "type": "thesis", "company": "Test Co"}'

# Update node
curl -X PUT http://localhost:8000/api/v1/evidence-graph/nodes/node-1 \
  -H "X-API-Key: your-token" \
  -H "Content-Type: application/json" \
  -d '{"type": "thesis", "company": "Updated Co"}'

# Delete node
curl -X DELETE http://localhost:8000/api/v1/evidence-graph/nodes/node-1 \
  -H "Authorization: Bearer your-token"
```

## Testing

### Disable Authentication for Development

```bash
# .env file
API_TOKEN_ENABLED=false
```

### Enable Authentication for Testing

```bash
# .env file
API_TOKEN_ENABLED=true
API_TOKEN=test-token-12345
```

### Unit Tests

```python
import pytest
from fastapi.testclient import TestClient
from bt_platform.core.app import app

client = TestClient(app)

def test_get_without_auth():
    """GET requests should work without authentication"""
    response = client.get("/api/v1/evidence-graph/nodes")
    assert response.status_code == 200

def test_post_without_auth():
    """POST requests should require authentication"""
    response = client.post(
        "/api/v1/evidence-graph/nodes",
        json={"id": "test", "type": "thesis", "company": "Test"}
    )
    # Should fail if auth is enabled
    assert response.status_code in [201, 401]

def test_post_with_valid_token():
    """POST requests should succeed with valid token"""
    response = client.post(
        "/api/v1/evidence-graph/nodes",
        headers={"Authorization": "Bearer test-token-12345"},
        json={"id": "test", "type": "thesis", "company": "Test"}
    )
    assert response.status_code in [200, 201]

def test_post_with_invalid_token():
    """POST requests should fail with invalid token"""
    response = client.post(
        "/api/v1/evidence-graph/nodes",
        headers={"Authorization": "Bearer wrong-token"},
        json={"id": "test", "type": "thesis", "company": "Test"}
    )
    assert response.status_code == 403
```

## Advanced Usage

### Per-Endpoint Authentication

Use the `require_api_token` dependency for explicit authentication:

```python
from fastapi import Depends
from bt_platform.core.middleware.auth import require_api_token

@router.post("/sensitive-data", dependencies=[Depends(require_api_token)])
async def create_sensitive_data(data: dict):
    """This endpoint always requires authentication"""
    return {"message": "Data created"}
```

### Custom Token Validation

Extend the middleware for custom validation logic:

```python
from bt_platform.core.middleware.auth import APITokenAuthMiddleware

class CustomAuthMiddleware(APITokenAuthMiddleware):
    async def dispatch(self, request, call_next):
        # Add custom validation logic
        token = self._extract_token(request)
        
        if token and self._is_revoked(token):
            return JSONResponse(
                status_code=403,
                content={"detail": "Token has been revoked"}
            )
        
        return await super().dispatch(request, call_next)
    
    def _is_revoked(self, token: str) -> bool:
        # Check against revocation list
        return token in self.revoked_tokens
```

### Multiple Tokens

Support multiple valid tokens:

```python
class MultiTokenAuthMiddleware(APITokenAuthMiddleware):
    def __init__(self, app, enabled: bool = None, api_tokens: list[str] = None):
        super().__init__(app, enabled, None)
        self.api_tokens = api_tokens or []
    
    async def dispatch(self, request, call_next):
        if not self.enabled:
            return await call_next(request)
        
        # ... other checks ...
        
        # Validate against multiple tokens
        if token not in self.api_tokens:
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid API token"}
            )
        
        return await call_next(request)
```

## Security Best Practices

### Token Management

1. **Use strong tokens**: At least 32 characters, random
2. **Rotate tokens regularly**: Change tokens periodically
3. **Use environment variables**: Never commit tokens to code
4. **Different tokens per environment**: Separate dev/staging/production
5. **Limit token scope**: Use per-service tokens if possible

### Storage

1. **Environment variables**: Store in `.env` file (gitignored)
2. **Secrets management**: Use AWS Secrets Manager, HashiCorp Vault, etc.
3. **CI/CD**: Use encrypted environment variables
4. **Documentation**: Keep token locations documented

### Network Security

1. **HTTPS only**: Always use HTTPS in production
2. **Network isolation**: Restrict API access to trusted networks
3. **Rate limiting**: Implement rate limiting (see `bt_platform/core/utils/ratelimit.py`)
4. **WAF**: Use Web Application Firewall for additional protection

### Monitoring

1. **Log authentication attempts**: Monitor for brute force attacks
2. **Alert on failures**: Set up alerts for repeated auth failures
3. **Track token usage**: Monitor which tokens are being used
4. **Audit logs**: Keep audit trail of authenticated operations

## Troubleshooting

### "Authentication required" on GET requests

- Check that authentication is actually required for the endpoint
- Verify the middleware is configured correctly
- Check if the path is in PUBLIC_PATHS

### "Invalid API token" errors

- Verify token matches exactly (no extra spaces)
- Check environment variable is loaded correctly
- Verify token is being sent in correct header format
- Check if token contains special characters that need encoding

### Authentication works locally but not in production

- Verify environment variables are set in production
- Check HTTPS is being used
- Verify CORS headers allow Authorization header
- Check for proxy/load balancer stripping headers

### Token appears in logs

- Review logging configuration
- Ensure sensitive headers are filtered
- Update logging middleware to exclude Authorization header
- Check Sentry scrubbing configuration

## Migration Guide

### Enabling Authentication on Existing Installation

1. **Announce planned change**: Notify users authentication will be required
2. **Generate token**: Create secure token
3. **Set environment variables**: Update production configuration
4. **Test**: Verify authentication works in staging
5. **Deploy**: Enable authentication in production
6. **Distribute token**: Provide token to authorized users
7. **Monitor**: Watch for authentication errors

### Disabling Authentication

1. **Update environment**: Set `API_TOKEN_ENABLED=false`
2. **Restart service**: Restart API server
3. **Verify**: Test that endpoints work without token
4. **Clean up**: Remove token from configuration (keep in secure storage)

## FAQs

**Q: Can I use OAuth2 instead of API tokens?**
A: The current implementation uses simple token auth. For OAuth2, you would need to implement additional authentication providers.

**Q: Can I have different tokens for different endpoints?**
A: The default implementation uses a single token. Implement custom middleware for per-endpoint tokens.

**Q: Is the token encrypted in transit?**
A: Tokens are sent as plain text in headers. Always use HTTPS in production.

**Q: Can I use JWT tokens?**
A: The default implementation doesn't validate JWT structure. You can extend the middleware to validate JWT tokens.

**Q: What if I forget my token?**
A: Generate a new token and update the `API_TOKEN` environment variable.

## Resources

- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [HTTP Authentication Schemes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)
