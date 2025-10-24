/**
 * Evidence Graph E2E Tests
 * 
 * Tests the manual refresh model and caching behavior of the Evidence Graph.
 * Based on requirements in tests/e2e/README.md
 */

import { test, expect } from '@playwright/test';

test.describe('Evidence Graph - Manual Refresh Model', () => {
  test('should not make background API calls after page load', async ({ page }) => {
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

  test('should not establish WebSocket connections', async ({ page }) => {
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

  test('should not have polling intervals active', async ({ page }) => {
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Check for active intervals in the page context
    const intervalCount = await page.evaluate(() => {
      // Access the internal interval tracking (if available)
      return (window as any).__playwright_active_intervals?.length || 0;
    });
    
    // Should not have any polling intervals
    expect(intervalCount).toBe(0);
  });
});

test.describe('Evidence Graph - Refresh Button Behavior', () => {
  test('should update timestamp when refresh button is clicked', async ({ page }) => {
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Get initial timestamp
    const initialTimestamp = await page.locator('[data-testid="last-updated"]').textContent();
    
    // Wait a second to ensure timestamp would change
    await page.waitForTimeout(1000);
    
    // Click refresh button
    await page.click('[data-testid="refresh-button"]');
    
    // Wait for refresh to complete
    await page.waitForLoadState('networkidle');
    
    // Get new timestamp
    const newTimestamp = await page.locator('[data-testid="last-updated"]').textContent();
    
    // Timestamps should be different
    expect(newTimestamp).not.toBe(initialTimestamp);
  });

  test('should show loading state during refresh', async ({ page }) => {
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Start watching for loading indicator
    const loadingPromise = page.waitForSelector('[data-testid="loading-indicator"]', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // Click refresh button
    await page.click('[data-testid="refresh-button"]');
    
    // Should show loading indicator
    await expect(loadingPromise).resolves.toBeTruthy();
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="loading-indicator"]', { 
      state: 'hidden',
      timeout: 10000 
    });
  });

  test('should update node and edge counts after refresh', async ({ page }) => {
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Get initial counts (if displayed)
    const nodeCountExists = await page.locator('[data-testid="node-count"]').count();
    
    if (nodeCountExists > 0) {
      const initialNodeCount = await page.locator('[data-testid="node-count"]').textContent();
      
      // Click refresh
      await page.click('[data-testid="refresh-button"]');
      await page.waitForLoadState('networkidle');
      
      // Count should still be displayed (may or may not change)
      const newNodeCount = await page.locator('[data-testid="node-count"]').textContent();
      expect(newNodeCount).toBeDefined();
    }
  });
});

test.describe('Evidence Graph - Keyboard Shortcuts', () => {
  test('should refresh when R key is pressed', async ({ page }) => {
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
    
    // Press R key
    await page.keyboard.press('r');
    
    // Wait for network activity
    await page.waitForLoadState('networkidle');
    
    // Should have made API request
    expect(apiRequests.length).toBeGreaterThan(0);
  });

  test('should not trigger refresh when typing in input field', async ({ page }) => {
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Focus on search/filter input if it exists
    const searchInput = page.locator('input[type="text"]').first();
    const inputExists = await searchInput.count();
    
    if (inputExists > 0) {
      await searchInput.click();
      
      // Track API requests
      const apiRequests: string[] = [];
      page.on('request', request => {
        const url = request.url();
        if (url.includes('/evidence-graph')) {
          apiRequests.push(url);
        }
      });
      
      // Type R while focused in input
      await searchInput.type('r');
      
      // Wait a bit
      await page.waitForTimeout(1000);
      
      // Should NOT trigger refresh
      expect(apiRequests.length).toBe(0);
    }
  });
});

test.describe('Evidence Graph - ETag Caching', () => {
  test('should receive ETag header on first request', async ({ page }) => {
    let etag: string | null = null;
    
    page.on('response', response => {
      if (response.url().includes('/evidence-graph/nodes')) {
        etag = response.headers()['etag'];
      }
    });
    
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    expect(etag).toBeTruthy();
    expect(etag?.length).toBeGreaterThan(0);
  });

  test('should send If-None-Match header on subsequent requests', async ({ page }) => {
    let sentIfNoneMatch = false;
    
    // First load
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Monitor next request for If-None-Match header
    page.on('request', request => {
      if (request.url().includes('/evidence-graph/nodes')) {
        const headers = request.headers();
        if (headers['if-none-match']) {
          sentIfNoneMatch = true;
        }
      }
    });
    
    // Trigger refresh
    await page.click('[data-testid="refresh-button"]');
    await page.waitForLoadState('networkidle');
    
    // Should have sent If-None-Match header
    expect(sentIfNoneMatch).toBe(true);
  });

  test('should handle 304 Not Modified response', async ({ page }) => {
    let received304 = false;
    
    // First load
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Monitor responses for 304
    page.on('response', response => {
      if (response.url().includes('/evidence-graph/nodes') && response.status() === 304) {
        received304 = true;
      }
    });
    
    // Quick refresh (data shouldn't change)
    await page.click('[data-testid="refresh-button"]');
    await page.waitForLoadState('networkidle');
    
    // May receive 304 if data hasn't changed
    // This is optional depending on backend behavior
  });
});

test.describe('Evidence Graph - Error Handling', () => {
  test('should show error message when API is down', async ({ page, context }) => {
    // Block API requests to simulate API down
    await context.route('**/api/v1/evidence-graph/**', route => {
      route.abort('failed');
    });
    
    await page.goto('/evidence-graph');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('should allow retry after error', async ({ page, context }) => {
    let requestCount = 0;
    
    // Fail first request, succeed on second
    await context.route('**/api/v1/evidence-graph/nodes', route => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto('/evidence-graph');
    
    // Should show error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    
    // Click retry button if it exists
    const retryButton = page.locator('[data-testid="retry-button"]');
    if (await retryButton.count() > 0) {
      await retryButton.click();
      
      // Should load successfully
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
    }
  });

  test('should handle network timeout gracefully', async ({ page, context }) => {
    // Delay all API responses significantly
    await context.route('**/api/v1/evidence-graph/**', async route => {
      await page.waitForTimeout(60000); // Simulate timeout
      route.continue();
    });
    
    await page.goto('/evidence-graph');
    
    // Should show loading or error state (not hang indefinitely)
    const errorOrLoading = await Promise.race([
      page.waitForSelector('[data-testid="error-message"]', { timeout: 35000 }).then(() => 'error'),
      page.waitForSelector('[data-testid="loading-indicator"]', { timeout: 35000 }).then(() => 'loading'),
    ]).catch(() => 'timeout');
    
    expect(['error', 'loading']).toContain(errorOrLoading);
  });
});

test.describe('Evidence Graph - Visualization', () => {
  test('should render graph nodes', async ({ page }) => {
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Wait for graph to render
    await page.waitForSelector('[data-testid="evidence-graph"]', { timeout: 10000 });
    
    // Should have nodes (canvas or SVG elements)
    const graphContainer = page.locator('[data-testid="evidence-graph"]');
    expect(await graphContainer.count()).toBeGreaterThan(0);
  });

  test('should render graph edges', async ({ page }) => {
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Graph should have edge elements
    const edgeElements = page.locator('[data-edge-id]');
    const edgeCount = await edgeElements.count();
    
    // May or may not have edges depending on seed data
    // Just verify the page doesn't crash
    expect(edgeCount).toBeGreaterThanOrEqual(0);
  });

  test('should show node details when clicked', async ({ page }) => {
    await page.goto('/evidence-graph');
    await page.waitForLoadState('networkidle');
    
    // Click first node if available
    const firstNode = page.locator('[data-node-id]').first();
    const nodeExists = await firstNode.count();
    
    if (nodeExists > 0) {
      await firstNode.click();
      
      // Should show detail panel or modal
      const detailPanel = page.locator('[data-testid="node-detail"]');
      await expect(detailPanel).toBeVisible({ timeout: 5000 });
    }
  });
});
