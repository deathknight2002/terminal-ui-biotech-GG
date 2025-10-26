/**
 * Health Check E2E Tests
 *
 * Basic smoke tests to ensure the platform is running correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Platform Health Checks', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');

    // Should have a title
    await expect(page).toHaveTitle(/Biotech Terminal/i);
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Check for common navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should respond to API health check', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/health');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});

test.describe('API Endpoints', () => {
  test('should access evidence graph API', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should receive proper CORS headers', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');

    const headers = response.headers();
    expect(headers['access-control-allow-origin']).toBeDefined();
  });
});
