import React, { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Data } from 'plotly.js';
import './DCFCalculator.css';

export interface DCFInputs {
  revenue: number;
  revenueGrowthRate: number;
  ebitdaMargin: number;
  taxRate: number;
  capexPercent: number;
  wcPercent: number;
  wacc: number;
  terminalGrowthRate: number;
  forecastYears: number;
  netDebt: number;
  sharesOutstanding: number;
}

export interface DCFCalculatorProps {
  initialInputs?: Partial<DCFInputs>;
  className?: string;
}

const DEFAULT_INPUTS: DCFInputs = {
  revenue: 1000,
  revenueGrowthRate: 15,
  ebitdaMargin: 35,
  taxRate: 21,
  capexPercent: 5,
  wcPercent: 10,
  wacc: 10,
  terminalGrowthRate: 3,
  forecastYears: 10,
  netDebt: 0,
  sharesOutstanding: 100,
};

export const DCFCalculator: React.FC<DCFCalculatorProps> = ({
  initialInputs = {},
  className = '',
}) => {
  const [inputs, setInputs] = useState<DCFInputs>({ ...DEFAULT_INPUTS, ...initialInputs });
  const [sensitivityVar, setSensitivityVar] = useState<keyof DCFInputs>('wacc');
  const [sensitivityRange, setSensitivityRange] = useState(20); // +/- percentage

  // Calculate DCF
  const calculateDCF = (params: DCFInputs): number => {
    const fcfs: number[] = [];
    let revenue = params.revenue;

    // Calculate free cash flows
    for (let year = 1; year <= params.forecastYears; year++) {
      revenue *= (1 + params.revenueGrowthRate / 100);
      const ebitda = revenue * (params.ebitdaMargin / 100);
      const nopat = ebitda * (1 - params.taxRate / 100);
      const capex = revenue * (params.capexPercent / 100);
      const wcChange = revenue * (params.wcPercent / 100);
      const fcf = nopat - capex - wcChange;
      
      const discountFactor = Math.pow(1 + params.wacc / 100, year);
      fcfs.push(fcf / discountFactor);
    }

    // Terminal value
    const terminalFCF = fcfs[fcfs.length - 1] * (1 + params.terminalGrowthRate / 100);
    const terminalValue = terminalFCF / ((params.wacc - params.terminalGrowthRate) / 100);
    const discountedTerminalValue = terminalValue / Math.pow(1 + params.wacc / 100, params.forecastYears);

    // Enterprise value
    const enterpriseValue = fcfs.reduce((sum, fcf) => sum + fcf, 0) + discountedTerminalValue;
    
    // Equity value per share
    const equityValue = enterpriseValue - params.netDebt;
    return equityValue / params.sharesOutstanding;
  };

  const baseValue = useMemo(() => calculateDCF(inputs), [inputs]);

  // Calculate sensitivity analysis
  const sensitivityAnalysis = useMemo(() => {
    const results: { variable: string; change: number; value: number }[] = [];
    const baseParamValue = inputs[sensitivityVar];
    const steps = 10;

    for (let i = -steps; i <= steps; i++) {
      const changePercent = (i / steps) * sensitivityRange;
      const newValue = typeof baseParamValue === 'number'
        ? baseParamValue * (1 + changePercent / 100)
        : baseParamValue;
      
      const newInputs = { ...inputs, [sensitivityVar]: newValue };
      const dcfValue = calculateDCF(newInputs);
      const valueChange = ((dcfValue - baseValue) / baseValue) * 100;
      
      results.push({
        variable: `${changePercent.toFixed(0)}%`,
        change: changePercent,
        value: valueChange,
      });
    }

    return results.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [inputs, sensitivityVar, sensitivityRange, baseValue]);

  // Tornado chart data
  const tornadoData = useMemo((): Data[] => {
    const top10 = sensitivityAnalysis.slice(0, 10);
    
    return [{
      x: top10.map(r => r.value),
      y: top10.map(r => r.variable),
      type: 'bar',
      orientation: 'h',
      marker: {
        color: top10.map(r => r.value > 0 ? 'var(--status-success)' : 'var(--status-error)'),
      },
      text: top10.map(r => `${r.value.toFixed(1)}%`),
      textposition: 'auto',
    } as Data];
  }, [sensitivityAnalysis]);

  const handleInputChange = (field: keyof DCFInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`dcf-calculator ${className}`}>
      <div className="dcf-content">
        {/* Input Form */}
        <div className="dcf-inputs">
          <h3 className="dcf-section-title">INPUT ASSUMPTIONS</h3>
          
          <div className="input-group">
            <label>Current Revenue ($M)</label>
            <input
              type="number"
              value={inputs.revenue}
              onChange={(e) => handleInputChange('revenue', parseFloat(e.target.value) || 0)}
              step="100"
            />
          </div>

          <div className="input-group">
            <label>Revenue Growth Rate (%)</label>
            <input
              type="number"
              value={inputs.revenueGrowthRate}
              onChange={(e) => handleInputChange('revenueGrowthRate', parseFloat(e.target.value) || 0)}
              step="1"
            />
          </div>

          <div className="input-group">
            <label>EBITDA Margin (%)</label>
            <input
              type="number"
              value={inputs.ebitdaMargin}
              onChange={(e) => handleInputChange('ebitdaMargin', parseFloat(e.target.value) || 0)}
              step="1"
            />
          </div>

          <div className="input-group">
            <label>Tax Rate (%)</label>
            <input
              type="number"
              value={inputs.taxRate}
              onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
              step="1"
            />
          </div>

          <div className="input-group">
            <label>CapEx (% of Revenue)</label>
            <input
              type="number"
              value={inputs.capexPercent}
              onChange={(e) => handleInputChange('capexPercent', parseFloat(e.target.value) || 0)}
              step="0.5"
            />
          </div>

          <div className="input-group">
            <label>Working Capital (% of Revenue)</label>
            <input
              type="number"
              value={inputs.wcPercent}
              onChange={(e) => handleInputChange('wcPercent', parseFloat(e.target.value) || 0)}
              step="0.5"
            />
          </div>

          <div className="input-group">
            <label>WACC (%)</label>
            <input
              type="number"
              value={inputs.wacc}
              onChange={(e) => handleInputChange('wacc', parseFloat(e.target.value) || 0)}
              step="0.5"
            />
          </div>

          <div className="input-group">
            <label>Terminal Growth Rate (%)</label>
            <input
              type="number"
              value={inputs.terminalGrowthRate}
              onChange={(e) => handleInputChange('terminalGrowthRate', parseFloat(e.target.value) || 0)}
              step="0.5"
            />
          </div>

          <div className="input-group">
            <label>Forecast Years</label>
            <input
              type="number"
              value={inputs.forecastYears}
              onChange={(e) => handleInputChange('forecastYears', parseInt(e.target.value) || 10)}
              step="1"
              min="1"
              max="20"
            />
          </div>

          <div className="input-group">
            <label>Net Debt ($M)</label>
            <input
              type="number"
              value={inputs.netDebt}
              onChange={(e) => handleInputChange('netDebt', parseFloat(e.target.value) || 0)}
              step="100"
            />
          </div>

          <div className="input-group">
            <label>Shares Outstanding (M)</label>
            <input
              type="number"
              value={inputs.sharesOutstanding}
              onChange={(e) => handleInputChange('sharesOutstanding', parseFloat(e.target.value) || 100)}
              step="1"
            />
          </div>
        </div>

        {/* Results and Sensitivity */}
        <div className="dcf-results">
          <div className="dcf-value-card">
            <h3 className="dcf-section-title">FAIR VALUE PER SHARE</h3>
            <div className="dcf-value">${baseValue.toFixed(2)}</div>
          </div>

          <div className="sensitivity-controls">
            <h3 className="dcf-section-title">SENSITIVITY ANALYSIS</h3>
            
            <div className="input-group">
              <label>Variable to Test</label>
              <select
                value={sensitivityVar}
                onChange={(e) => setSensitivityVar(e.target.value as keyof DCFInputs)}
              >
                <option value="wacc">WACC</option>
                <option value="revenueGrowthRate">Revenue Growth Rate</option>
                <option value="ebitdaMargin">EBITDA Margin</option>
                <option value="terminalGrowthRate">Terminal Growth Rate</option>
                <option value="taxRate">Tax Rate</option>
              </select>
            </div>

            <div className="input-group">
              <label>Range (+/- %)</label>
              <input
                type="number"
                value={sensitivityRange}
                onChange={(e) => setSensitivityRange(parseFloat(e.target.value) || 20)}
                step="5"
                min="5"
                max="50"
              />
            </div>
          </div>

          <div className="tornado-chart">
            <h4 className="chart-title">TORNADO CHART - VALUE SENSITIVITY</h4>
            <Plot
              data={tornadoData}
              layout={{
                paper_bgcolor: 'rgba(0, 0, 0, 0)',
                plot_bgcolor: 'var(--bg-terminal)',
                font: { family: 'var(--font-mono)', color: 'var(--text-secondary)' },
                xaxis: {
                  title: 'Change in Value (%)',
                  gridcolor: 'var(--border-primary)',
                  showgrid: true,
                },
                yaxis: {
                  title: 'Parameter Change',
                  gridcolor: 'var(--border-primary)',
                },
                margin: { l: 100, r: 20, t: 20, b: 60 },
                showlegend: false,
                height: 400,
              }}
              config={{
                responsive: true,
                displayModeBar: false,
                displaylogo: false,
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          <div className="scenario-table">
            <h4 className="chart-title">SCENARIO COMPARISON</h4>
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>WACC</th>
                  <th>Growth</th>
                  <th>Margin</th>
                  <th>Fair Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="base-case">
                  <td>Base Case</td>
                  <td>{inputs.wacc.toFixed(1)}%</td>
                  <td>{inputs.revenueGrowthRate.toFixed(1)}%</td>
                  <td>{inputs.ebitdaMargin.toFixed(1)}%</td>
                  <td className="value-cell">${baseValue.toFixed(2)}</td>
                </tr>
                <tr className="bull-case">
                  <td>Bull Case</td>
                  <td>{(inputs.wacc * 0.9).toFixed(1)}%</td>
                  <td>{(inputs.revenueGrowthRate * 1.2).toFixed(1)}%</td>
                  <td>{(inputs.ebitdaMargin * 1.1).toFixed(1)}%</td>
                  <td className="value-cell">
                    ${calculateDCF({
                      ...inputs,
                      wacc: inputs.wacc * 0.9,
                      revenueGrowthRate: inputs.revenueGrowthRate * 1.2,
                      ebitdaMargin: inputs.ebitdaMargin * 1.1,
                    }).toFixed(2)}
                  </td>
                </tr>
                <tr className="bear-case">
                  <td>Bear Case</td>
                  <td>{(inputs.wacc * 1.1).toFixed(1)}%</td>
                  <td>{(inputs.revenueGrowthRate * 0.8).toFixed(1)}%</td>
                  <td>{(inputs.ebitdaMargin * 0.9).toFixed(1)}%</td>
                  <td className="value-cell">
                    ${calculateDCF({
                      ...inputs,
                      wacc: inputs.wacc * 1.1,
                      revenueGrowthRate: inputs.revenueGrowthRate * 0.8,
                      ebitdaMargin: inputs.ebitdaMargin * 0.9,
                    }).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
