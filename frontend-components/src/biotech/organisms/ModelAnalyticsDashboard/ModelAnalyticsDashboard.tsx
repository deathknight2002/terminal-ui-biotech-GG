import React, { useState, useEffect } from 'react';
import './ModelAnalyticsDashboard.css';

export interface DriftAlert {
  timestamp: number;
  type: 'prediction_drift' | 'feature_drift' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric_name: string;
  current_value: number;
  threshold: number;
}

export interface ModelMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  avg_confidence: number;
  prediction_count: number;
  drift_score?: number;
  timestamp: number;
}

export interface PerformanceHistory {
  timestamp: number;
  accuracy: number;
  f1_score: number;
  drift_score: number;
}

export interface ModelAnalyticsDashboardProps {
  /** API endpoint to fetch analytics */
  apiEndpoint?: string;
  /** Model names to monitor */
  modelNames?: string[];
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Show corner brackets */
  cornerBrackets?: boolean;
  /** Max alerts to display */
  maxAlerts?: number;
  /** Custom CSS class */
  className?: string;
}

/**
 * Advanced Analytics Dashboard for ML Models
 * 
 * Real-time monitoring with:
 * - Performance metrics tracking
 * - Drift detection visualization
 * - Historical trends
 * - Alert management
 */
export const ModelAnalyticsDashboard: React.FC<ModelAnalyticsDashboardProps> = ({
  apiEndpoint = '/api/v1/ml/analytics',
  modelNames = ['tfidf', 'finbert', 'biobert'],
  refreshInterval = 5000,
  cornerBrackets = true,
  maxAlerts = 10,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<Record<string, ModelMetrics>>({});
  const [alerts, setAlerts] = useState<DriftAlert[]>([]);
  const [history, setHistory] = useState<Record<string, PerformanceHistory[]>>({});
  const [selectedModel, setSelectedModel] = useState<string>(modelNames[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [apiEndpoint, refreshInterval]);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      
      // Fetch metrics for each model
      const metricsPromises = modelNames.map(async (model) => {
        const response = await fetch(`${apiEndpoint}/${model}/metrics`);
        if (response.ok) {
          const data = await response.json();
          return { model, data };
        }
        return null;
      });
      
      const results = await Promise.all(metricsPromises);
      const newMetrics: Record<string, ModelMetrics> = {};
      results.forEach(result => {
        if (result) {
          newMetrics[result.model] = result.data;
        }
      });
      setMetrics(newMetrics);
      
      // Fetch alerts
      const alertsResponse = await fetch(`${apiEndpoint}/alerts?limit=${maxAlerts}`);
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.alerts || []);
      }
      
      // Fetch historical data for selected model
      const historyResponse = await fetch(`${apiEndpoint}/${selectedModel}/history?limit=50`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(prev => ({
          ...prev,
          [selectedModel]: historyData.history || []
        }));
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'var(--status-error, #ff4444)';
      case 'high': return 'var(--status-warning, #ffaa00)';
      case 'medium': return 'var(--status-info, #00aaff)';
      case 'low': return 'var(--text-secondary, #8a99a8)';
      default: return 'var(--text-secondary, #8a99a8)';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatMetric = (value: number, unit: string = '%') => {
    return `${(value * 100).toFixed(2)}${unit}`;
  };

  const getMetricColor = (value: number, thresholds = { good: 0.8, warning: 0.6 }) => {
    if (value >= thresholds.good) return 'var(--status-success, #00ff88)';
    if (value >= thresholds.warning) return 'var(--status-warning, #ffaa00)';
    return 'var(--status-error, #ff4444)';
  };

  if (loading) {
    return (
      <div className={`model-analytics-dashboard loading ${className}`}>
        <div className="analytics-header">
          <h2 className={cornerBrackets ? 'corner-brackets' : ''}>
            MODEL ANALYTICS
          </h2>
        </div>
        <div className="analytics-loading">
          <div className="analytics-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`model-analytics-dashboard error ${className}`}>
        <div className="analytics-header">
          <h2 className={cornerBrackets ? 'corner-brackets' : ''}>
            MODEL ANALYTICS
          </h2>
        </div>
        <div className="analytics-error">
          <p className="analytics-error-icon">⚠</p>
          <p className="analytics-error-message">{error}</p>
          <button onClick={fetchAnalytics} className="analytics-retry-button">
            RETRY
          </button>
        </div>
      </div>
    );
  }

  const currentMetrics = metrics[selectedModel];

  return (
    <div className={`model-analytics-dashboard ${className}`}>
      <div className="analytics-header">
        <h2 className={cornerBrackets ? 'corner-brackets' : ''}>
          MODEL ANALYTICS
        </h2>
        <div className="model-selector">
          {modelNames.map((model) => (
            <button
              key={model}
              className={`model-tab ${selectedModel === model ? 'active' : ''}`}
              onClick={() => setSelectedModel(model)}
            >
              {model.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        {/* Current Metrics */}
        <div className="analytics-section metrics-section">
          <h3 className="section-title">CURRENT METRICS</h3>
          {currentMetrics ? (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">ACCURACY</div>
                <div 
                  className="metric-value" 
                  style={{ color: getMetricColor(currentMetrics.accuracy) }}
                >
                  {formatMetric(currentMetrics.accuracy)}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">PRECISION</div>
                <div 
                  className="metric-value"
                  style={{ color: getMetricColor(currentMetrics.precision) }}
                >
                  {formatMetric(currentMetrics.precision)}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">RECALL</div>
                <div 
                  className="metric-value"
                  style={{ color: getMetricColor(currentMetrics.recall) }}
                >
                  {formatMetric(currentMetrics.recall)}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">F1 SCORE</div>
                <div 
                  className="metric-value"
                  style={{ color: getMetricColor(currentMetrics.f1_score) }}
                >
                  {formatMetric(currentMetrics.f1_score)}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">AVG CONFIDENCE</div>
                <div className="metric-value">
                  {formatMetric(currentMetrics.avg_confidence)}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">PREDICTIONS</div>
                <div className="metric-value">
                  {currentMetrics.prediction_count.toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data">No metrics available for {selectedModel}</div>
          )}
        </div>

        {/* Drift Score */}
        {currentMetrics?.drift_score !== undefined && (
          <div className="analytics-section drift-section">
            <h3 className="section-title">DRIFT DETECTION</h3>
            <div className="drift-display">
              <div className="drift-gauge">
                <div 
                  className="drift-bar"
                  style={{
                    width: `${Math.min(currentMetrics.drift_score * 100, 100)}%`,
                    background: currentMetrics.drift_score > 0.05 
                      ? 'var(--status-error, #ff4444)' 
                      : 'var(--status-success, #00ff88)'
                  }}
                />
              </div>
              <div className="drift-value">
                <span className="drift-label">CURRENT DRIFT:</span>
                <span 
                  className="drift-score"
                  style={{ 
                    color: currentMetrics.drift_score > 0.05 
                      ? 'var(--status-error, #ff4444)' 
                      : 'var(--status-success, #00ff88)'
                  }}
                >
                  {(currentMetrics.drift_score * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        <div className="analytics-section alerts-section">
          <h3 className="section-title">RECENT ALERTS</h3>
          {alerts.length > 0 ? (
            <div className="alerts-list">
              {alerts.slice(0, maxAlerts).map((alert, idx) => (
                <div 
                  key={idx} 
                  className="alert-item"
                  style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                >
                  <div className="alert-header">
                    <span 
                      className="alert-severity"
                      style={{ color: getSeverityColor(alert.severity) }}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="alert-time">
                      {formatTimestamp(alert.timestamp)}
                    </span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-details">
                    <span>{alert.metric_name}: {alert.current_value.toFixed(4)}</span>
                    <span>Threshold: {alert.threshold.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No recent alerts</div>
          )}
        </div>

        {/* Performance Trend */}
        {history[selectedModel] && history[selectedModel].length > 0 && (
          <div className="analytics-section trend-section">
            <h3 className="section-title">PERFORMANCE TREND</h3>
            <div className="trend-chart">
              {history[selectedModel].slice(-20).map((point, idx) => (
                <div key={idx} className="trend-bar-container">
                  <div 
                    className="trend-bar"
                    style={{
                      height: `${point.accuracy * 100}%`,
                      background: getMetricColor(point.accuracy)
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="trend-legend">
              <span>← Older</span>
              <span>Accuracy Trend</span>
              <span>Recent →</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelAnalyticsDashboard;
