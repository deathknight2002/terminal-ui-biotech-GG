import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DraggablePanel } from '../components/layout/DraggablePanel';
import { TabbedPanel } from '../components/layout/TabbedPanel';
import { AdvancedChart } from '../components/charts/AdvancedChart';
import { DCFCalculator } from '../components/calculators/DCFCalculator';
import { PipelineVisualization } from '../components/visualizations/PipelineVisualization';
import { ProbabilityModeler } from '../components/visualizations/ProbabilityModeler';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import { IONIS_PROFILE, generateIonisStockData } from '../data/ionisData';
import { IONIS_PIPELINE } from '../data/ionisPipeline';
import './IonisProfilePage.css';

export const IonisProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [showDragPanels, setShowDragPanels] = useState(false);
  const [panels, setPanels] = useState<{ id: string; title: string; visible: boolean }[]>([
    { id: 'panel-1', title: 'MARKET DATA', visible: true },
    { id: 'panel-2', title: 'PIPELINE ANALYSIS', visible: true },
  ]);

  const stockData = generateIonisStockData();
  const profile = IONIS_PROFILE;

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  const handleClosePanel = (panelId: string) => {
    setPanels(panels.map(p => p.id === panelId ? { ...p, visible: false } : p));
  };

  return (
    <div className="ionis-profile-page">
      {/* Header */}
      <div className="ionis-header">
        <div className="header-top">
          <button onClick={() => navigate(-1)} className="btn-back">
            ← BACK
          </button>
          <div className="header-title-section">
            <h1 className="company-ticker">{profile.ticker}</h1>
            <h2 className="company-name">{profile.name}</h2>
            {profile.xbi_membership.is_constituent && (
              <span className="xbi-badge">XBI CONSTITUENT</span>
            )}
          </div>
          <div className="header-controls">
            <button
              className={`mode-toggle ${showDragPanels ? 'active' : ''}`}
              onClick={() => setShowDragPanels(!showDragPanels)}
            >
              {showDragPanels ? 'GRID MODE' : 'DRAG MODE'}
            </button>
          </div>
        </div>

        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-label">PRICE</div>
            <div className="stat-value">{formatCurrency(profile.financials.latest_price)}</div>
            <div className="stat-change positive">
              +{profile.financials.price_change?.toFixed(2)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">MARKET CAP</div>
            <div className="stat-value">{formatCurrency(profile.financials.market_cap)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">CASH</div>
            <div className="stat-value">{formatCurrency(profile.financials.cash_position)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">PIPELINE</div>
            <div className="stat-value">{profile.pipeline.program_count} PROGRAMS</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">CATALYSTS</div>
            <div className="stat-value">{profile.catalysts.upcoming_count} UPCOMING</div>
          </div>
        </div>
      </div>

      {/* Content */}
      {!showDragPanels ? (
        <div className="ionis-content-grid">
          {/* Tabbed Panel Demo */}
          <div className="content-section">
            <TabbedPanel
              title="CHARTING & ANALYTICS"
              tabs={[
                {
                  id: 'price-chart',
                  label: 'PRICE CHART',
                  content: (
                    <AdvancedChart
                      data={stockData}
                      title="IONS PRICE HISTORY (90 DAYS)"
                      initialChartType="candlestick"
                      initialTimeframe="3M"
                      enableIndicators={true}
                    />
                  ),
                },
                {
                  id: 'dcf',
                  label: 'DCF CALCULATOR',
                  content: (
                    <DCFCalculator
                      initialInputs={{
                        revenue: 800,
                        revenueGrowthRate: 18,
                        ebitdaMargin: 40,
                        taxRate: 21,
                        wacc: 9.5,
                        terminalGrowthRate: 3,
                        sharesOutstanding: 110,
                        netDebt: -850, // Negative = net cash
                      }}
                    />
                  ),
                  closeable: false,
                },
                {
                  id: 'probability',
                  label: 'PROBABILITY MODEL',
                  content: (
                    <ProbabilityModeler
                      indication="Cardiovascular"
                      currentPhase="Phase II"
                      enableMonteCarloSimulation={true}
                    />
                  ),
                  closeable: true,
                },
              ]}
            />
          </div>

          {/* Pipeline Visualization */}
          <div className="content-section full-width">
            <Panel title="COMPREHENSIVE DRUG DEVELOPMENT PIPELINE" cornerBrackets>
              <PipelineVisualization
                programs={IONIS_PIPELINE}
                title="IONIS 42-PROGRAM PIPELINE"
                enableZoom={true}
                enableFiltering={true}
              />
            </Panel>
          </div>

          {/* Company Info */}
          <div className="content-section">
            <Panel title="COMPANY INFORMATION" cornerBrackets>
              <div className="company-info">
                <div className="info-row">
                  <span className="info-label">TYPE:</span>
                  <span className="info-value">{profile.company_type}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">HQ:</span>
                  <span className="info-value">{profile.headquarters}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">FOUNDED:</span>
                  <span className="info-value">{profile.founded_year}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">EMPLOYEES:</span>
                  <span className="info-value">{formatNumber(profile.employees)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">ENTERPRISE VALUE:</span>
                  <span className="info-value">{formatCurrency(profile.financials.enterprise_value)}</span>
                </div>
              </div>
              <div className="company-description">
                <p>{profile.description}</p>
              </div>
              <div className="company-links">
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="link-btn">
                  WEBSITE →
                </a>
                <a href={profile.investor_relations_url} target="_blank" rel="noopener noreferrer" className="link-btn">
                  INVESTOR RELATIONS →
                </a>
              </div>
            </Panel>
          </div>

          {/* Therapeutic Areas */}
          <div className="content-section">
            <Panel title="THERAPEUTIC AREAS" cornerBrackets>
              <div className="therapeutic-areas">
                {profile.pipeline.therapeutic_areas.map(ta => {
                  const programCount = IONIS_PIPELINE.filter(p => p.therapeuticArea === ta).length;
                  const totalPeakSales = IONIS_PIPELINE
                    .filter(p => p.therapeuticArea === ta)
                    .reduce((sum, p) => sum + (p.peakSales || 0), 0);
                  
                  return (
                    <div key={ta} className="ta-card">
                      <div className="ta-name">{ta}</div>
                      <div className="ta-programs">{programCount} Programs</div>
                      <div className="ta-value">${totalPeakSales}M Peak Sales</div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
        </div>
      ) : (
        <div className="ionis-content-draggable">
          {panels.filter(p => p.visible).map((panel, index) => (
            <DraggablePanel
              key={panel.id}
              id={panel.id}
              title={panel.title}
              initialPosition={{ x: 50 + index * 30, y: 50 + index * 30 }}
              initialSize={{ width: 600, height: 400 }}
              onClose={handleClosePanel}
              cornerBrackets
            >
              {panel.id === 'panel-1' && (
                <AdvancedChart
                  data={stockData}
                  title="IONS PRICE HISTORY"
                  initialChartType="line"
                  initialTimeframe="1M"
                />
              )}
              {panel.id === 'panel-2' && (
                <div style={{ height: '100%', overflow: 'auto' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--accent-primary)' }}>
                    TOP PIPELINE PROGRAMS
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {IONIS_PIPELINE.slice(0, 5).map(program => (
                      <div
                        key={program.id}
                        style={{
                          background: 'var(--bg-terminal)',
                          border: '1px solid var(--border-primary)',
                          padding: '0.75rem',
                          borderRadius: '4px',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {program.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {program.indication} • {program.phase}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DraggablePanel>
          ))}
        </div>
      )}
    </div>
  );
};
