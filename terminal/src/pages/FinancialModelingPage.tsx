import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BiotechFinancialDashboard,
} from '../../../frontend-components/src/biotech';
import type { 
  Asset,
  FinancialProjection
} from '../../../frontend-components/src/types/biotech';

// Sample sophisticated biotech asset for financial modeling
const SAMPLE_ASSET: Asset = {
  id: 'SRPT-5051',
  name: 'SRP-5051 Duchenne Muscular Dystrophy Treatment',
  symbol: 'SRPT',
  type: 'biotech',
  stage: {
    name: 'Phase III',
    progress: 0.75,
    startDate: '2024-01-15',
    endDate: '2025-08-15',
    estimatedCost: 150000000
  },
  indication: 'Duchenne Muscular Dystrophy',
  modality: 'Gene Therapy',
  mechanism: 'Dystrophin Restoration',
  sponsor: 'Sarepta Therapeutics',
  targetMarket: 'Rare Disease - Neuromuscular',
  riskProfile: 'medium',
  marketCap: 8900000000,
  lastUpdated: new Date().toISOString(),
  pricing_us: 3000000, // $3M per treatment
  pricing_eur: 2700000,
  pricing_row: 3300000, // Rest of World pricing
};

// Sample sophisticated financial projection
const SAMPLE_PROJECTION: FinancialProjection = {
  assetId: 'SRPT-5051',
  npv: 8500000000, // $8.5B NPV
  irr: 0.28, // 28% IRR
  peakSales: 2800000000, // $2.8B peak sales
  timeToMarket: 2.5, // 2.5 years to market
  probability: 0.65, // 65% success probability
  scenario: 'Base Case',
  assumptions: {
    discountRate: 0.12,
    patentLife: 12,
    marketPenetration: 0.35,
    pricingPower: 0.82,
  },
  milestones: [
    {
      id: 'phase-3-complete',
      name: 'Phase 3 Completion',
      date: '2025-Q3',
      probability: 0.75,
      value: 500000000,
      type: 'development'
    },
    {
      id: 'fda-approval',
      name: 'FDA Approval',
      date: '2026-Q1',
      probability: 0.85,
      value: 800000000,
      type: 'regulatory'
    },
    {
      id: 'first-sales',
      name: 'First Commercial Sales',
      date: '2026-Q2',
      probability: 0.90,
      value: 200000000,
      type: 'sales'
    }
  ],
  royaltyTiers: [
    { min: 0, max: 500000000, rate: 0.08 },
    { min: 500000000, max: 1500000000, rate: 0.12 },
    { min: 1500000000, max: 10000000000, rate: 0.15 }
  ],
  patientProjections: [
    { year: 2026, patients: 450, revenue: 180000000 },
    { year: 2027, patients: 1200, revenue: 720000000 },
    { year: 2028, patients: 2100, revenue: 1260000000 },
    { year: 2029, patients: 3200, revenue: 1920000000 },
    { year: 2030, patients: 4500, revenue: 2700000000 },
    { year: 2031, patients: 4200, revenue: 2520000000 },
    { year: 2032, patients: 3800, revenue: 2280000000 },
  ]
};

const fetchFinancialData = async () => {
  try {
    const response = await fetch('http://localhost:3001/api/biotech/financial-models');
    if (!response.ok) {
      return { asset: SAMPLE_ASSET, projection: SAMPLE_PROJECTION };
    }
    const data = await response.json();
    return data || { asset: SAMPLE_ASSET, projection: SAMPLE_PROJECTION };
  } catch {
    console.log('Backend unavailable, using sophisticated sample data');
    return { asset: SAMPLE_ASSET, projection: SAMPLE_PROJECTION };
  }
};

export function FinancialModelingPage() {
  const { 
    data: financialData = { asset: SAMPLE_ASSET, projection: SAMPLE_PROJECTION },
  } = useQuery({
    queryKey: ['financial-modeling'],
    queryFn: fetchFinancialData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">SOPHISTICATED FINANCIAL MODELING SUITE</div>
        <h1>BIOTECH VALUATION & PROJECTIONS</h1>
        <div className="subtitle">DCF analysis, risk-adjusted NPV, milestone valuation & scenario modeling</div>
      </div>

      <BiotechFinancialDashboard
        asset={financialData.asset}
        projection={financialData.projection}
      />
    </div>
  );
}