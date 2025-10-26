import React, { useState, useEffect } from 'react';
import './KOLTracker.css';

interface KOLSignal {
  id: number;
  source_id: number;
  signal_type: string;
  signal_text: string;
  signal_sentiment: number;
  company_ticker: string;
  drug_name?: string;
  signal_date: string;
  quality_score: number;
  impact_score: number;
  platform?: string;
  post_url?: string;
}

interface KOLScore {
  id: number;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  aggregate_sentiment: number;
  weighted_sentiment: number;
  confidence_score: number;
  signal_count: number;
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
}

export interface KOLTrackerProps {
  apiBaseUrl?: string;
  className?: string;
  cornerBrackets?: boolean;
}

/**
 * KOL Tracker Dashboard
 * Displays KOL signals and ranked entities for biotech hedge fund trading
 */
export const KOLTracker: React.FC<KOLTrackerProps> = ({
  apiBaseUrl = 'http://localhost:8000',
  className = '',
  cornerBrackets = true,
}) => {
  const [scores, setScores] = useState<KOLScore[]>([]);
  const [signals, setSignals] = useState<KOLSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rankings' | 'signals'>('rankings');
  const [filterType, setFilterType] = useState<'all' | 'bullish' | 'bearish'>('all');

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch top-ranked entities
      const scoresResponse = await fetch(
        `${apiBaseUrl}/api/v1/kol/scores?entity_type=company&lookback_days=30&limit=50`
      );
      if (!scoresResponse.ok) {
        throw new Error('Failed to fetch KOL scores');
      }
      const scoresData = await scoresResponse.json();
      setScores(scoresData);

      // Fetch recent signals
      const signalsResponse = await fetch(
        `${apiBaseUrl}/api/v1/kol/signals?days_back=7&min_quality=0.5&limit=100`
      );
      if (!signalsResponse.ok) {
        throw new Error('Failed to fetch KOL signals');
      }
      const signalsData = await signalsResponse.json();
      setSignals(signalsData);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching KOL data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.3) return 'var(--success-primary)';
    if (sentiment < -0.3) return 'var(--error-primary)';
    return 'var(--text-tertiary)';
  };

  const getSentimentLabel = (sentiment: number): string => {
    if (sentiment > 0.5) return 'STRONG BULLISH';
    if (sentiment > 0.2) return 'BULLISH';
    if (sentiment < -0.5) return 'STRONG BEARISH';
    if (sentiment < -0.2) return 'BEARISH';
    return 'NEUTRAL';
  };

  const getSignalTypeColor = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'bullish':
      case 'upgrade':
        return 'var(--success-primary)';
      case 'bearish':
      case 'downgrade':
        return 'var(--error-primary)';
      case 'catalyst_alert':
        return 'var(--warning-primary)';
      default:
        return 'var(--text-tertiary)';
    }
  };

  const filteredScores = scores.filter(score => {
    if (filterType === 'all') return true;
    if (filterType === 'bullish') return score.weighted_sentiment > 0.2;
    if (filterType === 'bearish') return score.weighted_sentiment < -0.2;
    return true;
  });

  const renderRankings = () => (
    <div className="kol-rankings">
      <div className="filter-controls">
        <button
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          ALL
        </button>
        <button
          className={`filter-btn ${filterType === 'bullish' ? 'active' : ''}`}
          onClick={() => setFilterType('bullish')}
        >
          BULLISH
        </button>
        <button
          className={`filter-btn ${filterType === 'bearish' ? 'active' : ''}`}
          onClick={() => setFilterType('bearish')}
        >
          BEARISH
        </button>
      </div>

      <table className="kol-rankings-table">
        <thead>
          <tr>
            <th>RANK</th>
            <th>TICKER</th>
            <th>COMPANY</th>
            <th>SENTIMENT</th>
            <th>SIGNALS</th>
            <th>CONFIDENCE</th>
            <th>COMPOSITION</th>
          </tr>
        </thead>
        <tbody>
          {filteredScores.map((score, index) => (
            <tr key={score.id} className="ranking-row">
              <td className="rank-cell">#{index + 1}</td>
              <td className="ticker-cell">
                <span className="ticker">{score.entity_id}</span>
              </td>
              <td className="company-cell">{score.entity_name || score.entity_id}</td>
              <td className="sentiment-cell">
                <span
                  className="sentiment-badge"
                  style={{ color: getSentimentColor(score.weighted_sentiment) }}
                >
                  {getSentimentLabel(score.weighted_sentiment)}
                </span>
                <span className="sentiment-value">
                  {(score.weighted_sentiment * 100).toFixed(0)}%
                </span>
              </td>
              <td className="signals-cell">{score.signal_count}</td>
              <td className="confidence-cell">
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${score.confidence_score * 100}%` }}
                  />
                </div>
                <span className="confidence-value">
                  {(score.confidence_score * 100).toFixed(0)}%
                </span>
              </td>
              <td className="composition-cell">
                <span className="composition-item bullish">
                  ↑{score.bullish_count}
                </span>
                <span className="composition-item bearish">
                  ↓{score.bearish_count}
                </span>
                <span className="composition-item neutral">
                  ={score.neutral_count}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSignals = () => (
    <div className="kol-signals">
      <div className="signals-grid">
        {signals.map(signal => (
          <div key={signal.id} className="signal-card">
            <div className="signal-header">
              <span
                className="signal-type"
                style={{ color: getSignalTypeColor(signal.signal_type) }}
              >
                {signal.signal_type.toUpperCase()}
              </span>
              {signal.company_ticker && (
                <span className="signal-ticker">${signal.company_ticker}</span>
              )}
              <span className="signal-date">
                {new Date(signal.signal_date).toLocaleDateString()}
              </span>
            </div>

            <div className="signal-body">
              <p className="signal-text">{signal.signal_text}</p>
            </div>

            <div className="signal-footer">
              {signal.platform && (
                <span className="signal-platform">{signal.platform}</span>
              )}
              <div className="signal-scores">
                <span className="score-badge">
                  Q: {(signal.quality_score * 100).toFixed(0)}
                </span>
                <span className="score-badge">
                  I: {(signal.impact_score * 100).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading && scores.length === 0) {
    return (
      <div className={`kol-tracker ${className} ${cornerBrackets ? 'corner-brackets' : ''}`}>
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>LOADING KOL DATA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`kol-tracker ${className} ${cornerBrackets ? 'corner-brackets' : ''}`}>
        <div className="error-state">
          <p className="error-message">ERROR: {error}</p>
          <button onClick={fetchData} className="retry-btn">
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`kol-tracker ${className} ${cornerBrackets ? 'corner-brackets' : ''}`}>
      <div className="kol-tracker-header">
        <h2 className="tracker-title">KOL INTELLIGENCE</h2>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-label">ENTITIES</span>
            <span className="stat-value">{scores.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">SIGNALS (7D)</span>
            <span className="stat-value">{signals.length}</span>
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'rankings' ? 'active' : ''}`}
          onClick={() => setActiveTab('rankings')}
        >
          RANKINGS
        </button>
        <button
          className={`tab-btn ${activeTab === 'signals' ? 'active' : ''}`}
          onClick={() => setActiveTab('signals')}
        >
          SIGNAL FEED
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'rankings' ? renderRankings() : renderSignals()}
      </div>

      <div className="tracker-footer">
        <button onClick={fetchData} className="refresh-btn" disabled={loading}>
          {loading ? 'REFRESHING...' : 'REFRESH DATA'}
        </button>
        <span className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default KOLTracker;
