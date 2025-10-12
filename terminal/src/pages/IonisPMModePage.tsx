import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import { PMStickyHeader } from '../components/pm-mode/PMStickyHeader';
import { RnpvLadder } from '../components/pm-mode/RnpvLadder';
import { CatalystTimeline } from '../components/pm-mode/CatalystTimeline';
import { DCFCalculator } from '../components/calculators/DCFCalculator';
import { PipelineVisualization } from '../components/visualizations/PipelineVisualization';
import { IONIS_PROFILE } from '../data/ionisData';
import { IONIS_PIPELINE } from '../data/ionisPipeline';
import {
  convertToPMMetrics,
  convertToRnpvLadder,
  convertToCatalystTimeline,
} from '../utils/pmModeHelpers';
import './IonisPMModePage.css';

export const IonisPMModePage: React.FC = () => {
  const navigate = useNavigate();

  // Convert data to PM Mode format
  const pmMetrics = useMemo(
    () => convertToPMMetrics(IONIS_PROFILE, IONIS_PIPELINE),
    []
  );

  const rnpvLadderItems = useMemo(
    () => convertToRnpvLadder(IONIS_PIPELINE),
    []
  );

  const catalystEvents = useMemo(
    () => convertToCatalystTimeline(IONIS_PIPELINE),
    []
  );

  return (
    <div className="ionis-pm-mode-page">
      {/* Sticky Header - Always visible */}
      <PMStickyHeader metrics={pmMetrics} />

      {/* Main Content */}
      <div className="pm-mode-content">
        {/* Control Bar */}
        <div className="pm-mode-controls">
          <button onClick={() => navigate(-1)} className="btn-back">
            ← BACK
          </button>
          <div className="pm-mode-title">
            <h1>{IONIS_PROFILE.ticker} - PM MODE</h1>
            <span className="pm-mode-subtitle">Portfolio Manager View</span>
          </div>
          <div className="pm-mode-actions">
            <button className="btn-action">
              💾 SAVE VIEW
            </button>
            <button className="btn-action">
              📤 EXPORT DECK
            </button>
            <button className="btn-action">
              🔗 SHARE LINK
            </button>
          </div>
        </div>

        {/* Top Row - Three Core Panels */}
        <div className="pm-mode-top-row">
          <div className="pm-panel">
            <RnpvLadder items={rnpvLadderItems} maxItems={10} />
          </div>
          <div className="pm-panel">
            <CatalystTimeline events={catalystEvents} monthsToShow={12} />
          </div>
          <div className="pm-panel">
            <Panel title="VALUATION & SCENARIOS" cornerBrackets>
              <div style={{ padding: '1rem' }}>
                <DCFCalculator
                  initialInputs={{
                    revenue: 800,
                    revenueGrowthRate: 18,
                    ebitdaMargin: 40,
                    taxRate: 21,
                    wacc: 9.5,
                    terminalGrowthRate: 3,
                    sharesOutstanding: 110,
                    netDebt: -850,
                  }}
                />
              </div>
            </Panel>
          </div>
        </div>

        {/* Middle Row - Pipeline Visualization */}
        <div className="pm-mode-middle-row">
          <Panel title="PIPELINE SWIMLANES" cornerBrackets>
            <PipelineVisualization
              programs={IONIS_PIPELINE}
              enableZoom={true}
              enableFiltering={true}
            />
          </Panel>
        </div>

        {/* Bottom Row - Therapeutic Area Summary */}
        <div className="pm-mode-bottom-row">
          <Panel title="THERAPEUTIC AREA EXPOSURE" cornerBrackets>
            <div className="ta-exposure-grid">
              {Array.from(new Set(IONIS_PIPELINE.map(p => p.therapeuticArea))).map(ta => {
                const taPrograms = IONIS_PIPELINE.filter(p => p.therapeuticArea === ta);
                const totalRnpv = taPrograms.reduce(
                  (sum, p) => sum + (p.probability || 0) * (p.peakSales || 0) * 1_000_000 * 0.3,
                  0
                );
                const avgPoS = taPrograms.reduce((sum, p) => sum + (p.probability || 0), 0) / taPrograms.length;

                return (
                  <div key={ta} className="ta-card">
                    <h3 className="ta-name">{ta}</h3>
                    <div className="ta-stats">
                      <div className="ta-stat">
                        <span className="ta-stat-label">PROGRAMS</span>
                        <span className="ta-stat-value">{taPrograms.length}</span>
                      </div>
                      <div className="ta-stat">
                        <span className="ta-stat-label">AVG PoS</span>
                        <span className="ta-stat-value">{(avgPoS * 100).toFixed(0)}%</span>
                      </div>
                      <div className="ta-stat">
                        <span className="ta-stat-label">TOTAL rNPV</span>
                        <span className="ta-stat-value">
                          ${(totalRnpv / 1_000_000_000).toFixed(2)}B
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Right Rail - Notes & Provenance (Placeholder) */}
        <div className="pm-mode-right-rail">
          <Panel title="NOTES & PROVENANCE" cornerBrackets>
            <div className="notes-placeholder">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                📝 Analyst notes, tags, and source tracking coming soon
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <div>✓ Pipeline data: Ionis Q4 2024 Pipeline Update</div>
                <div>✓ Financials: Yahoo Finance, Dec 2024</div>
                <div>✓ Catalysts: Company presentations & SEC filings</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
