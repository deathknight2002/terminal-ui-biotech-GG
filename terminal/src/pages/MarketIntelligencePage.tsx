import React from 'react';
import { TerminalFrame, Panel } from '@biotech-terminal/frontend-components/terminal';

export function MarketIntelligencePage() {
  return (
    <TerminalFrame
      headline={{
        title: 'MARKET INTELLIGENCE CENTER',
        subtitle: 'Competitor analysis and market insights',
        eyebrow: 'INTELLIGENCE'
      }}
    >
      <Panel title="MARKET ANALYSIS">
        <p>Market intelligence dashboard coming soon...</p>
      </Panel>
    </TerminalFrame>
  );
}