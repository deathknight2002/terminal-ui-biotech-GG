/**
 * Evidence Graph Types
 *
 * TypeScript types for the evidence graph feature.
 * Mirrors the Python Pydantic models.
 */

export type NodeType = 'trial' | 'catalyst' | 'kol' | 'doc' | 'thesis';
export type RelationType = 'supports' | 'contradicts' | 'updates' | 'catalyst_for' | 'related_to';

export interface EdgeDelta {
  pos?: number;
  sentiment?: number;
  tam?: number;
}

export interface NodeBase {
  id: string;
  type: NodeType;
  date?: string;
  company?: string;
  asset?: string;
  indication?: string;
  phase?: string;
  catalyst_type?: string;
  pos_estimate?: number;
  sentiment?: number;
  source_url?: string;
  notes?: string;
}

export interface Edge {
  from: string;
  to: string;
  relation: RelationType;
  delta?: EdgeDelta;
  confidence?: number;
  reason?: string;
  created_at: string;
}

export interface TimelineEntry {
  edge: Edge;
  source_node: NodeBase | null;
  timestamp: string;
  cumulative?: {
    pos: number;
    sentiment: number;
  };
}

export interface ThesisTimeline {
  thesis_id: string;
  thesis: NodeBase;
  timeline: TimelineEntry[];
  summary: {
    total_updates: number;
    final_pos: number;
    final_sentiment: number;
  };
}

export interface EvidenceGraphData {
  nodes: NodeBase[];
  edges: Edge[];
}
