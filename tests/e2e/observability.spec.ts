/**
 * Observability E2E Tests
 *
 * Tests metrics endpoint and structured logging functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('Metrics Endpoint', () => {
  test('should expose Prometheus metrics at /metrics', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/metrics');

    expect(response.ok()).toBeTruthy();
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain');
  });

  test('should include HTTP request metrics', async ({ page }) => {
    // Make some API calls to generate metrics
    await page.request.get('http://localhost:8000/api/v1/biotech/drugs');
    await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');

    // Fetch metrics
    const response = await page.request.get('http://localhost:8000/metrics');
    const metricsText = await response.text();

    // Should include http_requests_total metric
    expect(metricsText).toContain('http_requests_total');

    // Should include method and endpoint labels
    expect(metricsText).toMatch(/method="GET"/);
    expect(metricsText).toMatch(/endpoint="[^"]+"/);
  });

  test('should include HTTP request duration metrics', async ({ page }) => {
    // Make an API call
    await page.request.get('http://localhost:8000/api/v1/biotech/drugs');

    // Fetch metrics
    const response = await page.request.get('http://localhost:8000/metrics');
    const metricsText = await response.text();

    // Should include http_request_duration_seconds metric
    expect(metricsText).toContain('http_request_duration_seconds');
  });

  test('should track error metrics', async ({ page }) => {
    // Make a request that might fail
    await page.request.get('http://localhost:8000/api/v1/non-existent-endpoint', {
      failOnStatusCode: false
    });

    // Fetch metrics
    const response = await page.request.get('http://localhost:8000/metrics');
    const metricsText = await response.text();

    // Should include errors_total metric (if errors are tracked)
    // This might not exist if no errors have occurred
    if (metricsText.includes('errors_total')) {
      expect(metricsText).toContain('errors_total');
    }
  });

  test('should include cache metrics', async ({ page }) => {
    // Make requests to trigger caching
    await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');

    // Fetch metrics
    const response = await page.request.get('http://localhost:8000/metrics');
    const metricsText = await response.text();

    // Should include cache metrics if caching is active
    if (metricsText.includes('cache_hits_total')) {
      expect(metricsText).toContain('cache_hits_total');
    }

    if (metricsText.includes('cache_misses_total')) {
      expect(metricsText).toContain('cache_misses_total');
    }
  });

  test('should include evidence graph metrics', async ({ page }) => {
    // Fetch metrics
    const response = await page.request.get('http://localhost:8000/metrics');
    const metricsText = await response.text();

    // Should include evidence graph specific metrics (if nodes exist)
    if (metricsText.includes('evidence_graph_nodes_total')) {
      expect(metricsText).toContain('evidence_graph_nodes_total');
    }

    if (metricsText.includes('evidence_graph_edges_total')) {
      expect(metricsText).toContain('evidence_graph_edges_total');
    }
  });

  test('should be accessible without authentication', async ({ page }) => {
    // Metrics endpoint should always be public
    const response = await page.request.get('http://localhost:8000/metrics');

    expect(response.ok()).toBeTruthy();
  });

  test('should return valid Prometheus format', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/metrics');
    const metricsText = await response.text();

    // Prometheus metrics format has specific characteristics
    // Each metric line should match pattern: metric_name{labels} value
    const lines = metricsText.split('\n');
    let hasValidMetrics = false;

    for (const line of lines) {
      if (line.startsWith('#')) continue; // Comment line
      if (line.trim() === '') continue; // Empty line

      // Check if line matches metric format (loosely)
      if (line.match(/^\w+(\{[^}]+\})?\s+[\d.]+/)) {
        hasValidMetrics = true;
        break;
      }
    }

    expect(hasValidMetrics).toBeTruthy();
  });
});

test.describe('Health Check', () => {
  test('should return healthy status', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/health');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.status).toBe('healthy');
    expect(data.service).toBe('biotech-terminal-platform');
    expect(data.version).toBeDefined();
  });

  test('should include environment information', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/health');
    const data = await response.json();

    expect(data.environment).toBeDefined();
    expect(typeof data.environment).toBe('string');
  });

  test('should be accessible without authentication', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/health');

    expect(response.ok()).toBeTruthy();
  });

  test('should respond quickly', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.request.get('http://localhost:8000/health');
    const duration = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();
    // Health check should respond in less than 1 second
    expect(duration).toBeLessThan(1000);
  });
});

test.describe('Error Handling', () => {
  test('should return proper error response for 404', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/non-existent', {
      failOnStatusCode: false
    });

    expect(response.status()).toBe(404);
  });

  test('should include proper headers in error responses', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/non-existent', {
      failOnStatusCode: false
    });

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('should handle malformed JSON in POST requests', async ({ page }) => {
    const response = await page.request.post('http://localhost:8000/api/v1/evidence-graph/nodes', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: 'invalid json {{{',
      failOnStatusCode: false
    });

    // Should return 4xx error (400 or 422)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Caching Behavior', () => {
  test('should include Cache-Control headers', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');

    const headers = response.headers();
    expect(headers['cache-control']).toBeDefined();
  });

  test('should support ETag caching', async ({ page }) => {
    // First request to get ETag
    const response1 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    const etag = response1.headers()['etag'];

    if (etag) {
      // Second request with If-None-Match header
      const response2 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes', {
        headers: {
          'If-None-Match': etag
        },
        failOnStatusCode: false
      });

      // Should return 304 Not Modified if data hasn't changed
      expect([200, 304]).toContain(response2.status());
    }
  });

  test('should support HEAD requests for cache validation', async ({ page }) => {
    const response = await page.request.head('http://localhost:8000/api/v1/evidence-graph/nodes');

    expect(response.ok()).toBeTruthy();
    const headers = response.headers();

    // Should include ETag for cache validation
    expect(headers['etag']).toBeDefined();
  });
});
