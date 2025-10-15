import React, { useState, useEffect } from 'react';
import { wsClient } from '../../../../../src/services/websocket-client';
import './MLMonitoringDashboard.css';

interface DriftAlert {
  type: 'prediction_drift' | 'feature_drift' | 'performance_degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric_name: string;
  current_value: number;
  threshold: number;
  timestamp: number;
  model_name?: string;
  details?: Record<string, any>;
}

interface ModelMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  avg_confidence: number;
  prediction_count: number;
  timestamp: number;
}

interface MLMonitoringDashboardProps {
  modelNames?: string[];
  autoConnect?: boolean;
  refreshInterval?: number;
  maxAlerts?: number;
}

export const MLMonitoringDashboard: React.FC<MLMonitoringDashboardProps> = ({
  modelNames = ['tfidf', 'finbert', 'biobert'],
  autoConnect = true,
  refreshInterval = 5000,
  maxAlerts = 10,
}) => {
  const [alerts, setAlerts] = useState<DriftAlert[]>([]);
  const [metrics, setMetrics] = useState<Record<string, ModelMetrics>>({});
  const [connected, setConnected] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(modelNames[0] || 'all');

  useEffect(() => {
    if (!autoConnect) return;

    const connectWebSocket = async () => {
      try {
        await wsClient.connect();
        setConnected(true);

        // Subscribe to drift alerts
        wsClient.subscribe('drift_alert', (data: DriftAlert) => {
          setAlerts(prev => [data, ...prev].slice(0, maxAlerts));
        });

        // Subscribe to model metrics
        wsClient.subscribe('model_metrics', (data: ModelMetrics) => {
          setMetrics(prev => ({
            ...prev,
            [data.model_name]: data
          }));
        });

        // Subscribe via custom event (if backend supports it)
        if (wsClient['socket']) {
          wsClient['socket'].emit('subscribe:drift_alerts', { model_names: modelNames });
          wsClient['socket'].emit('subscribe:model_metrics', { model_names: modelNames });
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      wsClient.disconnect();
    };
  }, [autoConnect, modelNames, maxAlerts]);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case 'prediction_drift': return '📊';
      case 'feature_drift': return '🔍';
      case 'performance_degradation': return '⚠️';
      default: return '🔔';
    }
  };

  const filteredAlerts = selectedModel === 'all' 
    ? alerts 
    : alerts.filter(a => a.model_name === selectedModel);

  const selectedMetrics = selectedModel === 'all'
    ? Object.values(metrics)
    : metrics[selectedModel] ? [metrics[selectedModel]] : [];

  return (
    <div className="ml-monitoring-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2 className="dashboard-title">ML MODEL MONITORING</h2>
          <div className="connection-status">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`} />
            <span className="status-text">
              {connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
        
        <div className="model-selector">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-select"
          >
            <option value="all">ALL MODELS</option>
            {modelNames.map(name => (
              <option key={name} value={name}>{name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {selectedMetrics.length > 0 ? (
          selectedMetrics.map((metric) => (
            <div key={metric.model_name} className="metric-card">
              <h3 className="metric-card-title">{metric.model_name.toUpperCase()}</h3>
              
              <div className="metric-stats">
                <div className="metric-stat">
                  <span className="metric-label">ACCURACY</span>
                  <span className="metric-value">{(metric.accuracy * 100).toFixed(1)}%</span>
                </div>
                
                <div className="metric-stat">
                  <span className="metric-label">PRECISION</span>
                  <span className="metric-value">{(metric.precision * 100).toFixed(1)}%</span>
                </div>
                
                <div className="metric-stat">
                  <span className="metric-label">RECALL</span>
                  <span className="metric-value">{(metric.recall * 100).toFixed(1)}%</span>
                </div>
                
                <div className="metric-stat">
                  <span className="metric-label">F1 SCORE</span>
                  <span className="metric-value">{(metric.f1_score * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="metric-footer">
                <span className="metric-predictions">
                  {metric.prediction_count.toLocaleString()} predictions
                </span>
                <span className="metric-confidence">
                  Avg confidence: {(metric.avg_confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-metrics">
            <p>No metrics available</p>
            <p className="no-metrics-hint">Waiting for model data...</p>
          </div>
        )}
      </div>

      {/* Drift Alerts */}
      <div className="alerts-section">
        <h3 className="section-title">
          DRIFT ALERTS
          <span className="alert-count">{filteredAlerts.length}</span>
        </h3>
        
        <div className="alerts-list">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert, index) => (
              <div 
                key={`${alert.timestamp}-${index}`} 
                className="alert-item"
                style={{ borderLeftColor: getSeverityColor(alert.severity) }}
              >
                <div className="alert-header">
                  <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                  <span className="alert-severity" style={{ color: getSeverityColor(alert.severity) }}>
                    {alert.severity.toUpperCase()}
                  </span>
                  {alert.model_name && (
                    <span className="alert-model">{alert.model_name}</span>
                  )}
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="alert-message">{alert.message}</div>
                
                <div className="alert-details">
                  <span className="alert-metric">{alert.metric_name}</span>
                  <span className="alert-values">
                    Current: {alert.current_value.toFixed(3)} | 
                    Threshold: {alert.threshold.toFixed(3)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-alerts">
              <p>✅ No drift alerts</p>
              <p className="no-alerts-hint">All models are performing within expected parameters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MLMonitoringDashboard;
