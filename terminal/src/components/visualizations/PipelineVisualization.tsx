import React, { useState, useRef, useEffect } from 'react';
import './PipelineVisualization.css';

export interface PipelineProgram {
  id: string;
  name: string;
  genericName?: string;
  indication: string;
  phase: 'Preclinical' | 'Phase I' | 'Phase II' | 'Phase III' | 'Filed' | 'Approved';
  therapeuticArea: string;
  mechanism?: string;
  target?: string;
  nextMilestone?: string;
  probability?: number;
  peakSales?: number;
}

export interface PipelineVisualizationProps {
  programs: PipelineProgram[];
  title?: string;
  enableZoom?: boolean;
  enableFiltering?: boolean;
  className?: string;
}

const PHASE_ORDER: Record<string, number> = {
  'Preclinical': 0,
  'Phase I': 1,
  'Phase II': 2,
  'Phase III': 3,
  'Filed': 4,
  'Approved': 5,
};

const PHASE_COLORS: Record<string, string> = {
  'Preclinical': 'var(--text-tertiary)',
  'Phase I': 'var(--accent-amber)',
  'Phase II': 'var(--accent-purple)',
  'Phase III': 'var(--accent-cyan)',
  'Filed': 'var(--status-info)',
  'Approved': 'var(--status-success)',
};

export const PipelineVisualization: React.FC<PipelineVisualizationProps> = ({
  programs,
  title = 'DRUG DEVELOPMENT PIPELINE',
  enableZoom = true,
  enableFiltering = true,
  className = '',
}) => {
  const [selectedTherapeuticArea, setSelectedTherapeuticArea] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [hoveredProgram, setHoveredProgram] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get unique therapeutic areas and phases
  const therapeuticAreas = Array.from(new Set(programs.map(p => p.therapeuticArea))).sort();
  const phases = Object.keys(PHASE_ORDER).sort((a, b) => PHASE_ORDER[a] - PHASE_ORDER[b]);

  // Filter programs
  const filteredPrograms = programs.filter(p => {
    if (selectedTherapeuticArea && p.therapeuticArea !== selectedTherapeuticArea) return false;
    if (selectedPhase && p.phase !== selectedPhase) return false;
    return true;
  });

  // Group programs by therapeutic area and phase
  const groupedPrograms = filteredPrograms.reduce((acc, program) => {
    const key = `${program.therapeuticArea}:${program.phase}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(program);
    return acc;
  }, {} as Record<string, PipelineProgram[]>);

  // Handle zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!enableZoom) return;
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel * delta));
    setZoomLevel(newZoom);
  };

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const hoveredProgramData = programs.find(p => p.id === hoveredProgram);

  return (
    <div className={`pipeline-visualization ${className}`}>
      {/* Header */}
      <div className="pipeline-header">
        <h2 className="pipeline-title">{title}</h2>
        <div className="pipeline-stats">
          <span className="stat">Total Programs: {filteredPrograms.length}</span>
          <span className="stat">Therapeutic Areas: {therapeuticAreas.length}</span>
        </div>
      </div>

      {/* Filters */}
      {enableFiltering && (
        <div className="pipeline-filters">
          <div className="filter-group">
            <label>THERAPEUTIC AREA:</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedTherapeuticArea === null ? 'active' : ''}`}
                onClick={() => setSelectedTherapeuticArea(null)}
              >
                ALL
              </button>
              {therapeuticAreas.map(ta => (
                <button
                  key={ta}
                  className={`filter-btn ${selectedTherapeuticArea === ta ? 'active' : ''}`}
                  onClick={() => setSelectedTherapeuticArea(ta)}
                >
                  {ta}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>PHASE:</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedPhase === null ? 'active' : ''}`}
                onClick={() => setSelectedPhase(null)}
              >
                ALL
              </button>
              {phases.map(phase => (
                <button
                  key={phase}
                  className={`filter-btn ${selectedPhase === phase ? 'active' : ''}`}
                  onClick={() => setSelectedPhase(phase)}
                  style={{ borderColor: PHASE_COLORS[phase] }}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      {enableZoom && (
        <div className="zoom-controls">
          <button onClick={() => setZoomLevel(z => Math.min(3, z * 1.2))}>+</button>
          <span>{Math.round(zoomLevel * 100)}%</span>
          <button onClick={() => setZoomLevel(z => Math.max(0.5, z * 0.8))}>-</button>
          <button onClick={handleReset}>Reset</button>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="pipeline-canvas-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          ref={canvasRef}
          className="pipeline-canvas"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Phase columns */}
          <div className="pipeline-grid">
            {phases.map((phase) => (
              <div key={phase} className="pipeline-column">
                <div className="phase-header" style={{ borderColor: PHASE_COLORS[phase] }}>
                  <div className="phase-name">{phase}</div>
                  <div className="phase-count">
                    {filteredPrograms.filter(p => p.phase === phase).length}
                  </div>
                </div>

                {/* Therapeutic area rows within phase */}
                <div className="phase-programs">
                  {therapeuticAreas.map(ta => {
                    const key = `${ta}:${phase}`;
                    const programsInCell = groupedPrograms[key] || [];

                    if (programsInCell.length === 0) {
                      return (
                        <div key={key} className="program-cell empty" />
                      );
                    }

                    return (
                      <div key={key} className="program-cell">
                        {programsInCell.map(program => (
                          <div
                            key={program.id}
                            className={`program-node ${hoveredProgram === program.id ? 'hovered' : ''}`}
                            style={{ borderColor: PHASE_COLORS[phase] }}
                            onMouseEnter={() => setHoveredProgram(program.id)}
                            onMouseLeave={() => setHoveredProgram(null)}
                          >
                            <div className="program-node-name">{program.name}</div>
                            {program.indication && (
                              <div className="program-node-indication">{program.indication}</div>
                            )}
                            {program.probability !== undefined && (
                              <div className="program-node-probability">
                                PoS: {(program.probability * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredProgramData && (
        <div className="pipeline-tooltip">
          <div className="tooltip-title">{hoveredProgramData.name}</div>
          {hoveredProgramData.genericName && (
            <div className="tooltip-generic">{hoveredProgramData.genericName}</div>
          )}
          <div className="tooltip-detail">
            <span className="detail-label">INDICATION:</span> {hoveredProgramData.indication}
          </div>
          <div className="tooltip-detail">
            <span className="detail-label">PHASE:</span> {hoveredProgramData.phase}
          </div>
          <div className="tooltip-detail">
            <span className="detail-label">THERAPEUTIC AREA:</span> {hoveredProgramData.therapeuticArea}
          </div>
          {hoveredProgramData.mechanism && (
            <div className="tooltip-detail">
              <span className="detail-label">MECHANISM:</span> {hoveredProgramData.mechanism}
            </div>
          )}
          {hoveredProgramData.target && (
            <div className="tooltip-detail">
              <span className="detail-label">TARGET:</span> {hoveredProgramData.target}
            </div>
          )}
          {hoveredProgramData.nextMilestone && (
            <div className="tooltip-detail">
              <span className="detail-label">NEXT MILESTONE:</span> {hoveredProgramData.nextMilestone}
            </div>
          )}
          {hoveredProgramData.probability !== undefined && (
            <div className="tooltip-detail">
              <span className="detail-label">PROBABILITY OF SUCCESS:</span>{' '}
              {(hoveredProgramData.probability * 100).toFixed(1)}%
            </div>
          )}
          {hoveredProgramData.peakSales !== undefined && (
            <div className="tooltip-detail">
              <span className="detail-label">PEAK SALES:</span> ${hoveredProgramData.peakSales}M
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="pipeline-legend">
        {phases.map(phase => (
          <div key={phase} className="legend-item">
            <div className="legend-color" style={{ background: PHASE_COLORS[phase] }} />
            <span>{phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
