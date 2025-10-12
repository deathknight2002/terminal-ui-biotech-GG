import React, { useMemo } from 'react';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import type { RnpvLadderItem, Phase } from '../../../../src/types/biotech';
import './RnpvLadder.css';

interface RnpvLadderProps {
  items: RnpvLadderItem[];
  sortBy?: 'rnpv' | 'name';
  sortDirection?: 'asc' | 'desc';
  maxItems?: number;
}

const PHASE_COLORS: Record<Phase, string> = {
  'Preclinical': 'var(--text-tertiary)',
  'Phase I': 'var(--accent-amber)',
  'Phase II': 'var(--accent-purple)',
  'Phase III': 'var(--accent-cyan)',
  'Filed': 'var(--status-info)',
  'Approved': 'var(--status-success)',
};

export const RnpvLadder: React.FC<RnpvLadderProps> = ({
  items,
  sortBy = 'rnpv',
  sortDirection = 'desc',
  maxItems,
}) => {
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      if (sortBy === 'rnpv') {
        return sortDirection === 'desc' ? b.rnpv - a.rnpv : a.rnpv - b.rnpv;
      }
      return sortDirection === 'desc'
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name);
    });
    return maxItems ? sorted.slice(0, maxItems) : sorted;
  }, [items, sortBy, sortDirection, maxItems]);

  const maxRnpv = useMemo(
    () => Math.max(...sortedItems.map(item => item.rnpv)),
    [sortedItems]
  );

  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const totalRnpv = useMemo(
    () => sortedItems.reduce((sum, item) => sum + item.rnpv, 0),
    [sortedItems]
  );

  return (
    <Panel title="rNPV LADDER" cornerBrackets>
      <div className="rnpv-ladder">
        <div className="rnpv-ladder-header">
          <span className="rnpv-total">
            TOTAL: {formatCurrency(totalRnpv)}
          </span>
          <span className="rnpv-count">
            {sortedItems.length} PROGRAMS
          </span>
        </div>

        <div className="rnpv-ladder-chart">
          {sortedItems.map((item, index) => {
            const barWidth = (item.rnpv / maxRnpv) * 100;
            const phaseColor = PHASE_COLORS[item.phase];

            return (
              <div key={item.id} className="rnpv-ladder-item">
                <div className="rnpv-item-label">
                  <span className="rnpv-item-rank">{index + 1}</span>
                  <span className="rnpv-item-name">{item.name}</span>
                  <span className="rnpv-item-ta">{item.therapeuticArea}</span>
                </div>
                <div className="rnpv-item-bar-container">
                  <div
                    className={`rnpv-item-bar ${item.isPartnered ? 'partnered' : ''}`}
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: phaseColor,
                    }}
                  >
                    <span className="rnpv-item-phase">{item.phase}</span>
                  </div>
                  <span className="rnpv-item-value">{formatCurrency(item.rnpv)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {maxItems && items.length > maxItems && (
          <div className="rnpv-ladder-footer">
            <span className="rnpv-footer-text">
              Showing top {maxItems} of {items.length} programs
            </span>
          </div>
        )}
      </div>
    </Panel>
  );
};
