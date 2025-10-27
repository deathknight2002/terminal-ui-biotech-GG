/**
 * IV Spark Tile Component
 * 
 * Compact visualization showing:
 * - Price line chart (mini)
 * - IV7 overlay (filled area)
 * - IV/RV ratio band
 */

import React from 'react';
import './IVSparkTile.css';

export interface IVSparkData {
  date: string;
  price: number;
  iv7: number;
  iv_rv_ratio?: number;
}

export interface IVSparkTileProps {
  ticker: string;
  data: IVSparkData[];
  width?: number;
  height?: number;
  showIVRV?: boolean;
  className?: string;
}

export const IVSparkTile: React.FC<IVSparkTileProps> = ({
  ticker,
  data,
  width = 200,
  height = 80,
  showIVRV = true,
  className = ''
}) => {
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
  
  return (
    <div className={`iv-spark-tile ${className}`}>
      <div className="iv-spark-header">
        <span className="iv-spark-ticker">{ticker}</span>
        <span className="iv-spark-price">${latest.price.toFixed(2)}</span>
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
    </div>
  );
};

export default IVSparkTile;
