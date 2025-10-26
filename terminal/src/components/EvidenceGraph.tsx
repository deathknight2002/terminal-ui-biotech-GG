/**
 * Evidence Graph Force Layout Component
 *
 * A simple force-directed graph visualization for evidence nodes and edges.
 * Uses a basic physics simulation without D3 to minimize dependencies.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { NodeBase, Edge } from '../../types/evidence-graph';
import './EvidenceGraph.css';

interface GraphNode extends NodeBase {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;  // Fixed x (for dragging)
  fy?: number;  // Fixed y (for dragging)
}

interface EvidenceGraphProps {
  nodes: NodeBase[];
  edges: Edge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: NodeBase) => void;
  onEdgeClick?: (edge: Edge) => void;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({
  nodes: inputNodes,
  edges,
  width = 800,
  height = 600,
  onNodeClick,
  onEdgeClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const animationRef = useRef<number>();

  // Initialize nodes with positions and velocities
  useEffect(() => {
    const initialNodes: GraphNode[] = inputNodes.map((node, i) => {
      const angle = (i / inputNodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) / 4;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      };
    });
    setGraphNodes(initialNodes);
  }, [inputNodes, width, height]);

  // Simple force simulation
  useEffect(() => {
    const simulate = () => {
      setGraphNodes(prevNodes => {
        const newNodes = [...prevNodes];

        // Force parameters
        const centerForce = 0.01;
        const repelForce = 5000;
        const linkForce = 0.05;
        const damping = 0.85;

        // Apply forces
        for (let i = 0; i < newNodes.length; i++) {
          const node = newNodes[i];

          // Skip if node is being dragged
          if (node.fx !== undefined && node.fy !== undefined) {
            node.x = node.fx;
            node.y = node.fy;
            node.vx = 0;
            node.vy = 0;
            continue;
          }

          // Center force
          const dx = width / 2 - node.x;
          const dy = height / 2 - node.y;
          node.vx += dx * centerForce;
          node.vy += dy * centerForce;

          // Repel force (node-node repulsion)
          for (let j = 0; j < newNodes.length; j++) {
            if (i === j) continue;
            const other = newNodes[j];
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = repelForce / (dist * dist);
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }

          // Link force (edge connections)
          edges.forEach(edge => {
            const source = newNodes.find(n => n.id === edge.from);
            const target = newNodes.find(n => n.id === edge.to);

            if (source && target) {
              if (node.id === source.id) {
                const dx = target.x - source.x;
                const dy = target.y - source.y;
                node.vx += dx * linkForce;
                node.vy += dy * linkForce;
              } else if (node.id === target.id) {
                const dx = source.x - target.x;
                const dy = source.y - target.y;
                node.vx += dx * linkForce;
                node.vy += dy * linkForce;
              }
            }
          });

          // Apply damping
          node.vx *= damping;
          node.vy *= damping;

          // Update position
          node.x += node.vx;
          node.y += node.vy;

          // Boundary constraints
          const margin = 30;
          node.x = Math.max(margin, Math.min(width - margin, node.x));
          node.y = Math.max(margin, Math.min(height - margin, node.y));
        }

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    if (graphNodes.length > 0) {
      animationRef.current = requestAnimationFrame(simulate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [graphNodes.length, edges, width, height]);

  // Render graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw edges
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;

    edges.forEach(edge => {
      const source = graphNodes.find(n => n.id === edge.from);
      const target = graphNodes.find(n => n.id === edge.to);

      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);

        // Color by relation type
        switch (edge.relation) {
          case 'supports':
            ctx.strokeStyle = '#48bb78';
            break;
          case 'contradicts':
            ctx.strokeStyle = '#f56565';
            break;
          case 'updates':
            ctx.strokeStyle = '#4299e1';
            break;
          case 'catalyst_for':
            ctx.strokeStyle = '#ed8936';
            break;
          default:
            ctx.strokeStyle = '#718096';
        }

        // Thicker line if edge has significant delta
        if (edge.delta?.pos && Math.abs(edge.delta.pos) > 0.05) {
          ctx.lineWidth = 3;
        } else {
          ctx.lineWidth = 2;
        }

        ctx.stroke();
      }
    });

    // Draw nodes
    graphNodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);

      // Color by node type
      switch (node.type) {
        case 'thesis':
          ctx.fillStyle = '#805ad5';
          break;
        case 'trial':
          ctx.fillStyle = '#3182ce';
          break;
        case 'catalyst':
          ctx.fillStyle = '#dd6b20';
          break;
        case 'kol':
          ctx.fillStyle = '#38a169';
          break;
        case 'doc':
          ctx.fillStyle = '#d69e2e';
          break;
        default:
          ctx.fillStyle = '#718096';
      }

      // Highlight selected or hovered
      if (node.id === selectedNode) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 10;
      } else if (node.id === hoveredNode) {
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 8;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw node label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const label = node.type === 'thesis' ? '◆' :
                   node.type === 'trial' ? '●' :
                   node.type === 'catalyst' ? '★' : '■';
      ctx.fillText(label, node.x, node.y);
    });
  }, [graphNodes, edges, width, height, selectedNode, hoveredNode]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = graphNodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (clickedNode) {
      setDraggingNode(clickedNode.id);
      setSelectedNode(clickedNode.id);
      if (onNodeClick) {
        onNodeClick(clickedNode);
      }
    } else {
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingNode) {
      setGraphNodes(prev => prev.map(node =>
        node.id === draggingNode
          ? { ...node, fx: x, fy: y }
          : node
      ));
    } else {
      const hoveredNode = graphNodes.find(node => {
        const dx = node.x - x;
        const dy = node.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 20;
      });
      setHoveredNode(hoveredNode?.id || null);
    }
  };

  const handleMouseUp = () => {
    if (draggingNode) {
      setGraphNodes(prev => prev.map(node =>
        node.id === draggingNode
          ? { ...node, fx: undefined, fy: undefined }
          : node
      ));
      setDraggingNode(null);
    }
  };

  return (
    <div className="evidence-graph">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: draggingNode ? 'grabbing' : 'default' }}
      />
    </div>
  );
};
