import React from 'react';
import Plot from 'react-plotly.js';
import type { Layout, Config } from 'plotly.js';
import type { HazardRatioData } from '../../types/biotech';
import styles from './HazardRatioChart.module.css';

export interface HazardRatioChartProps {
  data: HazardRatioData[];
  title?: string;
  showPValues?: boolean;
  height?: number;
  className?: string;
}

export const HazardRatioChart: React.FC<HazardRatioChartProps> = ({
  data,
  title = 'Hazard Ratio Analysis',
  showPValues = true,
  height = 400,
  className,
}) => {
  // Sort data by hazard ratio for better visualization
  const sortedData = [...data].sort((a, b) => a.hazardRatio - b.hazardRatio);

  // Create forest plot trace
  const trace = {
    x: sortedData.map((d) => d.hazardRatio),
    y: sortedData.map((d) => `${d.intervention} vs ${d.control}`),
    error_x: {
      type: 'data' as const,
      symmetric: false,
      array: sortedData.map((d) => d.ci_upper - d.hazardRatio),
      arrayminus: sortedData.map((d) => d.hazardRatio - d.ci_lower),
      color: '#3b82f6',
      thickness: 2,
      width: 4,
    },
    type: 'scatter' as const,
    mode: 'markers' as const,
    marker: {
      size: 12,
      color: sortedData.map((d) => (d.hazardRatio < 1 ? '#10b981' : '#ef4444')),
      line: {
        color: '#e2e8f0',
        width: 2,
      },
    },
    hovertemplate:
      '<b>%{y}</b><br>' +
      'HR: %{x:.3f}<br>' +
      'Events (Intervention): %{customdata[0]}<br>' +
      'Events (Control): %{customdata[1]}<br>' +
      'P-value: %{customdata[2]}<br>' +
      '<extra></extra>',
    customdata: sortedData.map((d) => [
      d.events_intervention,
      d.events_control,
      d.pValue < 0.001 ? '<0.001' : d.pValue.toFixed(3),
    ]),
  };

  // Add vertical line at HR = 1 (null effect)
  const shapes = [
    {
      type: 'line' as const,
      x0: 1,
      x1: 1,
      y0: -0.5,
      y1: sortedData.length - 0.5,
      line: {
        color: '#94a3b8',
        width: 2,
        dash: 'dash' as const,
      },
    },
  ];

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
      title: { text: 'Hazard Ratio (95% CI)' },
      type: 'log' as const,
      gridcolor: '#334155',
      zerolinecolor: '#475569',
      color: '#cbd5e1',
      tickfont: {
        family: 'JetBrains Mono, monospace',
      },
    },
    yaxis: {
      gridcolor: '#334155',
      color: '#cbd5e1',
      tickfont: {
        family: 'JetBrains Mono, monospace',
        size: 11,
      },
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    shapes,
    hovermode: 'closest' as const,
    margin: { l: 200, r: 40, t: 50, b: 60 },
    annotations: [
      {
        x: 0.5,
        y: sortedData.length,
        xref: 'x',
        yref: 'y',
        text: 'Favors Intervention',
        showarrow: false,
        font: {
          size: 10,
          color: '#10b981',
          family: 'JetBrains Mono, monospace',
        },
        xanchor: 'right',
      },
      {
        x: 1.5,
        y: sortedData.length,
        xref: 'x',
        yref: 'y',
        text: 'Favors Control',
        showarrow: false,
        font: {
          size: 10,
          color: '#ef4444',
          family: 'JetBrains Mono, monospace',
        },
        xanchor: 'left',
      },
    ],
  };

  const config: Partial<Config> = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'] as any,
    responsive: true,
  };

  return (
    <div className={`${styles.hazardRatioChart} ${className || ''}`}>
      <Plot
        data={[trace]}
        layout={layout}
        config={config}
        style={{ width: '100%', height: `${height}px` }}
      />
      {showPValues && (
        <div className={styles.pValueLegend}>
          <span className={styles.legendTitle}>Statistical Significance:</span>
          {sortedData.map((d, idx) => (
            <div key={idx} className={styles.pValueItem}>
              <span className={styles.comparison}>
                {d.intervention} vs {d.control}:
              </span>
              <span
                className={`${styles.pValue} ${d.pValue < 0.05 ? styles.significant : ''}`}
              >
                p = {d.pValue < 0.001 ? '<0.001' : d.pValue.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
