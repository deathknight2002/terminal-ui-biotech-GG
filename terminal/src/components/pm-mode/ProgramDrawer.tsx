import React from 'react';
import type { Program } from '../../../src/types/biotech';
import './ProgramDrawer.css';

interface ProgramDrawerProps {
  program: Program;
  onClose: () => void;
}

export const ProgramDrawer: React.FC<ProgramDrawerProps> = ({ program, onClose }) => {
  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="program-drawer-overlay" onClick={onClose}>
      <div className="program-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title">{program.assetName}</h2>
            <div className="drawer-subtitle">
              {program.therapeuticArea} • {program.indication}
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-content">
          {/* Basic Info Section */}
          <div className="drawer-section">
            <h3 className="section-title">BASIC INFORMATION</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">PHASE</span>
                <span className="info-value phase-badge">{program.phase}</span>
              </div>
              <div className="info-item">
                <span className="info-label">MODALITY</span>
                <span className="info-value">{program.modality}</span>
              </div>
              <div className="info-item">
                <span className="info-label">TARGET</span>
                <span className="info-value">{program.target}</span>
              </div>
              <div className="info-item">
                <span className="info-label">INDICATION</span>
                <span className="info-value">{program.indication}</span>
              </div>
              <div className="info-item">
                <span className="info-label">THERAPEUTIC AREA</span>
                <span className="info-value">{program.therapeuticArea}</span>
              </div>
            </div>
          </div>

          {/* Financial Metrics Section */}
          <div className="drawer-section">
            <h3 className="section-title">FINANCIAL METRICS</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">rNPV</span>
                <span className="metric-value">{formatCurrency(program.rnPV)}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">PEAK SALES (BASE)</span>
                <span className="metric-value">{formatCurrency(program.peakSalesBase ? program.peakSalesBase * 1_000_000 : undefined)}</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">PoS (BASE)</span>
                <span className="metric-value">
                  {program.posBase !== undefined ? `${(program.posBase * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
              <div className="metric-card">
                <span className="metric-label">PoS (ADJ)</span>
                <span className="metric-value">
                  {program.posAdj !== undefined ? `${(program.posAdj * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Partner Information */}
          {program.partner && (
            <div className="drawer-section">
              <h3 className="section-title">PARTNERSHIP</h3>
              <div className="partner-info">
                <div className="info-item">
                  <span className="info-label">PARTNER</span>
                  <span className="info-value">{program.partner.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">STAGE</span>
                  <span className="info-value">{program.partner.stage}</span>
                </div>
                {program.partner.royalty && (
                  <div className="info-item">
                    <span className="info-label">ROYALTY</span>
                    <span className="info-value">{program.partner.royalty}</span>
                  </div>
                )}
                {program.partner.milestones && (
                  <div className="info-item">
                    <span className="info-label">MILESTONES</span>
                    <span className="info-value">{program.partner.milestones}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Milestone */}
          {program.nextMilestone && (
            <div className="drawer-section">
              <h3 className="section-title">NEXT MILESTONE</h3>
              <div className="milestone-card">
                <div className="milestone-date">
                  {new Date(program.nextMilestone.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="milestone-type">{program.nextMilestone.type}</div>
                <div className="milestone-confidence">
                  Confidence: {['Low', 'Medium', 'High'][program.nextMilestone.confidence]}
                </div>
              </div>
            </div>
          )}

          {/* Sources Section */}
          {program.sources && program.sources.length > 0 && (
            <div className="drawer-section">
              <h3 className="section-title">SOURCES & PROVENANCE</h3>
              <div className="sources-list">
                {program.sources.map((source, idx) => (
                  <div key={idx} className="source-item">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      {source.label}
                    </a>
                    <span className="source-date">
                      As of: {new Date(source.asOf).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PoS Rationale */}
          <div className="drawer-section">
            <h3 className="section-title">PoS RATIONALE</h3>
            <div className="rationale-text">
              <p>
                Probability of Success is based on historical phase transition rates,
                indication-specific factors, competitive landscape, and mechanistic validation.
              </p>
              <ul>
                <li>Phase transition rates for {program.phase} in {program.therapeuticArea}</li>
                <li>Mechanistic validation for {program.target} targeting</li>
                <li>Competitive position in {program.indication}</li>
                <li>Regulatory pathway considerations</li>
              </ul>
            </div>
          </div>

          {/* Clinical Trials Links */}
          <div className="drawer-section">
            <h3 className="section-title">EXTERNAL LINKS</h3>
            <div className="external-links">
              <a
                href={`https://clinicaltrials.gov/search?term=${encodeURIComponent(program.assetName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                🔗 ClinicalTrials.gov
              </a>
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(program.assetName)}+${encodeURIComponent(program.target)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                🔗 PubMed
              </a>
              <a
                href={`https://www.fda.gov/search?s=${encodeURIComponent(program.assetName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                🔗 FDA.gov
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
