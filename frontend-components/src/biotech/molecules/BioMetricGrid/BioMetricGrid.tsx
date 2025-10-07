import React from 'react';
import clsx from 'clsx';
import styles from './BioMetricGrid.module.css';
import { Metric } from '../../../terminal/molecules/Metric';
import { Text } from '../../../terminal/atoms/Text';
import type { BioAuroraMetric } from '../../../types/biotech';

export interface BioMetricGridProps {
  metrics: BioAuroraMetric[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const trendMap = {
  up: 'up',
  down: 'down',
  neutral: 'neutral',
} as const;

export const BioMetricGrid: React.FC<BioMetricGridProps> = ({
  metrics,
  columns = 3,
  className,
}) => {
  return (
    <div className={clsx(styles.grid, styles[`columns-${columns}`], className)}>
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className={clsx(
            styles['metric-card'],
            metric.variant && styles[`variant-${metric.variant}`]
          )}
        >
          <Metric
            label={metric.label}
            value={metric.value}
            change={metric.change}
            changeLabel={metric.changeLabel}
            trend={trendMap[metric.trend || 'neutral']}
          />

          {metric.supportText && (
            <Text
              as="div"
              variant="caption"
              color="secondary"
              uppercase
              className={styles.support}
            >
              {metric.supportText}
            </Text>
          )}
        </div>
      ))}
    </div>
  );
};
