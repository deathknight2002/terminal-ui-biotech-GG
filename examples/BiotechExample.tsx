import React from 'react';
import {
  AuroraBackdrop,
  BiotechFinancialDashboard,
  MetricCard,
  Panel,
  Tabs,
  Badge,
  Text
} from '../src';
import type { 
  Asset, 
  FinancialProjection,
  PipelineStage 
} from '../src';
import styles from './BiotechExample.module.css';

// Sample biotech asset data
const sampleAsset: Asset = {
  id: 'BCRX-001',
  name: 'Beigene Oncology Pipeline',
  symbol: 'BCRX',
  type: 'biotech',
  stage: 'phase-3' as PipelineStage,
  indication: 'Non-Hodgkin Lymphoma',
  modality: 'Small Molecule',
  mechanism: 'BTK Inhibitor',
  sponsor: 'Beigene Ltd.',
  targetMarket: 'Oncology - Hematologic',
  riskProfile: 'medium',
  marketCap: 8900000000,
  lastUpdated: new Date().toISOString(),
  pricing_us: 0,
  pricing_eur: 0,
  pricing_row: 0
};

const sampleProjection: FinancialProjection = {
  assetId: 'BCRX-001',
  npv: 2847000000,
  irr: 0.185,
  peakSales: 1250000000,
  timeToMarket: 24,
  probability: 0.65,
  scenario: 'base-case',
  assumptions: {
    discountRate: 0.12,
    patentLife: 12,
    marketPenetration: 0.08,
    pricingPower: 0.75
  },
  milestones: [
    {
      id: '1',
      name: 'Phase 3 Completion',
      date: '2024-Q4',
      probability: 0.78,
      value: 450000000,
      type: 'regulatory'
    },
    {
      id: '2', 
      name: 'FDA Approval',
      date: '2025-Q2',
      probability: 0.65,
      value: 1200000000,
      type: 'regulatory'
    },
    {
      id: '3',
      name: 'EU Approval',
      date: '2025-Q3', 
      probability: 0.58,
      value: 380000000,
      type: 'regulatory'
    }
  ],
  royaltyTiers: [
    { min: 0, max: 500000000, rate: 0.08 },
    { min: 500000000, max: 1000000000, rate: 0.12 },
    { min: 1000000000, max: Infinity, rate: 0.15 }
  ],
  patientProjections: [
    { year: 2024, patients: 1250, revenue: 87500000 },
    { year: 2025, patients: 8900, revenue: 623000000 },
    { year: 2026, patients: 14200, revenue: 994000000 },
    { year: 2027, patients: 17800, revenue: 1246000000 }
  ]
};

const getBadgeVariant = (probability: number) => {
  if (probability > 0.7) return 'success';
  if (probability > 0.5) return 'warning';
  return 'error';
};

const BiotechExample: React.FC = () => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Financial Dashboard',
      content: (
        <div className={styles.dashboardContent}>
          <BiotechFinancialDashboard 
            asset={sampleAsset}
            projection={sampleProjection}
          />
        </div>
      )
    },
    {
      id: 'pipeline',
      label: 'Pipeline Overview',
      content: (
        <div className={styles.pipelineGrid}>
          <MetricCard
            label="Peak Sales Forecast"
            value="$1.25B"
            change={18.5}
            variant="revenue"
            trend="up"
            subtitle="Phase 3 BTK Inhibitor"
          />
          <MetricCard
            label="NPV (12% Discount)"
            value="$2.85B"
            change={12.3}
            variant="revenue"
            trend="up"
            subtitle="Base case scenario"
          />
          <MetricCard
            label="Approval Probability"
            value="65%"
            change={-2.1}
            variant="primary"
            trend="down"
            subtitle="FDA regulatory path"
          />
          <MetricCard
            label="Time to Market"
            value="24"
            change={0}
            variant="primary"
            trend="flat"
            subtitle="Months remaining"
          />
        </div>
      )
    },
    {
      id: 'catalysts',
      label: 'Key Catalysts',
      content: (
        <div className={styles.catalystsContent}>
          <Panel title="Upcoming Clinical Milestones" variant="glass">
            <div className={styles.milestonesList}>
              {sampleProjection.milestones.map((milestone) => (
                <div key={milestone.id} className={styles.milestoneItem}>
                  <div>
                    <Text variant="body" color="primary">{milestone.name}</Text>
                    <Text variant="caption" color="secondary">{milestone.date}</Text>
                  </div>
                  <div className={styles.milestoneActions}>
                    <Badge variant={getBadgeVariant(milestone.probability)}>
                      {Math.round(milestone.probability * 100)}% probability
                    </Badge>
                    <Text variant="body" color="primary">
                      ${(milestone.value / 1000000).toFixed(0)}M
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )
    }
  ];

  return (
    <div className={styles.biotechExample}>
      <AuroraBackdrop
        intensity="high"
        showParticles={true}
        className="aurora-backdrop"
      />
      
      <div className={styles.contentContainer}>
        <div className={styles.headerSection}>
          <Text variant="h1" color="primary" style={{ marginBottom: '8px' }}>
            Biotech Intelligence Terminal
          </Text>
          <Text variant="body" color="muted">
            Next-generation pharmaceutical asset analysis and portfolio management
          </Text>
        </div>

        <Panel variant="glass" className={styles.panelContainer}>
          <Tabs tabs={tabs} />
        </Panel>
      </div>
    </div>
  );
};

export default BiotechExample;
