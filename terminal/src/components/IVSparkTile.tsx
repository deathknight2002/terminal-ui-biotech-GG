/**
 * IV Spark Tile Component
 * 
 * Compact visualization showing:
 * - Price line chart (mini)
 * - IV7 overlay (filled area)
 * - IV/RV ratio band
 * - Tooltips with IV drift, skew change, OI spikes
 */

import React, { useState } from 'react';
import './IVSparkTile.css';

export interface IVSparkData {
  date: string;
  price: number;
  iv7: number;
  iv_rv_ratio?: number;
  skew_25d?: number;
  skew_change?: number;
  oi_spike?: boolean;
}

export interface IVSparkTileProps {
  ticker: string;
  data: IVSparkData[];
  width?: number;
  height?: number;
  showIVRV?: boolean;
  ivDrift?: number;  // IV7 change over last 7 days
  skewChange?: number;  // Skew change vs 20D median
  oiSpike?: boolean;  // OI spike detected
  className?: string;
}

export const IVSparkTile: React.FC<IVSparkTileProps> = ({
  ticker,
  data,
  width = 200,
  height = 80,
  showIVRV = true,
  ivDrift,
  skewChange,
  oiSpike,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className={`iv-spark-tile ${className}`} style={{ width, height }}>
        <div className="iv-spark-empty">No data</div>
      </div>
    );
  }

  // Calculate scales
  const prices = data.map(d => d.price);
  const iv7s = data.map(d => d.iv7);
  
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const priceRange = priceMax - priceMin || 1;
  
  const iv7Min = Math.min(...iv7s);
  const iv7Max = Math.max(...iv7s);
  const iv7Range = iv7Max - iv7Min || 1;
  
  // Normalize to 0-1 scale
  const normalizePrice = (price: number) => {
    return 1 - ((price - priceMin) / priceRange); // Inverted for SVG coords
  };
  
  const normalizeIV = (iv: number) => {
    return 1 - ((iv - iv7Min) / iv7Range);
  };
  
  // Generate SVG paths
  const chartPadding = 5;
  const chartWidth = width - chartPadding * 2;
  const chartHeight = height - chartPadding * 2;
  
  const xStep = chartWidth / (data.length - 1);
  
  // Price line path
  const priceLinePath = data.map((d, i) => {
    const x = chartPadding + i * xStep;
    const y = chartPadding + normalizePrice(d.price) * chartHeight;
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');
  
  // IV7 filled area path
  const iv7AreaPath = data.map((d, i) => {
    const x = chartPadding + i * xStep;
    const y = chartPadding + normalizeIV(d.iv7) * chartHeight;
    
    if (i === 0) {
      return `M ${x} ${height - chartPadding} L ${x} ${y}`;
    }
    return `L ${x} ${y}`;
  }).join(' ') + ` L ${width - chartPadding} ${height - chartPadding} Z`;
  
  // Latest values for display
  const latest = data[data.length - 1];
  const latestIVRV = latest.iv_rv_ratio || 0;
  const ivrvColor = latestIVRV > 1.4 ? 'var(--color-warning)' : 'var(--color-info)';
  
  // Calculate IV drift if not provided
  const calculatedIVDrift = ivDrift !== undefined ? ivDrift : 
    data.length > 7 ? latest.iv7 - data[data.length - 8].iv7 : 0;
  
  // Build tooltip content
  const tooltipContent = () => (
    <div className="iv-spark-tooltip">
      <div className="tooltip-header">{ticker} IV METRICS</div>
      <div className="tooltip-row">
        <span className="tooltip-label">IV Drift (7D):</span>
        <span className={`tooltip-value ${calculatedIVDrift > 0 ? 'positive' : 'negative'}`}>
          {calculatedIVDrift > 0 ? '+' : ''}{calculatedIVDrift.toFixed(1)}%
        </span>
      </div>
      {skewChange !== undefined && (
        <div className="tooltip-row">
          <span className="tooltip-label">Skew Change:</span>
          <span className={`tooltip-value ${skewChange > 10 ? 'warning' : ''}`}>
            {skewChange > 0 ? '+' : ''}{skewChange.toFixed(1)} pts
          </span>
        </div>
      )}
      {oiSpike !== undefined && (
        <div className="tooltip-row">
          <span className="tooltip-label">OI Spike:</span>
          <span className={`tooltip-value ${oiSpike ? 'warning' : ''}`}>
            {oiSpike ? 'YES ⚠️' : 'No'}
          </span>
        </div>
      )}
      <div className="tooltip-row">
        <span className="tooltip-label">Current IV7:</span>
        <span className="tooltip-value">{latest.iv7.toFixed(1)}%</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">IV/RV Ratio:</span>
        <span className={`tooltip-value ${latestIVRV > 1.4 ? 'warning' : ''}`}>
          {latestIVRV.toFixed(2)}
        </span>
      </div>
    </div>
  );
  
  return (
    <div 
      className={`iv-spark-tile ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="iv-spark-header">
        <span className="iv-spark-ticker">{ticker}</span>
        <span className="iv-spark-price">${latest.price.toFixed(2)}</span>
        {(oiSpike || (skewChange && skewChange > 10)) && (
          <span className="iv-spark-alert" title="Signal Alert">⚠️</span>
        )}
      </div>
      
      <svg
        width={width}
        height={height}
        className="iv-spark-chart"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* IV7 filled area (background) */}
        <path
          d={iv7AreaPath}
          fill="var(--color-iv-fill)"
          opacity="0.3"
          className="iv-spark-iv-area"
        />
        
        {/* Price line (foreground) */}
        <path
          d={priceLinePath}
          fill="none"
          stroke="var(--color-price-line)"
          strokeWidth="2"
          className="iv-spark-price-line"
        />
      </svg>
      
      <div className="iv-spark-footer">
        <span className="iv-spark-label">IV7:</span>
        <span className="iv-spark-value">{latest.iv7.toFixed(1)}%</span>
        
        {showIVRV && (
          <>
            <span className="iv-spark-separator">|</span>
            <span className="iv-spark-label">IV/RV:</span>
            <span className="iv-spark-value" style={{ color: ivrvColor }}>
              {latestIVRV.toFixed(2)}
            </span>
          </>
        )}
      </div>
      
      {/* Tooltip overlay */}
      {showTooltip && (
        <div className="iv-spark-tooltip-overlay">
          {tooltipContent()}
        </div>
      )}
    </div>
  );
};

export default IVSparkTile;
