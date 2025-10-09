import React from 'react';
import { Panel } from '../../../../frontend-components/src/terminal';

export function ConsensusVsHousePage() {
  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">FINANCIALS MODULE</div>
        <h1>CONSENSUS VS HOUSE</h1>
        <div className="subtitle">
          Street consensus estimates compared to House projections
        </div>
      </div>

      <Panel title="REVENUE COMPARISON" cornerBrackets>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Butterfly chart: Street vs House revenue by year
        </div>
      </Panel>

      <Panel title="METRIC DELTAS" cornerBrackets>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Traffic-light callouts for key metric differences
        </div>
      </Panel>
    </div>
  );
}

export function DCFMultiplesPage() {
  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">FINANCIALS MODULE</div>
        <h1>DCF & MULTIPLES</h1>
        <div className="subtitle">
          Discounted cash flow analysis and multiples cross-check
        </div>
      </div>

      <Panel title="DCF VALUATION" cornerBrackets>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Free cash flow table, WACC/TGR sensitivity grid
        </div>
      </Panel>

      <Panel title="MULTIPLES VALUATION" cornerBrackets>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          EV/Sales ladder by year
        </div>
      </Panel>
    </div>
  );
}

export function ModelAuditPage() {
  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">FINANCIALS MODULE</div>
        <h1>MODEL AUDIT</h1>
        <div className="subtitle">
          Valuation run history and reproducibility tracking
        </div>
      </div>

      <Panel title="VALUATION RUNS" cornerBrackets>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          List of valuation runs with inputs hash and timestamps
        </div>
      </Panel>
    </div>
  );
}

export function ReportsPage() {
  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">FINANCIALS MODULE</div>
        <h1>REPORTS</h1>
        <div className="subtitle">
          Export banker-grade decks and Excel models
        </div>
      </div>

      <Panel title="EXPORT OPTIONS" cornerBrackets>
        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <button style={{ 
              padding: '1rem', 
              background: 'var(--bg-panel)', 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              borderRadius: '4px'
            }}>
              📊 Export Excel Model (.xlsx)
            </button>
            <button style={{ 
              padding: '1rem', 
              background: 'var(--bg-panel)', 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              borderRadius: '4px'
            }}>
              📑 Export PowerPoint Deck (.pptx)
            </button>
            <button style={{ 
              padding: '1rem', 
              background: 'var(--bg-panel)', 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              borderRadius: '4px'
            }}>
              📄 Export PDF Report (.pdf)
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
