import { FC, useMemo } from 'react';
import Plot from 'react-plotly.js';

export interface PriceData {
  date: string;
  close: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface TechnicalIndicatorsProps {
  data: PriceData[];
  indicators: ('rsi' | 'macd' | 'volume')[];
  height?: number;
}

/**
 * Technical indicators component
 * Displays RSI, MACD, and volume indicators
 */
export const TechnicalIndicators: FC<TechnicalIndicatorsProps> = ({
  data,
  indicators,
  height = 300,
}) => {
  const { traces, layout } = useMemo(() => {
    const dates = data.map((d) => d.date);
    const closes = data.map((d) => d.close);
    const volumes = data.map((d) => d.volume || 0);

    const traces: any[] = [];
    const subplots: any[] = [];
    let currentRow = 1;

    // RSI Indicator
    if (indicators.includes('rsi')) {
      const rsi = calculateRSI(closes, 14);

      traces.push({
        type: 'scatter',
        x: dates,
        y: rsi,
        mode: 'lines',
        name: 'RSI',
        line: { color: '#ffaa00', width: 2 },
        xaxis: 'x',
        yaxis: `y${currentRow}`,
      });

      // Overbought/Oversold lines
      traces.push(
        {
          type: 'scatter',
          x: dates,
          y: Array(dates.length).fill(70),
          mode: 'lines',
          name: 'Overbought',
          line: { color: '#ff4444', width: 1, dash: 'dash' },
          xaxis: 'x',
          yaxis: `y${currentRow}`,
          showlegend: false,
        },
        {
          type: 'scatter',
          x: dates,
          y: Array(dates.length).fill(30),
          mode: 'lines',
          name: 'Oversold',
          line: { color: '#00ff88', width: 1, dash: 'dash' },
          xaxis: 'x',
          yaxis: `y${currentRow}`,
          showlegend: false,
        }
      );

      subplots.push({
        name: 'RSI',
        yaxis: `y${currentRow}`,
        domain: [0.65, 1],
      });

      currentRow++;
    }

    // MACD Indicator
    if (indicators.includes('macd')) {
      const { macd, signal, histogram } = calculateMACD(closes);

      traces.push(
        {
          type: 'scatter',
          x: dates,
          y: macd,
          mode: 'lines',
          name: 'MACD',
          line: { color: '#00aaff', width: 2 },
          xaxis: 'x',
          yaxis: `y${currentRow}`,
        },
        {
          type: 'scatter',
          x: dates,
          y: signal,
          mode: 'lines',
          name: 'Signal',
          line: { color: '#ff4444', width: 2 },
          xaxis: 'x',
          yaxis: `y${currentRow}`,
        },
        {
          type: 'bar',
          x: dates,
          y: histogram,
          name: 'Histogram',
          marker: {
            color: histogram.map((h) => (h && h >= 0 ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 68, 68, 0.5)')),
          },
          xaxis: 'x',
          yaxis: `y${currentRow}`,
        }
      );

      subplots.push({
        name: 'MACD',
        yaxis: `y${currentRow}`,
        domain: [0.3, 0.6],
      });

      currentRow++;
    }

    // Volume Indicator
    if (indicators.includes('volume')) {
      const volumeColors = data.map((d, i) =>
        i > 0 && d.close >= data[i - 1].close ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 68, 68, 0.5)'
      );

      traces.push({
        type: 'bar',
        x: dates,
        y: volumes,
        name: 'Volume',
        marker: { color: volumeColors },
        xaxis: 'x',
        yaxis: `y${currentRow}`,
      });

      subplots.push({
        name: 'Volume',
        yaxis: `y${currentRow}`,
        domain: [0, 0.25],
      });
    }

    // Layout configuration
    const layout: any = {
      paper_bgcolor: 'rgba(10, 10, 15, 0.8)',
      plot_bgcolor: 'rgba(20, 20, 30, 0.6)',
      font: { family: 'SF Mono, monospace', color: '#ffffff' },
      height,
      showlegend: true,
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1,
      },
      xaxis: {
        showgrid: true,
        gridcolor: 'rgba(100, 100, 100, 0.2)',
      },
    };

    // Add y-axes for each subplot
    subplots.forEach((subplot, index) => {
      const axisKey = index === 0 ? 'yaxis' : `yaxis${index + 1}`;
      layout[axisKey] = {
        title: subplot.name,
        showgrid: true,
        gridcolor: 'rgba(100, 100, 100, 0.2)',
        domain: subplot.domain,
      };
    });

    return { traces, layout };
  }, [data, indicators, height]);

  return (
    <div className="technical-indicators">
      <Plot
        data={traces}
        layout={layout}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// RSI Calculation
function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const changes: number[] = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      const recentChanges = changes.slice(i - period, i);
      const gains = recentChanges.filter((c) => c > 0);
      const losses = recentChanges.filter((c) => c < 0).map((c) => Math.abs(c));

      const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        result.push(rsi);
      }
    }
  }

  return result;
}

// MACD Calculation
function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  // Calculate MACD line
  const macd: (number | null)[] = emaFast.map((fast, i) => {
    const slow = emaSlow[i];
    if (fast === null || slow === null) return null;
    return fast - slow;
  });

  // Calculate signal line (EMA of MACD)
  const macdValues = macd.filter((m) => m !== null) as number[];
  const signalLine = calculateEMA(macdValues, signalPeriod);
  
  // Pad signal line with nulls to match MACD length
  const paddingLength = macd.length - signalLine.length;
  const signal = [...Array(paddingLength).fill(null), ...signalLine];

  // Calculate histogram
  const histogram: (number | null)[] = macd.map((m, i) => {
    const s = signal[i];
    if (m === null || s === null) return null;
    return m - s;
  });

  return { macd, signal, histogram };
}

// EMA Calculation
function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  let ema = data[0];
  result.push(ema);

  for (let i = 1; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
    result.push(ema);
  }

  return result;
}
