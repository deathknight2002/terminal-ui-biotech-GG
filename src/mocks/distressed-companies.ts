/**
 * Mock data for Distressed Biotech Catalyst Tracker
 * Pre-seeded examples for Natalie's Special Situations Dashboard
 */

import type { DistressedCompany, RegulatoryDistressedCatalyst } from '../types/biotech';

/**
 * Master Distressed Watchlist - Pre-seeded examples from the spec
 */
export const DISTRESSED_COMPANIES: DistressedCompany[] = [
  {
    id: 'STOK-001',
    ticker: 'STOK',
    company: 'Stoke Therapeutics',
    
    regulatorySituation: 'Dravet syndrome program; previous clinical hold',
    currentStatus: 'Working with FDA',
    crlType: 'Safety',
    solvability: 'Case-by-Case',
    crlDate: '2024-08-15',
    
    marketCap: 500,
    marketOverreactionThesis: 'Market pricing near zero for platform; safety issues resolvable',
    platformValue: 1500,
    
    resolutionCatalyst: 'FDA feedback on amended protocol',
    catalystDate: '2026-03-15',
    timelineQuarter: 'Q1 2026',
    probability: 65,
    confidenceLevel: 'Medium',
    
    asymmetricOpportunity: {
      upsidePercent: 200,
      downsidePercent: 30,
      asymmetryScore: 6.7,
    },
    
    regulatoryOverhangScore: 7.5,
    
    resolutionPath: {
      meetingType: 'Type A',
      fdaDivision: 'CDER',
      keyStakeholders: ['Division of Neurology Products', 'Office of Rare Diseases'],
      precedents: ['SAGE-324 epilepsy program resolution', 'ESAI pediatric epilepsy CRL resolution'],
      managementFDAExperience: 'Moderate',
    },
    
    cashRunway: {
      cashOnHand: 180,
      burnRate: 15,
      runwayMonths: 12,
      regulatoryTimelineMonths: 6,
      fundingGap: false,
      managementFundingStrategy: 'Sufficient cash through catalyst; may raise post-resolution',
    },
    
    languageAnalysis: {
      evidenceStrength: 'Adequate',
      clinicalMeaningfulness: 'Clearly Meaningful',
      unmetNeedStrength: 'Strong',
    },
    
    managementResponse: {
      responseSpeed: 'Fast',
      pathForwardClarity: 'Clear',
      previousResolutionRecord: 0,
    },
    
    lastUpdated: new Date().toISOString(),
    notes: 'Platform value significant for RNA-targeting beyond Dravet. Management working constructively with FDA.',
  },
  
  {
    id: 'CAPR-001',
    ticker: 'CAPR',
    company: 'Capricor Therapeutics',
    
    regulatorySituation: 'CRL July 2025 for DMD cardiomyopathy therapy',
    currentStatus: 'CRL Received',
    crlType: 'Manufacturing',
    solvability: 'High',
    crlDate: '2025-07-15',
    
    marketCap: 180,
    marketOverreactionThesis: 'Surprised by CRL; pre-license inspection was successful. Manufacturing issues solvable; clinical benefit clear',
    platformValue: 600,
    
    resolutionCatalyst: 'Type A meeting outcome',
    timelineQuarter: 'Q4 2025',
    probability: 70,
    confidenceLevel: 'High',
    
    asymmetricOpportunity: {
      upsidePercent: 180,
      downsidePercent: 40,
      asymmetryScore: 4.5,
    },
    
    regulatoryOverhangScore: 6.2,
    
    resolutionPath: {
      meetingType: 'Type A',
      meetingDate: '2025-12-01',
      fdaDivision: 'CBER',
      keyStakeholders: ['CBER Cell Therapy Division', 'CMC Review Team'],
      precedents: ['BLA manufacturing CRLs typically 6-9 month resolution', 'Cell therapy CMC resolutions average 8 months'],
      managementFDAExperience: 'Moderate',
    },
    
    cashRunway: {
      cashOnHand: 75,
      burnRate: 8,
      runwayMonths: 9,
      regulatoryTimelineMonths: 5,
      fundingGap: false,
      nextFinancingWindow: '2026-Q1',
      managementFundingStrategy: 'May do small financing pre-resolution; confident in CMC resolution',
    },
    
    languageAnalysis: {
      evidenceStrength: 'Substantial',
      clinicalMeaningfulness: 'Clearly Meaningful',
      unmetNeedStrength: 'Strong',
    },
    
    managementResponse: {
      responseSpeed: 'Fast',
      pathForwardClarity: 'Clear',
      previousResolutionRecord: 1,
    },
    
    lastUpdated: new Date().toISOString(),
    notes: 'Pre-BLA inspection passed successfully. CRL surprised market. CMC issues are typical and addressable.',
  },
  
  {
    id: 'QURE-001',
    ticker: 'QURE',
    company: 'uniQure',
    
    regulatorySituation: 'Hemophilia B gene therapy manufacturing questions',
    currentStatus: 'Working with FDA',
    crlType: 'Manufacturing',
    solvability: 'High',
    crlDate: '2024-11-20',
    
    marketCap: 420,
    marketOverreactionThesis: 'Market penalizing for CMC issues typical in gene therapy. EU already approved, validating clinical benefit',
    platformValue: 1200,
    
    resolutionCatalyst: 'FDA alignment on release criteria',
    timelineQuarter: 'H1 2026',
    probability: 60,
    confidenceLevel: 'Medium',
    
    asymmetricOpportunity: {
      upsidePercent: 250,
      downsidePercent: 35,
      asymmetryScore: 7.1,
    },
    
    regulatoryOverhangScore: 7.0,
    
    resolutionPath: {
      meetingType: 'Type B',
      fdaDivision: 'CBER',
      keyStakeholders: ['CBER Gene Therapy Division', 'CMC Subject Matter Experts'],
      precedents: ['ROCTAVIAN hemophilia A approval after manufacturing discussions', 'LUXTURNA gene therapy CMC resolution'],
      managementFDAExperience: 'Strong',
    },
    
    cashRunway: {
      cashOnHand: 280,
      burnRate: 20,
      runwayMonths: 14,
      regulatoryTimelineMonths: 8,
      fundingGap: false,
      managementFundingStrategy: 'Strong balance sheet; no near-term financing needed',
    },
    
    languageAnalysis: {
      evidenceStrength: 'Substantial',
      clinicalMeaningfulness: 'Clearly Meaningful',
      unmetNeedStrength: 'Strong',
    },
    
    managementResponse: {
      responseSpeed: 'Moderate',
      pathForwardClarity: 'Moderate',
      previousResolutionRecord: 2,
    },
    
    lastUpdated: new Date().toISOString(),
    notes: 'Gene therapy CMC issues are complex but addressable. EU approval provides clinical validation. Platform has multiple programs.',
  },
  
  {
    id: 'LEXIO-001',
    ticker: 'LEXIO',
    company: 'Lexicon Pharmaceuticals',
    
    regulatorySituation: 'Sotagliflozin CRL for type 1 diabetes',
    currentStatus: 'Working with FDA',
    crlType: 'Safety',
    solvability: 'Case-by-Case',
    crlDate: '2024-06-10',
    
    marketCap: 320,
    marketOverreactionThesis: 'FDA concerned about ketoacidosis risk. Risk mitigation strategies available; EU approved with REMS-like measures',
    platformValue: 800,
    
    resolutionCatalyst: 'FDA meeting on risk management',
    timelineQuarter: 'Q2 2026',
    probability: 55,
    confidenceLevel: 'Medium',
    
    asymmetricOpportunity: {
      upsidePercent: 160,
      downsidePercent: 40,
      asymmetryScore: 4.0,
    },
    
    regulatoryOverhangScore: 6.8,
    
    resolutionPath: {
      meetingType: 'Type A',
      fdaDivision: 'CDER',
      keyStakeholders: ['Division of Metabolism & Endocrinology Products', 'Risk Management Review Team'],
      precedents: ['SGLT2 inhibitor class REMS strategies', 'Type 1 diabetes products with ketoacidosis risk'],
      managementFDAExperience: 'Moderate',
    },
    
    cashRunway: {
      cashOnHand: 95,
      burnRate: 12,
      runwayMonths: 8,
      regulatoryTimelineMonths: 9,
      fundingGap: true,
      nextFinancingWindow: '2025-Q4',
      managementFundingStrategy: 'Will need financing before resolution; exploring partnerships',
    },
    
    languageAnalysis: {
      evidenceStrength: 'Adequate',
      clinicalMeaningfulness: 'Clearly Meaningful',
      unmetNeedStrength: 'Moderate',
    },
    
    managementResponse: {
      responseSpeed: 'Moderate',
      pathForwardClarity: 'Moderate',
      previousResolutionRecord: 1,
    },
    
    lastUpdated: new Date().toISOString(),
    notes: 'EU approval demonstrates clinical benefit. Risk management approach key to FDA resolution. Funding gap is a concern.',
  },
  
  {
    id: 'RP-001',
    ticker: 'RP',
    company: 'Replimune',
    
    regulatorySituation: 'CRL July 2025 for melanoma combo - Breakthrough Designation',
    currentStatus: 'CRL Received',
    crlType: 'Trial Design',
    solvability: 'Medium',
    crlDate: '2025-07-20',
    
    marketCap: 850,
    marketOverreactionThesis: 'FDA wants more data, not saying no to efficacy. Breakthrough Designation still active',
    platformValue: 1800,
    
    resolutionCatalyst: 'Protocol amendment acceptance',
    timelineQuarter: 'Q1 2026',
    probability: 60,
    confidenceLevel: 'Medium',
    
    asymmetricOpportunity: {
      upsidePercent: 150,
      downsidePercent: 35,
      asymmetryScore: 4.3,
    },
    
    regulatoryOverhangScore: 5.5,
    
    resolutionPath: {
      meetingType: 'Type B',
      fdaDivision: 'CDER',
      keyStakeholders: ['Division of Oncology Products 1', 'Breakthrough Therapy Program'],
      precedents: ['Oncolytic virus CRLs typically protocol amendments', 'Breakthrough-designated products ~85% approval rate'],
      managementFDAExperience: 'Strong',
    },
    
    cashRunway: {
      cashOnHand: 320,
      burnRate: 25,
      runwayMonths: 13,
      regulatoryTimelineMonths: 6,
      fundingGap: false,
      managementFundingStrategy: 'Strong cash position; may raise opportunistically',
    },
    
    languageAnalysis: {
      evidenceStrength: 'Adequate',
      clinicalMeaningfulness: 'Clearly Meaningful',
      unmetNeedStrength: 'Moderate',
    },
    
    managementResponse: {
      responseSpeed: 'Fast',
      pathForwardClarity: 'Clear',
      previousResolutionRecord: 2,
    },
    
    lastUpdated: new Date().toISOString(),
    notes: 'Breakthrough Designation intact suggests FDA believes in mechanism. Trial design CRLs are solvable with additional data.',
  },
];

/**
 * Regulatory catalysts for the distressed companies
 */
export const DISTRESSED_CATALYSTS: RegulatoryDistressedCatalyst[] = [
  {
    id: 'CAT-STOK-001',
    ticker: 'STOK',
    company: 'Stoke Therapeutics',
    catalystType: 'FDA Feedback - Amended Protocol',
    tier: 'Tier 1',
    dateRange: 'Q1 2026',
    expectedImpact: 'High',
    expectedMove: '±50%+',
    probability: 65,
    confidenceLevel: 'Medium',
    description: 'FDA response to amended protocol for Dravet syndrome program following clinical hold',
    reguatorySituation: 'Previous clinical hold on safety concerns',
    keyFactors: [
      'Safety mitigation strategies in amended protocol',
      'Platform value near zero in current pricing',
      'Strong unmet need in Dravet syndrome',
      'FDA working constructively with company',
    ],
    status: 'Scheduled',
    lastUpdated: new Date().toISOString(),
  },
  
  {
    id: 'CAT-CAPR-001',
    ticker: 'CAPR',
    company: 'Capricor Therapeutics',
    catalystType: 'Type A Meeting Outcome',
    tier: 'Tier 2',
    dateRange: 'Q4 2025',
    expectedImpact: 'High',
    expectedMove: '±30-40%',
    probability: 70,
    confidenceLevel: 'High',
    description: 'Type A meeting with FDA to address manufacturing CRL for DMD therapy',
    reguatorySituation: 'Manufacturing CRL despite successful pre-BLA inspection',
    keyFactors: [
      'CMC issues typically have high solvability',
      'Pre-license inspection was successful',
      'Clinical benefit clearly demonstrated',
      'Strong precedent for manufacturing CRL resolutions',
    ],
    status: 'Scheduled',
    lastUpdated: new Date().toISOString(),
  },
  
  {
    id: 'CAT-QURE-001',
    ticker: 'QURE',
    company: 'uniQure',
    catalystType: 'FDA Alignment - Release Criteria',
    tier: 'Tier 1',
    dateRange: 'H1 2026',
    expectedImpact: 'High',
    expectedMove: '±50%+',
    probability: 60,
    confidenceLevel: 'Medium',
    description: 'FDA alignment on release criteria for Hemophilia B gene therapy manufacturing',
    reguatorySituation: 'Manufacturing questions typical in gene therapy',
    keyFactors: [
      'EU approval validates clinical benefit',
      'Gene therapy CMC issues are addressable',
      'Strong management FDA experience',
      'Platform has multiple programs',
    ],
    status: 'Scheduled',
    lastUpdated: new Date().toISOString(),
  },
  
  {
    id: 'CAT-LEXIO-001',
    ticker: 'LEXIO',
    company: 'Lexicon Pharmaceuticals',
    catalystType: 'FDA Meeting - Risk Management',
    tier: 'Tier 2',
    dateRange: 'Q2 2026',
    expectedImpact: 'Medium',
    expectedMove: '±25-35%',
    probability: 55,
    confidenceLevel: 'Medium',
    description: 'FDA meeting on risk management plan for ketoacidosis concerns',
    reguatorySituation: 'Safety CRL focused on ketoacidosis risk mitigation',
    keyFactors: [
      'EU approval with risk mitigation measures',
      'REMS strategies available',
      'Clinical benefit demonstrated',
      'Funding gap creates execution risk',
    ],
    status: 'Scheduled',
    lastUpdated: new Date().toISOString(),
  },
  
  {
    id: 'CAT-RP-001',
    ticker: 'RP',
    company: 'Replimune',
    catalystType: 'Protocol Amendment Acceptance',
    tier: 'Tier 2',
    dateRange: 'Q1 2026',
    expectedImpact: 'High',
    expectedMove: '±30-45%',
    probability: 60,
    confidenceLevel: 'Medium',
    description: 'FDA acceptance of protocol amendment for melanoma combo trial',
    reguatorySituation: 'Trial design CRL - FDA wants more data',
    keyFactors: [
      'Breakthrough Designation still active',
      'FDA not questioning efficacy',
      'Trial design CRLs are solvable',
      'Strong management team with FDA experience',
    ],
    status: 'Scheduled',
    lastUpdated: new Date().toISOString(),
  },
  
  // Additional Tier 3 catalysts for incremental updates
  {
    id: 'CAT-STOK-002',
    ticker: 'STOK',
    company: 'Stoke Therapeutics',
    catalystType: 'Manufacturing Update',
    tier: 'Tier 3',
    dateRange: 'Q4 2025',
    expectedImpact: 'Low',
    expectedMove: '±10-15%',
    probability: 75,
    confidenceLevel: 'High',
    description: 'Update on preclinical data package for amended protocol',
    reguatorySituation: 'Supporting data for clinical hold removal',
    keyFactors: [
      'Demonstrates progress on FDA feedback',
      'De-risks safety concerns',
      'Builds confidence in resolution timeline',
    ],
    status: 'Scheduled',
    lastUpdated: new Date().toISOString(),
  },
];

/**
 * Historical regulatory precedents
 */
export const REGULATORY_PRECEDENTS = [
  {
    id: 'PREC-001',
    company: 'Acceleron Pharma',
    ticker: 'XLRN',
    crlType: 'Manufacturing' as const,
    resolutionTimeline: 8,
    fdaDivision: 'CDER' as const,
    outcome: 'Approved' as const,
    marketReaction: {
      crlDrop: -45,
      recoveryPercent: 180,
      daysToRecover: 240,
    },
  },
  {
    id: 'PREC-002',
    company: 'Sage Therapeutics',
    ticker: 'SAGE',
    crlType: 'Safety' as const,
    resolutionTimeline: 12,
    fdaDivision: 'CDER' as const,
    outcome: 'Second CRL' as const,
    marketReaction: {
      crlDrop: -55,
      recoveryPercent: 25,
      daysToRecover: 180,
    },
  },
  {
    id: 'PREC-003',
    company: 'bluebird bio',
    ticker: 'BLUE',
    crlType: 'Manufacturing' as const,
    resolutionTimeline: 10,
    fdaDivision: 'CBER' as const,
    outcome: 'Approved' as const,
    marketReaction: {
      crlDrop: -38,
      recoveryPercent: 220,
      daysToRecover: 300,
    },
  },
  {
    id: 'PREC-004',
    company: 'Intercept Pharmaceuticals',
    ticker: 'ICPT',
    crlType: 'Efficacy' as const,
    resolutionTimeline: 24,
    fdaDivision: 'CDER' as const,
    outcome: 'Withdrawn' as const,
    marketReaction: {
      crlDrop: -65,
      recoveryPercent: -10,
      daysToRecover: 0,
    },
  },
];

/**
 * Helper function to calculate regulatory overhang score
 * Score = (CRL Severity * 0.3) + (Time Since CRL * 0.2) + (Cash Pressure * 0.3) + (Mgmt Experience * 0.2)
 */
export function calculateRegulatoryOverhangScore(company: DistressedCompany): number {
  // CRL Severity (0-10)
  const crlSeverityMap = {
    'Manufacturing': 3,
    'Trial Design': 5,
    'Safety': 7,
    'Efficacy': 9,
  };
  const crlSeverity = company.crlType ? crlSeverityMap[company.crlType] : 5;
  
  // Time Since CRL (0-10, normalized to months)
  const monthsSinceCRL = company.crlDate 
    ? Math.min(10, (new Date().getTime() - new Date(company.crlDate).getTime()) / (30 * 24 * 60 * 60 * 1000))
    : 0;
  
  // Cash Pressure (0-10)
  const cashPressure = company.cashRunway?.fundingGap ? 8 : 3;
  
  // Management Experience (0-10, inverted so lower is worse)
  const mgmtExpMap = {
    'Strong': 2,
    'Moderate': 5,
    'Limited': 8,
  };
  const mgmtExp = company.resolutionPath?.managementFDAExperience 
    ? mgmtExpMap[company.resolutionPath.managementFDAExperience] 
    : 5;
  
  const score = (crlSeverity * 0.3) + (monthsSinceCRL * 0.2) + (cashPressure * 0.3) + (mgmtExp * 0.2);
  return Math.round(score * 10) / 10;
}
