import React from 'react';
import type { PMHeaderMetrics } from '../../../../src/types/biotech';
import './PMStickyHeader.css';

interface PMStickyHeaderProps {
  metrics: PMHeaderMetrics;
}

export const PMStickyHeader: React.FC<PMStickyHeaderProps> = ({ metrics }) => {
  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (value: number): string => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
    return value.toString();
  };

  return (
    <div className="pm-sticky-header">
      <div className="pm-header-main">
        <div className="pm-header-ticker">
          <span className="ticker-symbol">{metrics.ticker}</span>
          <span className="ticker-price">{formatCurrency(metrics.price)}</span>
          <span className={`ticker-change ${metrics.priceChange >= 0 ? 'positive' : 'negative'}`}>
            {metrics.priceChange >= 0 ? '+' : ''}{metrics.priceChange.toFixed(2)}%
          </span>
        </div>

        <div className="pm-header-metrics">
          <div className="pm-metric">
            <span className="pm-metric-label">EV</span>
            <span className="pm-metric-value">{formatCurrency(metrics.enterpriseValue)}</span>
          </div>
          <div className="pm-metric">
            <span className="pm-metric-label">MARKET CAP</span>
            <span className="pm-metric-value">{formatCurrency(metrics.marketCap)}</span>
          </div>
          <div className="pm-metric">
            <span className="pm-metric-label">NET CASH</span>
            <span className="pm-metric-value">{formatCurrency(metrics.netCash)}</span>
          </div>
          <div className="pm-metric">
            <span className="pm-metric-label">RUNWAY</span>
            <span className="pm-metric-value">{metrics.cashRunwayMonths}mo</span>
          </div>
          <div className="pm-metric">
            <span className="pm-metric-label">3M ADV</span>
            <span className="pm-metric-value">{formatVolume(metrics.avgDailyVolume3M)}</span>
          </div>
          <div className="pm-metric">
            <span className="pm-metric-label">PROGRAMS</span>
            <span className="pm-metric-value">
              {metrics.programCount} ({metrics.programsOwnedPercent.toFixed(0)}% owned)
            </span>
          </div>
          {metrics.shortInterest !== undefined && (
            <div className="pm-metric">
              <span className="pm-metric-label">SHORT %</span>
              <span className="pm-metric-value">{metrics.shortInterest.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="pm-header-secondary">
        <div className="pm-drivers">
          <span className="pm-section-label">TOP 3 rNPV DRIVERS:</span>
          {metrics.topRnpvDrivers.slice(0, 3).map((driver, idx) => (
            <span key={idx} className="pm-driver-badge">
              {driver.name} ({formatCurrency(driver.value)})
            </span>
          ))}
        </div>

        <div className="pm-catalysts">
          <span className="pm-section-label">NEXT 3 CATALYSTS:</span>
          {metrics.nextCatalysts.slice(0, 3).map((catalyst, idx) => (
            <span key={idx} className="pm-catalyst-badge">
              {new Date(catalyst.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {catalyst.event} • {catalyst.program}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
