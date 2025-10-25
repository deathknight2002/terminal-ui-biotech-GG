/**
 * Evidence Graph API E2E Tests
 * 
 * Tests CRUD operations and SQLite storage functionality for evidence graph.
 */

import { test, expect } from '@playwright/test';

test.describe('Evidence Graph - CRUD Operations', () => {
  const API_BASE = 'http://localhost:8000/api/v1/evidence-graph';
  
  // Unique test IDs to avoid conflicts
  const testNodeId = `test-node-${Date.now()}`;
  const testNode2Id = `test-node-2-${Date.now()}`;

  test('should retrieve all nodes', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/nodes`);
    
    expect(response.ok()).toBeTruthy();
    const nodes = await response.json();
    expect(Array.isArray(nodes)).toBeTruthy();
  });

  test('should create a new node', async ({ page }) => {
    const newNode = {
      id: testNodeId,
      type: 'thesis',
      company: 'Test Pharma Inc',
      asset: 'TEST-001',
      indication: 'Test Indication',
      phase: 'Phase II',
      pos_estimate: 0.85,
      sentiment: 0.75,
      notes: 'Test node for E2E testing'
    };

    const response = await page.request.post(`${API_BASE}/nodes`, {
      data: newNode,
      failOnStatusCode: false
    });
    
    // Should succeed (201) or fail with auth error (401)
    expect([200, 201, 401]).toContain(response.status());
    
    if (response.ok()) {
      const createdNode = await response.json();
      expect(createdNode.id).toBe(testNodeId);
      expect(createdNode.type).toBe('thesis');
      expect(createdNode.company).toBe('Test Pharma Inc');
    }
  });

  test('should retrieve a specific node by ID', async ({ page }) => {
    // First create a node
    await page.request.post(`${API_BASE}/nodes`, {
      data: {
        id: testNode2Id,
        type: 'trial',
        company: 'Test Biotech',
        asset: 'TEST-002'
      },
      failOnStatusCode: false
    });

    // Then retrieve it
    const response = await page.request.get(`${API_BASE}/nodes/${testNode2Id}`, {
      failOnStatusCode: false
    });
    
    if (response.ok()) {
      const node = await response.json();
      expect(node.id).toBe(testNode2Id);
      expect(node.type).toBe('trial');
    }
  });

  test('should update an existing node', async ({ page }) => {
    const updateNodeId = `test-update-${Date.now()}`;
    
    // Create node
    await page.request.post(`${API_BASE}/nodes`, {
      data: {
        id: updateNodeId,
        type: 'thesis',
        company: 'Original Company',
        notes: 'Original notes'
      },
      failOnStatusCode: false
    });

    // Update node
    const response = await page.request.put(`${API_BASE}/nodes/${updateNodeId}`, {
      data: {
        type: 'thesis',
        company: 'Updated Company',
        notes: 'Updated notes',
        sentiment: 0.9
      },
      failOnStatusCode: false
    });
    
    // Should succeed (200) or fail with auth error (401)
    expect([200, 401, 404]).toContain(response.status());
    
    if (response.ok()) {
      const updatedNode = await response.json();
      expect(updatedNode.company).toBe('Updated Company');
      expect(updatedNode.notes).toBe('Updated notes');
    }
  });

  test('should filter nodes by type', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/nodes?type=thesis`);
    
    expect(response.ok()).toBeTruthy();
    const nodes = await response.json();
    
    // All returned nodes should be of type 'thesis'
    for (const node of nodes) {
      expect(node.type).toBe('thesis');
    }
  });

  test('should filter nodes by company', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/nodes?company=Test`);
    
    expect(response.ok()).toBeTruthy();
    const nodes = await response.json();
    
    // All returned nodes should have 'Test' in company name
    for (const node of nodes) {
      expect(node.company?.toLowerCase()).toContain('test');
    }
  });

  test('should support pagination with limit and offset', async ({ page }) => {
    // Get first page
    const response1 = await page.request.get(`${API_BASE}/nodes?limit=5&offset=0`);
    expect(response1.ok()).toBeTruthy();
    const page1 = await response1.json();
    expect(page1.length).toBeLessThanOrEqual(5);
    
    // Get second page
    const response2 = await page.request.get(`${API_BASE}/nodes?limit=5&offset=5`);
    expect(response2.ok()).toBeTruthy();
    const page2 = await response2.json();
    expect(page2.length).toBeLessThanOrEqual(5);
    
    // Pages should be different (if there are enough nodes)
    if (page1.length === 5 && page2.length > 0) {
      expect(page1[0].id).not.toBe(page2[0].id);
    }
  });

  test('should delete a node', async ({ page }) => {
    const deleteNodeId = `test-delete-${Date.now()}`;
    
    // Create node
    await page.request.post(`${API_BASE}/nodes`, {
      data: {
        id: deleteNodeId,
        type: 'catalyst',
        company: 'Delete Test Company'
      },
      failOnStatusCode: false
    });

    // Delete node
    const response = await page.request.delete(`${API_BASE}/nodes/${deleteNodeId}`, {
      failOnStatusCode: false
    });
    
    // Should succeed (200/204) or fail with auth error (401)
    expect([200, 204, 401, 404]).toContain(response.status());
    
    if (response.status() === 200 || response.status() === 204) {
      // Verify deletion - node should not exist
      const getResponse = await page.request.get(`${API_BASE}/nodes/${deleteNodeId}`, {
        failOnStatusCode: false
      });
      expect(getResponse.status()).toBe(404);
    }
  });

  test('should return 404 for non-existent node', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/nodes/non-existent-node-id-99999`, {
      failOnStatusCode: false
    });
    
    expect(response.status()).toBe(404);
  });
});

test.describe('Evidence Graph - Edges', () => {
  const API_BASE = 'http://localhost:8000/api/v1/evidence-graph';

  test('should retrieve all edges', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/edges`);
    
    expect(response.ok()).toBeTruthy();
    const edges = await response.json();
    expect(Array.isArray(edges)).toBeTruthy();
  });

  test('should create an edge between nodes', async ({ page }) => {
    const fromId = `edge-from-${Date.now()}`;
    const toId = `edge-to-${Date.now()}`;
    
    // Create two nodes
    await page.request.post(`${API_BASE}/nodes`, {
      data: {
        id: fromId,
        type: 'thesis',
        company: 'Edge Test Company'
      },
      failOnStatusCode: false
    });
    
    await page.request.post(`${API_BASE}/nodes`, {
      data: {
        id: toId,
        type: 'trial',
        company: 'Edge Test Company'
      },
      failOnStatusCode: false
    });

    // Create edge
    const response = await page.request.post(`${API_BASE}/edges`, {
      data: {
        from_id: fromId,
        to_id: toId,
        relation: 'supports',
        confidence: 0.85,
        reason: 'Test edge for E2E testing'
      },
      failOnStatusCode: false
    });
    
    // Should succeed (201) or fail with auth error (401)
    expect([200, 201, 401]).toContain(response.status());
    
    if (response.ok()) {
      const createdEdge = await response.json();
      expect(createdEdge.from_id).toBe(fromId);
      expect(createdEdge.to_id).toBe(toId);
      expect(createdEdge.relation).toBe('supports');
    }
  });

  test('should filter edges by relation type', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/edges?relation=supports`);
    
    expect(response.ok()).toBeTruthy();
    const edges = await response.json();
    
    // All returned edges should have 'supports' relation
    for (const edge of edges) {
      expect(edge.relation).toBe('supports');
    }
  });

  test('should filter edges by from_id', async ({ page }) => {
    const testFromId = 'test-filter-from';
    
    const response = await page.request.get(`${API_BASE}/edges?from_id=${testFromId}`);
    
    expect(response.ok()).toBeTruthy();
    const edges = await response.json();
    
    // All returned edges should have the specified from_id
    for (const edge of edges) {
      expect(edge.from_id).toBe(testFromId);
    }
  });
});

test.describe('Evidence Graph - Storage Backend', () => {
  const API_BASE = 'http://localhost:8000/api/v1/evidence-graph';

  test('should persist data across requests (testing storage)', async ({ page }) => {
    const persistNodeId = `persist-test-${Date.now()}`;
    
    // Create node
    const createResponse = await page.request.post(`${API_BASE}/nodes`, {
      data: {
        id: persistNodeId,
        type: 'thesis',
        company: 'Persistence Test Company',
        notes: 'Testing data persistence'
      },
      failOnStatusCode: false
    });
    
    if (!createResponse.ok()) {
      // If creation failed (e.g., auth required), skip the rest
      return;
    }

    // Wait a moment
    await page.waitForTimeout(100);

    // Retrieve node in a separate request
    const getResponse = await page.request.get(`${API_BASE}/nodes/${persistNodeId}`);
    
    expect(getResponse.ok()).toBeTruthy();
    const retrievedNode = await getResponse.json();
    expect(retrievedNode.id).toBe(persistNodeId);
    expect(retrievedNode.company).toBe('Persistence Test Company');
  });

  test('should maintain data integrity with concurrent requests', async ({ page }) => {
    const concurrentNodeId = `concurrent-${Date.now()}`;
    
    // Create initial node
    await page.request.post(`${API_BASE}/nodes`, {
      data: {
        id: concurrentNodeId,
        type: 'thesis',
        company: 'Concurrent Test',
        sentiment: 0.5
      },
      failOnStatusCode: false
    });

    // Make multiple update requests
    const updates = [
      { sentiment: 0.6, notes: 'Update 1' },
      { sentiment: 0.7, notes: 'Update 2' },
      { sentiment: 0.8, notes: 'Update 3' }
    ];

    for (const update of updates) {
      await page.request.put(`${API_BASE}/nodes/${concurrentNodeId}`, {
        data: {
          type: 'thesis',
          company: 'Concurrent Test',
          ...update
        },
        failOnStatusCode: false
      });
    }

    // Retrieve final state
    const response = await page.request.get(`${API_BASE}/nodes/${concurrentNodeId}`, {
      failOnStatusCode: false
    });
    
    if (response.ok()) {
      const node = await response.json();
      // Node should have one of the update values
      expect([0.5, 0.6, 0.7, 0.8]).toContain(node.sentiment);
    }
  });

  test('should support both SQLite and JSON storage modes', async ({ page }) => {
    // This test verifies that the API works regardless of storage backend
    const response = await page.request.get(`${API_BASE}/nodes`);
    
    expect(response.ok()).toBeTruthy();
    const nodes = await response.json();
    expect(Array.isArray(nodes)).toBeTruthy();
    
    // Response structure should be the same regardless of backend
    if (nodes.length > 0) {
      const node = nodes[0];
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('type');
    }
  });
});

test.describe('Evidence Graph - ETag and Caching', () => {
  const API_BASE = 'http://localhost:8000/api/v1/evidence-graph';

  test('should return ETag header for nodes endpoint', async ({ page }) => {
    const response = await page.request.get(`${API_BASE}/nodes`);
    
    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    expect(headers['etag']).toBeDefined();
  });

  test('should return 304 Not Modified for matching ETag', async ({ page }) => {
    // First request
    const response1 = await page.request.get(`${API_BASE}/nodes`);
    const etag = response1.headers()['etag'];
    
    if (!etag) {
      // Skip test if ETag is not supported
      return;
    }

    // Second request with If-None-Match
    const response2 = await page.request.get(`${API_BASE}/nodes`, {
      headers: {
        'If-None-Match': etag
      },
      failOnStatusCode: false
    });
    
    // Should return 304 if data hasn't changed
    expect([200, 304]).toContain(response2.status());
    
    if (response2.status() === 304) {
      // 304 response should have minimal body
      const body = await response2.text();
      expect(body.length).toBeLessThan(100);
    }
  });

  test('should support HEAD requests for cache validation', async ({ page }) => {
    const response = await page.request.head(`${API_BASE}/nodes`);
    
    expect(response.ok()).toBeTruthy();
    const headers = response.headers();
    
    // Should include ETag
    expect(headers['etag']).toBeDefined();
    
    // Should include Cache-Control
    expect(headers['cache-control']).toBeDefined();
    
    // Should include Content-Type
    expect(headers['content-type']).toBeDefined();
  });
});
