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
  PipelineStage,
  Catalyst
} from '../src';

// Sample biotech asset data
const sampleAsset: Asset = {
  id: 'BCRX-001',
  name: 'Beigene Oncology Pipeline',
  symbol: 'BCRX',
  type: 'biotech',
  stage: {
    name: 'Phase III',
    progress: 0.75
  } as PipelineStage,
  indication: 'Non-Hodgkin Lymphoma',
  modality: 'Small Molecule',
  mechanism: 'BTK Inhibitor',
  sponsor: 'Beigene Ltd.',
  targetMarket: 'Oncology - Hematologic',
  riskProfile: 'medium',
  marketCap: 8900000000,
  lastUpdated: new Date().toISOString(),
  pricing_us: 125000,
  pricing_eur: 98000,
  pricing_row: 75000
};

const sampleProjections: FinancialProjection[] = [
  {
    year: 2024,
    revenue: 87500000,
    expenses: 45000000,
    netIncome: 42500000,
    npv: 675000000,
    irr: 0.165,
    patients: {
      us: 850,
      eur: 300,
      row: 100,
      total: 1250
    }
  },
  {
    year: 2025,
    revenue: 623000000,
    expenses: 298000000,
    netIncome: 325000000,
    npv: 1850000000,
    irr: 0.185,
    patients: {
      us: 6230,
      eur: 2100,
      row: 570,
      total: 8900
    }
  },
  {
    year: 2026,
    revenue: 994000000,
    expenses: 467000000,
    netIncome: 527000000,
    npv: 2450000000,
    irr: 0.195,
    patients: {
      us: 9940,
      eur: 3200,
      row: 1060,
      total: 14200
    }
  }
];

const sampleCatalysts: Catalyst[] = [
  {
    id: '1',
    label: 'Phase 3 Completion',
    date: '2024-Q4',
    risk: 'Medium',
    description: 'Primary endpoint data readout',
    expectedImpact: 'High',
    category: 'Clinical'
  },
  {
    id: '2', 
    label: 'FDA Approval',
    date: '2025-Q2',
    risk: 'Medium',
    description: 'BLA submission and approval',
    expectedImpact: 'High',
    category: 'Regulatory'
  },
  {
    id: '3',
    label: 'EU Approval',
    date: '2025-Q3',
    risk: 'Medium',
    description: 'EMA approval decision',
    expectedImpact: 'High',
    category: 'Regulatory'
  }
];

const getBadgeVariant = (risk: string) => {
  switch (risk) {
    case 'Low': return 'success';
    case 'Medium': return 'warning';
    case 'High': return 'error';
    default: return 'default';
  }
};

const BiotechExample: React.FC = () => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Financial Dashboard',
      content: (
        <div style={{ padding: '24px' }}>
          <BiotechFinancialDashboard 
            projections={sampleProjections}
          />
        </div>
      )
    },
    {
      id: 'pipeline',
      label: 'Pipeline Overview',
      content: (
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <MetricCard
            label="Peak Sales Forecast"
            value="$1.25B"
            change={18.5}
            variant="revenue"
            trend="up"
          />
          <MetricCard
            label="NPV (12% Discount)"
            value="$2.85B"
            change={12.3}
            variant="revenue"
            trend="up"
          />
          <MetricCard
            label="Approval Probability"
            value="65%"
            change={-2.1}
            variant="milestone"
            trend="down"
          />
          <MetricCard
            label="Time to Market"
            value="24"
            change={0}
            variant="primary"
            trend="flat"
          />
        </div>
      )
    },
    {
      id: 'catalysts',
      label: 'Key Catalysts',
      content: (
        <div style={{ padding: '24px' }}>
          <Panel title="Upcoming Clinical Milestones">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sampleCatalysts.map((catalyst) => (
                <div 
                  key={catalyst.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div>
                    <Text variant="body" color="primary">{catalyst.label}</Text>
                    <Text variant="caption" color="secondary">{catalyst.date}</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Badge variant={getBadgeVariant(catalyst.risk)}>
                      {catalyst.risk} Risk
                    </Badge>
                    <Text variant="body" color="primary">
                      {catalyst.category}
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
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <AuroraBackdrop
        intensity="high"
        className="aurora-backdrop"
      />
      
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        padding: '40px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <Text variant="h1" color="primary" style={{ marginBottom: '8px' }}>
            Biotech Intelligence Terminal
          </Text>
          <Text variant="body" color="secondary">
            Next-generation pharmaceutical asset analysis and portfolio management
          </Text>
        </div>

        <Panel title="" style={{ marginBottom: '24px' }}>
          <Tabs tabs={tabs} />
        </Panel>
      </div>
    </div>
  );
};

export default BiotechExample;