import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Data } from 'plotly.js';
import './ProbabilityModeler.css';

export interface PhaseTransition {
  fromPhase: string;
  toPhase: string;
  probability: number;
  historicalRate?: number;
}

export interface ProbabilityModelerProps {
  indication: string;
  currentPhase: string;
  transitions?: PhaseTransition[];
  enableMonteCarloSimulation?: boolean;
  className?: string;
}

// Historical industry success rates (approximate)
const DEFAULT_TRANSITION_RATES: Record<string, number> = {
  'Preclinical->Phase I': 0.636,
  'Phase I->Phase II': 0.633,
  'Phase II->Phase III': 0.307,
  'Phase III->Filed': 0.583,
  'Filed->Approved': 0.902,
};

// Indication-specific multipliers (examples)
const INDICATION_MULTIPLIERS: Record<string, number> = {
  'Oncology': 0.85,
  'Rare Disease': 1.15,
  'Infectious Disease': 1.05,
  'Cardiovascular': 0.95,
  'Neurology': 0.80,
  'Immunology': 0.90,
  'Default': 1.00,
};

export const ProbabilityModeler: React.FC<ProbabilityModelerProps> = ({
  indication,
  currentPhase,
  transitions = [],
  enableMonteCarloSimulation = true,
  className = '',
}) => {
  const [customProbabilities, setCustomProbabilities] = useState<Record<string, number>>({});
  const [simulationRuns, setSimulationRuns] = useState(10000);
  const [runSimulation, setRunSimulation] = useState(false);

  // Get indication multiplier
  const indicationMultiplier = INDICATION_MULTIPLIERS[indication] || INDICATION_MULTIPLIERS['Default'];

  // Calculate adjusted probabilities
  const getAdjustedProbability = (fromPhase: string, toPhase: string): number => {
    const key = `${fromPhase}->${toPhase}`;
    
    // Use custom probability if set
    if (customProbabilities[key] !== undefined) {
      return customProbabilities[key];
    }
    
    // Use provided transition data
    const transition = transitions.find(t => t.fromPhase === fromPhase && t.toPhase === toPhase);
    if (transition) {
      return transition.probability;
    }
    
    // Use historical rate with indication multiplier
    const baseRate = DEFAULT_TRANSITION_RATES[key] || 0.5;
    return Math.min(1, baseRate * indicationMultiplier);
  };

  // Calculate cumulative probability to each phase
  const phases = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved'];
  const currentPhaseIndex = phases.indexOf(currentPhase);

  const cumulativeProbabilities = useMemo(() => {
    const probs: Record<string, number> = {};
    let cumProb = 1.0;
    
    for (let i = currentPhaseIndex; i < phases.length - 1; i++) {
      const fromPhase = phases[i];
      const toPhase = phases[i + 1];
      const transitionProb = getAdjustedProbability(fromPhase, toPhase);
      cumProb *= transitionProb;
      probs[toPhase] = cumProb;
    }
    
    return probs;
  }, [currentPhase, customProbabilities, transitions, indicationMultiplier]);

  // Monte Carlo simulation
  const simulationResults = useMemo(() => {
    if (!runSimulation || !enableMonteCarloSimulation) {
      return null;
    }

    const results: Record<string, number> = {};
    phases.forEach(phase => results[phase] = 0);

    for (let run = 0; run < simulationRuns; run++) {
      let currentSimPhase = currentPhase;
      let currentSimIndex = currentPhaseIndex;

      while (currentSimIndex < phases.length - 1) {
        const fromPhase = phases[currentSimIndex];
        const toPhase = phases[currentSimIndex + 1];
        const prob = getAdjustedProbability(fromPhase, toPhase);
        
        // Random success/failure
        if (Math.random() <= prob) {
          currentSimPhase = toPhase;
          currentSimIndex++;
        } else {
          break; // Failed at this stage
        }
      }

      results[currentSimPhase]++;
    }

    // Convert to percentages
    Object.keys(results).forEach(phase => {
      results[phase] = (results[phase] / simulationRuns) * 100;
    });

    return results;
  }, [runSimulation, simulationRuns, currentPhase, customProbabilities, transitions, indicationMultiplier]);

  // Chart data for cumulative probabilities
  const cumulativeProbChart: Data[] = [
    {
      x: Object.keys(cumulativeProbabilities),
      y: Object.values(cumulativeProbabilities).map(v => v * 100),
      type: 'bar',
      marker: {
        color: 'var(--accent-cyan)',
      },
      text: Object.values(cumulativeProbabilities).map(v => `${(v * 100).toFixed(1)}%`),
      textposition: 'outside',
    } as Data,
  ];

  // Chart data for Monte Carlo simulation
  const simulationChart: Data[] = simulationResults ? [
    {
      x: Object.keys(simulationResults),
      y: Object.values(simulationResults),
      type: 'bar',
      marker: {
        color: 'var(--accent-purple)',
      },
      text: Object.values(simulationResults).map(v => `${v.toFixed(1)}%`),
      textposition: 'outside',
    } as Data,
  ] : [];

  // Chart data for phase transition funnel
  const funnelData: Data[] = [
    {
      y: phases.slice(currentPhaseIndex),
      x: phases.slice(currentPhaseIndex).map((phase, idx) => {
        if (idx === 0) return 100;
        return (cumulativeProbabilities[phase] || 0) * 100;
      }),
      type: 'funnel',
      marker: {
        color: phases.slice(currentPhaseIndex).map((_, idx) => 
          `rgba(0, 255, 255, ${1 - idx * 0.15})`
        ),
      },
      textinfo: 'value+percent initial',
    } as Data,
  ];

  const handleProbabilityChange = (fromPhase: string, toPhase: string, value: number) => {
    const key = `${fromPhase}->${toPhase}`;
    setCustomProbabilities(prev => ({
      ...prev,
      [key]: value / 100,
    }));
  };

  return (
    <div className={`probability-modeler ${className}`}>
      <div className="modeler-header">
        <h2 className="modeler-title">CLINICAL TRIAL PROBABILITY MODELING</h2>
        <div className="modeler-info">
          <span className="info-item">INDICATION: {indication}</span>
          <span className="info-item">CURRENT PHASE: {currentPhase}</span>
        </div>
      </div>

      <div className="modeler-content">
        {/* Transition Probabilities */}
        <div className="transition-probabilities">
          <h3 className="section-title">PHASE TRANSITION PROBABILITIES</h3>
          <div className="transition-list">
            {phases.slice(currentPhaseIndex).map((phase, idx) => {
              if (idx === phases.slice(currentPhaseIndex).length - 1) return null;
              
              const nextPhase = phases[currentPhaseIndex + idx + 1];
              const prob = getAdjustedProbability(phase, nextPhase) * 100;
              const historicalRate = DEFAULT_TRANSITION_RATES[`${phase}->${nextPhase}`] * 100;

              return (
                <div key={`${phase}-${nextPhase}`} className="transition-item">
                  <div className="transition-label">
                    {phase} → {nextPhase}
                  </div>
                  <div className="transition-inputs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(prob)}
                      onChange={(e) => handleProbabilityChange(phase, nextPhase, parseFloat(e.target.value) || 0)}
                      className="probability-input"
                    />
                    <span className="percent-sign">%</span>
                  </div>
                  <div className="historical-rate">
                    Historical: {historicalRate.toFixed(1)}%
                  </div>
                  <div className="probability-bar">
                    <div
                      className="probability-fill"
                      style={{ width: `${prob}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts */}
        <div className="modeler-charts">
          {/* Cumulative Probability */}
          <div className="chart-panel">
            <h3 className="section-title">CUMULATIVE PROBABILITY OF SUCCESS</h3>
            <Plot
              data={cumulativeProbChart}
              layout={{
                paper_bgcolor: 'rgba(0, 0, 0, 0)',
                plot_bgcolor: 'var(--bg-terminal)',
                font: { family: 'var(--font-mono)', color: 'var(--text-secondary)' },
                xaxis: {
                  title: 'Phase',
                  gridcolor: 'var(--border-primary)',
                },
                yaxis: {
                  title: 'Probability (%)',
                  gridcolor: 'var(--border-primary)',
                  range: [0, 100],
                },
                margin: { l: 60, r: 20, t: 20, b: 60 },
                showlegend: false,
              }}
              config={{
                responsive: true,
                displayModeBar: false,
                displaylogo: false,
              }}
              style={{ width: '100%', height: '300px' }}
            />
          </div>

          {/* Funnel Chart */}
          <div className="chart-panel">
            <h3 className="section-title">PHASE PROGRESSION FUNNEL</h3>
            <Plot
              data={funnelData}
              layout={{
                paper_bgcolor: 'rgba(0, 0, 0, 0)',
                plot_bgcolor: 'var(--bg-terminal)',
                font: { family: 'var(--font-mono)', color: 'var(--text-secondary)' },
                margin: { l: 150, r: 20, t: 20, b: 20 },
              }}
              config={{
                responsive: true,
                displayModeBar: false,
                displaylogo: false,
              }}
              style={{ width: '100%', height: '300px' }}
            />
          </div>

          {/* Monte Carlo Simulation */}
          {enableMonteCarloSimulation && (
            <div className="chart-panel monte-carlo">
              <h3 className="section-title">MONTE CARLO SIMULATION</h3>
              <div className="simulation-controls">
                <div className="input-group">
                  <label>Simulation Runs:</label>
                  <input
                    type="number"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={simulationRuns}
                    onChange={(e) => setSimulationRuns(parseInt(e.target.value) || 10000)}
                  />
                </div>
                <button
                  className="run-simulation-btn"
                  onClick={() => setRunSimulation(!runSimulation)}
                >
                  {runSimulation ? 'Reset' : 'Run Simulation'}
                </button>
              </div>
              {simulationResults && (
                <Plot
                  data={simulationChart}
                  layout={{
                    paper_bgcolor: 'rgba(0, 0, 0, 0)',
                    plot_bgcolor: 'var(--bg-terminal)',
                    font: { family: 'var(--font-mono)', color: 'var(--text-secondary)' },
                    xaxis: {
                      title: 'Final Phase Reached',
                      gridcolor: 'var(--border-primary)',
                    },
                    yaxis: {
                      title: 'Frequency (%)',
                      gridcolor: 'var(--border-primary)',
                      range: [0, 100],
                    },
                    margin: { l: 60, r: 20, t: 20, b: 80 },
                    showlegend: false,
                  }}
                  config={{
                    responsive: true,
                    displayModeBar: false,
                    displaylogo: false,
                  }}
                  style={{ width: '100%', height: '300px' }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="probability-summary">
        <h3 className="section-title">PROBABILITY OF APPROVAL FROM {currentPhase}</h3>
        <div className="summary-value">
          {((cumulativeProbabilities['Approved'] || 0) * 100).toFixed(1)}%
        </div>
        {simulationResults && (
          <div className="simulation-summary">
            Monte Carlo Result: {simulationResults['Approved']?.toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
};
