import { FC, useState, useEffect } from 'react';
import './MobileDashboard.css';

// Sample data for dashboard metrics
const SAMPLE_METRICS = [
  { label: 'Market Cap', value: '$2.4B', change: '+5.2%', positive: true },
  { label: 'Pipeline Value', value: '$8.9B', change: '+12.4%', positive: true },
  { label: 'Active Trials', value: '247', change: '+18', positive: true },
  { label: 'FDA Approvals', value: '34', change: '-2', positive: false },
];

const RECENT_CATALYSTS = [
  { title: 'Phase III Results', company: 'BioTech Inc', priority: 'high', time: '2h ago' },
  { title: 'FDA Approval', company: 'PharmaCo', priority: 'critical', time: '4h ago' },
  { title: 'Partnership Deal', company: 'GeneTech', priority: 'medium', time: '6h ago' },
];

export const MobileDashboard: FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mobile-dashboard">
      {/* Header */}
      <div className="mobile-dashboard-header">
        <div className="mobile-page-title">Dashboard</div>
        <div className="mobile-page-time">
          {currentTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}
        </div>
      </div>

      {/* Market Summary Card */}
      <div className="mobile-glass-panel">
        <div className="mobile-panel-header">
          <h2 className="mobile-panel-title">Market Summary</h2>
          <span className="ios-badge ios-badge-success">Live</span>
        </div>
        <div className="mobile-grid-2">
          {SAMPLE_METRICS.map((metric, index) => (
            <div key={index} className="mobile-metric-card">
              <div className="mobile-metric-label">{metric.label}</div>
              <div className="mobile-metric-value">{metric.value}</div>
              <div className={`mobile-metric-change ${metric.positive ? 'positive' : 'negative'}`}>
                {metric.positive ? '↑' : '↓'} {metric.change}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Catalysts */}
      <div className="mobile-glass-panel">
        <div className="mobile-panel-header">
          <h2 className="mobile-panel-title">Recent Catalysts</h2>
          <button className="ios-button">View All</button>
        </div>
        <div className="mobile-catalysts-list">
          {RECENT_CATALYSTS.map((catalyst, index) => (
            <div key={index} className="mobile-catalyst-item">
              <div className="mobile-catalyst-content">
                <div className="mobile-catalyst-title">{catalyst.title}</div>
                <div className="mobile-catalyst-company">{catalyst.company}</div>
              </div>
              <div className="mobile-catalyst-meta">
                <span className={`ios-badge ios-badge-${
                  catalyst.priority === 'critical' ? 'error' :
                  catalyst.priority === 'high' ? 'warning' :
                  'success'
                }`}>
                  {catalyst.priority.toUpperCase()}
                </span>
                <div className="mobile-catalyst-time">{catalyst.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mobile-glass-panel">
        <h2 className="mobile-panel-title">Quick Actions</h2>
        <div className="mobile-actions-grid">
          <button className="mobile-action-button ios-touch-feedback">
            <div className="mobile-action-icon">🔍</div>
            <div className="mobile-action-label">Search Drugs</div>
          </button>
          <button className="mobile-action-button ios-touch-feedback">
            <div className="mobile-action-icon">📈</div>
            <div className="mobile-action-label">Analytics</div>
          </button>
          <button className="mobile-action-button ios-touch-feedback">
            <div className="mobile-action-icon">🔔</div>
            <div className="mobile-action-label">Alerts</div>
          </button>
          <button className="mobile-action-button ios-touch-feedback">
            <div className="mobile-action-icon">⚙️</div>
            <div className="mobile-action-label">Settings</div>
          </button>
        </div>
      </div>

      {/* Pipeline Progress */}
      <div className="mobile-glass-panel">
        <h2 className="mobile-panel-title">Top Pipeline Programs</h2>
        <div className="mobile-pipeline-list">
          <div className="mobile-pipeline-item">
            <div className="mobile-pipeline-info">
              <div className="mobile-pipeline-name">Drug Candidate A</div>
              <div className="mobile-pipeline-phase">Phase III - Oncology</div>
            </div>
            <div className="mobile-pipeline-progress-container">
              <div className="mobile-pipeline-progress-bar">
                <div 
                  className="mobile-pipeline-progress-fill" 
                  style={{ width: '75%' }}
                />
              </div>
              <div className="mobile-pipeline-progress-text">75%</div>
            </div>
          </div>
          <div className="mobile-pipeline-item">
            <div className="mobile-pipeline-info">
              <div className="mobile-pipeline-name">Drug Candidate B</div>
              <div className="mobile-pipeline-phase">Phase II - Immunology</div>
            </div>
            <div className="mobile-pipeline-progress-container">
              <div className="mobile-pipeline-progress-bar">
                <div 
                  className="mobile-pipeline-progress-fill" 
                  style={{ width: '45%' }}
                />
              </div>
              <div className="mobile-pipeline-progress-text">45%</div>
            </div>
          </div>
          <div className="mobile-pipeline-item">
            <div className="mobile-pipeline-info">
              <div className="mobile-pipeline-name">Drug Candidate C</div>
              <div className="mobile-pipeline-phase">Phase I - Rare Disease</div>
            </div>
            <div className="mobile-pipeline-progress-container">
              <div className="mobile-pipeline-progress-bar">
                <div 
                  className="mobile-pipeline-progress-fill" 
                  style={{ width: '20%' }}
                />
              </div>
              <div className="mobile-pipeline-progress-text">20%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
