import React from 'react';
import clsx from 'clsx';

import type { WatchlistRow, TrendState } from '../../TerminalHome';
import styles from './WatchlistPanel.module.css';

const trendClassName: Record<TrendState, string> = {
  up: styles.trendUp,
  down: styles.trendDown,
  flat: styles.trendNeutral,
};

export interface WatchlistPanelProps {
  rows: WatchlistRow[];
  title?: string;
  changeLabel?: string;
  className?: string;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  rows,
  title = 'Watchlist',
  changeLabel = 'Change',
  className,
}) => {
  return (
    <aside className={clsx(styles.card, className)}>
      <div className={styles.header}>
        <span>{title}</span>
        <span>{changeLabel}</span>
      </div>
      <div className={styles.table}>
        {rows.map((row) => (
          <div key={row.symbol} className={styles.row}>
            <span className={styles.symbol}>{row.symbol}</span>
            <span className={styles.price}>{row.price}</span>
            <span className={clsx(styles.change, trendClassName[row.changeState])}>{row.change}</span>
            <span className={styles.meta}>{row.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default WatchlistPanel;
