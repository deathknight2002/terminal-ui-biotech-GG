import type { PipelineProgram } from '../components/visualizations/PipelineVisualization';
import type {
  PMHeaderMetrics,
  RnpvLadderItem,
  CatalystTimelineEvent,
  Phase
} from '../../../src/types/biotech';

/**
 * Convert Ionis profile and pipeline data to PM Mode metrics
 */
export function convertToPMMetrics(
  profile: any,
  pipeline: PipelineProgram[]
): PMHeaderMetrics {
  // Calculate rNPV for each program (simplified: PoS * PeakSales * 0.3 margin)
  const programsWithRnpv = pipeline.map(p => ({
    ...p,
    rnpv: (p.probability || 0) * (p.peakSales || 0) * 1_000_000 * 0.3,
  }));

  // Sort by rNPV to get top drivers
  const sortedByRnpv = [...programsWithRnpv].sort((a, b) => b.rnpv - a.rnpv);
  const topRnpvDrivers = sortedByRnpv.slice(0, 3).map(p => ({
    name: p.name,
    value: p.rnpv,
  }));

  // Extract next catalysts (programs with upcoming milestones)
  const programsWithMilestones = pipeline
    .filter(p => p.nextMilestone)
    .map(p => {
      // Parse milestone date from string like "Phase 3 data readout Q2 2025"
      const milestoneText = p.nextMilestone || '';
      const yearMatch = milestoneText.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear() + 1;

      // Estimate month based on quarter
      let month = 6; // Default to mid-year
      if (milestoneText.includes('Q1')) month = 2;
      else if (milestoneText.includes('Q2')) month = 5;
      else if (milestoneText.includes('Q3')) month = 8;
      else if (milestoneText.includes('Q4')) month = 11;

      const estimatedDate = new Date(year, month, 15);

      return {
        program: p.name,
        date: estimatedDate.toISOString(),
        event: milestoneText.split(' ').slice(0, 3).join(' '), // First 3 words
        sortDate: estimatedDate.getTime(),
      };
    })
    .sort((a, b) => a.sortDate - b.sortDate);

  const nextCatalysts = programsWithMilestones.slice(0, 3);

  // Calculate owned vs partnered (assume 85% owned for Ionis)
  const programsOwnedPercent = 85;

  // Estimate cash runway (cash / quarterly burn)
  const quarterlyBurn = 50_000_000; // ~$50M/quarter estimate
  const cashRunwayMonths = Math.floor(
    ((profile.financials.cash_position || 0) / quarterlyBurn) * 3
  );

  return {
    ticker: profile.ticker,
    price: profile.financials.latest_price || 0,
    priceChange: profile.financials.price_change || 0,
    enterpriseValue: profile.financials.enterprise_value || profile.financials.market_cap || 0,
    marketCap: profile.financials.market_cap || 0,
    netCash: profile.financials.cash_position || 0,
    cashRunwayMonths,
    programCount: pipeline.length,
    programsOwnedPercent,
    avgDailyVolume3M: profile.financials.volume || 1_250_000,
    shortInterest: 8.5, // Example short interest
    topRnpvDrivers,
    nextCatalysts,
  };
}

/**
 * Convert pipeline programs to rNPV ladder items
 */
export function convertToRnpvLadder(pipeline: PipelineProgram[]): RnpvLadderItem[] {
  return pipeline.map(p => ({
    id: p.id,
    name: p.name,
    rnpv: (p.probability || 0) * (p.peakSales || 0) * 1_000_000 * 0.3, // Simplified rNPV
    phase: p.phase as Phase,
    isPartnered: false, // Would need partner data
    therapeuticArea: p.therapeuticArea,
  }));
}

/**
 * Convert pipeline programs to catalyst timeline events
 */
export function convertToCatalystTimeline(
  pipeline: PipelineProgram[]
): CatalystTimelineEvent[] {
  return pipeline
    .filter(p => p.nextMilestone)
    .map(p => {
      const milestoneText = p.nextMilestone || '';
      const yearMatch = milestoneText.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear() + 1;

      let month = 6;
      if (milestoneText.includes('Q1')) month = 2;
      else if (milestoneText.includes('Q2')) month = 5;
      else if (milestoneText.includes('Q3')) month = 8;
      else if (milestoneText.includes('Q4')) month = 11;

      const estimatedDate = new Date(year, month, 15);

      // Determine event type from milestone text
      let eventType: 'Data' | 'Filing' | 'AdCom' | 'PDUFA' | 'Other' = 'Other';
      if (milestoneText.toLowerCase().includes('data')) eventType = 'Data';
      else if (milestoneText.toLowerCase().includes('filing')) eventType = 'Filing';
      else if (milestoneText.toLowerCase().includes('adcom')) eventType = 'AdCom';
      else if (milestoneText.toLowerCase().includes('pdufa')) eventType = 'PDUFA';

      return {
        id: p.id,
        date: estimatedDate.toISOString(),
        program: p.name,
        eventType,
        importance: p.probability || 0.5,
        description: milestoneText,
        phase: p.phase as Phase,
        therapeuticArea: p.therapeuticArea,
        evDelta: (p.probability || 0) * (p.peakSales || 0) * 1_000_000 * 0.15, // Simplified EV impact
      };
    });
}
