import { FC, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import './InteractiveStockChart.css';

interface ChartDataPoint {
  date: string;
  value: number;
  volume?: number;
}

interface InteractiveStockChartProps {
  data: ChartDataPoint[];
  title?: string;
  symbol?: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';

export const InteractiveStockChart: FC<InteractiveStockChartProps> = ({
  data,
  title = 'Stock Price',
  symbol,
  currentPrice,
  change,
  changePercent,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    const filtered = data.filter((point) => {
      const date = new Date(point.date);
      const diffTime = now.getTime() - date.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      switch (timeRange) {
        case '1D':
          return diffDays <= 1;
        case '1W':
          return diffDays <= 7;
        case '1M':
          return diffDays <= 30;
        case '3M':
          return diffDays <= 90;
        case '6M':
          return diffDays <= 180;
        case '1Y':
          return diffDays <= 365;
        case 'YTD':
          return date.getFullYear() === now.getFullYear();
        case 'ALL':
        default:
          return true;
      }
    });
    return filtered.length > 0 ? filtered : data;
  };

  const filteredData = getFilteredData();
  const isPositive = (change ?? 0) >= 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="stock-chart-tooltip">
          <div className="tooltip-date">{data.date}</div>
          <div className="tooltip-value">${data.value.toFixed(2)}</div>
          {data.volume && (
            <div className="tooltip-volume">Vol: {data.volume.toLocaleString()}</div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="interactive-stock-chart">
      {/* Header */}
      <div className="stock-chart-header">
        <div className="stock-info">
          {symbol && <div className="stock-symbol">{symbol}</div>}
          {title && <div className="stock-title">{title}</div>}
        </div>
        {currentPrice !== undefined && (
          <div className="stock-price-info">
            <div className="stock-current-price">${currentPrice.toFixed(2)}</div>
            {change !== undefined && changePercent !== undefined && (
              <div className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}
                {change.toFixed(2)} ({isPositive ? '+' : ''}
                {changePercent.toFixed(2)}%)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Type Toggle */}
      <div className="stock-chart-controls">
        <div className="chart-type-toggle">
          <button
            className={`toggle-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Line
          </button>
          <button
            className={`toggle-btn ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => setChartType('area')}
          >
            Area
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="stock-chart-container">
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'area' ? (
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? '#10b981' : '#ef4444'}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? '#10b981' : '#ef4444'}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                stroke="#888"
                tick={{ fill: '#888' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <YAxis
                stroke="#888"
                tick={{ fill: '#888' }}
                tickFormatter={(value) => `$${value}`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                fill="url(#colorValue)"
                animationDuration={500}
              />
            </AreaChart>
          ) : (
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="date"
                stroke="#888"
                tick={{ fill: '#888' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <YAxis
                stroke="#888"
                tick={{ fill: '#888' }}
                tickFormatter={(value) => `$${value}`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                dot={false}
                animationDuration={500}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Time Range Selector */}
      <div className="stock-time-range-selector">
        {(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'] as TimeRange[]).map(
          (range) => (
            <button
              key={range}
              className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          )
        )}
      </div>
    </div>
  );
};
