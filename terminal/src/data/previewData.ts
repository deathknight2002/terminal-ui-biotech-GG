import type {
  AnalyticsData,
  BioAuroraDashboardProps,
  Catalyst,
  ExposureSlice,
  LauraDoc,
  NewsItem,
  PipelineStage,
  PortfolioPosition,
} from '../../../frontend-components/src/types/biotech'
import type { CatalystEvent } from '../../../src/types/biotech'

const headline: BioAuroraDashboardProps['headline'] = {
  fundName: 'Redmile Bio Growth',
  strategy: 'SMID BIO | LONG/SHORT | SCIENCE-FIRST',
  status: 'Live',
  lastUpdated: new Date().toISOString(),
  nav: 142.36,
  navChange: 1.32,
  navChangePercent: 0.94,
}

const metrics: BioAuroraDashboardProps['metrics'] = [
  {
    id: 'alpha',
    label: 'ALPHA (QTD)',
    value: '+312 bps',
    change: 42,
    changeLabel: 'Beat vs XBI',
    trend: 'up',
    variant: 'primary',
  },
  {
    id: 'hit-rate',
    label: 'HIT RATE',
    value: '62%',
    change: 12,
    changeLabel: 'Upgrade vs last quarter',
    trend: 'up',
    variant: 'accent',
  },
  {
    id: 'cash',
    label: 'CASH',
    value: '$412M',
    change: 5,
    changeLabel: 'Dry powder for 2H catalysts',
    trend: 'neutral',
  },
  {
    id: 'drawdown',
    label: 'MAX DRAWDOWN',
    value: '-3.8%',
    change: -1.1,
    changeLabel: 'Tighter risk envelope',
    trend: 'up',
  },
]

const catalysts: Catalyst[] = [
  {
    id: 'catalyst-1',
    label: 'SRPT-5051 MOMENTUM readout',
    date: '2026-02-15',
    risk: 'High',
    category: 'Clinical',
    expectedImpact: 'High',
    description: 'Ambulatory endpoints; high-value DMD population',
  },
  {
    id: 'catalyst-2',
    label: 'VERVE-101 initial in vivo data',
    date: '2026-03-20',
    risk: 'Medium',
    category: 'Clinical',
    expectedImpact: 'Medium',
    description: 'Base editing safety/LDL impact in HeFH',
  },
  {
    id: 'catalyst-3',
    label: 'VRTX/CRSP exa-cel EU CHMP',
    date: '2026-04-05',
    risk: 'Low',
    category: 'Regulatory',
    expectedImpact: 'Medium',
    description: 'Reimbursement clarity for β-thalassemia and SCD',
  },
]

const positions: PortfolioPosition[] = [
  {
    id: 'VRTX',
    ticker: 'VRTX',
    company: 'Vertex',
    weight: 0.12,
    pnl: 0.18,
    thesis: 'GLP-1 renal protection + gene editing optionality',
    risk: 'Low',
  },
  {
    id: 'IONS',
    ticker: 'IONS',
    company: 'Ionis',
    weight: 0.09,
    pnl: 0.11,
    thesis: 'Neurology + cardio antisense franchise',
    risk: 'Medium',
  },
  {
    id: 'SRPT',
    ticker: 'SRPT',
    company: 'Sarepta',
    weight: 0.08,
    pnl: -0.04,
    thesis: 'Next-gen DMD durability data',
    catalystDate: '2026-02-15',
    risk: 'High',
  },
]

const exposures: ExposureSlice[] = [
  { id: 'rare', label: 'Rare Disease', weight: 0.32, performance: 0.11, color: '#4ade80' },
  { id: 'oncology', label: 'Oncology', weight: 0.28, performance: 0.06, color: '#22d3ee' },
  { id: 'metabolic', label: 'Metabolic', weight: 0.18, performance: 0.09, color: '#c084fc' },
  { id: 'neuro', label: 'Neuro', weight: 0.14, performance: 0.04, color: '#f97316' },
  { id: 'cash', label: 'Cash', weight: 0.08, performance: 0.01, color: '#a3a3a3' },
]

const pipeline: PipelineStage[] = [
  { name: 'Discovery', progress: 0.4 },
  { name: 'IND / CTA', progress: 0.6 },
  { name: 'Phase I/II', progress: 0.75 },
  { name: 'Phase III', progress: 0.5 },
  { name: 'Commercial', progress: 0.25 },
]

const documents: LauraDoc[] = [
  {
    id: 'doc-1',
    title: 'GLP-1 Renal Outcomes Dossier',
    category: 'Clinical',
    date: '2026-01-04',
    highlights: ['CREDENCE and FLOW comparables', 'Expected renal benefit timing'],
  },
  {
    id: 'doc-2',
    title: 'Base Editing Competitive Review',
    category: 'Research',
    date: '2025-12-18',
    highlights: ['Verve vs beam safety stack', 'LDL trajectory scenarios'],
  },
]

const analytics: AnalyticsData = {
  pageViews: 12840,
  uniqueUsers: 482,
  searchQueries: ['obesity renal', 'SRPT MOMENTUM', 'base editing safety'],
  popularContent: ['SRPT-5051 readout', 'GLP-1 CVOT impact', 'Base editing safety cheat sheet'],
  userEngagement: {
    avgSessionDuration: 12.4,
    bounceRate: 0.18,
    returnUsers: 0.63,
  },
}

export const previewNews: NewsItem[] = [
  {
    id: 'news-1',
    title: 'Scholar Rock hits primary endpoint in Phase 3 SAPPHIRE',
    summary: 'Apitegromab shows clinically meaningful motor gains in later-onset SMA.',
    date: new Date().toISOString(),
    source: 'Fierce Biotech',
    category: 'Trial Results',
    importance: 'Critical',
    companies: ['Scholar Rock'],
    tickers: ['SRRK'],
    marketCap: 1200,
    marketCapCategory: 'Small Cap',
    relevanceScore: 96,
    url: '#',
  },
  {
    id: 'news-2',
    title: 'Novo Nordisk expands GLP-1 franchise with renal outcomes study',
    summary: 'SELECT-style dataset shows slowed eGFR decline; payer discussions underway.',
    date: new Date().toISOString(),
    source: 'BioPharma Dive',
    category: 'Clinical',
    importance: 'High',
    companies: ['Novo Nordisk'],
    tickers: ['NVO'],
    marketCap: 450000,
    marketCapCategory: 'Mega Cap',
    relevanceScore: 82,
    url: '#',
  },
  {
    id: 'news-3',
    title: 'Beam shares updated base editing safety package',
    summary: 'Toxicology and off-target panel shared ahead of 2026 catalysts.',
    date: new Date().toISOString(),
    source: 'Endpoints',
    category: 'Research',
    importance: 'Medium',
    companies: ['Beam Therapeutics'],
    tickers: ['BEAM'],
    marketCap: 2600,
    marketCapCategory: 'Mid Cap',
    relevanceScore: 74,
    url: '#',
  },
]

export const previewCatalystEvents: CatalystEvent[] = [
  {
    event_id: 'ev-1',
    as_of: new Date().toISOString(),
    company: {
      name: 'Sarepta Therapeutics',
      ticker: 'SRPT',
      exchange: 'NASDAQ',
      marketCap: 8900,
      stage: 'Commercial',
      type: 'public',
      headquarters: 'Cambridge, MA',
      employees: 1800,
      focus: ['Neuromuscular'],
    },
    catalyst: {
      title: 'SRP-5051 Phase 3 MOMENTUM readout',
      date: '2026-02-15',
      type: 'clinical',
      subtype: 'Phase 3 Readout',
      description: 'Ambulatory endpoints in exon-skipping population',
    },
    expectations: {
      base_case: '55-60m improvement vs placebo',
      bull_case: '70m+ with durability',
      bear_case: 'No functional separation',
      probability: 0.62,
      class: 'beat',
      delta: { class: 'beat', score: 0.22 },
    },
    outcome: {
      status: 'scheduled',
      verdict: 'pending',
      market_impact: {
        immediate: { direction: 'up', magnitude: 0.12 },
        sustained: { direction: 'up', magnitude: 0.18 },
      },
    },
    sources: [
      {
        title: 'ClinicalTrials.gov update',
        url: 'https://clinicaltrials.gov',
        ts: new Date().toISOString(),
        type: 'primary',
      },
    ],
  },
  {
    event_id: 'ev-2',
    as_of: new Date().toISOString(),
    company: {
      name: 'Verve Therapeutics',
      ticker: 'VERV',
      exchange: 'NASDAQ',
      marketCap: 2800,
      stage: 'Clinical',
      type: 'public',
      headquarters: 'Boston, MA',
      employees: 400,
      focus: ['Cardio'],
    },
    catalyst: {
      title: 'VERVE-101 initial in vivo data',
      date: '2026-03-20',
      type: 'clinical',
      subtype: 'First-in-human',
      description: 'Base editing LDL-C reduction data',
    },
    expectations: {
      base_case: '50-55% LDL-C reduction at Day 28',
      bull_case: '60%+ with clean safety',
      bear_case: 'Transient LFT elevations, modest LDL drop',
      probability: 0.48,
      class: 'inline',
      delta: { class: 'inline', score: 0.08 },
    },
    outcome: {
      status: 'scheduled',
      verdict: 'pending',
      market_impact: {
        immediate: { direction: 'up', magnitude: 0.08 },
        sustained: { direction: 'up', magnitude: 0.12 },
      },
    },
    sources: [
      {
        title: 'Company presentation',
        url: 'https://ir.vervetx.com',
        ts: new Date().toISOString(),
        type: 'secondary',
      },
    ],
  },
]

export const previewDashboard: BioAuroraDashboardProps = {
  theme: 'aurora-red',
  headline,
  metrics,
  catalysts,
  positions,
  exposures,
  pipeline,
  documents,
  analytics,
  news: previewNews,
}

export const previewEvidence = {
  notebookTitle: 'Science-first evidence stack',
  highlights: ['Manual refresh only', 'Preloaded catalyst dossiers', 'Offline-friendly preview'],
}
