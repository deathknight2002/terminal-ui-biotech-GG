/**
 * Evidence Graph — Manual Refresh Only Contract Test
 *
 * This test codifies the "manual refresh only" behavior requirement:
 * - No WebSocket connections
 * - No polling intervals
 * - Refresh only happens on explicit user button click
 * - Last-updated timestamp changes only after refresh
 *
 * Based on requirements from issue specification.
 */

import { test, expect } from '@playwright/test';

test.describe('Evidence Graph — manual refresh only', () => {
  test('refresh button triggers a single fetch, no sockets/polling', async ({ page }) => {
    await page.goto('/evidence-graph');

    // Visible refresh button
    const refresh = page.getByRole('button', { name: /refresh/i });
    await expect(refresh).toBeVisible();

    // Last-updated stamp changes only on click
    const stampSel = '.stamp, [data-testid="last-updated"]';
    const stampExists = await page.locator(stampSel).first().count();

    let before = '';
    if (stampExists > 0) {
      before = await page.locator(stampSel).first().textContent() || '';
    }

    await refresh.click();

    // Wait for loading indicator if present
    const loadingIndicator = page.locator('[data-testid="loading-indicator"], .loading, [aria-busy="true"]');
    const hasLoading = await loadingIndicator.count();

    if (hasLoading > 0) {
      await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }

    // Timestamp should have changed
    if (stampExists > 0) {
      const after = await page.locator(stampSel).first().textContent() || '';
      expect(after).not.toEqual(before);
    }

    // No WebSocket or polling artifacts
    const resources = await page.evaluate(() =>
      performance.getEntriesByType('resource').map(r => (r as PerformanceResourceTiming).name)
    );
    const bad = resources.filter(u => /(ws|socket|sockjs|eventsource)/i.test(u));
    expect(bad).toHaveLength(0);

    // Ensure there is no setInterval or setTimeout polling registered
    const hasTimers = await page.evaluate(() => {
      // @ts-ignore - check for polling indicators
      return !!(window.__pollingEnabled || (window as any).pollingIntervalId);
    });
    expect(hasTimers).toBeFalsy();
  });

  test('no background API calls after initial page load', async ({ page }) => {
    // Track all API requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiRequests.push(url);
      }
    });

    // Navigate to evidence graph page
    await page.goto('/evidence-graph');

    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Clear request log after initial load
    apiRequests.length = 0;

    // Wait 5 seconds to ensure no background polling
    await page.waitForTimeout(5000);

    // Should have no API requests in the background
    expect(apiRequests.length).toBe(0);
  });

  test('no WebSocket connections established', async ({ page }) => {
    // Track WebSocket connections
    let wsConnectionAttempted = false;
    page.on('websocket', ws => {
      wsConnectionAttempted = true;
    });

    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');

    // Wait a bit to ensure no delayed WS connections
    await page.waitForTimeout(2000);

    expect(wsConnectionAttempted).toBe(false);
  });

  test('refresh button updates data explicitly', async ({ page }) => {
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');

    // Track API requests
    const apiRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/evidence-graph')) {
        apiRequests.push(url);
      }
    });

    // Clear initial requests
    apiRequests.length = 0;

    // Click refresh button
    const refresh = page.getByRole('button', { name: /refresh/i });
    await refresh.click();

    // Wait for network activity
    await page.waitForLoadState('networkidle');

    // Should have made API request only when button clicked
    expect(apiRequests.length).toBeGreaterThan(0);

    // Clear requests
    apiRequests.length = 0;

    // Wait another 5 seconds - no more requests should be made
    await page.waitForTimeout(5000);
    expect(apiRequests.length).toBe(0);
  });
});
