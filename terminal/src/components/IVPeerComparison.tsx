/**
 * IV Peer Comparison Component
 * 
 * Compares IV metrics across peer companies in the same therapeutic area or MOA.
 */

import React from 'react';
import './IVPeerComparison.css';

interface PeerMetrics {
  ticker: string;
  company_name: string;
  iv7: number;
  iv7_pctile: number;
  iv_rv_ratio: number;
  price_change_5d: number;
  has_catalyst: boolean;
  catalyst_days: number | null;
}

interface IVPeerComparisonProps {
  ticker: string;
  peers: PeerMetrics[];
  className?: string;
}

export const IVPeerComparison: React.FC<IVPeerComparisonProps> = ({
  ticker,
  peers,
  className = ''
}) => {
  // Find the primary ticker in peers list
  const primaryPeer = peers.find(p => p.ticker === ticker);
  const otherPeers = peers.filter(p => p.ticker !== ticker);

  // Calculate relative metrics
  const avgIV7 = peers.reduce((sum, p) => sum + p.iv7, 0) / peers.length;
  const avgIVPercentile = peers.reduce((sum, p) => sum + p.iv7_pctile, 0) / peers.length;

  const getPercentileColor = (pctile: number): string => {
    if (pctile >= 85) return 'percentile-very-high';
    if (pctile >= 70) return 'percentile-high';
    if (pctile >= 50) return 'percentile-medium';
    if (pctile >= 30) return 'percentile-low';
    return 'percentile-very-low';
  };

  const getRelativeClass = (value: number, avg: number): string => {
    const diff = ((value - avg) / avg) * 100;
    if (diff > 10) return 'above-avg';
    if (diff < -10) return 'below-avg';
    return 'at-avg';
  };

  return (
    <div className={`iv-peer-comparison ${className}`}>
      <div className="peer-header">
        <h3 className="peer-title">IV PEER COMPARISON</h3>
        <div className="peer-subtitle">
          {ticker} vs {peers.length - 1} peers
        </div>
      </div>

      {/* Primary ticker summary */}
      {primaryPeer && (
        <div className="peer-primary">
          <div className="peer-primary-ticker">{primaryPeer.ticker}</div>
          <div className="peer-primary-metrics">
            <div className="metric-item">
              <div className="metric-label">IV7</div>
              <div className={`metric-value ${getRelativeClass(primaryPeer.iv7, avgIV7)}`}>
                {primaryPeer.iv7.toFixed(1)}%
              </div>
              <div className="metric-delta">
                {primaryPeer.iv7 > avgIV7 ? '+' : ''}
                {((primaryPeer.iv7 - avgIV7) / avgIV7 * 100).toFixed(0)}% vs avg
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-label">Percentile</div>
              <div className={`metric-value ${getPercentileColor(primaryPeer.iv7_pctile)}`}>
                {primaryPeer.iv7_pctile.toFixed(0)}%ile
              </div>
              <div className="metric-delta">
                {primaryPeer.iv7_pctile > avgIVPercentile ? '+' : ''}
                {(primaryPeer.iv7_pctile - avgIVPercentile).toFixed(0)} pts
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-label">IV/RV</div>
              <div className={`metric-value ${primaryPeer.iv_rv_ratio > 1.4 ? 'elevated' : ''}`}>
                {primaryPeer.iv_rv_ratio.toFixed(2)}
              </div>
              {primaryPeer.iv_rv_ratio > 1.4 && (
                <div className="metric-badge">Elevated</div>
              )}
            </div>

            {primaryPeer.has_catalyst && (
              <div className="metric-item">
                <div className="metric-label">Catalyst</div>
                <div className="metric-value catalyst">
                  {primaryPeer.catalyst_days}d
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Peer comparison grid */}
      <div className="peer-grid">
        <div className="peer-grid-header">
          <div className="col-ticker">TICKER</div>
          <div className="col-iv7">IV7</div>
          <div className="col-pctile">%ile</div>
          <div className="col-ivrv">IV/RV</div>
          <div className="col-change">5D Δ</div>
          <div className="col-catalyst">CAT</div>
        </div>

        {otherPeers.map((peer) => (
          <div key={peer.ticker} className="peer-grid-row">
            <div className="col-ticker">
              <span className="peer-ticker">{peer.ticker}</span>
            </div>

            <div className={`col-iv7 ${getRelativeClass(peer.iv7, avgIV7)}`}>
              {peer.iv7.toFixed(1)}%
            </div>

            <div className={`col-pctile ${getPercentileColor(peer.iv7_pctile)}`}>
              {peer.iv7_pctile.toFixed(0)}
            </div>

            <div className={`col-ivrv ${peer.iv_rv_ratio > 1.4 ? 'elevated' : ''}`}>
              {peer.iv_rv_ratio.toFixed(2)}
            </div>

            <div className={`col-change ${peer.price_change_5d >= 0 ? 'positive' : 'negative'}`}>
              {peer.price_change_5d >= 0 ? '+' : ''}
              {(peer.price_change_5d * 100).toFixed(1)}%
            </div>

            <div className="col-catalyst">
              {peer.has_catalyst ? (
                <span className="catalyst-badge">{peer.catalyst_days}d</span>
              ) : (
                <span className="no-catalyst">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="peer-summary">
        <div className="summary-item">
          <div className="summary-label">Avg IV7</div>
          <div className="summary-value">{avgIV7.toFixed(1)}%</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">Avg Percentile</div>
          <div className="summary-value">{avgIVPercentile.toFixed(0)}%ile</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">With Catalyst</div>
          <div className="summary-value">
            {peers.filter(p => p.has_catalyst).length}/{peers.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IVPeerComparison;
