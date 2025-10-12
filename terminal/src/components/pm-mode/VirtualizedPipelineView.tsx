import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Program, Phase } from '../../../src/types/biotech';
import { ProgramDrawer } from './ProgramDrawer';
import { QueryBuilder } from './QueryBuilder';
import './VirtualizedPipelineView.css';

// Hierarchy node types
interface HierarchyNode {
  id: string;
  type: 'therapeuticArea' | 'indication' | 'asset';
  name: string;
  level: number;
  expanded: boolean;
  programs: Program[];
  children?: HierarchyNode[];
  aggregates?: {
    totalRnpv: number;
    avgPoS: number;
    count: number;
  };
}

interface VirtualizedPipelineViewProps {
  programs: Program[];
  focusMode?: boolean;
  onProgramSelect?: (program: Program) => void;
}

export const VirtualizedPipelineView: React.FC<VirtualizedPipelineViewProps> = ({
  programs,
  focusMode = false,
  onProgramSelect,
}) => {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<{
    phases: Phase[];
    therapeuticAreas: string[];
    indications: string[];
    partnered: boolean | null;
  }>({
    phases: [],
    therapeuticAreas: [],
    indications: [],
    partnered: null,
  });
  const [isFocusMode, setIsFocusMode] = useState(focusMode);
  const parentRef = useRef<HTMLDivElement>(null);

  // Build hierarchical structure
  const hierarchyData = useMemo(() => {
    const filteredPrograms = programs.filter(program => {
      if (filters.phases.length > 0 && !filters.phases.includes(program.phase)) return false;
      if (filters.therapeuticAreas.length > 0 && !filters.therapeuticAreas.includes(program.therapeuticArea)) return false;
      if (filters.indications.length > 0 && !filters.indications.includes(program.indication)) return false;
      if (filters.partnered !== null && !!program.partner !== filters.partnered) return false;
      return true;
    });

    // Group by Therapeutic Area → Indication → Asset
    const taMap = new Map<string, Map<string, Program[]>>();
    
    filteredPrograms.forEach(program => {
      if (!taMap.has(program.therapeuticArea)) {
        taMap.set(program.therapeuticArea, new Map());
      }
      const indicationMap = taMap.get(program.therapeuticArea)!;
      
      if (!indicationMap.has(program.indication)) {
        indicationMap.set(program.indication, []);
      }
      indicationMap.get(program.indication)!.push(program);
    });

    // Build hierarchy
    const hierarchy: HierarchyNode[] = [];
    
    taMap.forEach((indicationMap, ta) => {
      const taPrograms: Program[] = [];
      indicationMap.forEach(progs => taPrograms.push(...progs));
      
      const taNode: HierarchyNode = {
        id: `ta-${ta}`,
        type: 'therapeuticArea',
        name: ta,
        level: 0,
        expanded: expandedNodes.has(`ta-${ta}`),
        programs: taPrograms,
        children: [],
        aggregates: {
          totalRnpv: taPrograms.reduce((sum, p) => sum + (p.rnPV || 0), 0),
          avgPoS: taPrograms.reduce((sum, p) => sum + (p.posAdj || p.posBase || 0), 0) / taPrograms.length,
          count: taPrograms.length,
        },
      };

      // Add indication children
      indicationMap.forEach((indicationPrograms, indication) => {
        const indNode: HierarchyNode = {
          id: `ind-${ta}-${indication}`,
          type: 'indication',
          name: indication,
          level: 1,
          expanded: expandedNodes.has(`ind-${ta}-${indication}`),
          programs: indicationPrograms,
          children: indicationPrograms.map(program => ({
            id: `asset-${program.id}`,
            type: 'asset' as const,
            name: program.assetName,
            level: 2,
            expanded: false,
            programs: [program],
            aggregates: {
              totalRnpv: program.rnPV || 0,
              avgPoS: program.posAdj || program.posBase || 0,
              count: 1,
            },
          })),
          aggregates: {
            totalRnpv: indicationPrograms.reduce((sum, p) => sum + (p.rnPV || 0), 0),
            avgPoS: indicationPrograms.reduce((sum, p) => sum + (p.posAdj || p.posBase || 0), 0) / indicationPrograms.length,
            count: indicationPrograms.length,
          },
        };
        
        taNode.children!.push(indNode);
      });

      hierarchy.push(taNode);
    });

    return hierarchy;
  }, [programs, filters, expandedNodes]);

  // Flatten hierarchy for virtualization
  const flattenedNodes = useMemo(() => {
    const flat: (HierarchyNode & { program?: Program })[] = [];
    
    const flatten = (node: HierarchyNode) => {
      flat.push(node);
      
      if (node.expanded && node.children) {
        node.children.forEach(child => flatten(child));
      }
    };
    
    hierarchyData.forEach(node => flatten(node));
    return flat;
  }, [hierarchyData]);

  // Focus mode: highlight top 10 EV drivers
  const top10EvDrivers = useMemo(() => {
    return [...programs]
      .sort((a, b) => (b.rnPV || 0) - (a.rnPV || 0))
      .slice(0, 10)
      .map(p => p.id);
  }, [programs]);

  // Virtual list setup
  const rowVirtualizer = useVirtualizer({
    count: flattenedNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 48, []),
    overscan: 5,
  });

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleProgramClick = useCallback((program: Program) => {
    setSelectedProgram(program);
    onProgramSelect?.(program);
  }, [onProgramSelect]);

  const expandAll = useCallback(() => {
    const allNodeIds = new Set<string>();
    const collectIds = (node: HierarchyNode) => {
      allNodeIds.add(node.id);
      node.children?.forEach(child => collectIds(child));
    };
    hierarchyData.forEach(node => collectIds(node));
    setExpandedNodes(allNodeIds);
  }, [hierarchyData]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return (
    <div className="virtualized-pipeline-view">
      {/* Query Builder */}
      <QueryBuilder
        filters={filters}
        onFiltersChange={setFilters}
        programs={programs}
      />

      {/* Control Bar */}
      <div className="pipeline-controls">
        <div className="control-group">
          <button className="btn-control" onClick={expandAll}>
            ▼ EXPAND ALL
          </button>
          <button className="btn-control" onClick={collapseAll}>
            ▲ COLLAPSE ALL
          </button>
        </div>

        <div className="control-group">
          <button
            className={`btn-control ${isFocusMode ? 'active' : ''}`}
            onClick={() => setIsFocusMode(!isFocusMode)}
          >
            🎯 FOCUS MODE {isFocusMode ? 'ON' : 'OFF'}
          </button>
          <span className="pipeline-stats">
            {flattenedNodes.length} visible • {programs.length} total programs
          </span>
        </div>
      </div>

      {/* Virtualized List */}
      <div
        ref={parentRef}
        className="pipeline-scroll-container"
        style={{ height: '600px', overflow: 'auto' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const node = flattenedNodes[virtualRow.index];
            const isTopDriver = node.type === 'asset' && 
              node.programs[0] && 
              top10EvDrivers.includes(node.programs[0].id);
            const dimmed = isFocusMode && node.type === 'asset' && !isTopDriver;

            return (
              <div
                key={virtualRow.key}
                className={`pipeline-row ${node.type} ${dimmed ? 'dimmed' : ''} ${isTopDriver ? 'top-driver' : ''}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingLeft: `${node.level * 24}px`,
                }}
              >
                {node.type !== 'asset' ? (
                  <div
                    className="hierarchy-node"
                    onClick={() => toggleNode(node.id)}
                  >
                    <span className="expand-icon">
                      {node.expanded ? '▼' : '▶'}
                    </span>
                    <span className="node-name">{node.name}</span>
                    <span className="node-stats">
                      {node.aggregates && (
                        <>
                          <span className="stat">{node.aggregates.count} programs</span>
                          <span className="stat">
                            PoS: {(node.aggregates.avgPoS * 100).toFixed(0)}%
                          </span>
                          <span className="stat">
                            rNPV: ${(node.aggregates.totalRnpv / 1_000_000).toFixed(1)}M
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                ) : (
                  <div
                    className="asset-node"
                    onClick={() => node.programs[0] && handleProgramClick(node.programs[0])}
                  >
                    <span className="asset-name">{node.name}</span>
                    {node.programs[0] && (
                      <>
                        <span className="asset-phase phase-badge">{node.programs[0].phase}</span>
                        <span className="asset-target">{node.programs[0].target}</span>
                        <span className="asset-rnpv">
                          ${((node.programs[0].rnPV || 0) / 1_000_000).toFixed(1)}M
                        </span>
                        {node.programs[0].partner && (
                          <span className="asset-partner">
                            🤝 {node.programs[0].partner.name}
                          </span>
                        )}
                        {isTopDriver && (
                          <span className="top-driver-badge">⭐ TOP 10</span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Program Drawer */}
      {selectedProgram && (
        <ProgramDrawer
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </div>
  );
};
