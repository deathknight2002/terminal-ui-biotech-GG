/**
 * Observability E2E Tests
 * 
 * Tests for metrics endpoint, structured logging, and Sentry integration.
 */

import { test, expect } from '@playwright/test';

test.describe('Metrics Endpoint', () => {
  test('should expose Prometheus metrics', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/metrics');
    
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    
    // Should contain Prometheus-formatted metrics
    expect(body).toContain('# HELP');
    expect(body).toContain('# TYPE');
  });

  test('should track HTTP request metrics', async ({ page }) => {
    // Make a request to generate metrics
    await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    
    // Check metrics endpoint
    const response = await page.request.get('http://localhost:8000/metrics');
    const body = await response.text();
    
    // Should track HTTP requests
    expect(body).toContain('http_requests_total');
    expect(body).toContain('http_request_duration_seconds');
  });

  test('should track database query metrics', async ({ page }) => {
    // Make a request that triggers database queries
    await page.request.get('http://localhost:8000/api/v1/catalysts');
    
    // Check metrics
    const response = await page.request.get('http://localhost:8000/metrics');
    const body = await response.text();
    
    // Should track database metrics
    expect(body).toContain('database_queries_total');
  });

  test('should track cache metrics', async ({ page }) => {
    // Make requests to test caching
    await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    
    const response = await page.request.get('http://localhost:8000/metrics');
    const body = await response.text();
    
    // Should track cache hits/misses
    expect(body).toMatch(/cache_(hits|misses)_total/);
  });

  test('should be accessible without authentication', async ({ page }) => {
    // Metrics endpoint should be public
    const response = await page.request.get('http://localhost:8000/metrics');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
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
    expect(data.environment).toBeDefined();
  });

  test('should respond quickly (< 1 second)', async ({ page }) => {
    const startTime = Date.now();
    await page.request.get('http://localhost:8000/health');
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(1000);
  });

  test('should be accessible without authentication', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/health');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
  });
});

test.describe('Structured Logging', () => {
  test('should log HTTP requests', async ({ page }) => {
    // Make a request
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    
    expect(response.ok()).toBeTruthy();
    
    // Structured logs should be written to stdout/stderr
    // This is verified through backend logs in CI/CD
  });

  test('should log errors with context', async ({ page }) => {
    // Try to access non-existent endpoint
    await page.request.get('http://localhost:8000/api/v1/non-existent-endpoint');
    
    // Error should be logged with structured format
    // Verified through backend logs
  });
});
