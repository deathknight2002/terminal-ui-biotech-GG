import React from 'react';
import { TerminalFrame, Panel } from '@biotech-terminal/frontend-components/terminal';

export function FinancialModelingPage() {
  return (
    <TerminalFrame
      headline={{
        title: 'FINANCIAL MODELING SUITE',
        subtitle: 'DCF and risk-adjusted NPV analysis',
        eyebrow: 'FINANCIAL'
      }}
    >
      <Panel title="FINANCIAL MODELS">
        <p>Financial modeling tools coming soon...</p>
      </Panel>
    </TerminalFrame>
  );
}