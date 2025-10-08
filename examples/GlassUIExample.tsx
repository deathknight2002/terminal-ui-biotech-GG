import React, { useState } from 'react';
import { GlassPanel } from '../frontend-components/src/terminal/organisms/GlassPanel';
import { MolecularGlassGrid } from '../frontend-components/src/biotech/organisms/MolecularGlassGrid';
import { ClinicalTrialGlassTimeline } from '../frontend-components/src/biotech/organisms/ClinicalTrialGlassTimeline';
import { CatalystGlassAlert } from '../frontend-components/src/biotech/organisms/CatalystGlassAlert';
import type { TrialPhase } from '../frontend-components/src/biotech/organisms/ClinicalTrialGlassTimeline';
import type { CatalystAlert } from '../frontend-components/src/biotech/organisms/CatalystGlassAlert';
import styles from './GlassUIExample.module.css';

// Sample data
const sampleTrialPhases: TrialPhase[] = [
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
    completion: 75,
    status: 'active',
    milestone: {
      name: 'Interim Analysis',
      probability: 0.82,
      date: '2025-Q2',
    },
  },
  {
    phase: 'phase-3',
    name: 'Phase III',
    completion: 35,
    status: 'active',
    milestone: {
      name: 'FDA Fast Track',
      probability: 0.68,
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

const sampleAlerts: CatalystAlert[] = [
  {
    id: '1',
    title: 'FDA PDUFA Date Approaching',
    message: 'ARYAZ-123 breakthrough therapy designation decision expected within 30 days',
    priority: 'critical',
    type: 'fda',
    timestamp: new Date(Date.now() - 5 * 60000),
    ticker: 'ARYAZ',
    action: {
      label: 'View Details',
      onClick: () => console.log('View FDA details'),
    },
  },
  {
    id: '2',
    title: 'Phase 3 Trial Results',
    message: 'Positive top-line results announced for oncology candidate BTK-456',
    priority: 'high',
    type: 'trial',
    timestamp: new Date(Date.now() - 45 * 60000),
    ticker: 'BCRX',
  },
  {
    id: '3',
    title: 'Market Moving Event',
    message: 'Institutional buying detected: 15% increase in volume over 24h',
    priority: 'medium',
    type: 'market',
    timestamp: new Date(Date.now() - 2 * 3600000),
    ticker: 'XYZ',
  },
];

const GlassUIExample: React.FC = () => {
  const [alerts, setAlerts] = useState<CatalystAlert[]>(sampleAlerts);
  const [selectedPhase, setSelectedPhase] = useState<TrialPhase | null>(null);

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const handlePhaseSelect = (phase: TrialPhase) => {
    setSelectedPhase(phase);
    console.log('Selected phase:', phase);
  };

  return (
    <div className={styles.glassUIExample}>
      {/* Neural Glass Dashboard Background */}
      <div className="neural-glass-dashboard">
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.title}>
              Glass UI Concept - October 2025
            </h1>
            <p className={styles.subtitle}>
              Next-generation pharmaceutical intelligence interface with adaptive glassmorphism
            </p>
          </header>

          {/* Adaptive Glass Panels Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Adaptive Glass Panels</h2>
            <div className={styles.panelGrid}>
              <GlassPanel urgency="critical" texture="neural">
                <h3 className={styles.panelTitle}>CRITICAL ALERT</h3>
                <p className={styles.panelContent}>
                  High priority FDA decision pending. Maximum transparency and visual prominence
                  for immediate attention.
                </p>
                <div className={styles.panelMeta}>Urgency: Critical | Texture: Neural</div>
              </GlassPanel>

              <GlassPanel urgency="high" texture="molecular">
                <h3 className={styles.panelTitle}>High Priority Data</h3>
                <p className={styles.panelContent}>
                  Important market intelligence with molecular texture pattern. Enhanced blur for
                  data depth perception.
                </p>
                <div className={styles.panelMeta}>Urgency: High | Texture: Molecular</div>
              </GlassPanel>

              <GlassPanel urgency="medium" texture="crystalline">
                <h3 className={styles.panelTitle}>Medium Priority Update</h3>
                <p className={styles.panelContent}>
                  Standard pharmaceutical data visualization with crystalline surface texture.
                  Balanced transparency.
                </p>
                <div className={styles.panelMeta}>Urgency: Medium | Texture: Crystalline</div>
              </GlassPanel>

              <GlassPanel urgency="low" texture="neural" showDataUpdate>
                <h3 className={styles.panelTitle}>Low Priority Info</h3>
                <p className={styles.panelContent}>
                  Background information with minimal visual emphasis. High transparency for
                  subtle presence. Real-time data update ripple enabled.
                </p>
                <div className={styles.panelMeta}>Urgency: Low | Data Update: Active</div>
              </GlassPanel>
            </div>
          </section>

          {/* Molecular Glass Grid Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Molecular Glass Grid</h2>
            <MolecularGlassGrid show3DStructure showConnections animationSpeed="normal">
              <div className={styles.molecularContent}>
                <h3 className={styles.panelTitle}>Compound Analysis - BTK Inhibitor</h3>
                <div className={styles.compoundGrid}>
                  <div className={styles.compoundStat}>
                    <span className={styles.statLabel}>Molecular Weight</span>
                    <span className={styles.statValue}>450.5 g/mol</span>
                  </div>
                  <div className={styles.compoundStat}>
                    <span className={styles.statLabel}>LogP</span>
                    <span className={styles.statValue}>3.2</span>
                  </div>
                  <div className={styles.compoundStat}>
                    <span className={styles.statLabel}>H-Bond Donors</span>
                    <span className={styles.statValue}>2</span>
                  </div>
                  <div className={styles.compoundStat}>
                    <span className={styles.statLabel}>H-Bond Acceptors</span>
                    <span className={styles.statValue}>6</span>
                  </div>
                </div>
                <p className={styles.molecularDescription}>
                  3D molecular structure visualization with animated connection lines between
                  chemical bonds. Perfect for drug compound analysis and similarity clustering.
                </p>
              </div>
            </MolecularGlassGrid>
          </section>

          {/* Clinical Trial Glass Timeline Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Clinical Trial Glass Timeline</h2>
            <ClinicalTrialGlassTimeline
              phases={sampleTrialPhases}
              enableFlowAnimation
              showMilestones
              onPhaseSelect={handlePhaseSelect}
            />
            {selectedPhase && (
              <div className={styles.phaseDetails}>
                <GlassPanel urgency="medium" texture="neural">
                  <h4>Selected Phase: {selectedPhase.name}</h4>
                  <p>Status: {selectedPhase.status}</p>
                  <p>Completion: {selectedPhase.completion}%</p>
                  {selectedPhase.milestone && (
                    <>
                      <p>Milestone: {selectedPhase.milestone.name}</p>
                      <p>
                        Probability: {Math.round(selectedPhase.milestone.probability * 100)}%
                      </p>
                      <p>Expected: {selectedPhase.milestone.date}</p>
                    </>
                  )}
                </GlassPanel>
              </div>
            )}
          </section>

          {/* Catalyst Glass Alerts Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Catalyst Glass Alerts</h2>
            <div className={styles.alertsContainer}>
              {alerts.length === 0 ? (
                <GlassPanel urgency="low" texture="neural">
                  <p className={styles.noAlerts}>No active alerts. All clear! 🎉</p>
                </GlassPanel>
              ) : (
                alerts.map((alert) => (
                  <CatalystGlassAlert
                    key={alert.id}
                    alert={alert}
                    autoDismiss={alert.priority === 'low' ? 10000 : undefined}
                    showTimestamp
                    onDismiss={handleDismissAlert}
                    onClick={(alert) => console.log('Alert clicked:', alert)}
                  />
                ))
              )}
            </div>
          </section>

          {/* Features Overview */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Glass UI Features</h2>
            <div className={styles.featuresGrid}>
              <GlassPanel urgency="medium" texture="neural">
                <h4 className={styles.featureTitle}>🎨 Adaptive Transparency</h4>
                <p className={styles.featureText}>
                  Data-driven transparency levels from 15% (critical) to 85% (minimal) for
                  intelligent visual hierarchy.
                </p>
              </GlassPanel>

              <GlassPanel urgency="medium" texture="molecular">
                <h4 className={styles.featureTitle}>💎 Surface Textures</h4>
                <p className={styles.featureText}>
                  Neural, molecular, and crystalline texture patterns for different data types
                  and contexts.
                </p>
              </GlassPanel>

              <GlassPanel urgency="medium" texture="crystalline">
                <h4 className={styles.featureTitle}>🌊 Liquid Flow</h4>
                <p className={styles.featureText}>
                  Clinical trial phases with liquid-like data flow animations showing progress
                  and completion.
                </p>
              </GlassPanel>

              <GlassPanel urgency="medium" texture="neural">
                <h4 className={styles.featureTitle}>⭐ FDA Milestones</h4>
                <p className={styles.featureText}>
                  Glass markers with approval probability halos for key regulatory decision
                  points.
                </p>
              </GlassPanel>

              <GlassPanel urgency="medium" texture="molecular">
                <h4 className={styles.featureTitle}>🔔 Smart Alerts</h4>
                <p className={styles.featureText}>
                  Priority-based catalyst notifications with slide-in animations and auto-dismiss.
                </p>
              </GlassPanel>

              <GlassPanel urgency="medium" texture="crystalline">
                <h4 className={styles.featureTitle}>📱 Responsive</h4>
                <p className={styles.featureText}>
                  Adaptive quality scaling from mobile to workstation for optimal performance.
                </p>
              </GlassPanel>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GlassUIExample;
