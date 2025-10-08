
import { FC } from 'react';
import './MobileFinancial.css';

const FINANCIAL_METRICS = [
  { label: 'Revenue', value: '$1.2B', change: '+18%', positive: true },
  { label: 'EBITDA', value: '$450M', change: '+22%', positive: true },
  { label: 'Cash', value: '$2.8B', change: '-5%', positive: false },
  { label: 'Burn Rate', value: '$85M/Q', change: '+12%', positive: false },
];

export const MobileFinancial: FC = () => {
  return (
    <div className="mobile-financial">
      <div className="mobile-page-title">Financial</div>

      {/* Key Metrics */}
      <div className="mobile-glass-panel">
        <h2 className="mobile-panel-title">Key Metrics</h2>
        <div className="mobile-grid-2">
          {FINANCIAL_METRICS.map((metric, index) => (
            <div key={index} className="mobile-metric-card">
              <div className="mobile-metric-label">{metric.label}</div>
              <div className="mobile-metric-value">{metric.value}</div>
              <div className={`mobile-metric-change ${metric.positive ? 'positive' : 'negative'}`}>
                {metric.positive ? '↑' : '↓'} {metric.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Valuation Model */}
      <div className="mobile-glass-panel">
        <h2 className="mobile-panel-title">Valuation Model</h2>
        <div className="mobile-valuation-item">
          <span className="mobile-valuation-label">Base Case NPV</span>
          <span className="mobile-valuation-value">$8.9B</span>
        </div>
        <div className="mobile-valuation-item">
          <span className="mobile-valuation-label">Bull Case NPV</span>
          <span className="mobile-valuation-value">$12.5B</span>
        </div>
        <div className="mobile-valuation-item">
          <span className="mobile-valuation-label">Bear Case NPV</span>
          <span className="mobile-valuation-value">$5.2B</span>
        </div>
        <div className="mobile-valuation-item">
          <span className="mobile-valuation-label">Probability Weighted</span>
          <span className="mobile-valuation-value mobile-valuation-highlight">$9.4B</span>
        </div>
      </div>

      {/* Revenue Forecast */}
      <div className="mobile-glass-panel">
        <h2 className="mobile-panel-title">5-Year Revenue Forecast</h2>
        <div className="mobile-chart-placeholder">
          <div className="mobile-chart-info">📈 Revenue Growth</div>
          <div className="mobile-chart-bars">
            {[60, 75, 88, 95, 100].map((height, i) => (
              <div key={i} className="mobile-chart-bar-container">
                <div 
                  className="mobile-chart-bar"
                  style={{ height: `${height}%` }}
                />
                <div className="mobile-chart-label">Y{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
