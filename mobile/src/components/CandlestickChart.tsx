import { FC, useMemo } from 'react';
import Plot from 'react-plotly.js';

export interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: CandlestickData[];
  title?: string;
  height?: number;
  showVolume?: boolean;
  technicalIndicators?: {
    sma?: { period: number; color?: string }[];
    ema?: { period: number; color?: string }[];
    bollinger?: { period: number; stdDev?: number };
  };
}

/**
 * Candlestick chart component with technical indicators
 * Uses Plotly.js for interactive financial charts
 */
export const CandlestickChart: FC<CandlestickChartProps> = ({
  data,
  title = 'Stock Price',
  height = 500,
  showVolume = true,
  technicalIndicators,
}) => {
  // Calculate technical indicators
  const { traces, layout } = useMemo(() => {
    const dates = data.map((d) => d.date);
    const opens = data.map((d) => d.open);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const closes = data.map((d) => d.close);
    const volumes = data.map((d) => d.volume || 0);

    // Main candlestick trace
    const candlestickTrace: any = {
      type: 'candlestick',
      x: dates,
      open: opens,
      high: highs,
      low: lows,
      close: closes,
      name: 'Price',
      increasing: { line: { color: '#00ff88' } },
      decreasing: { line: { color: '#ff4444' } },
      xaxis: 'x',
      yaxis: 'y',
    };

    const traces: any[] = [candlestickTrace];

    // Add SMA indicators
    if (technicalIndicators?.sma) {
      technicalIndicators.sma.forEach((sma) => {
        const smaValues = calculateSMA(closes, sma.period);
        traces.push({
          type: 'scatter',
          x: dates,
          y: smaValues,
          mode: 'lines',
          name: `SMA ${sma.period}`,
          line: { color: sma.color || '#ffaa00', width: 1.5 },
          xaxis: 'x',
          yaxis: 'y',
        });
      });
    }

    // Add EMA indicators
    if (technicalIndicators?.ema) {
      technicalIndicators.ema.forEach((ema) => {
        const emaValues = calculateEMA(closes, ema.period);
        traces.push({
          type: 'scatter',
          x: dates,
          y: emaValues,
          mode: 'lines',
          name: `EMA ${ema.period}`,
          line: { color: ema.color || '#00aaff', width: 1.5 },
          xaxis: 'x',
          yaxis: 'y',
        });
      });
    }

    // Add Bollinger Bands
    if (technicalIndicators?.bollinger) {
      const { period, stdDev = 2 } = technicalIndicators.bollinger;
      const { upper, middle, lower } = calculateBollingerBands(closes, period, stdDev);

      traces.push(
        {
          type: 'scatter',
          x: dates,
          y: upper,
          mode: 'lines',
          name: 'BB Upper',
          line: { color: 'rgba(100, 100, 100, 0.3)', width: 1 },
          xaxis: 'x',
          yaxis: 'y',
        },
        {
          type: 'scatter',
          x: dates,
          y: middle,
          mode: 'lines',
          name: 'BB Middle',
          line: { color: 'rgba(100, 100, 100, 0.5)', width: 1, dash: 'dash' },
          xaxis: 'x',
          yaxis: 'y',
        },
        {
          type: 'scatter',
          x: dates,
          y: lower,
          mode: 'lines',
          name: 'BB Lower',
          line: { color: 'rgba(100, 100, 100, 0.3)', width: 1 },
          fill: 'tonexty',
          fillcolor: 'rgba(100, 100, 100, 0.1)',
          xaxis: 'x',
          yaxis: 'y',
        }
      );
    }

    // Add volume bars
    if (showVolume) {
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
        yaxis: 'y2',
      });
    }

    // Layout configuration
    const layout: any = {
      title: {
        text: title,
        font: { family: 'SF Mono, monospace', size: 16, color: '#ffffff' },
      },
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
        rangeslider: { visible: false },
        showgrid: true,
        gridcolor: 'rgba(100, 100, 100, 0.2)',
        domain: showVolume ? [0, 1] : [0, 1],
      },
      yaxis: {
        title: 'Price',
        showgrid: true,
        gridcolor: 'rgba(100, 100, 100, 0.2)',
        domain: showVolume ? [0.3, 1] : [0, 1],
      },
    };

    if (showVolume) {
      layout.yaxis2 = {
        title: 'Volume',
        showgrid: false,
        domain: [0, 0.2],
      };
    }

    return { traces, layout };
  }, [data, title, height, showVolume, technicalIndicators]);

  return (
    <div className="candlestick-chart">
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

// Technical indicator calculations
function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }

  return result;
}

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

function calculateBollingerBands(
  data: number[],
  period: number,
  stdDev: number
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i]!;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);

      upper.push(mean + stdDev * standardDeviation);
      lower.push(mean - stdDev * standardDeviation);
    }
  }

  return { upper, middle, lower };
}
