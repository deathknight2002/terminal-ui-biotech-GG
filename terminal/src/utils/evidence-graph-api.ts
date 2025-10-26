/**
 * Evidence Graph API Client
 *
 * Client functions for interacting with the evidence graph API.
 */

import { API_ENDPOINTS, apiFetch } from '../config/api';
import type { NodeBase, Edge, ThesisTimeline, EvidenceGraphData } from '../types/evidence-graph';

export const evidenceGraphApi = {
  /**
   * Get all nodes in the evidence graph
   */
  async getNodes(): Promise<NodeBase[]> {
    return apiFetch<NodeBase[]>(API_ENDPOINTS.EVIDENCE_GRAPH.NODES);
  },

  /**
   * Get a specific node by ID
   */
  async getNode(nodeId: string): Promise<NodeBase> {
    return apiFetch<NodeBase>(API_ENDPOINTS.EVIDENCE_GRAPH.NODE(nodeId));
  },

  /**
   * Create or update a node
   */
  async upsertNode(node: NodeBase): Promise<NodeBase> {
    return apiFetch<NodeBase>(API_ENDPOINTS.EVIDENCE_GRAPH.NODES, {
      method: 'POST',
      body: JSON.stringify(node),
    });
  },

  /**
   * Get all edges in the evidence graph
   */
  async getEdges(): Promise<Edge[]> {
    return apiFetch<Edge[]>(API_ENDPOINTS.EVIDENCE_GRAPH.EDGES);
  },

  /**
   * Add a new edge
   */
  async addEdge(edge: Omit<Edge, 'created_at'>): Promise<Edge> {
    return apiFetch<Edge>(API_ENDPOINTS.EVIDENCE_GRAPH.EDGES, {
      method: 'POST',
      body: JSON.stringify(edge),
    });
  },

  /**
   * Get all graph data (nodes and edges)
   */
  async getGraphData(): Promise<EvidenceGraphData> {
    const [nodes, edges] = await Promise.all([
      this.getNodes(),
      this.getEdges(),
    ]);
    return { nodes, edges };
  },

  /**
   * Get timeline of updates for a thesis
   */
  async getThesisTimeline(thesisId: string): Promise<ThesisTimeline> {
    return apiFetch<ThesisTimeline>(API_ENDPOINTS.EVIDENCE_GRAPH.THESIS_TIMELINE(thesisId));
  },

  /**
   * Screen/filter edges by criteria
   */
  async screenEdges(filters: {
    pos_delta_abs_gt?: number;
    days?: number;
  }): Promise<Edge[]> {
    const params = new URLSearchParams();
    if (filters.pos_delta_abs_gt !== undefined) {
      params.append('pos_delta_abs_gt', filters.pos_delta_abs_gt.toString());
    }
    if (filters.days !== undefined) {
      params.append('days', filters.days.toString());
    }

    const url = `${API_ENDPOINTS.EVIDENCE_GRAPH.SCREEN}?${params.toString()}`;
    return apiFetch<Edge[]>(url);
  },

  /**
   * Re-seed data from seed file
   */
  async reseed(): Promise<{ status: string; message: string; nodes_loaded: number; edges_loaded: number }> {
    return apiFetch(API_ENDPOINTS.EVIDENCE_GRAPH.SEED, {
      method: 'POST',
    });
  },

  /**
   * Health check
   */
  async health(): Promise<{ status: string; service: string }> {
    return apiFetch(API_ENDPOINTS.EVIDENCE_GRAPH.HEALTH);
  },
};
