import React from 'react';
import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';

import type { StageMetric, StatMetric, TrendState } from '../../TerminalHome';
import styles from './StageMixCard.module.css';

const trendClassName: Record<TrendState, string> = {
  up: styles.trendUp,
  down: styles.trendDown,
  flat: styles.trendNeutral,
};

export interface StageMixCardProps {
  stages: StageMetric[];
  stats: StatMetric[];
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const StageMixCard: React.FC<StageMixCardProps> = ({
  stages,
  stats,
  actionLabel = 'Full Analytics',
  onAction,
  className,
}) => {
  return (
    <section className={clsx(styles.card, className)}>
      <header className={styles.header}>
        <span className={styles.title}>Stage Mix Intelligence</span>
        {actionLabel && (
          onAction ? (
            <button type="button" className={styles.action} onClick={onAction}>
              {actionLabel} <ArrowRight size={16} />
            </button>
          ) : (
            <span className={styles.action}>
              {actionLabel} <ArrowRight size={16} />
            </span>
          )
        )}
      </header>

      <div className={styles.heatmap}>
        {stages.map((stage) => {
          const icon = stage.trend === 'up' ? '▲' : stage.trend === 'down' ? '▼' : '◆';
          return (
            <div
              key={stage.stage}
              className={styles.stageCell}
              style={{
                background: `linear-gradient(135deg, ${stage.palette[0]}, ${stage.palette[1]})`,
              }}
            >
              <span className={styles.stageLabel}>{stage.stage}</span>
              <span className={styles.stageValue}>{stage.value}</span>
              <span className={clsx(styles.stageTrend, trendClassName[stage.trend])}>
                {icon} {Math.abs(stage.change)}% QoQ
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.statTile}>
            <span className={styles.statLabel}>{stat.label}</span>
            <span className={styles.statValue}>{stat.value}</span>
            {stat.sublabel && <span className={styles.statSublabel}>{stat.sublabel}</span>}
            {stat.delta && <span className={clsx(styles.statDelta, trendClassName[stat.trend ?? 'flat'])}>{stat.delta}</span>}
          </div>
        ))}
      </div>
    </section>
  );
};

export default StageMixCard;
