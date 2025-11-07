import React, { useState, useMemo } from 'react';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel';
import { DISTRESSED_COMPANIES, DISTRESSED_CATALYSTS, calculateRegulatoryOverhangScore } from '../../../src/mocks/distressed-companies';
import type { DistressedCompany, RegulatoryDistressedCatalyst, CRLType, CatalystTier } from '../../../src/types/biotech';
import './DistressedCatalystTrackerPage.css';

type ViewMode = 'watchlist' | 'catalysts' | 'analytics';
type FilterTier = 'all' | 'tier1' | 'tier2' | 'tier3';

export function DistressedCatalystTrackerPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('watchlist');
  const [filterTier, setFilterTier] = useState<FilterTier>('all');
  const [sortBy, setSortBy] = useState<'asymmetry' | 'probability' | 'timeline'>('asymmetry');

  // Get CRL color based on solvability
  const getCRLColor = (crlType?: CRLType): string => {
    if (!crlType) return 'crl-unknown';
    switch (crlType) {
      case 'Manufacturing':
        return 'crl-manufacturing'; // Green - High solvability
      case 'Trial Design':
        return 'crl-trial-design'; // Yellow - Medium solvability
      case 'Efficacy':
        return 'crl-efficacy'; // Red - Low solvability
      case 'Safety':
        return 'crl-safety'; // Blue - Case-by-case
      default:
        return 'crl-unknown';
    }
  };

  // Get confidence color
  const getConfidenceColor = (probability: number, hasPrecedent: boolean, mgmtExp?: string): string => {
    if (mgmtExp === 'Strong' && hasPrecedent) return 'confidence-high';
    if (mgmtExp === 'Limited' || !hasPrecedent) return 'confidence-low';
    return 'confidence-medium';
  };

  // Get tier badge color
  const getTierColor = (tier: CatalystTier): string => {
    switch (tier) {
      case 'Tier 1':
        return 'tier-1'; // Binary outcomes
      case 'Tier 2':
        return 'tier-2'; // De-risking
      case 'Tier 3':
        return 'tier-3'; // Incremental
      default:
        return 'tier-unknown';
    }
  };

  // Sort companies
  const sortedCompanies = useMemo(() => {
    const companies = [...DISTRESSED_COMPANIES];
    switch (sortBy) {
      case 'asymmetry':
        return companies.sort((a, b) => b.asymmetricOpportunity.asymmetryScore - a.asymmetricOpportunity.asymmetryScore);
      case 'probability':
        return companies.sort((a, b) => b.probability - a.probability);
      case 'timeline':
        return companies.sort((a, b) => {
          const dateA = a.catalystDate ? new Date(a.catalystDate).getTime() : Infinity;
          const dateB = b.catalystDate ? new Date(b.catalystDate).getTime() : Infinity;
          return dateA - dateB;
        });
      default:
        return companies;
    }
  }, [sortBy]);

  // Filter catalysts by tier
  const filteredCatalysts = useMemo(() => {
    if (filterTier === 'all') return DISTRESSED_CATALYSTS;
    const tierMap = {
      'tier1': 'Tier 1',
      'tier2': 'Tier 2',
      'tier3': 'Tier 3',
    };
    return DISTRESSED_CATALYSTS.filter(c => c.tier === tierMap[filterTier]);
  }, [filterTier]);

  // Group catalysts by tier for the calendar view
  const catalystsByTier = useMemo(() => {
    const grouped: Record<CatalystTier, RegulatoryDistressedCatalyst[]> = {
      'Tier 1': [],
      'Tier 2': [],
      'Tier 3': [],
    };
    DISTRESSED_CATALYSTS.forEach(catalyst => {
      grouped[catalyst.tier].push(catalyst);
    });
    return grouped;
  }, []);

  // Render Master Distressed Watchlist
  const renderWatchlist = () => (
    <div className="watchlist-container">
      <div className="watchlist-controls">
        <div className="control-group">
          <label>SORT BY:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="sort-select">
            <option value="asymmetry">ASYMMETRY SCORE</option>
            <option value="probability">PROBABILITY</option>
            <option value="timeline">TIMELINE</option>
          </select>
        </div>
      </div>

      <div className="watchlist-table-wrapper">
        <table className="watchlist-table">
          <thead>
            <tr>
              <th>TICKER</th>
              <th>COMPANY</th>
              <th>REGULATORY SITUATION</th>
              <th>CURRENT STATUS</th>
              <th>CRL TYPE</th>
              <th>MARKET OVERREACTION THESIS</th>
              <th>RESOLUTION CATALYST</th>
              <th>TIMELINE</th>
              <th>PROB.</th>
              <th>ASYMMETRY</th>
              <th>OVERHANG</th>
            </tr>
          </thead>
          <tbody>
            {sortedCompanies.map((company) => {
              const hasPrecedent = company.resolutionPath?.precedents && company.resolutionPath.precedents.length > 0;
              const confidenceClass = getConfidenceColor(
                company.probability,
                hasPrecedent,
                company.resolutionPath?.managementFDAExperience
              );
              
              return (
                <tr key={company.id} className="watchlist-row">
                  <td className="ticker-cell">
                    <span className="ticker-symbol">{company.ticker}</span>
                  </td>
                  <td className="company-cell">{company.company}</td>
                  <td className="situation-cell">
                    <div className="situation-text">{company.regulatorySituation}</div>
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge status-${company.currentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                      {company.currentStatus}
                    </span>
                  </td>
                  <td className="crl-cell">
                    {company.crlType && (
                      <span className={`crl-badge ${getCRLColor(company.crlType)}`}>
                        {company.crlType}
                      </span>
                    )}
                    {company.solvability && (
                      <div className="solvability-text">{company.solvability} Solvability</div>
                    )}
                  </td>
                  <td className="thesis-cell">
                    <div className="thesis-text">{company.marketOverreactionThesis}</div>
                  </td>
                  <td className="catalyst-cell">
                    <div className="catalyst-text">{company.resolutionCatalyst}</div>
                  </td>
                  <td className="timeline-cell">
                    <span className="timeline-badge">{company.timelineQuarter || 'TBD'}</span>
                  </td>
                  <td className="probability-cell">
                    <span className={`probability-badge ${confidenceClass}`}>
                      {company.probability}%
                    </span>
                  </td>
                  <td className="asymmetry-cell">
                    <div className="asymmetry-score">
                      {company.asymmetricOpportunity.asymmetryScore.toFixed(1)}:1
                    </div>
                    <div className="asymmetry-details">
                      ↑{company.asymmetricOpportunity.upsidePercent}% / 
                      ↓{company.asymmetricOpportunity.downsidePercent}%
                    </div>
                  </td>
                  <td className="overhang-cell">
                    <div className={`overhang-score overhang-${Math.floor(company.regulatoryOverhangScore || 0)}`}>
                      {(company.regulatoryOverhangScore || 0).toFixed(1)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CRL Decoder Matrix Legend */}
      <div className="crl-decoder-legend">
        <h3>CRL DECODER MATRIX</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="crl-badge crl-manufacturing">Manufacturing</span>
            <span className="legend-text">High Solvability - CMC/Process Issues</span>
          </div>
          <div className="legend-item">
            <span className="crl-badge crl-trial-design">Trial Design</span>
            <span className="legend-text">Medium Solvability - Protocol Amendments</span>
          </div>
          <div className="legend-item">
            <span className="crl-badge crl-efficacy">Efficacy</span>
            <span className="legend-text">Low Solvability - Fundamental Questions</span>
          </div>
          <div className="legend-item">
            <span className="crl-badge crl-safety">Safety</span>
            <span className="legend-text">Case-by-Case - Risk Management Possible</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Regulatory Catalyst Calendar with Tiered Importance
  const renderCatalysts = () => (
    <div className="catalysts-container">
      <div className="catalysts-controls">
        <div className="tier-filters">
          <button
            className={`tier-filter-btn ${filterTier === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTier('all')}
          >
            ALL CATALYSTS
          </button>
          <button
            className={`tier-filter-btn ${filterTier === 'tier1' ? 'active' : ''}`}
            onClick={() => setFilterTier('tier1')}
          >
            TIER 1 - BINARY
          </button>
          <button
            className={`tier-filter-btn ${filterTier === 'tier2' ? 'active' : ''}`}
            onClick={() => setFilterTier('tier2')}
          >
            TIER 2 - DE-RISKING
          </button>
          <button
            className={`tier-filter-btn ${filterTier === 'tier3' ? 'active' : ''}`}
            onClick={() => setFilterTier('tier3')}
          >
            TIER 3 - INCREMENTAL
          </button>
        </div>
      </div>

      {/* Tier Descriptions */}
      <div className="tier-descriptions">
        <div className="tier-description tier-1-desc">
          <h4>🔴 TIER 1 - BINARY OUTCOMES</h4>
          <p>Stock moving ±50%+: FDA ADCOM Meetings, CRL Responses, Clinical Hold Removals</p>
        </div>
        <div className="tier-description tier-2-desc">
          <h4>🟡 TIER 2 - DE-RISKING EVENTS</h4>
          <p>Stock moving ±20-40%: Type A Meeting Outcomes, Protocol Amendment Acceptance, SPAs</p>
        </div>
        <div className="tier-description tier-3-desc">
          <h4>🟢 TIER 3 - INCREMENTAL UPDATES</h4>
          <p>Stock moving ±10-20%: FDA Meeting Announcements, Manufacturing Updates, Submission Dates</p>
        </div>
      </div>

      {/* Catalysts List */}
      <div className="catalysts-list">
        {filteredCatalysts.map((catalyst) => {
          const company = DISTRESSED_COMPANIES.find(c => c.ticker === catalyst.ticker);
          const confidenceClass = getConfidenceColor(
            catalyst.probability,
            company?.resolutionPath?.precedents?.length ? true : false,
            company?.resolutionPath?.managementFDAExperience
          );

          return (
            <div key={catalyst.id} className={`catalyst-card ${getTierColor(catalyst.tier)}`}>
              <div className="catalyst-header">
                <div className="catalyst-company-info">
                  <span className="catalyst-ticker">{catalyst.ticker}</span>
                  <span className="catalyst-company">{catalyst.company}</span>
                </div>
                <div className="catalyst-badges">
                  <span className={`tier-badge ${getTierColor(catalyst.tier)}`}>
                    {catalyst.tier}
                  </span>
                  <span className={`impact-badge impact-${catalyst.expectedImpact.toLowerCase()}`}>
                    {catalyst.expectedImpact} IMPACT
                  </span>
                </div>
              </div>

              <div className="catalyst-main">
                <h3 className="catalyst-type">{catalyst.catalystType}</h3>
                <div className="catalyst-timeline">
                  <span className="timeline-label">EXPECTED:</span>
                  <span className="timeline-value">{catalyst.dateRange || 'TBD'}</span>
                </div>
              </div>

              <div className="catalyst-details">
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{catalyst.description}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Regulatory Situation:</span>
                  <span className="detail-value">{catalyst.reguatorySituation}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Expected Move:</span>
                  <span className="detail-value expected-move">{catalyst.expectedMove}</span>
                </div>
              </div>

              <div className="catalyst-metrics">
                <div className="metric-item">
                  <span className="metric-label">PROBABILITY</span>
                  <span className={`metric-value ${confidenceClass}`}>{catalyst.probability}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">CONFIDENCE</span>
                  <span className={`metric-value ${confidenceClass}`}>{catalyst.confidenceLevel}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">STATUS</span>
                  <span className={`metric-value status-${catalyst.status.toLowerCase()}`}>
                    {catalyst.status}
                  </span>
                </div>
              </div>

              {/* Key Factors */}
              {catalyst.keyFactors && catalyst.keyFactors.length > 0 && (
                <div className="key-factors">
                  <div className="key-factors-label">KEY FACTORS:</div>
                  <ul className="key-factors-list">
                    {catalyst.keyFactors.map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render Advanced Analytics
  const renderAnalytics = () => (
    <div className="analytics-container">
      <div className="analytics-grid">
        {/* Cash Runway Alerts */}
        <div className="analytics-panel">
          <h3>💰 CASH RUNWAY vs REGULATORY TIMELINE</h3>
          <div className="runway-alerts">
            {sortedCompanies.map((company) => {
              if (!company.cashRunway) return null;
              const hasFundingGap = company.cashRunway.fundingGap;
              
              return (
                <div key={company.id} className={`runway-alert ${hasFundingGap ? 'funding-gap' : 'adequate-runway'}`}>
                  <div className="runway-header">
                    <span className="runway-ticker">{company.ticker}</span>
                    <span className={`runway-status ${hasFundingGap ? 'gap' : 'adequate'}`}>
                      {hasFundingGap ? '🟥 FUNDING GAP' : '🟩 ADEQUATE RUNWAY'}
                    </span>
                  </div>
                  <div className="runway-details">
                    <div className="runway-metric">
                      <span className="runway-label">Cash Runway:</span>
                      <span className="runway-value">{company.cashRunway.runwayMonths} months</span>
                    </div>
                    <div className="runway-metric">
                      <span className="runway-label">Regulatory Timeline:</span>
                      <span className="runway-value">{company.cashRunway.regulatoryTimelineMonths} months</span>
                    </div>
                    {company.cashRunway.managementFundingStrategy && (
                      <div className="runway-strategy">
                        <span className="strategy-label">Strategy:</span>
                        <span className="strategy-text">{company.cashRunway.managementFundingStrategy}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regulatory Overhang Scores */}
        <div className="analytics-panel">
          <h3>📊 REGULATORY OVERHANG SCORECARD</h3>
          <p className="panel-description">
            Score = (CRL Severity × 0.3) + (Time Since CRL × 0.2) + (Cash Pressure × 0.3) + (Mgmt Experience × 0.2)
          </p>
          <div className="overhang-chart">
            {sortedCompanies
              .sort((a, b) => (b.regulatoryOverhangScore || 0) - (a.regulatoryOverhangScore || 0))
              .map((company) => {
                const score = company.regulatoryOverhangScore || 0;
                const scoreClass = score >= 7 ? 'high' : score >= 5 ? 'medium' : 'low';
                
                return (
                  <div key={company.id} className="overhang-bar-item">
                    <div className="overhang-bar-label">
                      <span className="bar-ticker">{company.ticker}</span>
                      <span className="bar-score">{score.toFixed(1)}</span>
                    </div>
                    <div className="overhang-bar-container">
                      <div 
                        className={`overhang-bar ${scoreClass}`}
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Asymmetric Opportunity Matrix */}
        <div className="analytics-panel">
          <h3>🎯 ASYMMETRIC OPPORTUNITY MATRIX</h3>
          <div className="asymmetry-grid">
            {sortedCompanies
              .sort((a, b) => b.asymmetricOpportunity.asymmetryScore - a.asymmetricOpportunity.asymmetryScore)
              .map((company) => {
                const { upsidePercent, downsidePercent, asymmetryScore } = company.asymmetricOpportunity;
                const scoreClass = asymmetryScore >= 6 ? 'excellent' : asymmetryScore >= 4 ? 'good' : 'fair';
                
                return (
                  <div key={company.id} className={`asymmetry-card ${scoreClass}`}>
                    <div className="asymmetry-header">
                      <span className="asymmetry-ticker">{company.ticker}</span>
                      <span className={`asymmetry-score ${scoreClass}`}>
                        {asymmetryScore.toFixed(1)}:1
                      </span>
                    </div>
                    <div className="asymmetry-breakdown">
                      <div className="asymmetry-upside">
                        <span className="asymmetry-label">UPSIDE</span>
                        <span className="asymmetry-value upside">+{upsidePercent}%</span>
                      </div>
                      <div className="asymmetry-divider">/</div>
                      <div className="asymmetry-downside">
                        <span className="asymmetry-label">DOWNSIDE</span>
                        <span className="asymmetry-value downside">-{downsidePercent}%</span>
                      </div>
                    </div>
                    <div className="asymmetry-thesis">
                      {company.marketOverreactionThesis}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="distressed-catalyst-tracker-page">
      <Panel
        title="DISTRESSED BIOTECH CATALYST TRACKER - NATALIE'S REGULATORY ARBITRAGE DASHBOARD"
        cornerBrackets
        variant="glass"
        headerAction={
          <div className="view-mode-controls">
            <button
              className={`view-mode-btn ${viewMode === 'watchlist' ? 'active' : ''}`}
              onClick={() => setViewMode('watchlist')}
            >
              📋 MASTER WATCHLIST
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'catalysts' ? 'active' : ''}`}
              onClick={() => setViewMode('catalysts')}
            >
              📅 CATALYST CALENDAR
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'analytics' ? 'active' : ''}`}
              onClick={() => setViewMode('analytics')}
            >
              📊 ADVANCED ANALYTICS
            </button>
          </div>
        }
      >
        <div className="tracker-content">
          {viewMode === 'watchlist' && renderWatchlist()}
          {viewMode === 'catalysts' && renderCatalysts()}
          {viewMode === 'analytics' && renderAnalytics()}
        </div>
      </Panel>
    </div>
  );
}
