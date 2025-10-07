// Mock Database Service for Development
// Provides sophisticated biotech data without requiring external databases

export interface BioAuroraMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  variant: 'primary' | 'secondary' | 'accent' | 'revenue' | 'expense';
  subtitle?: string;
}

export interface Catalyst {
  id: string;
  label: string;
  date: string;
  risk: 'High' | 'Medium' | 'Low';
  expectedImpact: 'High' | 'Medium' | 'Low';
  category: 'Clinical' | 'Regulatory' | 'Commercial' | 'Corporate';
  symbol?: string;
  company?: string;
}

export interface PortfolioPosition {
  symbol: string;
  company: string;
  shares: number;
  marketValue: number;
  weight: number;
  dayChange: number;
  dayChangePercent: number;
  cost: number;
  unrealizedPnL: number;
  sector: string;
  phase: string;
}

export interface ExposureSlice {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

// Sophisticated Mock Data
export const MOCK_AURORA_HEADLINE = {
  fundName: 'Aurora Biotech Intelligence Fund',
  strategy: 'AI-Driven Pharmaceutical Portfolio',
  status: 'OPERATIONAL' as const,
  lastUpdated: new Date().toISOString(),
  nav: 2540000000, // $2.54B
  navChange: 89000000, // +$89M
  navChangePercent: 3.68, // +3.68%
};

export const MOCK_AURORA_METRICS: BioAuroraMetric[] = [
  {
    id: 'nav',
    label: 'NET ASSET VALUE',
    value: '$2.54B',
    change: 3.68,
    trend: 'up',
    variant: 'primary',
    subtitle: 'Total Fund Value'
  },
  {
    id: 'alpha-capture',
    label: 'ALPHA CAPTURE',
    value: '+418 bps',
    change: 15.2,
    trend: 'up',
    variant: 'accent',
    subtitle: 'vs Biotech Index'
  },
  {
    id: 'active-positions',
    label: 'ACTIVE POSITIONS',
    value: '23',
    change: 4.5,
    trend: 'up',
    variant: 'secondary',
    subtitle: 'Portfolio Holdings'
  },
  {
    id: 'pipeline-value',
    label: 'PIPELINE VALUE',
    value: '$12.8B',
    change: 8.9,
    trend: 'up',
    variant: 'revenue',
    subtitle: 'Risk-Adjusted NPV'
  },
  {
    id: 'catalyst-count',
    label: 'NEAR-TERM CATALYSTS',
    value: '47',
    change: 12.1,
    trend: 'up',
    variant: 'accent',
    subtitle: 'Next 6 Months'
  },
  {
    id: 'success-rate',
    label: 'SUCCESS RATE',
    value: '73%',
    change: 5.8,
    trend: 'up',
    variant: 'primary',
    subtitle: 'Phase Transitions'
  }
];

export const MOCK_CATALYSTS: Catalyst[] = [
  {
    id: 'srpt-5051-data',
    label: 'SRP-5051 DMD DATA DROP',
    date: '2025-10-15',
    risk: 'Medium',
    expectedImpact: 'High',
    category: 'Clinical',
    symbol: 'SRPT',
    company: 'Sarepta Therapeutics'
  },
  {
    id: 'beam-302-clearance',
    label: 'BEAM-302 FDA CLEARANCE',
    date: '2025-10-30',
    risk: 'Low',
    expectedImpact: 'High',
    category: 'Regulatory',
    symbol: 'BEAM',
    company: 'Beam Therapeutics'
  },
  {
    id: 'ntla-2002-interim',
    label: 'NTLA-2002 INTERIM DATA',
    date: '2025-11-20',
    risk: 'High',
    expectedImpact: 'Medium',
    category: 'Clinical',
    symbol: 'NTLA',
    company: 'Intellia Therapeutics'
  },
  {
    id: 'regn-eb3-approval',
    label: 'REGN-EB3 EU APPROVAL',
    date: '2025-12-10',
    risk: 'Medium',
    expectedImpact: 'High',
    category: 'Regulatory',
    symbol: 'REGN',
    company: 'Regeneron Pharmaceuticals'
  }
];

export const MOCK_POSITIONS: PortfolioPosition[] = [
  {
    symbol: 'SRPT',
    company: 'Sarepta Therapeutics',
    shares: 2500000,
    marketValue: 425000000,
    weight: 0.167,
    dayChange: 12500000,
    dayChangePercent: 3.03,
    cost: 380000000,
    unrealizedPnL: 45000000,
    sector: 'Rare Disease',
    phase: 'Phase 3'
  },
  {
    symbol: 'BEAM',
    company: 'Beam Therapeutics',
    shares: 1800000,
    marketValue: 380000000,
    weight: 0.150,
    dayChange: -8900000,
    dayChangePercent: -2.29,
    cost: 350000000,
    unrealizedPnL: 30000000,
    sector: 'Gene Editing',
    phase: 'Phase 2'
  },
  {
    symbol: 'NTLA',
    company: 'Intellia Therapeutics',
    shares: 3200000,
    marketValue: 320000000,
    weight: 0.126,
    dayChange: 15200000,
    dayChangePercent: 4.98,
    cost: 290000000,
    unrealizedPnL: 30000000,
    sector: 'CRISPR',
    phase: 'Phase 1'
  },
  {
    symbol: 'REGN',
    company: 'Regeneron Pharmaceuticals',
    shares: 450000,
    marketValue: 450000000,
    weight: 0.177,
    dayChange: 8700000,
    dayChangePercent: 1.97,
    cost: 420000000,
    unrealizedPnL: 30000000,
    sector: 'Immunology',
    phase: 'Approved'
  }
];

export const MOCK_EXPOSURES: ExposureSlice[] = [
  { name: 'Oncology', value: 785000000, percentage: 31, color: '#FF6B6B' },
  { name: 'Rare Disease', value: 610000000, percentage: 24, color: '#4ECDC4' },
  { name: 'Gene Editing', value: 508000000, percentage: 20, color: '#45B7D1' },
  { name: 'Immunology', value: 381000000, percentage: 15, color: '#96CEB4' },
  { name: 'Neurology', value: 254000000, percentage: 10, color: '#FCEA2B' }
];

export const MOCK_PIPELINE_STAGES = [
  {
    name: 'Phase III',
    progress: 0.75,
    startDate: '2024-01-15',
    endDate: '2025-08-15',
    estimatedCost: 150000000
  },
  {
    name: 'Phase II',
    progress: 0.45,
    startDate: '2023-06-01',
    endDate: '2025-12-30',
    estimatedCost: 80000000
  },
  {
    name: 'Phase I',
    progress: 0.20,
    startDate: '2024-03-01',
    endDate: '2026-06-15',
    estimatedCost: 25000000
  }
];

// Clinical Trials Mock Data
export const MOCK_CLINICAL_TRIALS = [
  {
    id: 'NCT05123456',
    title: 'SRP-5051 in Boys with DMD - Phase 3 MOMENTUM Study',
    phase: 'Phase III' as const,
    status: 'Recruiting' as const,
    indication: 'Duchenne Muscular Dystrophy',
    primaryCompletion: '2025-08-15',
    estimatedEnrollment: 220,
    sponsors: ['Sarepta Therapeutics'],
    locations: ['USA', 'Europe', 'Canada'],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'NCT04987654',
    title: 'BEAM-302 Base Editing for Sickle Cell Disease',
    phase: 'Phase II' as const,
    status: 'Active, not recruiting' as const,
    indication: 'Sickle Cell Disease',
    primaryCompletion: '2025-12-30',
    estimatedEnrollment: 45,
    sponsors: ['Beam Therapeutics'],
    locations: ['USA', 'UK'],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'NCT03654321',
    title: 'NTLA-2001 CRISPR Gene Editing for ATTR Amyloidosis',
    phase: 'Phase I' as const,
    status: 'Completed' as const,
    indication: 'ATTR Amyloidosis',
    primaryCompletion: '2024-06-15',
    estimatedEnrollment: 12,
    sponsors: ['Intellia Therapeutics'],
    locations: ['USA', 'Netherlands'],
    lastUpdated: new Date().toISOString(),
  }
];

// Financial Modeling Mock Data
export const MOCK_FINANCIAL_ASSET = {
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
  pricing_us: 3000000,
  pricing_eur: 2700000,
  pricing_row: 3300000,
};

export const MOCK_FINANCIAL_PROJECTION = {
  assetId: 'SRPT-5051',
  npv: 8500000000,
  irr: 0.28,
  peakSales: 2800000000,
  timeToMarket: 2.5,
  probability: 0.65,
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
  ]
};

// Pipeline Mock Data
export const MOCK_PIPELINE_METRICS: BioAuroraMetric[] = [
  {
    id: 'total-programs',
    label: 'TOTAL PROGRAMS',
    value: '47',
    change: 8.3,
    trend: 'up',
    variant: 'primary',
    subtitle: 'Active Development'
  },
  {
    id: 'phase-3',
    label: 'PHASE III',
    value: '12',
    change: 5.2,
    trend: 'up',
    variant: 'accent',
    subtitle: 'Late Stage'
  },
  {
    id: 'phase-2',
    label: 'PHASE II',
    value: '18',
    change: -2.1,
    trend: 'down',
    variant: 'secondary',
    subtitle: 'Mid Stage'
  },
  {
    id: 'phase-1',
    label: 'PHASE I',
    value: '17',
    change: 12.8,
    trend: 'up',
    variant: 'primary',
    subtitle: 'Early Stage'
  },
  {
    id: 'expected-approvals',
    label: 'EXPECTED APPROVALS',
    value: '8',
    change: 15.4,
    trend: 'up',
    variant: 'accent',
    subtitle: '2024-2025'
  },
  {
    id: 'total-investment',
    label: 'TOTAL INVESTMENT',
    value: '$12.4B',
    change: 7.9,
    trend: 'up',
    variant: 'secondary',
    subtitle: 'R&D Capital'
  }
];

export class MockDatabaseService {
  // Dashboard data
  async getDashboardData() {
    return {
      headline: MOCK_AURORA_HEADLINE,
      metrics: MOCK_AURORA_METRICS,
      catalysts: MOCK_CATALYSTS,
      positions: MOCK_POSITIONS,
      exposures: MOCK_EXPOSURES,
      pipeline: MOCK_PIPELINE_STAGES
    };
  }

  // Clinical trials data
  async getClinicalTrialsData() {
    return {
      trials: MOCK_CLINICAL_TRIALS
    };
  }

  // Financial modeling data
  async getFinancialModelingData() {
    return {
      asset: MOCK_FINANCIAL_ASSET,
      projection: MOCK_FINANCIAL_PROJECTION
    };
  }

  // Pipeline data
  async getPipelineData() {
    return {
      metrics: MOCK_PIPELINE_METRICS,
      catalysts: MOCK_CATALYSTS.filter(c => c.category === 'Clinical')
    };
  }

  // Market intelligence data
  async getMarketIntelligenceData() {
    return {
      metrics: MOCK_AURORA_METRICS.slice(0, 4),
      positions: MOCK_POSITIONS,
      exposures: MOCK_EXPOSURES
    };
  }

  // Data explorer data
  async getDataExplorerData() {
    return {
      datasets: [
        { id: 'clinical-trials', name: 'Clinical Trials', count: MOCK_CLINICAL_TRIALS.length },
        { id: 'portfolio-positions', name: 'Portfolio Positions', count: MOCK_POSITIONS.length },
        { id: 'catalysts', name: 'Catalysts', count: MOCK_CATALYSTS.length }
      ]
    };
  }
}

export const mockDb = new MockDatabaseService();