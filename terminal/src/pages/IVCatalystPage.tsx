/**
 * IV Catalyst Page
 * 
 * Main page for IV catalyst tracking - identifies asymmetric setups
 * ahead of biotech catalysts using implied volatility signals.
 */

import React, { useState, useEffect, useCallback } from 'react';
import IVCatalystHeatmap from '../components/IVCatalystHeatmap';
import './IVCatalystPage.css';

interface IVSignal {
  ticker: string;
  signal_date: string;
  event_date: string;
  event_type: string;
  days_to_event: number;
  signal_score: number;
  confidence: number;
  quality: string;
  metrics: {
    iv7: number;
    iv30: number;
    iv_rv_ratio: number;
    term_backwardation: number;
    skew25d: number;
    skew_change: number;
    iv7_pctile: number;
    price: number;
    ret5d: number;
  };
  flags: {
    backwardation: boolean;
    iv_rv_elevated: boolean;
    skew_significant: boolean;
    oi_spike: boolean;
  };
}

export const IVCatalystPage: React.FC = () => {
  const [signals, setSignals] = useState<IVSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(2);
  const [maxDays, setMaxDays] = useState(60);
  const [selectedQuality, setSelectedQuality] = useState<string>('');

  const fetchSignals = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        min_score: minScore.toString(),
        max_days_to_event: maxDays.toString(),
      });
      
      if (selectedQuality) {
        params.append('quality', selectedQuality);
      }
      
      const response = await fetch(`/api/v1/iv/signals?${params}`);
      if (!response.ok) throw new Error('Failed to fetch IV signals');
      
      const data = await response.json();
      setSignals(data.signals || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [minScore, maxDays, selectedQuality]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const getQualityClass = (quality: string): string => {
    switch (quality.toLowerCase()) {
      case 'high':
        return 'quality-high';
      case 'medium':
        return 'quality-medium';
      case 'low':
        return 'quality-low';
      default:
        return '';
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="iv-catalyst-page">
      <div className="page-header">
        <h1 className="page-title">IV CATALYST TRACKER</h1>
        <p className="page-subtitle">
          Identify asymmetric setups using implied volatility spikes ahead of biotech catalysts
        </p>
      </div>

      <div className="page-content">
        {/* Signal Dashboard */}
        <section className="signals-section">
          <div className="section-header">
            <h2 className="section-title">ACTIVE SIGNALS</h2>
            
            <div className="section-controls">
              <div className="control-group">
                <label>MIN SCORE:</label>
                <select value={minScore} onChange={(e) => setMinScore(Number(e.target.value))}>
                  <option value="0">0 (All)</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4 (Max)</option>
                </select>
              </div>
              
              <div className="control-group">
                <label>MAX DAYS:</label>
                <select value={maxDays} onChange={(e) => setMaxDays(Number(e.target.value))}>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
              
              <div className="control-group">
                <label>QUALITY:</label>
                <select value={selectedQuality} onChange={(e) => setSelectedQuality(e.target.value)}>
                  <option value="">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
              <button className="refresh-btn" onClick={fetchSignals}>
                ↻ REFRESH
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Loading signals...</div>
          ) : error ? (
            <div className="error-state">Error: {error}</div>
          ) : signals.length === 0 ? (
            <div className="empty-state">
              No signals found matching your criteria. Try adjusting filters.
            </div>
          ) : (
            <div className="signals-grid">
              {signals.map((signal, index) => (
                <div key={`${signal.ticker}-${index}`} className="signal-card">
                  <div className="signal-header">
                    <div className="signal-ticker">{signal.ticker}</div>
                    <div className={`signal-quality ${getQualityClass(signal.quality)}`}>
                      {signal.quality}
                    </div>
                    <div className="signal-score">
                      <span className="score-label">SCORE:</span>
                      <span className="score-value">{signal.signal_score}/4</span>
                    </div>
                  </div>

                  <div className="signal-event">
                    <div className="event-type">{signal.event_type}</div>
                    <div className="event-timing">
                      {formatDate(signal.event_date)} ({signal.days_to_event}d)
                    </div>
                  </div>

                  <div className="signal-flags">
                    {signal.flags.backwardation && (
                      <span className="flag flag-active" title="Term structure in backwardation">
                        ⚠ BACKWD
                      </span>
                    )}
                    {signal.flags.iv_rv_elevated && (
                      <span className="flag flag-active" title="IV/RV ratio elevated">
                        📈 IV/RV
                      </span>
                    )}
                    {signal.flags.skew_significant && (
                      <span className="flag flag-active" title="Skew change significant">
                        📊 SKEW
                      </span>
                    )}
                    {signal.flags.oi_spike && (
                      <span className="flag flag-active" title="Open interest spike">
                        💥 OI
                      </span>
                    )}
                  </div>

                  <div className="signal-metrics">
                    <div className="metric-row">
                      <div className="metric">
                        <span className="metric-label">IV7:</span>
                        <span className="metric-value">{signal.metrics.iv7.toFixed(1)}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">IV30:</span>
                        <span className="metric-value">{signal.metrics.iv30.toFixed(1)}%</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Pctile:</span>
                        <span className="metric-value">{signal.metrics.iv7_pctile.toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    <div className="metric-row">
                      <div className="metric">
                        <span className="metric-label">IV/RV:</span>
                        <span className={`metric-value ${signal.metrics.iv_rv_ratio > 1.4 ? 'elevated' : ''}`}>
                          {signal.metrics.iv_rv_ratio.toFixed(2)}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Skew:</span>
                        <span className="metric-value">{signal.metrics.skew25d.toFixed(1)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">5D Ret:</span>
                        <span className={`metric-value ${signal.metrics.ret5d > 0 ? 'positive' : 'negative'}`}>
                          {(signal.metrics.ret5d * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="signal-confidence">
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill" 
                        style={{ width: `${signal.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="confidence-label">
                      Confidence: {(signal.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* IV Calendar Heatmap */}
        <section className="heatmap-section">
          <IVCatalystHeatmap />
        </section>

        {/* Methodology Panel */}
        <section className="methodology-section">
          <h2 className="section-title">METHODOLOGY</h2>
          <div className="methodology-content">
            <div className="methodology-item">
              <h3>Signal Rules (Any 2 Trigger Alert)</h3>
              <ul>
                <li>🔶 <strong>Backwardation:</strong> 7D IV ↑ &gt;20% w/w AND 7D-30D term structure inverts</li>
                <li>🔶 <strong>IV/RV Ratio:</strong> IV/20D RV &gt;1.4 while 5D spot return between −2% and +2%</li>
                <li>🔶 <strong>Skew Change:</strong> 30D call-skew ↑ &gt;10 delta-points vs 20D median</li>
                <li>🔶 <strong>OI Spike:</strong> New OI at event-relevant strikes &gt;2× 30D avg</li>
              </ul>
            </div>

            <div className="methodology-item">
              <h3>Risk-Reward Framing</h3>
              <ul>
                <li><strong>Pre-Event:</strong> Consider debit call spreads or calendar spreads if IV rising but below 1Y median</li>
                <li><strong>Avoid:</strong> Naked long premium when IV at 90-95th percentile (already priced in)</li>
                <li><strong>Post-Event:</strong> IV typically collapses - favor delta expressions (stock) for directional plays</li>
              </ul>
            </div>

            <div className="methodology-item">
              <h3>Sanity Checks</h3>
              <ul>
                <li>Mask earnings weeks and FDA class-wide actions with sector controls (XBI IV moves)</li>
                <li>Micro-cap liquidity: Minimum OI &gt; 1,000; OI/Float sanity checks</li>
                <li>Re-anchor dates when company guidance slips from IR updates</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default IVCatalystPage;
