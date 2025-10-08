import React from 'react';
import Plot from 'react-plotly.js';
import type { Layout, Config } from 'plotly.js';
import type { SurvivalCurve } from '../../types/biotech';
import styles from './SurvivalCurveChart.module.css';

export interface SurvivalCurveChartProps {
  curves: SurvivalCurve[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showLegend?: boolean;
  showConfidenceIntervals?: boolean;
  height?: number;
  className?: string;
}

export const SurvivalCurveChart: React.FC<SurvivalCurveChartProps> = ({
  curves,
  title = 'Survival Analysis',
  xAxisLabel = 'Time (months)',
  yAxisLabel = 'Survival Probability',
  showLegend = true,
  showConfidenceIntervals = true,
  height = 500,
  className,
}) => {
  // Create main survival curve traces
  const mainTraces = curves.map((curve) => ({
    x: curve.data.map((d) => d.time),
    y: curve.data.map((d) => d.survival),
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: curve.label,
    line: {
      color: curve.color || '#3b82f6',
      width: 3,
      shape: 'hv' as const, // Step function for survival curves
    },
    hovertemplate: 
      `<b>${curve.label}</b><br>` +
      'Time: %{x} months<br>' +
      'Survival: %{y:.1%}<br>' +
      '<extra></extra>',
  }));

  // Create confidence interval traces if requested
  const ciTraces = showConfidenceIntervals
    ? curves.flatMap((curve) => [
        {
          x: curve.data.map((d) => d.time),
          y: curve.data.map((d) => d.ci_upper || d.survival),
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: `${curve.label} CI`,
          line: {
            color: curve.color || '#3b82f6',
            width: 0,
          },
          showlegend: false,
          hoverinfo: 'skip' as const,
        },
        {
          x: curve.data.map((d) => d.time),
          y: curve.data.map((d) => d.ci_lower || d.survival),
          type: 'scatter' as const,
          mode: 'lines' as const,
          name: `${curve.label} CI`,
          fill: 'tonexty' as const,
          fillcolor: `${curve.color || '#3b82f6'}33`, // 20% opacity
          line: {
            color: curve.color || '#3b82f6',
            width: 0,
          },
          showlegend: false,
          hoverinfo: 'skip' as const,
        },
      ])
    : [];

  const data = [...ciTraces, ...mainTraces];

  const layout: Partial<Layout> = {
    title: {
      text: title,
      font: {
        family: 'JetBrains Mono, monospace',
        size: 16,
        color: '#e2e8f0',
      },
    },
    xaxis: {
      title: { text: xAxisLabel },
      gridcolor: '#334155',
      zerolinecolor: '#475569',
      color: '#cbd5e1',
      tickfont: {
        family: 'JetBrains Mono, monospace',
      },
    },
    yaxis: {
      title: { text: yAxisLabel },
      gridcolor: '#334155',
      zerolinecolor: '#475569',
      color: '#cbd5e1',
      tickformat: '.0%',
      range: [0, 1],
      tickfont: {
        family: 'JetBrains Mono, monospace',
      },
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    showlegend: showLegend,
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(15, 23, 42, 0.8)',
      bordercolor: '#475569',
      borderwidth: 1,
      font: {
        family: 'JetBrains Mono, monospace',
        color: '#e2e8f0',
      },
    },
    hovermode: 'closest' as const,
    margin: { l: 60, r: 40, t: 50, b: 60 },
  };

  const config: Partial<Config> = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'] as any,
    responsive: true,
  };

  return (
    <div className={`${styles.survivalChart} ${className || ''}`}>
      <Plot
        data={data}
        layout={layout}
        config={config}
        style={{ width: '100%', height: `${height}px` }}
      />
      {curves.length > 0 && (
        <div className={styles.statsPanel}>
          {curves.map((curve) => (
            <div key={curve.id} className={styles.statItem}>
              <div className={styles.statLabel} style={{ color: curve.color }}>
                {curve.label}
              </div>
              <div className={styles.statValue}>
                Median: {curve.medianSurvival} months
                {curve.hazardRatio && (
                  <span className={styles.hazardRatio}>
                    {' '}
                    (HR: {curve.hazardRatio.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
