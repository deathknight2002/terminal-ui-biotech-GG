import React from 'react';
import { TerminalFrame, Panel } from '@biotech-terminal/frontend-components/terminal';

export function DataExplorerPage() {
  return (
    <TerminalFrame
      headline={{
        title: 'BIOTECH DATA EXPLORER',
        subtitle: 'Interactive pharmaceutical data discovery',
        eyebrow: 'EXPLORER'
      }}
    >
      <Panel title="DATA EXPLORER">
        <p>Data exploration tools coming soon...</p>
      </Panel>
    </TerminalFrame>
  );
}