/**
 * Evidence Journal Scoring Logic
 * 
 * Pure functions for computing differentiation scores and filtering evidence.
 * Implements the weighting rule: Genetic > Translational > Clinical
 */

import type { 
  Evidence, 
  DifferentiationScore, 
  Asset,
  EvidenceTrial 
} from '../types/biotech';

/**
 * Compute differentiation score for an asset
 * 
 * Weighting: Genetic (40%) > Mechanistic (15%) > Translational (20%) > Clinical (15%) > Comp (5%) > Execution (5%)
 * 
 * @param assetId - Asset identifier
 * @param evidence - Array of evidence records for the asset
 * @param competitors - Number of direct competitors
 * @returns DifferentiationScore with total (0-100) and subscores
 */
export function computeDifferentiation(
  assetId: string,
  evidence: Evidence[],
  competitors: number = 0
): DifferentiationScore {
  // Filter evidence for this asset
  const assetEvidence = evidence.filter(e => e.assetId === assetId);
  
  // Calculate subscores
  const genetic = computeGeneticScore(assetEvidence);
  const mechanistic = computeMechanisticScore(assetEvidence);
  const translational = computeTranslationalScore(assetEvidence);
  const clinical = computeClinicalScore(assetEvidence);
  const comp = computeCompetitiveScore(competitors);
  const execution = computeExecutionScore(assetEvidence);
  
  // Weighted total: Genetic (40%) > Mechanistic (15%) > Translational (20%) > Clinical (15%) > Comp (5%) > Execution (5%)
  const total = Math.round(
    genetic * 0.40 +
    mechanistic * 0.15 +
    translational * 0.20 +
    clinical * 0.15 +
    comp * 0.05 +
    execution * 0.05
  );
  
  // Generate rationale bullets
  const rationale = generateRationale({
    genetic,
    mechanistic,
    translational,
    clinical,
    comp,
    execution,
    assetEvidence
  });
  
  return {
    assetId,
    total,
    subscores: {
      genetic,
      mechanistic,
      translational,
      clinical,
      comp,
      execution
    },
    rationale
  };
}

/**
 * Genetic evidence score (0-100)
 * Based on Open Targets genetic associations
 */
function computeGeneticScore(evidence: Evidence[]): number {
  const geneticEvidence = evidence.filter(e => e.class === 'genetic');
  
  if (geneticEvidence.length === 0) return 0;
  
  // Use highest genetic strength score (0-1 scale from Open Targets)
  const maxStrength = Math.max(...geneticEvidence.map(e => e.strength));
  
  return Math.round(maxStrength * 100);
}

/**
 * Mechanistic score (0-100)
 * Based on target selectivity, potency
 */
function computeMechanisticScore(evidence: Evidence[]): number {
  // Placeholder: in production, would parse IC50/Ki values from translational evidence
  // For now, use translational evidence strength as proxy
  const mechanisticEvidence = evidence.filter(e => 
    e.class === 'translational' && 
    e.summary.toLowerCase().includes('ic50')
  );
  
  if (mechanisticEvidence.length === 0) return 50; // neutral if no data
  
  const avgStrength = mechanisticEvidence.reduce((sum, e) => sum + e.strength, 0) / mechanisticEvidence.length;
  return Math.round(avgStrength * 100);
}

/**
 * Translational evidence score (0-100)
 * Biomarkers, animal models, ex vivo data
 */
function computeTranslationalScore(evidence: Evidence[]): number {
  const translationalEvidence = evidence.filter(e => e.class === 'translational');
  
  if (translationalEvidence.length === 0) return 40; // neutral-low if no data
  
  const avgStrength = translationalEvidence.reduce((sum, e) => sum + e.strength, 0) / translationalEvidence.length;
  return Math.round(avgStrength * 100);
}

/**
 * Clinical evidence score (0-100)
 * Based on Phase IIb/III results, endpoint relevance
 */
function computeClinicalScore(evidence: Evidence[]): number {
  const clinicalEvidence = evidence.filter(e => e.class === 'clinical');
  
  if (clinicalEvidence.length === 0) return 30; // low if no clinical data
  
  const avgStrength = clinicalEvidence.reduce((sum, e) => sum + e.strength, 0) / clinicalEvidence.length;
  return Math.round(avgStrength * 100);
}

/**
 * Competitive positioning score (0-100)
 * Lower is better (fewer competitors = higher score)
 */
function computeCompetitiveScore(competitors: number): number {
  if (competitors === 0) return 100; // first-in-class
  if (competitors === 1) return 75;  // one competitor
  if (competitors === 2) return 50;  // duopoly
  if (competitors <= 4) return 25;   // crowded
  return 10; // highly crowded (>4 competitors)
}

/**
 * Execution score (0-100)
 * Trial design quality, enrollment speed, regulatory precedent
 */
function computeExecutionScore(evidence: Evidence[]): number {
  // Placeholder: in production, would assess trial design quality
  // For now, presence of well-cited clinical evidence = good execution
  const clinicalEvidence = evidence.filter(e => e.class === 'clinical');
  
  if (clinicalEvidence.length === 0) return 50; // neutral
  
  // Count evidence with multiple citations (well-supported)
  const wellSupported = clinicalEvidence.filter(e => e.citations.length >= 2).length;
  const executionScore = Math.min(100, 50 + (wellSupported * 25));
  
  return executionScore;
}

/**
 * Generate human-readable rationale bullets
 */
function generateRationale(scores: {
  genetic: number;
  mechanistic: number;
  translational: number;
  clinical: number;
  comp: number;
  execution: number;
  assetEvidence: Evidence[];
}): string[] {
  const rationale: string[] = [];
  
  // Genetic
  if (scores.genetic >= 85) {
    rationale.push(`✓ Strong genetic validation (score ${scores.genetic}/100)`);
  } else if (scores.genetic >= 70) {
    rationale.push(`○ Moderate genetic support (score ${scores.genetic}/100)`);
  } else if (scores.genetic > 0) {
    rationale.push(`△ Weak genetic evidence (score ${scores.genetic}/100)`);
  }
  
  // Clinical
  const clinicalEvidence = scores.assetEvidence.filter(e => e.class === 'clinical');
  if (clinicalEvidence.length > 0) {
    rationale.push(`✓ ${clinicalEvidence.length} clinical evidence record(s), avg strength ${Math.round(clinicalEvidence.reduce((s, e) => s + e.strength, 0) / clinicalEvidence.length * 100)}/100`);
  } else {
    rationale.push(`△ No clinical evidence yet (preclinical stage)`);
  }
  
  // Competitive
  if (scores.comp >= 75) {
    rationale.push(`✓ First-in-class or limited competition`);
  } else if (scores.comp >= 50) {
    rationale.push(`○ Moderate competitive density`);
  } else {
    rationale.push(`△ Crowded competitive landscape`);
  }
  
  return rationale;
}

/**
 * Noise Filter: hide underpowered or low-quality trials
 * 
 * Filters out:
 * - Single-arm trials (n < 50) outside rare disease context
 * - Post-hoc analyses without pre-specified endpoints
 * - Non-blinded trials without placebo control
 * 
 * @param trial - Trial to evaluate
 * @param isRareDisease - Whether indication is rare disease (exempts from some filters)
 * @returns true if trial should be hidden
 */
export function shouldFilterNoise(trial: EvidenceTrial, isRareDisease: boolean = false): boolean {
  // Single-arm underpowered
  if (trial.arm_schema.toLowerCase().includes('single') && 
      (trial.enrollment || 0) < 50 && 
      !isRareDisease) {
    return true;
  }
  
  // Post-hoc only
  const hasPrespecifiedPrimary = trial.endpoints.some(
    e => e.type === 'primary' && e.pre_specified
  );
  if (!hasPrespecifiedPrimary) {
    return true;
  }
  
  // Non-blinded without rare disease context
  if (!trial.design.toLowerCase().includes('blind') && !isRareDisease) {
    return true;
  }
  
  return false;
}

/**
 * Get indication-specific endpoint weighting
 * 
 * Returns weight multipliers for different endpoint types by indication
 */
export function getEndpointWeights(indication: string): Record<string, number> {
  const lowerIndication = indication.toLowerCase();
  
  // Cardiology: OS > Functional > Symptoms
  if (lowerIndication.includes('hf') || lowerIndication.includes('cardio')) {
    return {
      'os': 1.0,
      'cv death': 1.0,
      'hospitalization': 0.9,
      'functional': 0.7,
      'symptoms': 0.5,
      'biomarker': 0.3
    };
  }
  
  // IBD: Endoscopic/histologic > MMS/CDAI > ORR
  if (lowerIndication.includes('ibd') || lowerIndication.includes('crohn') || lowerIndication.includes('colitis')) {
    return {
      'endoscopic': 1.0,
      'histologic': 1.0,
      'mms': 0.7,
      'cdai': 0.7,
      'clinical response': 0.6,
      'symptoms': 0.4
    };
  }
  
  // DMD: Functional capacity > Expression > Safety
  if (lowerIndication.includes('dmd') || lowerIndication.includes('duchenne')) {
    return {
      'nsaa': 1.0,
      'north star': 1.0,
      'timed function': 0.9,
      'dystrophin': 0.6,
      'safety': 0.5
    };
  }
  
  // Retina: DRSS shift > BCVA > Durability
  if (lowerIndication.includes('retina') || lowerIndication.includes('dme') || lowerIndication.includes('npdr')) {
    return {
      'drss': 1.0,
      'bcva': 0.8,
      'durability': 0.7,
      'anatomy': 0.5
    };
  }
  
  // Default weights
  return {
    'primary': 1.0,
    'secondary': 0.6,
    'exploratory': 0.3
  };
}
