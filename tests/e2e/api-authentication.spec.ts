/**
 * API Authentication E2E Tests
 * 
 * Tests for API token authentication middleware.
 * Only write operations (POST, PUT, DELETE, PATCH) require authentication.
 * Read operations (GET, HEAD, OPTIONS) are public.
 */

import { test, expect } from '@playwright/test';

test.describe('API Authentication - Public Endpoints', () => {
  test('should allow GET requests without authentication', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });

  test('should allow HEAD requests without authentication', async ({ page }) => {
    const response = await page.request.head('http://localhost:8000/api/v1/evidence-graph/nodes');
    
    expect(response.status()).toBe(200);
  });

  test('should allow OPTIONS requests without authentication', async ({ page }) => {
    const response = await page.request.fetch('http://localhost:8000/api/v1/evidence-graph/nodes', {
      method: 'OPTIONS'
    });
    
    expect(response.status()).toBeLessThan(400);
  });

  test('should allow health check without authentication', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/health');
    
    expect(response.ok()).toBeTruthy();
  });

  test('should allow metrics endpoint without authentication', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/metrics');
    
    expect(response.ok()).toBeTruthy();
  });

  test('should allow API docs without authentication', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/docs');
    
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('API Authentication - Protected Endpoints', () => {
  test('should block POST requests without authentication when auth is enabled', async ({ page }) => {
    // Note: This test assumes API_TOKEN_ENABLED=true in environment
    // Skip test if auth is disabled
    const healthResponse = await page.request.get('http://localhost:8000/health');
    const healthData = await healthResponse.json();
    
    // Try to POST without auth
    const response = await page.request.post('http://localhost:8000/api/v1/evidence-graph/nodes', {
      data: {
        id: 'test-node',
        type: 'thesis',
        label: 'Test Node'
      }
    });
    
    // Should be rejected if auth is enabled
    if (process.env.API_TOKEN_ENABLED === 'true') {
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error_code).toBe('missing_token');
    }
  });

  test('should block PUT requests without authentication when auth is enabled', async ({ page }) => {
    const response = await page.request.put('http://localhost:8000/api/v1/evidence-graph/nodes/test', {
      data: {
        label: 'Updated Node'
      }
    });
    
    if (process.env.API_TOKEN_ENABLED === 'true') {
      expect(response.status()).toBe(401);
    }
  });

  test('should block DELETE requests without authentication when auth is enabled', async ({ page }) => {
    const response = await page.request.delete('http://localhost:8000/api/v1/evidence-graph/nodes/test');
    
    if (process.env.API_TOKEN_ENABLED === 'true') {
      expect(response.status()).toBe(401);
    }
  });

  test('should block PATCH requests without authentication when auth is enabled', async ({ page }) => {
    const response = await page.request.patch('http://localhost:8000/api/v1/evidence-graph/nodes/test', {
      data: {
        label: 'Patched Node'
      }
    });
    
    if (process.env.API_TOKEN_ENABLED === 'true') {
      expect(response.status()).toBe(401);
    }
  });
});

test.describe('API Authentication - With Valid Token', () => {
  const API_TOKEN = process.env.API_TOKEN || 'test-token';

  test('should allow POST with valid Bearer token', async ({ page }) => {
    if (process.env.API_TOKEN_ENABLED !== 'true') {
      test.skip();
    }

    const response = await page.request.post('http://localhost:8000/api/v1/evidence-graph/nodes', {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      data: {
        id: 'test-node-auth',
        type: 'thesis',
        label: 'Test Node with Auth'
      }
    });
    
    // Should succeed with valid token
    expect(response.status()).toBeLessThan(400);
  });

  test('should allow POST with valid X-API-Key header', async ({ page }) => {
    if (process.env.API_TOKEN_ENABLED !== 'true') {
      test.skip();
    }

    const response = await page.request.post('http://localhost:8000/api/v1/evidence-graph/nodes', {
      headers: {
        'X-API-Key': API_TOKEN
      },
      data: {
        id: 'test-node-apikey',
        type: 'thesis',
        label: 'Test Node with API Key'
      }
    });
    
    expect(response.status()).toBeLessThan(400);
  });

  test('should reject POST with invalid token', async ({ page }) => {
    if (process.env.API_TOKEN_ENABLED !== 'true') {
      test.skip();
    }

    const response = await page.request.post('http://localhost:8000/api/v1/evidence-graph/nodes', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      },
      data: {
        id: 'test-node-invalid',
        type: 'thesis',
        label: 'Test Node'
      }
    });
    
    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error_code).toBe('invalid_token');
  });
});

test.describe('API Authentication - CORS Headers', () => {
  test('should include CORS headers in responses', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    
    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
  });

  test('should handle preflight OPTIONS requests', async ({ page }) => {
    const response = await page.request.fetch('http://localhost:8000/api/v1/evidence-graph/nodes', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST'
      }
    });
    
    expect(response.status()).toBeLessThan(400);
    const headers = response.headers();
    expect(headers['access-control-allow-methods']).toBeDefined();
  });
});
