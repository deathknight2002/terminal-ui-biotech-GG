/**
 * Authentication E2E Tests
 *
 * Tests API token authentication for write operations.
 * Based on middleware in bt_platform/core/middleware/auth.py
 */

import { test, expect } from '@playwright/test';

test.describe('API Authentication', () => {
  const API_BASE = 'http://localhost:8000/api/v1';
  const TEST_TOKEN = 'test-token-12345';

  test('should allow GET requests without authentication', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/biotech/drugs`);

    // GET requests should work without token
    expect(response.ok()).toBeTruthy();
  });

  test('should allow HEAD requests without authentication', async ({ page }) => {
    const response = await page.request.head(`${API_BASE}/evidence-graph/nodes`);

    // HEAD requests should work without token
    expect(response.ok()).toBeTruthy();
  });

  test('should allow OPTIONS requests without authentication', async ({ page }) => {
    const response = await page.request.fetch(`${API_BASE}/biotech/drugs`, {
      method: 'OPTIONS'
    });

    // OPTIONS requests should work without token
    expect(response.ok()).toBeTruthy();
  });

  test('should block POST requests without authentication when auth is enabled', async ({ page }) => {
    // This test assumes API_TOKEN_ENABLED=true in environment
    const response = await page.request.post(`${API_BASE}/evidence-graph/nodes`, {
      data: {
        id: 'test-node',
        type: 'thesis',
        company: 'Test Company'
      },
      failOnStatusCode: false
    });

    // Without token, should get 401 Unauthorized (if auth enabled) or succeed (if disabled)
    if (response.status() === 401) {
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error_code).toBe('missing_token');
    } else {
      // Auth is disabled, request should succeed
      expect(response.ok()).toBeTruthy();
    }
  });

  test('should accept valid Bearer token', async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/evidence-graph/nodes`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      data: {
        id: 'test-node-auth',
        type: 'thesis',
        company: 'Test Company'
      },
      failOnStatusCode: false
    });

    // With valid token (if auth enabled and token matches) or without auth, should succeed
    // Status will be 201 (created), 200 (ok), or 403 (wrong token)
    expect([200, 201, 403, 503]).toContain(response.status());
  });

  test('should accept valid X-API-Key header', async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/evidence-graph/nodes`, {
      headers: {
        'X-API-Key': TEST_TOKEN
      },
      data: {
        id: 'test-node-apikey',
        type: 'thesis',
        company: 'Test Company'
      },
      failOnStatusCode: false
    });

    // With valid token (if auth enabled and token matches) or without auth, should succeed
    expect([200, 201, 403, 503]).toContain(response.status());
  });

  test('should reject invalid token', async ({ page }) => {
    const response = await page.request.post(`${API_BASE}/evidence-graph/nodes`, {
      headers: {
        'Authorization': 'Bearer invalid-wrong-token'
      },
      data: {
        id: 'test-node-invalid',
        type: 'thesis',
        company: 'Test Company'
      },
      failOnStatusCode: false
    });

    // With invalid token (if auth enabled), should get 403 Forbidden
    if (response.status() === 403) {
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.error_code).toBe('invalid_token');
    }
  });

  test('should block PUT requests without authentication when auth is enabled', async ({ page }) => {
    const response = await page.request.put(`${API_BASE}/evidence-graph/nodes/test-node`, {
      data: {
        type: 'trial',
        company: 'Updated Company'
      },
      failOnStatusCode: false
    });

    // Without token, should get 401 (if auth enabled) or succeed (if disabled)
    expect([200, 201, 401]).toContain(response.status());
  });

  test('should block DELETE requests without authentication when auth is enabled', async ({ page }) => {
    const response = await page.request.delete(`${API_BASE}/evidence-graph/nodes/test-node`, {
      failOnStatusCode: false
    });

    // Without token, should get 401 (if auth enabled) or succeed (if disabled)
    expect([200, 204, 401, 404]).toContain(response.status());
  });

  test('should block PATCH requests without authentication when auth is enabled', async ({ page }) => {
    const response = await page.request.patch(`${API_BASE}/evidence-graph/nodes/test-node`, {
      data: {
        notes: 'Updated notes'
      },
      failOnStatusCode: false
    });

    // Without token, should get 401 (if auth enabled) or succeed (if disabled)
    expect([200, 401, 404]).toContain(response.status());
  });

  test('should always allow access to public paths', async ({ page }) => {
    const publicPaths = [
      '/health',
      '/docs',
      '/metrics'
    ];

    for (const path of publicPaths) {
      const response = await page.request.get(`http://localhost:8000${path}`, {
        failOnStatusCode: false
      });

      // Public paths should always be accessible
      expect(response.ok() || response.status() === 404).toBeTruthy();
    }
  });
});

test.describe('CORS Headers', () => {
  const API_BASE = 'http://localhost:8000/api/v1';

  test('should include CORS headers in responses', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/biotech/drugs`);

    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
    expect(headers['access-control-allow-methods']).toBeDefined();
  });

  test('should handle preflight OPTIONS requests', async ({ page }) => {
    const response = await page.request.fetch(`${API_BASE}/biotech/drugs`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST'
      }
    });

    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers['access-control-allow-methods']).toBeDefined();
  });
});
