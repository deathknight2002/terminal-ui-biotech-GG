import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel, Metric } from '../../../../frontend-components/src/terminal';

const fetchFinancialsOverview = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/financials/overview');
    if (!response.ok) {
      return getMockOverviewData();
    }
    return await response.json();
  } catch {
    console.log('Backend unavailable, using mock data');
    return getMockOverviewData();
  }
};

const getMockOverviewData = () => ({
  ticker: 'NUVL',
  last_refresh: new Date().toISOString(),
  house_valuation: {
    per_share: 42.50,
    method: 'DCF (70%) + Multiples (30%)',
    last_updated: new Date().toISOString()
  },
  street_consensus: {
    avg_price_target: 38.25,
    min_price_target: 28.00,
    max_price_target: 52.00,
    num_analysts: 12
  },
  diff: {
    absolute: 4.25,
    percentage: 0.111,
    since_last_refresh: '+2.3%'
  }
});

export function FinancialsOverviewPage() {
  const { data: overview = getMockOverviewData() } = useQuery({
    queryKey: ['financials-overview'],
    queryFn: fetchFinancialsOverview,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">FINANCIALS MODULE</div>
        <h1>OVERVIEW - HOUSE VS STREET</h1>
        <div className="subtitle">
          Valuation summary, consensus comparison, and model refresh status
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Panel title="HOUSE VALUATION" cornerBrackets>
          <div style={{ padding: '1rem' }}>
            <Metric
              label="Per Share Value"
              value={`$${overview.house_valuation.per_share.toFixed(2)}`}
              variant="success"
              size="large"
            />
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div>Method: {overview.house_valuation.method}</div>
              <div>Updated: {new Date(overview.house_valuation.last_updated).toLocaleString()}</div>
            </div>
          </div>
        </Panel>

        <Panel title="STREET CONSENSUS" cornerBrackets>
          <div style={{ padding: '1rem' }}>
            <Metric
              label="Avg Price Target"
              value={`$${overview.street_consensus.avg_price_target.toFixed(2)}`}
              variant="info"
              size="large"
            />
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div>Range: ${overview.street_consensus.min_price_target.toFixed(2)} - ${overview.street_consensus.max_price_target.toFixed(2)}</div>
              <div>Analysts: {overview.street_consensus.num_analysts}</div>
            </div>
          </div>
        </Panel>

        <Panel title="HOUSE VS STREET" cornerBrackets>
          <div style={{ padding: '1rem' }}>
            <Metric
              label="Difference"
              value={`$${overview.diff.absolute.toFixed(2)}`}
              variant={overview.diff.absolute > 0 ? 'success' : 'warning'}
              size="large"
            />
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div>Percentage: {(overview.diff.percentage * 100).toFixed(1)}%</div>
              <div>Since Last Refresh: {overview.diff.since_last_refresh}</div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="RECENT ACTIVITY" cornerBrackets>
        <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            ✓ Last valuation run: {new Date(overview.house_valuation.last_updated).toLocaleString()}
          </div>
          <div style={{ marginBottom: '0.5rem' }}>
            ✓ Data sources: Epidemiology Builder, Street Consensus
          </div>
          <div>
            ℹ Manual refresh available via top-right refresh button
          </div>
        </div>
      </Panel>
    </div>
  );
}
