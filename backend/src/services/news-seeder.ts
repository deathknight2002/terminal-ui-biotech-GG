/**
 * News Seeder Service
 * Seeds the news archive with initial important events
 */

import { getNewsArchive, ExtendedNewsItem } from './news-archive.js';
import { logger } from '../utils/logger.js';

/**
 * Seed important recent news events
 */
export function seedNewsArchive(): void {
  const archive = getNewsArchive();
  
  logger.info('🌱 Seeding news archive with recent major events...');
  
  // Event 1: Tectonic Therapeutic TX45 Phase 1b Data
  const tecxEvent: ExtendedNewsItem = {
    id: 'tecx-tx45-phase1b-2025-10-29',
    title: 'Tectonic Therapeutic Announces Positive Phase 1b Part B Data for TX45 in Group 2 Pulmonary Hypertension with HFrEF',
    summary: 'Tectonic Therapeutic (NASDAQ: TECX) announced topline results from its Phase 1b Part B trial of TX45 showing significant hemodynamic improvements in 14 patients with Group 2 PH associated with HFrEF. Key results: PCWP reduced ~29.2%, TPR reduced ~29.2%, mPAP dropped ~19.3%, CO increased ~17.3%. Echocardiography at day 29 showed LVEF +19.4%, RVFAC +20.3%, TAPSE/SPAP +36.3%. Treatment was well-tolerated with no serious adverse events. Stock surged ~18% on the announcement.',
    publishedAt: '2025-10-29T16:01:00Z',
    source: 'Company PR',
    category: 'Trial Results',
    importance: 'High',
    therapeuticAreas: ['Cardiovascular'],
    companies: ['Tectonic Therapeutic Inc', 'Tectonic Therapeutic'],
    tickers: ['TECX'],
    keywords: [
      'phase 1b',
      'clinical trial',
      'pulmonary hypertension',
      'heart failure',
      'HFrEF',
      'hemodynamic',
      'positive results',
      'well-tolerated',
      'TX45',
    ],
    relevanceScore: 85,
    clinicalData: {
      phase: 'Phase 1b Part B',
      indication: 'Group 2 Pulmonary Hypertension with Heart Failure with Reduced Ejection Fraction (HFrEF)',
      endpoints: [
        {
          name: 'PCWP (Pulmonary Capillary Wedge Pressure)',
          percentChange: -29.2,
          unit: 'mmHg',
        },
        {
          name: 'TPR (Total Pulmonary Resistance)',
          percentChange: -29.2,
          unit: 'Wood units',
        },
        {
          name: 'mPAP (Mean Pulmonary Artery Pressure)',
          percentChange: -19.3,
          unit: 'mmHg',
        },
        {
          name: 'CO (Cardiac Output)',
          percentChange: 17.3,
          unit: 'L/min',
        },
        {
          name: 'LVEF (Left Ventricular Ejection Fraction)',
          percentChange: 19.4,
          unit: '%',
        },
        {
          name: 'RVFAC (Right Ventricular Fractional Area Change)',
          percentChange: 20.3,
          unit: '%',
        },
        {
          name: 'TAPSE/SPAP',
          percentChange: 36.3,
          unit: 'ratio',
        },
      ],
      safetyData: {
        adverseEvents: [],
        seriousAdverseEvents: [],
        discontinuations: 0,
      },
      patientCount: 14,
    },
    marketImpact: {
      priceChange: 18.0,
      analystReactions: [
        'Positive hemodynamic data supports expansion into PH-HFrEF',
        'High unmet need in Group 2 PH market',
        'Awaiting Phase 2 APEX trial results in 2026',
      ],
    },
  };
  archive.archiveEvent(tecxEvent);
  
  // Event 2: Thermo Fisher Acquires Clario Holdings
  const tmoEvent: ExtendedNewsItem = {
    id: 'tmo-clario-acquisition-2025-10-29',
    title: 'Thermo Fisher Scientific to Acquire Clario Holdings for Up to $9.4 Billion',
    summary: 'Thermo Fisher Scientific (NASDAQ: TMO) announced a definitive agreement to acquire Clario Holdings for $8.88 billion upfront in cash, plus $125 million payable in January 2027 and up to $400 million in earn-out payments based on 2026-27 performance. Total deal value up to ~$9.4 billion. Clario provides clinical trial data management and endpoint solutions (eCOA, imaging, respiratory, wearables). Expected to generate ~$1.25B revenue in 2025. Thermo expects $175M operating income from synergies by year 5. Deal immediately accretive to adjusted EPS ($0.45/share year 1). Closing targeted mid-2026.',
    publishedAt: '2025-10-29T08:00:00Z',
    source: 'Company PR',
    category: 'M&A',
    importance: 'Critical',
    therapeuticAreas: ['Other'],
    companies: ['Thermo Fisher Scientific Inc', 'Thermo Fisher', 'Clario Holdings Inc', 'Clario'],
    tickers: ['TMO'],
    keywords: [
      'acquisition',
      'merger',
      'M&A',
      'clinical trial',
      'data management',
      'endpoint solutions',
      'synergies',
      'accretive',
      'strategic',
    ],
    relevanceScore: 95,
    dealData: {
      type: 'acquisition',
      acquirer: 'Thermo Fisher Scientific Inc',
      target: 'Clario Holdings Inc',
      upfrontValue: 8880, // million USD
      totalValue: 9400, // million USD
      earnoutValue: 400, // million USD
      synergies: 175, // million USD operating income by year 5
      closingDate: '2026-06',
      strategic_rationale: 'Strengthen digital/clinical-trial services layer - owning more of the "data and endpoint generation" side of drug development. Shift from instruments/consumables to trial-execution and data layers. As drug development becomes more complex (decentralized trials, real-world data, wearables), companies controlling data flows and endpoints gain strategic value.',
    },
    marketImpact: {
      analystReactions: [
        'Strategic move into clinical trial data/endpoints space',
        'Positions TMO deeper in trial-execution value chain',
        'Competing with IQVIA, Oracle/Medidata',
        'Immediately accretive deal structure',
        'Integration risk and synergy execution key watchpoints',
      ],
    },
  };
  archive.archiveEvent(tmoEvent);
  
  logger.info('✅ Seeded 2 major news events');
  
  // Seed some additional historical context events
  seedHistoricalContext();
}

/**
 * Seed historical context events for trend analysis
 */
function seedHistoricalContext(): void {
  const archive = getNewsArchive();
  
  // Add some historical Phase III readouts
  const hist1: ExtendedNewsItem = {
    id: 'historical-ph3-success-1',
    title: 'Historical Phase III Success in Cardiovascular',
    summary: 'Previous successful Phase III trial in cardiovascular indication',
    publishedAt: '2025-09-15T12:00:00Z',
    source: 'Other' as any,
    category: 'Trial Results',
    importance: 'High',
    therapeuticAreas: ['Cardiovascular'],
    companies: ['Historical Company A'],
    tickers: ['HISTA'],
    keywords: ['phase iii', 'success', 'cardiovascular'],
    relevanceScore: 70,
  };
  archive.archiveEvent(hist1);
  
  // Add historical M&A for context
  const hist2: ExtendedNewsItem = {
    id: 'historical-ma-1',
    title: 'Historical M&A in Life Sciences Tools',
    summary: 'Major acquisition in life sciences services sector',
    publishedAt: '2025-08-20T09:00:00Z',
    source: 'Other' as any,
    category: 'M&A',
    importance: 'High',
    therapeuticAreas: ['Other'],
    companies: ['Historical Acquirer B', 'Historical Target B'],
    tickers: ['HISTB'],
    keywords: ['acquisition', 'life sciences', 'services'],
    relevanceScore: 75,
    dealData: {
      type: 'acquisition',
      upfrontValue: 5000,
      totalValue: 5500,
    },
  };
  archive.archiveEvent(hist2);
  
  // Add more cardiovascular trials
  const hist3: ExtendedNewsItem = {
    id: 'historical-cardio-trial-2',
    title: 'Phase II Results in Heart Failure',
    summary: 'Positive Phase II data in heart failure population',
    publishedAt: '2025-10-01T14:00:00Z',
    source: 'Other' as any,
    category: 'Trial Results',
    importance: 'Medium',
    therapeuticAreas: ['Cardiovascular'],
    companies: ['Historical Company C'],
    tickers: ['HISTC'],
    keywords: ['phase ii', 'heart failure', 'positive'],
    relevanceScore: 65,
  };
  archive.archiveEvent(hist3);
  
  // Add FDA approval
  const hist4: ExtendedNewsItem = {
    id: 'historical-fda-approval-1',
    title: 'FDA Approves Novel Cardiovascular Therapy',
    summary: 'FDA grants approval for new cardiovascular treatment',
    publishedAt: '2025-09-28T10:00:00Z',
    source: 'FDA News',
    category: 'FDA Approval',
    importance: 'Critical',
    therapeuticAreas: ['Cardiovascular'],
    companies: ['Historical Pharma D'],
    tickers: ['HISTD'],
    keywords: ['fda approval', 'cardiovascular', 'approval'],
    relevanceScore: 90,
  };
  archive.archiveEvent(hist4);
  
  logger.info('✅ Seeded historical context events');
}

/**
 * Get seed data stats
 */
export function getSeedStats(): any {
  const archive = getNewsArchive();
  return archive.getStats();
}
