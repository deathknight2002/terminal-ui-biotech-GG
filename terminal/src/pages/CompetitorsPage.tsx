import React, { useState, useEffect } from 'react';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel';
import './CompetitorsPage.css';

interface CompanyComparison {
  company: string;
  metrics: {
    pipeline_strength: number;
    financial_health: number;
    market_position: number;
    innovation: number;
    regulatory_track: number;
    partnerships: number;
  };
  justifications?: {
    pipeline_strength?: string;
    financial_health?: string;
    market_position?: string;
    innovation?: string;
    regulatory_track?: string;
    partnerships?: string;
  };
}

export function CompetitorsPage() {
  const [companies, setCompanies] = useState<CompanyComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/v1/competition/compare?companies=pfizer,moderna,biontech,regeneron,gilead,abbvie');
      const data = await response.json();
      setCompanies(data.comparisons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparisons');
    } finally {
      setLoading(false);
    }
  };

  const renderRadarChart = (company: CompanyComparison, index: number) => {
    const metrics = Object.entries(company.metrics);
    const angleStep = (2 * Math.PI) / metrics.length;
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 120;

    // Generate polygon points
    const points = metrics.map(([_, value], i) => {
      const angle = i * angleStep - Math.PI / 2;
      const radius = (value / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');

    // Generate axis lines and labels
    const axes = metrics.map(([key, _], i) => {
      const angle = i * angleStep - Math.PI / 2;
      const labelX = centerX + (maxRadius + 30) * Math.cos(angle);
      const labelY = centerY + (maxRadius + 30) * Math.sin(angle);
      const lineX = centerX + maxRadius * Math.cos(angle);
      const lineY = centerY + maxRadius * Math.sin(angle);

      return (
        <g key={key}>
          <line
            x1={centerX}
            y1={centerY}
            x2={lineX}
            y2={lineY}
            stroke="rgba(0, 255, 0, 0.2)"
            strokeWidth="1"
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            fill="var(--text-secondary, #aaaaaa)"
            fontSize="10"
            className="radar-label"
            onMouseEnter={() => setHoveredMetric(key)}
            onMouseLeave={() => setHoveredMetric(null)}
          >
            {key.replace(/_/g, ' ').toUpperCase()}
          </text>
        </g>
      );
    });

    // Generate concentric circles
    const circles = [0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => (
      <circle
        key={scale}
        cx={centerX}
        cy={centerY}
        r={maxRadius * scale}
        fill="none"
        stroke="rgba(0, 255, 0, 0.1)"
        strokeWidth="1"
      />
    ));

    const colors = [
      '#00ff00',
      '#00ccff',
      '#ff00ff',
      '#ffff00',
      '#ff8800',
      '#ff00cc'
    ];

    return (
      <div className="radar-chart-container">
        <svg viewBox="0 0 300 300" className="radar-chart">
          {circles}
          {axes}
          <polygon
            points={points}
            fill={`${colors[index % colors.length]}33`}
            stroke={colors[index % colors.length]}
            strokeWidth="2"
            className="radar-polygon"
          />
          {metrics.map(([key, value], i) => {
            const angle = i * angleStep - Math.PI / 2;
            const radius = (value / 100) * maxRadius;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            return (
              <circle
                key={key}
                cx={x}
                cy={y}
                r="4"
                fill={colors[index % colors.length]}
                className="radar-point"
                onMouseEnter={() => {
                  setSelectedCompany(company.company);
                  setHoveredMetric(key);
                }}
                onMouseLeave={() => {
                  setSelectedCompany(null);
                  setHoveredMetric(null);
                }}
              />
            );
          })}
        </svg>
        <div className="radar-legend">
          <div className="legend-company" style={{ color: colors[index % colors.length] }}>
            {company.company}
          </div>
        </div>
      </div>
    );
  };

  const renderJustificationTooltip = () => {
    if (!selectedCompany || !hoveredMetric) return null;

    const company = companies.find((c) => c.company === selectedCompany);
    if (!company || !company.justifications) return null;

    const justification = company.justifications[hoveredMetric as keyof typeof company.justifications];
    if (!justification) return null;

    return (
      <div className="justification-tooltip">
        <div className="tooltip-header">
          <span className="tooltip-company">{company.company}</span>
          <span className="tooltip-metric">{hoveredMetric.replace(/_/g, ' ').toUpperCase()}</span>
        </div>
        <div className="tooltip-content">{justification}</div>
      </div>
    );
  };

  const renderComparisonTable = () => {
    if (companies.length === 0) return null;

    const metrics = Object.keys(companies[0].metrics);

    return (
      <div className="comparison-table-container">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>METRIC</th>
              {companies.map((company) => (
                <th key={company.company}>{company.company}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric}>
                <td className="metric-name">
                  {metric.replace(/_/g, ' ').toUpperCase()}
                </td>
                {companies.map((company) => {
                  const value = company.metrics[metric as keyof typeof company.metrics];
                  return (
                    <td
                      key={company.company}
                      className="metric-value"
                      onMouseEnter={() => {
                        setSelectedCompany(company.company);
                        setHoveredMetric(metric);
                      }}
                      onMouseLeave={() => {
                        setSelectedCompany(null);
                        setHoveredMetric(null);
                      }}
                    >
                      <div className="value-bar">
                        <div
                          className="value-fill"
                          style={{
                            width: `${value}%`,
                            background: value > 70 ? '#00ff00' : value > 40 ? '#ffaa00' : '#ff6666'
                          }}
                        />
                        <span className="value-text">{value}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="competitors-page">
      <Panel
        title="SPIDERWEB COMPARE"
        cornerBrackets
        variant="glass"
        headerAction={
          <button onClick={fetchComparisons} className="refresh-btn">
            🔄 REFRESH
          </button>
        }
      >
        {loading && <div className="loading-state">Loading competitor analysis...</div>}
        {error && <div className="error-state">{error}</div>}

        {!loading && !error && companies.length === 0 && (
          <div className="empty-state">No comparison data available</div>
        )}

        {!loading && !error && companies.length > 0 && (
          <>
            <div className="radar-grid">
              {companies.map((company, index) => (
                <div key={company.company} className="radar-item">
                  {renderRadarChart(company, index)}
                </div>
              ))}
            </div>

            <div className="comparison-section">
              <h3 className="section-title">DETAILED COMPARISON</h3>
              {renderComparisonTable()}
            </div>

            {renderJustificationTooltip()}
          </>
        )}
      </Panel>
    </div>
  );
}
