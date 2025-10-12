import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import './AdvancedChart.css';

export type ChartType = 'line' | 'candlestick' | 'area' | 'bar' | 'scatter';
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';
export type Indicator = 'SMA20' | 'SMA50' | 'SMA200' | 'EMA' | 'VWAP' | 'RSI' | 'MACD';

export interface ChartDataPoint {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

export interface AdvancedChartProps {
  data: ChartDataPoint[];
  title?: string;
  initialChartType?: ChartType;
  initialTimeframe?: Timeframe;
  enableIndicators?: boolean;
  enableDrawingTools?: boolean;
  className?: string;
}

export const AdvancedChart: React.FC<AdvancedChartProps> = ({
  data,
  title = 'PRICE CHART',
  initialChartType = 'line',
  initialTimeframe = '1M',
  enableIndicators = true,
  // enableDrawingTools = false, // TODO: Implement drawing tools
  className = '',
}) => {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [activeIndicators, setActiveIndicators] = useState<Indicator[]>([]);
  const [showVolume, setShowVolume] = useState(true);

  // Filter data by timeframe
  const getFilteredData = (): ChartDataPoint[] => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case '1D':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '1W':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'YTD':
        cutoffDate.setMonth(0);
        cutoffDate.setDate(1);
        break;
      case 'ALL':
        return data;
    }
    
    return data.filter((d) => new Date(d.date) >= cutoffDate);
  };

  const filteredData = getFilteredData();

  // Calculate SMA (Simple Moving Average)
  const calculateSMA = (period: number): { x: string[]; y: number[] } => {
    const x: string[] = [];
    const y: number[] = [];
    
    for (let i = period - 1; i < filteredData.length; i++) {
      const sum = filteredData
        .slice(i - period + 1, i + 1)
        .reduce((acc, d) => acc + d.close, 0);
      x.push(filteredData[i].date);
      y.push(sum / period);
    }
    
    return { x, y };
  };

  // Generate traces based on chart type
  const getTraces = (): Data[] => {
    const traces: Data[] = [];
    const dates = filteredData.map((d) => d.date);
    const closes = filteredData.map((d) => d.close);

    // Main price trace
    switch (chartType) {
      case 'line':
        traces.push({
          x: dates,
          y: closes,
          type: 'scatter',
          mode: 'lines',
          name: 'Price',
          line: { color: 'var(--accent-cyan)', width: 2 },
        } as Data);
        break;
      
      case 'area':
        traces.push({
          x: dates,
          y: closes,
          type: 'scatter',
          fill: 'tozeroy',
          name: 'Price',
          line: { color: 'var(--accent-cyan)', width: 2 },
          fillcolor: 'rgba(0, 255, 255, 0.1)',
        } as Data);
        break;
      
      case 'candlestick':
        if (filteredData[0]?.open !== undefined) {
          traces.push({
            x: dates,
            open: filteredData.map((d) => d.open || d.close),
            high: filteredData.map((d) => d.high || d.close),
            low: filteredData.map((d) => d.low || d.close),
            close: closes,
            type: 'candlestick',
            name: 'Price',
            increasing: { line: { color: 'var(--status-success)' } },
            decreasing: { line: { color: 'var(--status-error)' } },
          } as Data);
        }
        break;
      
      case 'bar':
        traces.push({
          x: dates,
          y: closes,
          type: 'bar',
          name: 'Price',
          marker: { color: 'var(--accent-cyan)' },
        } as Data);
        break;
      
      case 'scatter':
        traces.push({
          x: dates,
          y: closes,
          type: 'scatter',
          mode: 'markers',
          name: 'Price',
          marker: { color: 'var(--accent-cyan)', size: 6 },
        } as Data);
        break;
    }

    // Add indicators
    if (activeIndicators.includes('SMA20')) {
      const sma20 = calculateSMA(20);
      traces.push({
        x: sma20.x,
        y: sma20.y,
        type: 'scatter',
        mode: 'lines',
        name: 'SMA 20',
        line: { color: 'var(--accent-amber)', width: 1.5 },
      } as Data);
    }

    if (activeIndicators.includes('SMA50')) {
      const sma50 = calculateSMA(50);
      traces.push({
        x: sma50.x,
        y: sma50.y,
        type: 'scatter',
        mode: 'lines',
        name: 'SMA 50',
        line: { color: 'var(--accent-purple)', width: 1.5 },
      } as Data);
    }

    if (activeIndicators.includes('SMA200')) {
      const sma200 = calculateSMA(200);
      traces.push({
        x: sma200.x,
        y: sma200.y,
        type: 'scatter',
        mode: 'lines',
        name: 'SMA 200',
        line: { color: 'var(--accent-green)', width: 1.5 },
      } as Data);
    }

    // Add volume trace if enabled
    if (showVolume && filteredData[0]?.volume !== undefined) {
      traces.push({
        x: dates,
        y: filteredData.map((d) => d.volume || 0),
        type: 'bar',
        name: 'Volume',
        yaxis: 'y2',
        marker: { color: 'rgba(128, 128, 128, 0.3)' },
      } as Data);
    }

    return traces;
  };

  const layout: Partial<Layout> = {
    title: {
      text: title,
      font: { family: 'var(--font-mono)', size: 14, color: 'var(--text-primary)' },
    },
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    plot_bgcolor: 'var(--bg-terminal)',
    font: { family: 'var(--font-mono)', color: 'var(--text-secondary)' },
    xaxis: {
      gridcolor: 'var(--border-primary)',
      showgrid: true,
    },
    yaxis: {
      gridcolor: 'var(--border-primary)',
      showgrid: true,
      title: 'Price ($)',
    },
    yaxis2: showVolume && filteredData[0]?.volume !== undefined ? {
      title: 'Volume',
      overlaying: 'y',
      side: 'right',
      showgrid: false,
    } : undefined,
    hovermode: 'x unified',
    showlegend: true,
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1,
    },
    margin: { l: 50, r: showVolume ? 50 : 20, t: 50, b: 50 },
  };

  const toggleIndicator = (indicator: Indicator) => {
    setActiveIndicators((prev) =>
      prev.includes(indicator)
        ? prev.filter((i) => i !== indicator)
        : [...prev, indicator]
    );
  };

  return (
    <div className={`advanced-chart ${className}`}>
      <div className="chart-controls">
        <div className="chart-control-group">
          <label>CHART TYPE:</label>
          <div className="button-group">
            {(['line', 'candlestick', 'area', 'bar', 'scatter'] as ChartType[]).map((type) => (
              <button
                key={type}
                className={`control-btn ${chartType === type ? 'active' : ''}`}
                onClick={() => setChartType(type)}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-control-group">
          <label>TIMEFRAME:</label>
          <div className="button-group">
            {(['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                className={`control-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {enableIndicators && (
          <div className="chart-control-group">
            <label>INDICATORS:</label>
            <div className="button-group">
              {(['SMA20', 'SMA50', 'SMA200'] as Indicator[]).map((ind) => (
                <button
                  key={ind}
                  className={`control-btn ${activeIndicators.includes(ind) ? 'active' : ''}`}
                  onClick={() => toggleIndicator(ind)}
                >
                  {ind}
                </button>
              ))}
              <button
                className={`control-btn ${showVolume ? 'active' : ''}`}
                onClick={() => setShowVolume(!showVolume)}
              >
                VOLUME
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="chart-container">
        <Plot
          data={getTraces()}
          layout={layout}
          config={{
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            displaylogo: false,
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};
