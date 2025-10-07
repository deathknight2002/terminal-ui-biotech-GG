import React from 'react';
import clsx from 'clsx';
import styles from './CatalystTicker.module.css';
import { Text } from '../../atoms/Text';
import { Badge } from '../../atoms/Badge';
import type { Catalyst } from '../../../types/biotech';

export interface CatalystTickerProps {
  catalysts: Catalyst[];
  className?: string;
  onSelect?: (catalyst: Catalyst) => void;
  headline?: string;
}

const riskToVariant = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
} as const;

const riskCopy = {
  High: 'High Risk',
  Medium: 'Medium Risk',
  Low: 'Low Risk',
} as const;

const formatDate = (dateString: string) => {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const CatalystTicker: React.FC<CatalystTickerProps> = ({
  catalysts,
  className,
  onSelect,
  headline = 'Catalyst Radar',
}) => {
  return (
    <div className={clsx(styles.ticker, className)}>
      <div className={styles.header}>
        <span>{headline}</span>
        <span>{catalysts.length} TRACKED</span>
      </div>

      <div className={styles.marquee}>
        {catalysts.map((catalyst) => (
          <button
            key={catalyst.id}
            type="button"
            className={clsx(
              styles.chip,
              catalyst.risk === 'High' && styles.chipHigh,
              catalyst.risk === 'Medium' && styles.chipMedium,
              catalyst.risk === 'Low' && styles.chipLow
            )}
            onClick={() => onSelect?.(catalyst)}
          >
            <div className={styles.chipTop}>
              <Text as="span" variant="label" color="accent" tabularNums className={styles.label}>
                {catalyst.label}
              </Text>

              <Badge variant={riskToVariant[catalyst.risk]} filled>
                {riskCopy[catalyst.risk]}
              </Badge>
            </div>

            <div className={styles.meta}>
              <span>{formatDate(catalyst.date)}</span>
              {catalyst.expectedImpact && <span>{catalyst.expectedImpact} impact</span>}
              {catalyst.category && <span>{catalyst.category}</span>}
            </div>

            {catalyst.description && (
              <Text as="span" variant="body-sm" color="secondary" className={styles.description}>
                {catalyst.description}
              </Text>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
