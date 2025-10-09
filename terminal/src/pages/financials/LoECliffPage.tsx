import React from 'react';
import { Panel } from '../../../../frontend-components/src/terminal';

export function LoECliffPage() {
  // Mock LoE timeline data
  const loeEvents = [
    {
      asset: 'Nuvalent Lead Asset',
      region: 'US',
      expiry_year: 2032,
      peak_revenue: 2800,
      erosion_year_1: 60,
      erosion_year_2: 20
    },
    {
      asset: 'Nuvalent Lead Asset',
      region: 'EU',
      expiry_year: 2033,
      peak_revenue: 1200,
      erosion_year_1: 55,
      erosion_year_2: 25
    },
    {
      asset: 'Pipeline Asset 2',
      region: 'US',
      expiry_year: 2035,
      peak_revenue: 1500,
      erosion_year_1: 60,
      erosion_year_2: 20
    }
  ];

  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">FINANCIALS MODULE</div>
        <h1>LOE CLIFF TIMELINE</h1>
        <div className="subtitle">
          Loss of exclusivity events and revenue erosion curves
        </div>
      </div>

      <Panel title="LOE EVENTS TIMELINE" cornerBrackets>
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Stacked revenue-at-risk by year ($ millions)
            </div>
            <div style={{ 
              display: 'flex', 
              height: '200px', 
              alignItems: 'flex-end', 
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-primary)',
              paddingBottom: '0.5rem'
            }}>
              {[2030, 2031, 2032, 2033, 2034, 2035, 2036].map(year => {
                const eventsInYear = loeEvents.filter(e => e.expiry_year === year);
                const totalRevenue = eventsInYear.reduce((sum, e) => sum + e.peak_revenue, 0);
                const height = totalRevenue > 0 ? (totalRevenue / 3000) * 100 : 0;
                
                return (
                  <div key={year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        height: `${height}%`,
                        backgroundColor: totalRevenue > 0 ? 'var(--accent-warning)' : 'transparent',
                        opacity: 0.8,
                        borderRadius: '2px 2px 0 0'
                      }}
                      title={`${year}: $${totalRevenue}M at risk`}
                    />
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {year}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Gantt Timeline - Asset Detail
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>ASSET</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>REGION</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>EXPIRY YEAR</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>PEAK REVENUE ($M)</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.75rem' }}>EROSION CURVE</th>
              </tr>
            </thead>
            <tbody>
              {loeEvents.map((event, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{event.asset}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{event.region}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-warning)' }}>
                    {event.expiry_year}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                    ${event.peak_revenue.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    Y1: -{event.erosion_year_1}% • Y2: -{event.erosion_year_2}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="EROSION MODEL" cornerBrackets>
        <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Erosion Assumptions:</strong>
          </div>
          <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>Year 1 post-LoE: 55-60% revenue erosion (generic entry)</li>
            <li>Year 2 post-LoE: Additional 20-25% erosion (market stabilization)</li>
            <li>Steady state: 80-85% total branded market share loss</li>
            <li>Region-specific curves applied based on historical precedent</li>
          </ul>
        </div>
      </Panel>
    </div>
  );
}
