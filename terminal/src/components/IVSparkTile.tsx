/**
 * IV Spark Tile Component
 * 
 * Compact visualization showing:
 * - Price line (solid)
 * - IV7 filled area
 * - IV/RV thin band
 */

import React from 'react';
import './IVSparkTile.css';

interface IVSparkDataPoint {
  date: string;
  price: number;
  iv7: number;
  iv_rv_ratio: number;
}

interface IVSparkTileProps {
  ticker: string;
  data: IVSparkDataPoint[];
  width?: number;
  height?: number;
  className?: string;
}

export const IVSparkTile: React.FC<IVSparkTileProps> = ({
  ticker,
  data,
  width = 200,
  height = 60,
  className = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`iv-spark-tile ${className}`} style={{ width, height }}>
        <div className="spark-no-data">NO DATA</div>
      </div>
    );
  }

  // Calculate scales
  const prices = data.map(d => d.price);
  const ivs = data.map(d => d.iv7);
  const ivrvs = data.map(d => d.iv_rv_ratio);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minIV = Math.min(...ivs);
  const maxIV = Math.max(...ivs);
  const minIVRV = Math.min(...ivrvs);
  const maxIVRV = Math.max(...ivrvs);

  const padding = { top: 8, right: 8, bottom: 8, left: 8 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const scaleX = (index: number) => {
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const scalePrice = (price: number) => {
    const range = maxPrice - minPrice || 1;
    return padding.top + chartHeight - ((price - minPrice) / range) * chartHeight;
  };

  const scaleIV = (iv: number) => {
    const range = maxIV - minIV || 1;
    return padding.top + chartHeight - ((iv - minIV) / range) * chartHeight;
  };

  const scaleIVRV = (ivrv: number) => {
    const range = maxIVRV - minIVRV || 1;
    return padding.top + chartHeight - ((ivrv - minIVRV) / range) * chartHeight;
  };

  // Generate paths
  const pricePath = data
    .map((d, i) => {
      const x = scaleX(i);
      const y = scalePrice(d.price);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  const ivAreaPath = data
    .map((d, i) => {
      const x = scaleX(i);
      const y = scaleIV(d.iv7);
      if (i === 0) {
        return `M ${x} ${padding.top + chartHeight} L ${x} ${y}`;
      }
      return `L ${x} ${y}`;
    })
    .join(' ') + ` L ${scaleX(data.length - 1)} ${padding.top + chartHeight} Z`;

  const ivrvPath = data
    .map((d, i) => {
      const x = scaleX(i);
      const y = scaleIVRV(d.iv_rv_ratio);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Calculate latest values
  const latest = data[data.length - 1];
  const priceChange = ((latest.price - data[0].price) / data[0].price) * 100;
  const ivChange = latest.iv7 - data[0].iv7;

  return (
    <div className={`iv-spark-tile ${className}`} style={{ width, height }}>
      <div className="spark-header">
        <div className="spark-ticker">{ticker}</div>
        <div className="spark-stats">
          <span className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
          </span>
          <span className="iv-value">
            IV {latest.iv7.toFixed(0)}% 
            <span className={`iv-change ${ivChange >= 0 ? 'up' : 'down'}`}>
              ({ivChange >= 0 ? '+' : ''}{ivChange.toFixed(1)})
            </span>
          </span>
        </div>
      </div>

      <svg width={width} height={height} className="spark-svg">
        {/* IV7 filled area (behind) */}
        <path
          d={ivAreaPath}
          className="iv-area"
          fill="url(#ivGradient)"
          opacity="0.3"
        />

        {/* IV/RV thin line */}
        <path
          d={ivrvPath}
          className="ivrv-line"
          stroke="var(--status-warning, #ffaa00)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="2,2"
          opacity="0.6"
        />

        {/* Price line (front) */}
        <path
          d={pricePath}
          className="price-line"
          stroke="var(--accent-primary, #00ff00)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Gradient definition for IV area */}
        <defs>
          <linearGradient id="ivGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-secondary, #00aaff)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--accent-secondary, #00aaff)" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Current value indicators */}
        <circle
          cx={scaleX(data.length - 1)}
          cy={scalePrice(latest.price)}
          r="2.5"
          fill="var(--accent-primary, #00ff00)"
          stroke="var(--bg-panel, #0a0a0a)"
          strokeWidth="1"
        />
      </svg>

      <div className="spark-legend">
        <span className="legend-item price">Price</span>
        <span className="legend-item iv">IV7</span>
        <span className="legend-item ivrv">IV/RV</span>
      </div>
    </div>
  );
};

export default IVSparkTile;
