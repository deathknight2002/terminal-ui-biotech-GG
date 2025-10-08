import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TerminalFrame, Panel } from '../../../frontend-components/src/terminal';
import OpenBBPlot from '../../../src/integrations/openbb/OpenBBPlot';

// Fetch OpenBB chart data from backend
const fetchOpenBBChart = async (symbol: string) => {
  const response = await fetch(`http://localhost:3001/api/market/openbb/chart?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error('Failed to fetch chart data');
  }
  return response.json();
};

export function MarketIntelligencePage() {
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['openbb-chart', 'BCRX'],
    queryFn: () => fetchOpenBBChart('BCRX'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <TerminalFrame
      headline={{
        title: 'MARKET INTELLIGENCE CENTER',
        subtitle: 'Competitor analysis and market insights',
        eyebrow: 'INTELLIGENCE'
      }}
    >
      <Panel title="MARKET ANALYSIS">
        {isLoading && <p>Loading chart data...</p>}
        {error && <p>Error loading chart: {error.message}</p>}
        {chartData && <OpenBBPlot payload={chartData} />}
      </Panel>
    </TerminalFrame>
  );
}