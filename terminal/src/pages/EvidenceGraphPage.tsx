/**
 * Evidence Graph Page
 *
 * Main page for visualizing and interacting with the evidence graph.
 * Features:
 * - Force-directed graph visualization
 * - Node/edge filtering and inspection
 * - Timeline scrubber for thesis analysis
 */

import React, { useState, useEffect, useRef } from 'react';
import { EvidenceGraph } from '../components/EvidenceGraph';
import { TimelineScrubber } from '../components/TimelineScrubber';
import { evidenceGraphApi } from '../utils/evidence-graph-api';
import type { NodeBase, Edge, ThesisTimeline } from '../types/evidence-graph';
import './EvidenceGraphPage.css';

export const EvidenceGraphPage: React.FC = () => {
  const [nodes, setNodes] = useState<NodeBase[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeBase | null>(null);
  const [thesisTimeline, setThesisTimeline] = useState<ThesisTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'graph' | 'timeline'>('graph');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // AbortController ref for canceling in-flight requests
  const controllerRef = useRef<AbortController | null>(null);

  // Load graph data with abort support and debounce protection
  const loadData = async () => {
    // Debounce guard - prevent double-clicks
    if (loading) return;

    // Cancel any in-flight requests
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Fetch with abort signal
      const [nodesData, edgesData] = await Promise.all([
        fetch(`${import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'}/api/v1/evidence-graph/nodes`, {
          signal: controllerRef.current.signal
        }).then(r => r.json()),
        fetch(`${import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000'}/api/v1/evidence-graph/edges`, {
          signal: controllerRef.current.signal
        }).then(r => r.json())
      ]);

      setNodes(nodesData);
      setEdges(edgesData);
      setLastUpdated(new Date());
    } catch (err) {
      // Ignore abort errors (user cancelled)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
      console.error('Error loading graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load only - no auto-refresh/polling
  useEffect(() => {
    loadData();

    // Cleanup: abort any pending requests on unmount
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  // Keyboard shortcut: Press 'R' to refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only if not typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          loadData();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading]); // Re-bind when loading state changes to respect debounce

  // Handle node selection
  const handleNodeClick = async (node: NodeBase) => {
    setSelectedNode(node);

    // If thesis node, load timeline
    if (node.type === 'thesis') {
      try {
        const timeline = await evidenceGraphApi.getThesisTimeline(node.id);
        setThesisTimeline(timeline);
        setView('timeline');
      } catch (err) {
        console.error('Error loading thesis timeline:', err);
      }
    }
  };

  // Get node type color
  const getNodeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      thesis: '#805ad5',
      trial: '#3182ce',
      catalyst: '#dd6b20',
      kol: '#38a169',
      doc: '#d69e2e',
    };
    return colors[type] || '#718096';
  };

  if (loading) {
    return (
      <div className="evidence-graph-page loading">
        <div className="loading-spinner">Loading evidence graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evidence-graph-page error">
        <div className="error-message">
          <h2>Error Loading Graph</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="evidence-graph-page">
      <div className="page-header">
        <h1 className="page-title">EVIDENCE GRAPH</h1>
        <p className="page-subtitle">
          Graph-based evidence tracking • Nodes: {nodes.length} • Edges: {edges.length}
        </p>

        <div className="view-controls">
          <div className="refresh-section">
            <button
              className="refresh-button"
              onClick={loadData}
              disabled={loading}
              title="Manually refresh data from server (or press R)"
            >
              {loading ? '⟳ LOADING...' : '⟳ REFRESH'}
            </button>
            <span className="last-updated-stamp">
              {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : '—'}
            </span>
          </div>
          <div className="view-buttons">
            <button
              className={`view-button ${view === 'graph' ? 'active' : ''}`}
              onClick={() => setView('graph')}
            >
              GRAPH VIEW
            </button>
            <button
              className={`view-button ${view === 'timeline' ? 'active' : ''}`}
              onClick={() => setView('timeline')}
              disabled={!thesisTimeline}
            >
              TIMELINE VIEW
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {view === 'graph' && (
          <div className="graph-view">
            <div className="graph-container">
              <EvidenceGraph
                nodes={nodes}
                edges={edges}
                width={1000}
                height={700}
                onNodeClick={handleNodeClick}
              />
            </div>

            <div className="graph-sidebar">
              <div className="legend">
                <h3 className="legend-title">NODE TYPES</h3>
                <div className="legend-items">
                  <div className="legend-item">
                    <span className="legend-icon" style={{ background: getNodeTypeColor('thesis') }}>◆</span>
                    <span className="legend-label">Thesis</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon" style={{ background: getNodeTypeColor('trial') }}>●</span>
                    <span className="legend-label">Trial</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon" style={{ background: getNodeTypeColor('catalyst') }}>★</span>
                    <span className="legend-label">Catalyst</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon" style={{ background: getNodeTypeColor('kol') }}>■</span>
                    <span className="legend-label">KOL</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon" style={{ background: getNodeTypeColor('doc') }}>■</span>
                    <span className="legend-label">Document</span>
                  </div>
                </div>
              </div>

              {selectedNode && (
                <div className="node-details">
                  <h3 className="details-title">NODE DETAILS</h3>
                  <div className="details-content">
                    <div className="detail-row">
                      <span className="detail-label">ID:</span>
                      <span className="detail-value">{selectedNode.id}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">TYPE:</span>
                      <span className="detail-value">{selectedNode.type}</span>
                    </div>
                    {selectedNode.company && (
                      <div className="detail-row">
                        <span className="detail-label">COMPANY:</span>
                        <span className="detail-value">{selectedNode.company}</span>
                      </div>
                    )}
                    {selectedNode.asset && (
                      <div className="detail-row">
                        <span className="detail-label">ASSET:</span>
                        <span className="detail-value">{selectedNode.asset}</span>
                      </div>
                    )}
                    {selectedNode.indication && (
                      <div className="detail-row">
                        <span className="detail-label">INDICATION:</span>
                        <span className="detail-value">{selectedNode.indication}</span>
                      </div>
                    )}
                    {selectedNode.phase && (
                      <div className="detail-row">
                        <span className="detail-label">PHASE:</span>
                        <span className="detail-value">{selectedNode.phase}</span>
                      </div>
                    )}
                    {selectedNode.pos_estimate !== undefined && (
                      <div className="detail-row">
                        <span className="detail-label">PoS:</span>
                        <span className="detail-value">
                          {(selectedNode.pos_estimate * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {selectedNode.sentiment !== undefined && (
                      <div className="detail-row">
                        <span className="detail-label">SENTIMENT:</span>
                        <span className={`detail-value ${selectedNode.sentiment >= 0 ? 'positive' : 'negative'}`}>
                          {selectedNode.sentiment.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {selectedNode.notes && (
                      <div className="detail-row">
                        <span className="detail-label">NOTES:</span>
                        <p className="detail-notes">{selectedNode.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'timeline' && thesisTimeline && (
          <div className="timeline-view">
            <button
              className="back-button"
              onClick={() => setView('graph')}
            >
              ← BACK TO GRAPH
            </button>
            <TimelineScrubber timeline={thesisTimeline} />
          </div>
        )}
      </div>
    </div>
  );
};
