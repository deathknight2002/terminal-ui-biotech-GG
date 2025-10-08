import React, { useEffect, useState } from 'react';
import { GlassPanel } from '../../frontend-components/src/terminal/organisms/GlassPanel';
import { MolecularGlassGrid } from '../../frontend-components/src/biotech/organisms/MolecularGlassGrid';
import { ClinicalTrialGlassTimeline } from '../../frontend-components/src/biotech/organisms/ClinicalTrialGlassTimeline';
import { CatalystGlassAlert } from '../../frontend-components/src/biotech/organisms/CatalystGlassAlert';
import { useGlassAlerts } from '../../frontend-components/src/hooks/useGlassAlerts';
import type { TrialPhase } from '../../frontend-components/src/biotech/organisms/ClinicalTrialGlassTimeline';
import '../../frontend-components/src/styles/glass-ui-enhanced.css';
import './GlassUIDemoPage.css';

// Sample data for demo
const DEMO_TRIAL_PHASES: TrialPhase[] = [
  {
    phase: 'preclinical',
    name: 'Preclinical',
    completion: 100,
    status: 'completed',
  },
  {
    phase: 'phase-1',
    name: 'Phase I',
    completion: 100,
    status: 'completed',
  },
  {
    phase: 'phase-2',
    name: 'Phase II',
    completion: 85,
    status: 'active',
    milestone: {
      name: 'Safety Review',
      probability: 0.89,
      date: '2025-Q2',
    },
  },
  {
    phase: 'phase-3',
    name: 'Phase III',
    completion: 45,
    status: 'active',
    milestone: {
      name: 'Efficacy Analysis',
      probability: 0.72,
      date: '2025-Q4',
    },
  },
  {
    phase: 'filed',
    name: 'Filed',
    completion: 0,
    status: 'upcoming',
  },
  {
    phase: 'approved',
    name: 'Approved',
    completion: 0,
    status: 'upcoming',
  },
];

export const GlassUIDemoPage: React.FC = () => {
  const { alerts, addAlert, dismissAlert } = useGlassAlerts(5);
  const [selectedPhase, setSelectedPhase] = useState<TrialPhase | null>(null);
  const [liveDataActive, setLiveDataActive] = useState(false);

  // Simulate live data updates
  useEffect(() => {
    if (!liveDataActive) return;

    const interval = setInterval(() => {
      const alertTypes = ['fda', 'trial', 'market', 'regulatory', 'clinical'] as const;
      const priorities = ['critical', 'high', 'medium', 'low'] as const;
      const tickers = ['ARYAZ', 'BCRX', 'XYZ', 'ABC', 'DEF'];
      
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
      const randomTicker = tickers[Math.floor(Math.random() * tickers.length)];

      addAlert({
        title: `${randomType.toUpperCase()} Update`,
        message: `Live market data detected for ${randomTicker} - ${new Date().toLocaleTimeString()}`,
        priority: randomPriority,
        type: randomType,
        ticker: randomTicker,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [liveDataActive, addAlert]);

  const handleSimulateAlert = (priority: 'critical' | 'high' | 'medium' | 'low') => {
    addAlert({
      title: `${priority.toUpperCase()} Priority Alert`,
      message: `This is a simulated ${priority} priority alert to demonstrate glass UI behavior`,
      priority,
      type: 'fda',
      ticker: 'DEMO',
      action: {
        label: 'View Details',
        onClick: () => console.log(`${priority} alert action clicked`),
      },
    });
  };

  return (
    <div className="neural-glass-dashboard glass-ui-demo-page">
      <div className="demo-container">
        {/* Header */}
        <header className="demo-header">
          <div className="demo-eyebrow">October 2025 Glass UI Concept</div>
          <h1 className="demo-title">Biotech Terminal Glass UI</h1>
          <p className="demo-subtitle">
            Experience next-generation pharmaceutical intelligence with adaptive glassmorphism,
            real-time data flow animations, and priority-based visual hierarchy.
          </p>
        </header>

        {/* Control Panel */}
        <section className="demo-section">
          <GlassPanel urgency="medium" texture="neural">
            <h2 className="section-title">Interactive Controls</h2>
            <div className="control-grid">
              <button
                className="demo-button demo-button-critical"
                onClick={() => handleSimulateAlert('critical')}
              >
                Trigger Critical Alert
              </button>
              <button
                className="demo-button demo-button-high"
                onClick={() => handleSimulateAlert('high')}
              >
                Trigger High Alert
              </button>
              <button
                className="demo-button demo-button-medium"
                onClick={() => handleSimulateAlert('medium')}
              >
                Trigger Medium Alert
              </button>
              <button
                className="demo-button demo-button-low"
                onClick={() => handleSimulateAlert('low')}
              >
                Trigger Low Alert
              </button>
              <button
                className={`demo-button ${liveDataActive ? 'demo-button-active' : ''}`}
                onClick={() => setLiveDataActive(!liveDataActive)}
              >
                {liveDataActive ? '🔴 Stop' : '🟢 Start'} Live Data
              </button>
            </div>
          </GlassPanel>
        </section>

        {/* Adaptive Panels Showcase */}
        <section className="demo-section">
          <h2 className="section-heading">Adaptive Glass Panels</h2>
          <p className="section-description">
            Panels with data-driven transparency levels and surface textures
          </p>
          <div className="panel-showcase-grid">
            <GlassPanel urgency="critical" texture="neural" showDataUpdate={liveDataActive}>
              <div className="showcase-panel-content">
                <h3 className="showcase-title">CRITICAL</h3>
                <p className="showcase-text">15% transparency • Neural texture</p>
                <div className="showcase-badge showcase-badge-critical">High Visibility</div>
              </div>
            </GlassPanel>

            <GlassPanel urgency="high" texture="molecular">
              <div className="showcase-panel-content">
                <h3 className="showcase-title">HIGH</h3>
                <p className="showcase-text">25% transparency • Molecular texture</p>
                <div className="showcase-badge showcase-badge-high">Important</div>
              </div>
            </GlassPanel>

            <GlassPanel urgency="medium" texture="crystalline">
              <div className="showcase-panel-content">
                <h3 className="showcase-title">MEDIUM</h3>
                <p className="showcase-text">45% transparency • Crystalline texture</p>
                <div className="showcase-badge showcase-badge-medium">Standard</div>
              </div>
            </GlassPanel>

            <GlassPanel urgency="low" texture="neural">
              <div className="showcase-panel-content">
                <h3 className="showcase-title">LOW</h3>
                <p className="showcase-text">65% transparency • Neural texture</p>
                <div className="showcase-badge showcase-badge-low">Background</div>
              </div>
            </GlassPanel>
          </div>
        </section>

        {/* Molecular Grid */}
        <section className="demo-section">
          <h2 className="section-heading">Molecular Glass Grid</h2>
          <p className="section-description">
            3D molecular structure visualization with animated chemical bonds
          </p>
          <MolecularGlassGrid show3DStructure showConnections animationSpeed="normal">
            <div className="molecular-demo-content">
              <h3 className="molecular-title">BTK Inhibitor Analysis</h3>
              <div className="molecular-stats">
                <div className="molecular-stat">
                  <span className="stat-label">Molecular Weight</span>
                  <span className="stat-value">450.5 g/mol</span>
                </div>
                <div className="molecular-stat">
                  <span className="stat-label">LogP</span>
                  <span className="stat-value">3.2</span>
                </div>
                <div className="molecular-stat">
                  <span className="stat-label">H-Donors</span>
                  <span className="stat-value">2</span>
                </div>
                <div className="molecular-stat">
                  <span className="stat-label">H-Acceptors</span>
                  <span className="stat-value">6</span>
                </div>
              </div>
            </div>
          </MolecularGlassGrid>
        </section>

        {/* Clinical Trial Timeline */}
        <section className="demo-section">
          <h2 className="section-heading">Clinical Trial Timeline</h2>
          <p className="section-description">
            Interactive phase progression with liquid-like flow and FDA milestones
          </p>
          <ClinicalTrialGlassTimeline
            phases={DEMO_TRIAL_PHASES}
            enableFlowAnimation
            showMilestones
            onPhaseSelect={setSelectedPhase}
          />
          {selectedPhase && (
            <div className="phase-details-container">
              <GlassPanel urgency="high" texture="molecular">
                <h3 className="phase-details-title">
                  Selected Phase: {selectedPhase.name}
                </h3>
                <div className="phase-details-grid">
                  <div className="phase-detail">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{selectedPhase.status}</span>
                  </div>
                  <div className="phase-detail">
                    <span className="detail-label">Completion:</span>
                    <span className="detail-value">{selectedPhase.completion}%</span>
                  </div>
                  {selectedPhase.milestone && (
                    <>
                      <div className="phase-detail">
                        <span className="detail-label">Milestone:</span>
                        <span className="detail-value">{selectedPhase.milestone.name}</span>
                      </div>
                      <div className="phase-detail">
                        <span className="detail-label">Probability:</span>
                        <span className="detail-value">
                          {Math.round(selectedPhase.milestone.probability * 100)}%
                        </span>
                      </div>
                      <div className="phase-detail">
                        <span className="detail-label">Expected:</span>
                        <span className="detail-value">{selectedPhase.milestone.date}</span>
                      </div>
                    </>
                  )}
                </div>
              </GlassPanel>
            </div>
          )}
        </section>

        {/* Catalyst Alerts */}
        <section className="demo-section">
          <h2 className="section-heading">Catalyst Glass Alerts</h2>
          <p className="section-description">
            Priority-based notifications with auto-dismiss and real-time updates
          </p>
          <div className="alerts-showcase">
            {alerts.length === 0 ? (
              <GlassPanel urgency="low" texture="neural">
                <div className="no-alerts-message">
                  <span className="no-alerts-icon">✨</span>
                  <p>No active alerts. Use controls above to simulate alerts.</p>
                </div>
              </GlassPanel>
            ) : (
              alerts.map((alert) => (
                <CatalystGlassAlert
                  key={alert.id}
                  alert={alert}
                  autoDismiss={alert.priority === 'low' ? 8000 : undefined}
                  showTimestamp
                  onDismiss={dismissAlert}
                  onClick={(alert) => console.log('Alert clicked:', alert)}
                />
              ))
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="demo-section">
          <h2 className="section-heading">Key Features</h2>
          <div className="features-showcase">
            <GlassPanel urgency="medium" texture="neural">
              <div className="feature-content">
                <span className="feature-icon">🎨</span>
                <h3 className="feature-title">Adaptive Transparency</h3>
                <p className="feature-text">
                  15%-85% transparency levels based on data urgency
                </p>
              </div>
            </GlassPanel>

            <GlassPanel urgency="medium" texture="molecular">
              <div className="feature-content">
                <span className="feature-icon">💎</span>
                <h3 className="feature-title">Surface Textures</h3>
                <p className="feature-text">
                  Neural, molecular, and crystalline patterns
                </p>
              </div>
            </GlassPanel>

            <GlassPanel urgency="medium" texture="crystalline">
              <div className="feature-content">
                <span className="feature-icon">🌊</span>
                <h3 className="feature-title">Liquid Flow</h3>
                <p className="feature-text">
                  Clinical trial phase progression animations
                </p>
              </div>
            </GlassPanel>

            <GlassPanel urgency="medium" texture="neural">
              <div className="feature-content">
                <span className="feature-icon">⭐</span>
                <h3 className="feature-title">FDA Milestones</h3>
                <p className="feature-text">
                  Probability halos for regulatory decisions
                </p>
              </div>
            </GlassPanel>

            <GlassPanel urgency="medium" texture="molecular">
              <div className="feature-content">
                <span className="feature-icon">🔔</span>
                <h3 className="feature-title">Smart Alerts</h3>
                <p className="feature-text">
                  Priority-based catalyst notifications
                </p>
              </div>
            </GlassPanel>

            <GlassPanel urgency="medium" texture="crystalline">
              <div className="feature-content">
                <span className="feature-icon">📱</span>
                <h3 className="feature-title">Responsive</h3>
                <p className="feature-text">
                  Adaptive quality for all device types
                </p>
              </div>
            </GlassPanel>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GlassUIDemoPage;
