import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Panel } from '../../../../frontend-components/src/terminal';

const fetchPriceTargets = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/financials/price-targets?ticker=NUVL');
    if (!response.ok) {
      return getMockPriceTargets();
    }
    return await response.json();
  } catch {
    return getMockPriceTargets();
  }
};

const getMockPriceTargets = () => ({
  ticker: 'NUVL',
  count: 12,
  targets: [
    { id: 1, source: 'Goldman Sachs', date: '2025-01-15', price_target: 52.00, rationale: 'Strong pipeline momentum', currency: 'USD' },
    { id: 2, source: 'Morgan Stanley', date: '2025-01-10', price_target: 48.00, rationale: 'Positive Phase 2 data', currency: 'USD' },
    { id: 3, source: 'JP Morgan', date: '2025-01-08', price_target: 45.00, rationale: 'Conservative on timelines', currency: 'USD' },
    { id: 4, source: 'BofA Securities', date: '2024-12-20', price_target: 42.00, rationale: 'Market potential solid', currency: 'USD' },
    { id: 5, source: 'Jefferies', date: '2024-12-15', price_target: 38.00, rationale: 'Competition concerns', currency: 'USD' },
    { id: 6, source: 'Barclays', date: '2024-12-10', price_target: 35.00, rationale: 'Regulatory risks', currency: 'USD' },
    { id: 7, source: 'Wells Fargo', date: '2024-12-05', price_target: 40.00, rationale: 'Balanced view', currency: 'USD' },
    { id: 8, source: 'Citi', date: '2024-11-28', price_target: 43.00, rationale: 'Franchise value', currency: 'USD' },
    { id: 9, source: 'Cowen', date: '2024-11-20', price_target: 46.00, rationale: 'Upside to estimates', currency: 'USD' },
    { id: 10, source: 'Oppenheimer', date: '2024-11-15', price_target: 50.00, rationale: 'Best-in-class assets', currency: 'USD' },
    { id: 11, source: 'Piper Sandler', date: '2024-11-10', price_target: 44.00, rationale: 'Strong fundamentals', currency: 'USD' },
    { id: 12, source: 'Evercore ISI', date: '2024-11-05', price_target: 39.00, rationale: 'Measured outlook', currency: 'USD' },
  ]
});

export function PriceTargetsPage() {
  const { data = getMockPriceTargets() } = useQuery({
    queryKey: ['price-targets'],
    queryFn: fetchPriceTargets,
    staleTime: 5 * 60 * 1000,
  });

  const targets = data.targets || [];
  const values = targets.map(t => t.price_target);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];

  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">FINANCIALS MODULE</div>
        <h1>PRICE TARGETS</h1>
        <div className="subtitle">
          Analyst price targets and Street consensus
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <Panel title="MIN TARGET" cornerBrackets>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-warning)' }}>
              ${min.toFixed(2)}
            </div>
          </div>
        </Panel>
        <Panel title="MEDIAN TARGET" cornerBrackets>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              ${median.toFixed(2)}
            </div>
          </div>
        </Panel>
        <Panel title="MAX TARGET" cornerBrackets>
          <div style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-success)' }}>
              ${max.toFixed(2)}
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="ANALYST PRICE TARGETS" cornerBrackets>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>SOURCE</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>DATE</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>PRICE TARGET</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>RATIONALE</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((target) => (
                <tr key={target.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{target.source}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(target.date).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                    ${target.price_target.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{target.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
