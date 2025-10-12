import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { PMLayoutPersistence } from '../utils/pmLayoutPersistence';
import type { SavedView } from '../../../src/types/biotech';
import './IonisPMModePage.css';

export const IonisPMModePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');

  // Load saved views on mount
  useEffect(() => {
    // Load all views for future use (display in dropdown, etc.)
    const views = PMLayoutPersistence.getAllViews();
    console.log('Available saved views:', views.length);
    
    // Check if we have a shared view in URL
    const shareHash = searchParams.get('view');
    if (shareHash) {
      const sharedState = PMLayoutPersistence.parseShareHash(shareHash);
      if (sharedState) {
        // Apply shared state (filters, etc.)
        console.log('Loaded shared view:', sharedState);
      }
    } else {
      // Load last saved view
      const currentView = PMLayoutPersistence.loadCurrentView();
      if (currentView) {
        console.log('Restored previous view:', currentView);
      }
    }
  }, [searchParams]);

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

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name: viewName,
      filters: {}, // Would contain actual filter state
      layout: 'pmMode',
    };
    
    PMLayoutPersistence.saveView(newView);
    // Refresh the available views count
    const views = PMLayoutPersistence.getAllViews();
    console.log('Saved view. Total views:', views.length);
    setShowSaveDialog(false);
    setViewName('');
  };

  const handleShareView = () => {
    const currentView: SavedView = {
      id: 'temp',
      name: 'Current View',
      filters: {},
      layout: 'pmMode',
    };
    
    const hash = PMLayoutPersistence.generateShareHash(currentView);
    const shareUrl = `${window.location.origin}${window.location.pathname}?view=${hash}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!');
    });
  };

  const handleExportDeck = () => {
    alert('Export to PowerPoint/PDF coming soon!');
  };

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
            <button className="btn-action" onClick={() => setShowSaveDialog(true)}>
              💾 SAVE VIEW
            </button>
            <button className="btn-action" onClick={handleExportDeck}>
              📤 EXPORT DECK
            </button>
            <button className="btn-action" onClick={handleShareView}>
              🔗 SHARE LINK
            </button>
          </div>
        </div>

        {/* Save View Dialog */}
        {showSaveDialog && (
          <div className="save-view-dialog">
            <div className="dialog-content">
              <h3>SAVE VIEW</h3>
              <input
                type="text"
                placeholder="Enter view name..."
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                className="view-name-input"
              />
              <div className="dialog-actions">
                <button onClick={handleSaveView} className="btn-primary">
                  SAVE
                </button>
                <button onClick={() => setShowSaveDialog(false)} className="btn-secondary">
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

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
