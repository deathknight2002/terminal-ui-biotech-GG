import React, { useState, useEffect } from 'react';
import './ABTestingDashboard.css';

export interface ABTestResult {
  test_name: string;
  model_a_name: string;
  model_b_name: string;
  model_a_samples: number;
  model_b_samples: number;
  winner: string | null;
  metrics: {
    model_a: {
      accuracy?: number;
      avg_confidence?: number;
      avg_latency_ms?: number;
    };
    model_b: {
      accuracy?: number;
      avg_confidence?: number;
      avg_latency_ms?: number;
    };
  };
  statistical_tests?: {
    [key: string]: {
      p_value: number;
      significant: boolean;
      effect_size?: number;
    };
  };
}

export interface ABTestingDashboardProps {
  /** API endpoint to fetch A/B test results */
  apiEndpoint?: string;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Show corner brackets */
  cornerBrackets?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * A/B Testing Dashboard for ML Models
 * 
 * Displays ongoing and completed A/B tests with:
 * - Real-time metrics comparison
 * - Statistical significance indicators
 * - Winner determination
 * - Test management controls
 */
export const ABTestingDashboard: React.FC<ABTestingDashboardProps> = ({
  apiEndpoint = '/api/v1/ml/ab-tests',
  refreshInterval = 10000,
  cornerBrackets = true,
  className = ''
}) => {
  const [tests, setTests] = useState<ABTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
    const interval = setInterval(fetchTests, refreshInterval);
    return () => clearInterval(interval);
  }, [apiEndpoint, refreshInterval]);

  const fetchTests = async () => {
    try {
      setError(null);
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setTests(data.tests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch A/B tests');
      console.error('Error fetching A/B tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWinnerBadge = (winner: string | null, modelName: string) => {
    if (!winner) return null;
    if (winner === modelName) {
      return <span className="ab-winner-badge">WINNER</span>;
    }
    return null;
  };

  const getSignificanceBadge = (significant: boolean) => {
    return (
      <span className={`ab-significance-badge ${significant ? 'significant' : 'not-significant'}`}>
        {significant ? '✓ SIGNIFICANT' : '~ NOT SIGNIFICANT'}
      </span>
    );
  };

  const formatMetric = (value: number | undefined, unit: string = '') => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}${unit}`;
  };

  const formatLatency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(1)}ms`;
  };

  if (loading) {
    return (
      <div className={`ab-testing-dashboard loading ${className}`}>
        <div className="ab-header">
          <h2 className={cornerBrackets ? 'corner-brackets' : ''}>
            A/B TESTING DASHBOARD
          </h2>
        </div>
        <div className="ab-loading">
          <div className="ab-spinner"></div>
          <p>Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`ab-testing-dashboard error ${className}`}>
        <div className="ab-header">
          <h2 className={cornerBrackets ? 'corner-brackets' : ''}>
            A/B TESTING DASHBOARD
          </h2>
        </div>
        <div className="ab-error">
          <p className="ab-error-icon">⚠</p>
          <p className="ab-error-message">{error}</p>
          <button onClick={fetchTests} className="ab-retry-button">
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`ab-testing-dashboard ${className}`}>
      <div className="ab-header">
        <h2 className={cornerBrackets ? 'corner-brackets' : ''}>
          A/B TESTING DASHBOARD
        </h2>
        <div className="ab-header-stats">
          <span className="ab-stat">
            <span className="ab-stat-label">ACTIVE TESTS:</span>
            <span className="ab-stat-value">{tests.length}</span>
          </span>
          <span className="ab-stat">
            <span className="ab-stat-label">COMPLETED:</span>
            <span className="ab-stat-value">
              {tests.filter(t => t.winner !== null).length}
            </span>
          </span>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="ab-empty">
          <p>No A/B tests running</p>
          <p className="ab-empty-hint">Configure tests in your ML pipeline</p>
        </div>
      ) : (
        <div className="ab-tests-grid">
          {tests.map((test) => (
            <div
              key={test.test_name}
              className={`ab-test-card ${selectedTest === test.test_name ? 'selected' : ''}`}
              onClick={() => setSelectedTest(
                selectedTest === test.test_name ? null : test.test_name
              )}
            >
              <div className="ab-test-header">
                <h3 className="ab-test-name">{test.test_name}</h3>
                {test.winner && (
                  <span className="ab-test-status completed">COMPLETED</span>
                )}
                {!test.winner && (
                  <span className="ab-test-status running">RUNNING</span>
                )}
              </div>

              <div className="ab-models-comparison">
                {/* Model A */}
                <div className="ab-model-column">
                  <div className="ab-model-header">
                    <h4>{test.model_a_name}</h4>
                    {getWinnerBadge(test.winner, test.model_a_name)}
                  </div>
                  <div className="ab-model-metrics">
                    <div className="ab-metric">
                      <span className="ab-metric-label">Samples:</span>
                      <span className="ab-metric-value">{test.model_a_samples}</span>
                    </div>
                    <div className="ab-metric">
                      <span className="ab-metric-label">Accuracy:</span>
                      <span className="ab-metric-value">
                        {formatMetric(test.metrics.model_a.accuracy, '%')}
                      </span>
                    </div>
                    <div className="ab-metric">
                      <span className="ab-metric-label">Confidence:</span>
                      <span className="ab-metric-value">
                        {formatMetric(test.metrics.model_a.avg_confidence, '%')}
                      </span>
                    </div>
                    <div className="ab-metric">
                      <span className="ab-metric-label">Latency:</span>
                      <span className="ab-metric-value">
                        {formatLatency(test.metrics.model_a.avg_latency_ms)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ab-vs-divider">VS</div>

                {/* Model B */}
                <div className="ab-model-column">
                  <div className="ab-model-header">
                    <h4>{test.model_b_name}</h4>
                    {getWinnerBadge(test.winner, test.model_b_name)}
                  </div>
                  <div className="ab-model-metrics">
                    <div className="ab-metric">
                      <span className="ab-metric-label">Samples:</span>
                      <span className="ab-metric-value">{test.model_b_samples}</span>
                    </div>
                    <div className="ab-metric">
                      <span className="ab-metric-label">Accuracy:</span>
                      <span className="ab-metric-value">
                        {formatMetric(test.metrics.model_b.accuracy, '%')}
                      </span>
                    </div>
                    <div className="ab-metric">
                      <span className="ab-metric-label">Confidence:</span>
                      <span className="ab-metric-value">
                        {formatMetric(test.metrics.model_b.avg_confidence, '%')}
                      </span>
                    </div>
                    <div className="ab-metric">
                      <span className="ab-metric-label">Latency:</span>
                      <span className="ab-metric-value">
                        {formatLatency(test.metrics.model_b.avg_latency_ms)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistical Tests */}
              {selectedTest === test.test_name && test.statistical_tests && (
                <div className="ab-statistical-tests">
                  <h4 className="ab-section-title">STATISTICAL TESTS</h4>
                  <div className="ab-tests-grid-inner">
                    {Object.entries(test.statistical_tests).map(([metric, result]) => (
                      <div key={metric} className="ab-stat-test">
                        <div className="ab-stat-test-header">
                          <span className="ab-stat-test-name">
                            {metric.toUpperCase()}
                          </span>
                          {getSignificanceBadge(result.significant)}
                        </div>
                        <div className="ab-stat-test-details">
                          <span>p-value: {result.p_value.toFixed(4)}</span>
                          {result.effect_size !== undefined && (
                            <span>Effect size: {result.effect_size.toFixed(3)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ABTestingDashboard;
