/**
 * Catalyst Scoring Radar Chart
 * 
 * Beautiful glass-morphic radar chart for displaying "Ionis-style" catalyst scores.
 * Shows 5 dimensions: Event Leverage, Timing Clarity, Surprise Factor, Downside Contained, Market Depth
 */

import React from 'react';
import clsx from 'clsx';
import { RadarChart, RadarDataPoint } from '../../../terminal/visualizations/RadarChart';
import styles from './CatalystScoringRadar.module.css';

export interface CatalystScore {
  eventLeverage: number;      // 0-4
  timingClarity: number;       // 0-3
  surpriseFactor: number;      // 0-3
  downsideContained: number;   // 0-3
  marketDepth: number;         // 0-3
  total?: number;              // 0-16
  tier?: 'High-Torque' | 'Tradable' | 'Watch';
}

export interface CatalystScoringRadarProps {
  score: CatalystScore;
  title?: string;
  className?: string;
  size?: number;
  showLegend?: boolean;
  animate?: boolean;
}

/**
 * Convert catalyst score to radar data points (normalized to 0-100 scale)
 */
function scoreToRadarData(score: CatalystScore): RadarDataPoint[] {
  return [
    {
      label: 'Event Leverage',
      value: (score.eventLeverage / 4) * 100, // 0-4 scale
    },
    {
      label: 'Timing Clarity',
      value: (score.timingClarity / 3) * 100,  // 0-3 scale
    },
    {
      label: 'Surprise Factor',
      value: (score.surpriseFactor / 3) * 100, // 0-3 scale
    },
    {
      label: 'Downside Contained',
      value: (score.downsideContained / 3) * 100, // 0-3 scale
    },
    {
      label: 'Market Depth',
      value: (score.marketDepth / 3) * 100,    // 0-3 scale
    },
  ];
}

/**
 * Get tier color based on total score
 */
function getTierColor(tier?: string): string {
  switch (tier) {
    case 'High-Torque':
      return 'var(--accent-cyan)';
    case 'Tradable':
      return 'var(--accent-amber)';
    case 'Watch':
      return 'var(--accent-purple)';
    default:
      return 'var(--accent-cyan)';
  }
}

/**
 * Get tier label with emoji
 */
function getTierLabel(tier?: string): string {
  switch (tier) {
    case 'High-Torque':
      return '🚀 HIGH-TORQUE';
    case 'Tradable':
      return '📊 TRADABLE';
    case 'Watch':
      return '👁️ WATCH';
    default:
      return 'UNSCORED';
  }
}

export const CatalystScoringRadar: React.FC<CatalystScoringRadarProps> = ({
  score,
  title,
  className,
  size = 320,
  showLegend = true,
  animate = true,
}) => {
  const radarData = scoreToRadarData(score);
  const totalScore = score.total ?? (
    score.eventLeverage + score.timingClarity + score.surpriseFactor + 
    score.downsideContained + score.marketDepth
  );
  
  const tier = score.tier ?? (
    totalScore > 8 ? 'High-Torque' : totalScore >= 6 ? 'Tradable' : 'Watch'
  );
  
  const tierColor = getTierColor(tier);
  const tierLabel = getTierLabel(tier);

  return (
    <div className={clsx(styles.container, className)}>
      {title && (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
      )}
      
      <div className={styles.radarWrapper}>
        <RadarChart
          data={radarData}
          size={size}
          animate={animate}
          showLabels={true}
          color={tierColor}
        />
      </div>
      
      <div className={styles.scoreInfo}>
        <div className={styles.tierBadge} style={{ borderColor: tierColor, color: tierColor }}>
          {tierLabel}
        </div>
        <div className={styles.totalScore}>
          <span className={styles.scoreLabel}>TOTAL SCORE</span>
          <span className={styles.scoreValue} style={{ color: tierColor }}>
            {totalScore}/16
          </span>
        </div>
      </div>
      
      {showLegend && (
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: tierColor }} />
            <span className={styles.legendLabel}>Event Leverage (0-4)</span>
            <span className={styles.legendValue}>{score.eventLeverage}</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: tierColor }} />
            <span className={styles.legendLabel}>Timing Clarity (0-3)</span>
            <span className={styles.legendValue}>{score.timingClarity}</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: tierColor }} />
            <span className={styles.legendLabel}>Surprise Factor (0-3)</span>
            <span className={styles.legendValue}>{score.surpriseFactor}</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: tierColor }} />
            <span className={styles.legendLabel}>Downside Contained (0-3)</span>
            <span className={styles.legendValue}>{score.downsideContained}</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: tierColor }} />
            <span className={styles.legendLabel}>Market Depth (0-3)</span>
            <span className={styles.legendValue}>{score.marketDepth}</span>
          </div>
        </div>
      )}
      
      <div className={styles.footer}>
        <p className={styles.description}>
          {tier === 'High-Torque' && 'High asymmetric upside potential with contained downside.'}
          {tier === 'Tradable' && 'Moderate setup with tradable risk/reward.'}
          {tier === 'Watch' && 'Watch list candidate - lower conviction or clarity.'}
        </p>
      </div>
    </div>
  );
};
