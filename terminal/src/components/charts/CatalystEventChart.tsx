/**
 * Catalyst Event Visualization Component
 * 
 * Displays catalyst events with expectation bands, outcomes, and market reactions
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import type { 
  CatalystEvent, 
  MetricData,
  QuadrantSlide 
} from '../../../src/types/biotech';

interface ExpectationBandChartProps {
  metrics: MetricData[];
  outcomes?: MetricData[];
  width?: number;
  height?: number;
  transparent?: boolean;
}

/**
 * Chart showing expectation bands with actual outcomes
 */
export const ExpectationBandChart: React.FC<ExpectationBandChartProps> = ({
  metrics,
  outcomes = [],
  width = 600,
  height = 300,
  transparent = false
}) => {
  const chartData = useMemo(() => {
    const data: any[] = [];
    
    // Create outcome lookup
    const outcomeMap = new Map(outcomes.map(o => [o.name, o.value]));
    
    metrics.forEach((metric) => {
      if (metric.band_low !== undefined && metric.band_high !== undefined) {
        const actualValue = outcomeMap.get(metric.name);
        
        data.push({
          name: metric.name,
          band_low: metric.band_low,
          band_high: metric.band_high,
          expected: metric.expected,
          actual: actualValue,
          unit: metric.unit
        });
      }
    });
    
    return data;
  }, [metrics, outcomes]);
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid var(--accent-primary, #FF9500)',
          padding: '12px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '12px'
        }}>
          <div style={{ color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>
            {data.name}
          </div>
          <div style={{ color: '#aaa' }}>
            Expected: {data.expected} {data.unit}
          </div>
          <div style={{ color: '#aaa' }}>
            Band: [{data.band_low}, {data.band_high}] {data.unit}
          </div>
          {data.actual !== undefined && (
            <div style={{ 
              color: data.actual > data.band_high ? '#00ff00' : 
                     data.actual < data.band_low ? '#ff0000' : 
                     '#ffaa00',
              fontWeight: 'bold',
              marginTop: '4px'
            }}>
              Actual: {data.actual} {data.unit}
            </div>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <ResponsiveContainer width={width} height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        style={{ background: transparent ? 'transparent' : 'rgba(0, 0, 0, 0.3)' }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis 
          dataKey="name" 
          stroke="rgba(255, 255, 255, 0.5)"
          style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px' }}
        />
        <YAxis 
          stroke="rgba(255, 255, 255, 0.5)"
          style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px' }}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Expectation band as stacked bars */}
        <Bar dataKey="band_low" stackId="band" fill="transparent" />
        <Bar 
          dataKey={(d: any) => d.band_high - d.band_low} 
          stackId="band" 
          fill="rgba(255, 149, 0, 0.2)"
          stroke="var(--accent-primary, #FF9500)"
          strokeWidth={2}
        />
        
        {/* Expected value line */}
        {chartData.map((entry, index) => (
          <ReferenceLine
            key={`expected-${index}`}
            y={entry.expected}
            stroke="var(--accent-primary, #FF9500)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}
        
        {/* Actual outcome markers */}
        <Bar dataKey="actual" fill="transparent">
          {chartData.map((entry, index) => {
            if (entry.actual === undefined) return null;
            
            const color = entry.actual > entry.band_high ? '#00ff00' :
                         entry.actual < entry.band_low ? '#ff0000' :
                         '#ffaa00';
            
            return <Cell key={`cell-${index}`} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

interface CatalystEventCardProps {
  event: CatalystEvent;
  onViewDetails?: (eventId: string) => void;
}

/**
 * Card displaying catalyst event summary
 */
export const CatalystEventCard: React.FC<CatalystEventCardProps> = ({
  event,
  onViewDetails
}) => {
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'M&A': return '#00d4ff';
      case 'PH3_READOUT': return '#00ff00';
      case 'SAFETY_PAUSE': return '#ff0000';
      case 'APPROVAL': return '#a855f7';
      case 'LABEL_UPDATE': return '#ffaa00';
      default: return '#ff9500';
    }
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '20px',
      fontFamily: 'var(--font-mono, monospace)',
      cursor: onViewDetails ? 'pointer' : 'default',
      transition: 'all 0.2s',
      ':hover': {
        borderColor: 'var(--accent-primary, #FF9500)'
      }
    }}
    onClick={() => onViewDetails?.(event.event_id)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getEventTypeColor(event.catalyst.type)
          }} />
          <span style={{ 
            color: getEventTypeColor(event.catalyst.type),
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            {event.catalyst.type.replace(/_/g, ' ')}
          </span>
        </div>
        <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>
          {formatDate(event.as_of)}
        </span>
      </div>
      
      {/* Company & Program */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
          {event.company.name} ({event.company.ticker})
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
          {event.catalyst.program}
        </div>
        {event.catalyst.indication && (
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', marginTop: '2px' }}>
            {event.catalyst.indication}
          </div>
        )}
      </div>
      
      {/* Key Metrics Summary */}
      {event.outcome?.metrics && event.outcome.metrics.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {event.outcome.metrics.slice(0, 3).map((metric, i) => (
            <div key={i} style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', marginBottom: '4px' }}>
                {metric.name}
              </div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                {metric.value} {metric.unit}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Market Reaction */}
      {event.market_reaction?.price && event.market_reaction.price.length > 0 && (
        <div style={{ 
          marginTop: '12px',
          padding: '8px',
          background: 'rgba(255, 149, 0, 0.1)',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Stock Reaction: </span>
          {event.market_reaction.price.map((pr, i) => (
            <span key={i} style={{ 
              color: pr.abs >= 0 ? '#00ff00' : '#ff0000',
              fontWeight: 'bold',
              marginLeft: '8px'
            }}>
              {pr.window}: {pr.abs > 0 ? '+' : ''}{pr.abs}%
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface QuadrantSlideViewProps {
  quadrant: QuadrantSlide;
}

/**
 * Full quadrant slide visualization
 */
export const QuadrantSlideView: React.FC<QuadrantSlideViewProps> = ({ quadrant }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr auto',
      gap: '20px',
      padding: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      fontFamily: 'var(--font-mono, monospace)',
      minHeight: '600px'
    }}>
      {/* Q1: Headline + TL;DR */}
      <div style={{ 
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ color: 'var(--accent-primary, #FF9500)', fontSize: '10px', marginBottom: '8px' }}>
          Q1: HEADLINE
        </div>
        <h2 style={{ color: '#fff', fontSize: '18px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
          {quadrant.quadrants.q1.headline}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', lineHeight: '1.6' }}>
          {quadrant.quadrants.q1.tldr}
        </p>
      </div>
      
      {/* Q2: Key Metrics / Charts */}
      <div style={{ 
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ color: 'var(--accent-primary, #FF9500)', fontSize: '10px', marginBottom: '12px' }}>
          Q2: KEY METRICS
        </div>
        {quadrant.quadrants.q2.key_metrics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {quadrant.quadrants.q2.key_metrics.map((metric, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px'
              }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  {metric.name}
                </span>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                  {metric.value} {metric.unit}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Q3: Street vs Outcome + Stock Reaction */}
      <div style={{ 
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ color: 'var(--accent-primary, #FF9500)', fontSize: '10px', marginBottom: '12px' }}>
          Q3: STREET VS OUTCOME
        </div>
        {quadrant.quadrants.q3.expectation_deltas && (
          <div style={{ fontSize: '11px' }}>
            {quadrant.quadrants.q3.expectation_deltas.map((delta, i) => (
              <div key={i} style={{ 
                marginBottom: '8px',
                padding: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px'
              }}>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{delta.metric}</div>
                <div style={{ 
                  color: delta.delta.class === 'beat' ? '#00ff00' :
                         delta.delta.class === 'miss' ? '#ff0000' : '#ffaa00',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '10px',
                  marginTop: '4px'
                }}>
                  {delta.delta.class} (score: {(delta.delta.score * 100).toFixed(0)}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Q4: Competitive Read-through */}
      <div style={{ 
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ color: 'var(--accent-primary, #FF9500)', fontSize: '10px', marginBottom: '12px' }}>
          Q4: COMPETITIVE READ-THROUGH
        </div>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', lineHeight: '1.6' }}>
          {quadrant.quadrants.q4.landscape}
        </p>
        {quadrant.quadrants.q4.peers && quadrant.quadrants.q4.peers.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', marginBottom: '8px' }}>
              PEERS:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {quadrant.quadrants.q4.peers.map((peer, i) => (
                <div key={i} style={{
                  padding: '4px 8px',
                  background: 'rgba(0, 212, 255, 0.1)',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: '#00d4ff'
                }}>
                  {peer.ticker}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer: Sources */}
      <div style={{ 
        gridColumn: '1 / -1',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '8px',
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        <strong>Sources:</strong>{' '}
        {quadrant.footer.sources.map((source, i) => (
          <span key={i}>
            {i > 0 && ' | '}
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-primary, #FF9500)', textDecoration: 'none' }}
            >
              {source.title}
            </a>
          </span>
        ))}
        <span style={{ float: 'right' }}>
          Generated: {new Date(quadrant.footer.generated_at).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default {
  ExpectationBandChart,
  CatalystEventCard,
  QuadrantSlideView
};
