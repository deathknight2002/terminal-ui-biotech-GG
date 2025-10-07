import React from 'react';
import { TerminalFrame, Panel } from '@biotech-terminal/frontend-components/terminal';

export function PipelinePage() {
  return (
    <TerminalFrame
      headline={{
        title: 'DRUG DEVELOPMENT PIPELINE',
        subtitle: 'Track pharmaceutical development stages',
        eyebrow: 'PIPELINE'
      }}
    >
      <Panel title="PIPELINE OVERVIEW">
        <p>Pipeline visualization coming soon...</p>
      </Panel>
    </TerminalFrame>
  );
}