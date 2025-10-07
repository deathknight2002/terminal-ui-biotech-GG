import React from 'react';
import { 
  TerminalFrame,
  Panel, 
  Metric, 
  Gauge, 
  DonutChart,
  DataTable
} from '@biotech-terminal/frontend-components/terminal';
import { 
  BioMetricGrid,
  CatalystTicker 
} from '@biotech-terminal/frontend-components/biotech';

export function DashboardPage() {
  // Mock data - will be replaced with real API calls
  const metrics = [
    { label: 'ACTIVE DRUGS', value: 2847, trend: 'up' as const, change: 12.3 },
    { label: 'PHASE III', value: 342, trend: 'up' as const, change: 8.1 },
    { label: 'FDA APPROVALS', value: 89, trend: 'down' as const, change: -2.4 },
    { label: 'MARKET CAP', value: '$2.4T', trend: 'up' as const, change: 15.7 },
  ];

  const pipelineData = [
    { phase: 'Preclinical', value: 45, color: '#FF9500' },
    { phase: 'Phase I', value: 28, color: '#00D4FF' },
    { phase: 'Phase II', value: 18, color: '#00FF00' },
    { phase: 'Phase III', value: 9, color: '#A855F7' },
  ];

  return (
    <TerminalFrame
      headline={{
        title: 'BIOTECH INTELLIGENCE DASHBOARD',
        subtitle: 'Real-time pharmaceutical market overview',
        eyebrow: 'MAIN TERMINAL'
      }}
    >
      <div className="dashboard-grid">
        {/* Key Metrics */}
        <Panel title="SYSTEM METRICS" cornerBrackets>
          <div className="metrics-grid">
            {metrics.map((metric, index) => (
              <Metric key={index} {...metric} />
            ))}
          </div>
        </Panel>

        {/* Pipeline Overview */}
        <Panel title="PIPELINE DISTRIBUTION">
          <div className="pipeline-viz">
            <DonutChart 
              data={pipelineData}
              centerLabel="TOTAL PIPELINE"
              centerValue="2,847"
            />
          </div>
        </Panel>

        {/* Market Activity */}
        <Panel title="MARKET ACTIVITY">
          <Gauge 
            value={78} 
            label="MARKET SENTIMENT"
            status="success"
          />
        </Panel>

        {/* Biotech Metrics */}
        <Panel title="BIOTECH INTELLIGENCE" fullWidth>
          <BioMetricGrid />
        </Panel>

        {/* Recent Catalysts */}
        <Panel title="RECENT CATALYSTS" fullWidth>
          <CatalystTicker />
        </Panel>
      </div>
    </TerminalFrame>
  );
}