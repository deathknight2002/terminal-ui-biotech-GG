import React from 'react';
import { TerminalFrame, Panel } from '@biotech-terminal/frontend-components/terminal';

export function ClinicalTrialsPage() {
  return (
    <TerminalFrame
      headline={{
        title: 'CLINICAL TRIALS TRACKER',
        subtitle: 'Real-time trial data and outcomes',
        eyebrow: 'TRIALS'
      }}
    >
      <Panel title="CLINICAL TRIALS">
        <p>Clinical trials dashboard coming soon...</p>
      </Panel>
    </TerminalFrame>
  );
}