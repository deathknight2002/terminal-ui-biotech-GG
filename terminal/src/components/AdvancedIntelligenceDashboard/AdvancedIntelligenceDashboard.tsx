/**
 * Advanced Intelligence Dashboard
 *
 * Comprehensive drug intelligence dashboard that integrates multiple data sources:
 * - FDA approvals and safety signals
 * - PubMed literature sentiment
 * - Clinical trial predictions
 * - Molecular target analysis
 */

import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './AdvancedIntelligenceDashboard.css';

interface SafetySignal {
  drug: string;
  total_events: number;
  serious_events: number;
  serious_ratio: number;
  signal_strength: string;
  top_reactions: Array<{ reaction: string; count: number }>;
}

interface ComprehensiveIntelligence {
  drug_name: string;
  analysis_date: string;
  risk_assessment: {
    risk_score: number;
    risk_category: string;
    factors: any;
  };
  safety_profile: SafetySignal;
  research_landscape: {
    total_publications: number;
    sentiment: string;
    confidence: number;
    recent_publications: any[];
  };
  clinical_development: {
    total_trials: number;
    active_trials: number;
    trial_phases: string[];
    recent_trials: any[];
  };
  molecular_data: {
    has_structural_data: boolean;
    total_structures: number;
    structures: any[];
  };
}

interface DashboardMetrics {
  metrics: Array<{
    id: string;
    label: string;
    value: string;
    trend: string;
    change: string;
  }>;
  recent_approvals: Array<{
    drug: string;
    sponsor: string;
    date: string;
  }>;
  active_data_sources: Array<{
    name: string;
    status: string;
    last_sync: string | null;
  }>;
}

export const AdvancedIntelligenceDashboard: React.FC = () => {
  const [drugName, setDrugName] = useState('');
  const [loading, setLoading] = useState(false);
  const [intelligence, setIntelligence] = useState<ComprehensiveIntelligence | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardMetrics();
  }, []);

  const loadDashboardMetrics = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.INTELLIGENCE.DASHBOARD);
      const data = await response.json();
      setDashboardMetrics(data);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    }
  };

  const analyzeDrug = async () => {
    if (!drugName.trim()) {
      setError('Please enter a drug name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.INTELLIGENCE.COMPREHENSIVE(drugName));
      const data = await response.json();
      setIntelligence(data);
    } catch (err) {
      setError('Failed to fetch intelligence data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return '#00ff00';
    if (score < 60) return '#ffaa00';
    return '#ff0000';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return '#00ff00';
    if (sentiment === 'negative') return '#ff0000';
    return '#888888';
  };

  return (
    <div className="advanced-intelligence-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">⚡ ADVANCED DRUG INTELLIGENCE</h1>
        <p className="dashboard-subtitle">
          Powered by FDA, PubMed, ClinicalTrials.gov & Protein Data Bank
        </p>
      </div>

      {/* Dashboard Metrics */}
      {dashboardMetrics && (
        <div className="metrics-grid">
          {dashboardMetrics.metrics.map((metric) => (
            <div key={metric.id} className="metric-card">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
              <div className={`metric-change ${metric.trend}`}>
                {metric.change}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drug Search */}
      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter drug name (e.g., Keytruda, Opdivo, Ozempic)"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && analyzeDrug()}
            className="search-input"
          />
          <button
            onClick={analyzeDrug}
            disabled={loading}
            className="search-button"
          >
            {loading ? 'ANALYZING...' : 'ANALYZE'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Comprehensive Intelligence Report */}
      {intelligence && (
        <div className="intelligence-report">
          <div className="report-header">
            <h2>{intelligence.drug_name.toUpperCase()}</h2>
            <span className="analysis-date">
              Analysis: {new Date(intelligence.analysis_date).toLocaleDateString()}
            </span>
          </div>

          {/* Risk Assessment */}
          <div className="risk-assessment">
            <h3>RISK ASSESSMENT</h3>
            <div className="risk-score-container">
              <div className="risk-score-circle" style={{ borderColor: getRiskColor(intelligence.risk_assessment.risk_score) }}>
                <span className="risk-score">{intelligence.risk_assessment.risk_score}</span>
                <span className="risk-label">{intelligence.risk_assessment.risk_category}</span>
              </div>
              <div className="risk-factors">
                <div>Safety Signals: <strong>{intelligence.risk_assessment.factors.safety_signals}</strong></div>
                <div>Literature Sentiment: <strong style={{ color: getSentimentColor(intelligence.risk_assessment.factors.literature_sentiment) }}>
                  {intelligence.risk_assessment.factors.literature_sentiment}
                </strong></div>
                <div>Active Trials: <strong>{intelligence.risk_assessment.factors.active_trials}</strong></div>
                <div>Structural Data: <strong>{intelligence.risk_assessment.factors.structural_data_available ? 'Available' : 'N/A'}</strong></div>
              </div>
            </div>
          </div>

          {/* Safety Profile */}
          <div className="section">
            <h3>🛡️ SAFETY PROFILE</h3>
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-value">{intelligence.safety_profile.total_adverse_events || 0}</div>
                <div className="stat-label">Total Adverse Events</div>
              </div>
              <div className="stat">
                <div className="stat-value">{intelligence.safety_profile.serious_events || 0}</div>
                <div className="stat-label">Serious Events</div>
              </div>
              <div className="stat">
                <div className="stat-value">{intelligence.safety_profile.signal_strength?.toUpperCase() || 'N/A'}</div>
                <div className="stat-label">Signal Strength</div>
              </div>
            </div>
            {intelligence.safety_profile.top_reactions && intelligence.safety_profile.top_reactions.length > 0 && (
              <div className="top-reactions">
                <h4>Top Adverse Reactions:</h4>
                <ul>
                  {intelligence.safety_profile.top_reactions.map((reaction, idx) => (
                    <li key={idx}>
                      {reaction.reaction}: <strong>{reaction.count} events</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Research Landscape */}
          <div className="section">
            <h3>📚 RESEARCH LANDSCAPE</h3>
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-value">{intelligence.research_landscape.total_publications || 0}</div>
                <div className="stat-label">Total Publications</div>
              </div>
              <div className="stat">
                <div className="stat-value" style={{ color: getSentimentColor(intelligence.research_landscape.sentiment) }}>
                  {intelligence.research_landscape.sentiment?.toUpperCase() || 'NEUTRAL'}
                </div>
                <div className="stat-label">Sentiment</div>
              </div>
              <div className="stat">
                <div className="stat-value">{(intelligence.research_landscape.confidence * 100).toFixed(0)}%</div>
                <div className="stat-label">Confidence</div>
              </div>
            </div>
            {intelligence.research_landscape.recent_publications && intelligence.research_landscape.recent_publications.length > 0 && (
              <div className="recent-publications">
                <h4>Recent Publications:</h4>
                <ul>
                  {intelligence.research_landscape.recent_publications.slice(0, 3).map((pub: any, idx) => (
                    <li key={idx}>
                      <strong>{pub.title}</strong> ({pub.year})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Clinical Development */}
          <div className="section">
            <h3>🧪 CLINICAL DEVELOPMENT</h3>
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-value">{intelligence.clinical_development.total_trials || 0}</div>
                <div className="stat-label">Total Trials</div>
              </div>
              <div className="stat">
                <div className="stat-value">{intelligence.clinical_development.active_trials || 0}</div>
                <div className="stat-label">Active Trials</div>
              </div>
            </div>
            {intelligence.clinical_development.recent_trials && intelligence.clinical_development.recent_trials.length > 0 && (
              <div className="recent-trials">
                <h4>Recent Trials:</h4>
                <ul>
                  {intelligence.clinical_development.recent_trials.slice(0, 3).map((trial: any, idx) => (
                    <li key={idx}>
                      <strong>{trial.nct_id}</strong>: {trial.title} - {trial.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Molecular Data */}
          <div className="section">
            <h3>🧬 MOLECULAR DATA</h3>
            <div className="stats-grid">
              <div className="stat">
                <div className="stat-value">
                  {intelligence.molecular_data.has_structural_data ? 'YES' : 'NO'}
                </div>
                <div className="stat-label">Structural Data Available</div>
              </div>
              <div className="stat">
                <div className="stat-value">{intelligence.molecular_data.total_structures || 0}</div>
                <div className="stat-label">PDB Structures</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent FDA Approvals */}
      {dashboardMetrics && dashboardMetrics.recent_approvals && (
        <div className="recent-approvals">
          <h3>Recent FDA Approvals (30 Days)</h3>
          <div className="approvals-list">
            {dashboardMetrics.recent_approvals.map((approval, idx) => (
              <div key={idx} className="approval-item">
                <div className="approval-drug">{approval.drug}</div>
                <div className="approval-sponsor">{approval.sponsor}</div>
                <div className="approval-date">{approval.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Sources Status */}
      {dashboardMetrics && dashboardMetrics.active_data_sources && (
        <div className="data-sources">
          <h3>Data Sources Status</h3>
          <div className="sources-grid">
            {dashboardMetrics.active_data_sources.map((source, idx) => (
              <div key={idx} className={`source-item ${source.status}`}>
                <div className="source-name">{source.name}</div>
                <div className={`source-status ${source.status}`}>
                  {source.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
