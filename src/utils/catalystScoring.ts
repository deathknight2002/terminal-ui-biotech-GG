/**
 * Catalyst Scoring Logic
 * 
 * Implements the "Ionis-style" stealth catalyst scoring system.
 * Scoring recipe (0-16 total):
 * - Event leverage (0-4): hard endpoint likely? prespecified? clinically persuasive?
 * - Timing clarity (0-3): fixed PDUFA vs event-driven fog
 * - Surprise factor (0-3): Street models anchored on surrogate only? precedent weak?
 * - Downside contained (0-3): CRL-type or class read-through favors upside asymmetry?
 * - Market depth (0-3): payer appetite + population size + guideline friendliness
 * 
 * Rank >8/16 as "High-Torque", 6-8 "Tradable", <6 "Watch only"
 */

import type { Catalyst } from '../types/biotech';

export interface CatalystScore {
  total: number;           // 0-16
  eventLeverage: number;   // 0-4
  timingClarity: number;   // 0-3
  surpriseFactor: number;  // 0-3
  downsideContained: number; // 0-3
  marketDepth: number;     // 0-3
  tier: 'High-Torque' | 'Tradable' | 'Watch';
  rationale: string[];
}

/**
 * Compute catalyst score from scoring fields
 */
export function computeCatalystScore(catalyst: Catalyst): CatalystScore {
  const eventLeverage = catalyst.eventLeverage ?? 0;
  const timingClarity = catalyst.timingClarity ?? 0;
  const surpriseFactor = catalyst.surpriseFactor ?? 0;
  const downsideContained = catalyst.downsideContained ?? 0;
  const marketDepth = catalyst.marketDepth ?? 0;
  
  const total = eventLeverage + timingClarity + surpriseFactor + downsideContained + marketDepth;
  
  let tier: 'High-Torque' | 'Tradable' | 'Watch';
  if (total > 8) {
    tier = 'High-Torque';
  } else if (total >= 6) {
    tier = 'Tradable';
  } else {
    tier = 'Watch';
  }
  
  const rationale = generateCatalystRationale({
    eventLeverage,
    timingClarity,
    surpriseFactor,
    downsideContained,
    marketDepth,
    category: catalyst.category
  });
  
  return {
    total,
    eventLeverage,
    timingClarity,
    surpriseFactor,
    downsideContained,
    marketDepth,
    tier,
    rationale
  };
}

/**
 * Generate human-readable rationale for catalyst score
 */
function generateCatalystRationale(params: {
  eventLeverage: number;
  timingClarity: number;
  surpriseFactor: number;
  downsideContained: number;
  marketDepth: number;
  category?: string;
}): string[] {
  const rationale: string[] = [];
  
  // Event leverage
  if (params.eventLeverage >= 3) {
    rationale.push('✓ Hard endpoint with strong clinical persuasiveness');
  } else if (params.eventLeverage >= 2) {
    rationale.push('○ Moderate endpoint quality');
  } else if (params.eventLeverage > 0) {
    rationale.push('△ Soft endpoint or exploratory');
  }
  
  // Timing clarity
  if (params.timingClarity >= 2) {
    rationale.push('✓ Fixed PDUFA date or clear milestone');
  } else if (params.timingClarity === 1) {
    rationale.push('○ Event-driven timeline (some uncertainty)');
  } else {
    rationale.push('△ Unclear timing');
  }
  
  // Surprise factor
  if (params.surpriseFactor >= 2) {
    rationale.push('✓ Market underpricing secondary endpoints');
  } else if (params.surpriseFactor === 1) {
    rationale.push('○ Some potential for upside surprise');
  }
  
  // Downside contained
  if (params.downsideContained >= 2) {
    rationale.push('✓ Limited downside risk (CRL resolution or class tailwind)');
  } else if (params.downsideContained === 1) {
    rationale.push('○ Moderate downside protection');
  }
  
  // Market depth
  if (params.marketDepth >= 2) {
    rationale.push('✓ Strong payer appetite & large addressable market');
  } else if (params.marketDepth === 1) {
    rationale.push('○ Moderate market opportunity');
  }
  
  return rationale;
}

/**
 * Filter catalysts by tier
 */
export function filterCatalystsByTier(
  catalysts: Catalyst[],
  tier: 'High-Torque' | 'Tradable' | 'Watch'
): Catalyst[] {
  return catalysts.filter(catalyst => {
    const score = computeCatalystScore(catalyst);
    return score.tier === tier;
  });
}

/**
 * Sort catalysts by total score (descending)
 */
export function sortCatalystsByScore(catalysts: Catalyst[]): Catalyst[] {
  return [...catalysts].sort((a, b) => {
    const scoreA = computeCatalystScore(a).total;
    const scoreB = computeCatalystScore(b).total;
    return scoreB - scoreA;
  });
}

/**
 * Get high-torque catalysts (score > 8/16)
 */
export function getHighTorqueCatalysts(catalysts: Catalyst[]): Catalyst[] {
  return filterCatalystsByTier(catalysts, 'High-Torque');
}
