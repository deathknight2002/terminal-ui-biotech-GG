/**
 * Database and Storage E2E Tests
 * 
 * Tests for SQLite database operations and evidence graph storage.
 */

import { test, expect } from '@playwright/test';

test.describe('Evidence Graph Storage', () => {
  test('should persist nodes across requests', async ({ page }) => {
    // Get initial nodes
    const response1 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    expect(response1.ok()).toBeTruthy();
    const nodes1 = await response1.json();
    
    // Get nodes again
    const response2 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    expect(response2.ok()).toBeTruthy();
    const nodes2 = await response2.json();
    
    // Should return same data
    expect(nodes1.length).toBe(nodes2.length);
  });

  test('should support ETag-based caching', async ({ page }) => {
    // First request
    const response1 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    expect(response1.ok()).toBeTruthy();
    
    const etag = response1.headers()['etag'];
    expect(etag).toBeDefined();
    
    // Second request with If-None-Match
    const response2 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes', {
      headers: {
        'If-None-Match': etag
      }
    });
    
    // Should return 304 Not Modified if data hasn't changed
    if (response2.status() === 304) {
      expect(response2.status()).toBe(304);
    } else {
      // Or 200 with same ETag if data changed
      expect(response2.status()).toBe(200);
    }
  });

  test('should support HEAD requests for metadata', async ({ page }) => {
    const response = await page.request.head('http://localhost:8000/api/v1/evidence-graph/nodes');
    
    expect(response.status()).toBe(200);
    const headers = response.headers();
    
    // Should include ETag
    expect(headers['etag']).toBeDefined();
    
    // Should include content type
    expect(headers['content-type']).toContain('application/json');
  });

  test('should support filtering by node type', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes?type=thesis');
    
    expect(response.ok()).toBeTruthy();
    const nodes = await response.json();
    
    // All nodes should be of type 'thesis'
    if (nodes.length > 0) {
      nodes.forEach((node: any) => {
        expect(node.type).toBe('thesis');
      });
    }
  });

  test('should support pagination with limit and offset', async ({ page }) => {
    // Get first page
    const response1 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes?limit=5&offset=0');
    expect(response1.ok()).toBeTruthy();
    const page1 = await response1.json();
    
    // Get second page
    const response2 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes?limit=5&offset=5');
    expect(response2.ok()).toBeTruthy();
    const page2 = await response2.json();
    
    // Pages should not overlap
    if (page1.length > 0 && page2.length > 0) {
      const ids1 = page1.map((n: any) => n.id);
      const ids2 = page2.map((n: any) => n.id);
      
      ids1.forEach((id: string) => {
        expect(ids2).not.toContain(id);
      });
    }
  });
});

test.describe('Evidence Graph Edges', () => {
  test('should retrieve edges', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/edges');
    
    expect(response.ok()).toBeTruthy();
    const edges = await response.json();
    
    expect(Array.isArray(edges)).toBeTruthy();
  });

  test('should support edge filtering by type', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/edges?type=supports');
    
    expect(response.ok()).toBeTruthy();
    const edges = await response.json();
    
    if (edges.length > 0) {
      edges.forEach((edge: any) => {
        expect(edge.type).toBe('supports');
      });
    }
  });

  test('should support ETag caching for edges', async ({ page }) => {
    const response1 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/edges');
    const etag = response1.headers()['etag'];
    
    if (etag) {
      const response2 = await page.request.get('http://localhost:8000/api/v1/evidence-graph/edges', {
        headers: {
          'If-None-Match': etag
        }
      });
      
      // Should use cache
      expect([200, 304]).toContain(response2.status());
    }
  });
});

test.describe('Database Operations', () => {
  test('should retrieve drugs from database', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/drugs');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should retrieve clinical trials from database', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/clinical-trials');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should retrieve companies from database', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/companies');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should retrieve catalysts from database', async ({ page }) => {
    const response = await page.request.get('http://localhost:8000/api/v1/catalysts');
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('should support filtering catalysts by date', async ({ page }) => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    
    const response = await page.request.get(
      `http://localhost:8000/api/v1/catalysts?start_date=${new Date().toISOString()}&end_date=${futureDate.toISOString()}`
    );
    
    expect(response.ok()).toBeTruthy();
    const catalysts = await response.json();
    
    expect(Array.isArray(catalysts)).toBeTruthy();
  });
});

test.describe('Storage Backend Switching', () => {
  test('should work with configured storage backend', async ({ page }) => {
    // Test that the API works regardless of storage backend (JSON or SQLite)
    const response = await page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes');
    
    expect(response.ok()).toBeTruthy();
    const nodes = await response.json();
    
    expect(Array.isArray(nodes)).toBeTruthy();
    
    // Nodes should have required fields
    if (nodes.length > 0) {
      const node = nodes[0];
      expect(node.id).toBeDefined();
      expect(node.type).toBeDefined();
      expect(node.label).toBeDefined();
    }
  });

  test('should maintain data consistency across requests', async ({ page }) => {
    // Make multiple requests
    const requests = await Promise.all([
      page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes'),
      page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes'),
      page.request.get('http://localhost:8000/api/v1/evidence-graph/nodes')
    ]);
    
    const dataSets = await Promise.all(requests.map(r => r.json()));
    
    // All requests should return same data
    expect(dataSets[0].length).toBe(dataSets[1].length);
    expect(dataSets[1].length).toBe(dataSets[2].length);
  });
});
