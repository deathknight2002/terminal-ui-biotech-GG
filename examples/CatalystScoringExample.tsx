/**
 * Catalyst Scoring Radar Example
 * 
 * Demonstrates the "Ionis-style" stealth catalyst scoring radar chart.
 */

import React, { useState } from 'react';
import { CatalystScoringRadar, CatalystScore } from '@biotech-terminal/frontend-components/biotech';
import styles from './CatalystScoringExample.module.css';

// Sample catalyst scores from the 50-catalyst watchlist
const sampleCatalysts: Array<{ name: string; score: CatalystScore }> = [
  {
    name: 'Olezarsen SHTG Pancreatitis (Ionis)',
    score: {
      eventLeverage: 4,      // Hard pancreatitis endpoint
      timingClarity: 2,       // Event-driven but expected Q1 2026
      surpriseFactor: 3,      // Market focused on TG, not AP events
      downsideContained: 2,   // FCS approval de-risks
      marketDepth: 2,         // SHTG + FCS niche but high-value
      tier: 'High-Torque'
    }
  },
  {
    name: 'Plozasiran FCS Zero AP Events (Arrowhead)',
    score: {
      eventLeverage: 4,
      timingClarity: 2,
      surpriseFactor: 3,
      downsideContained: 3,
      marketDepth: 2,
      tier: 'High-Torque'
    }
  },
  {
    name: 'Sparsentan FSGS PDUFA (Travere)',
    score: {
      eventLeverage: 3,
      timingClarity: 3,       // Fixed PDUFA Jan 13, 2026
      surpriseFactor: 3,      // Proteinuria surrogate acceptance
      downsideContained: 2,
      marketDepth: 2,
      tier: 'High-Torque'
    }
  },
  {
    name: 'Apitegromab SMA CRL Resolution (Scholar Rock)',
    score: {
      eventLeverage: 3,
      timingClarity: 2,
      surpriseFactor: 3,      // CRL resolution often 30%+ pop
      downsideContained: 3,   // CMC not efficacy
      marketDepth: 2,
      tier: 'High-Torque'
    }
  },
  {
    name: 'VERVE-102 Gene Editing Safety (Verve)',
    score: {
      eventLeverage: 3,
      timingClarity: 2,
      surpriseFactor: 3,      // First practical gene-editing CV use
      downsideContained: 1,   // Gene editing safety risk
      marketDepth: 2,
      tier: 'Tradable'        // Total = 11, but more risk
    }
  },
  {
    name: 'KT-621 STAT6 Degrader AD (Kymera)',
    score: {
      eventLeverage: 3,
      timingClarity: 2,
      surpriseFactor: 3,      // Oral degrader
      downsideContained: 2,
      marketDepth: 3,
      tier: 'High-Torque'
    }
  }
];

export const CatalystScoringExample: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = sampleCatalysts[selectedIndex];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>CATALYST SCORING RADAR</h1>
        <p className={styles.subtitle}>
          "Ionis-style" stealth catalyst watchlist with 5-dimensional scoring
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>SELECT CATALYST</h3>
          <div className={styles.catalystList}>
            {sampleCatalysts.map((cat, idx) => (
              <button
                key={idx}
                className={`${styles.catalystButton} ${idx === selectedIndex ? styles.active : ''}`}
                onClick={() => setSelectedIndex(idx)}
              >
                <div className={styles.catalystName}>{cat.name}</div>
                <div className={styles.catalystScore}>
                  {(cat.score.eventLeverage + cat.score.timingClarity + 
                    cat.score.surpriseFactor + cat.score.downsideContained + 
                    cat.score.marketDepth)}/16
                </div>
                <div className={`${styles.catalystTier} ${styles[cat.score.tier?.toLowerCase().replace('-', '') || '']}`}>
                  {cat.score.tier}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.main}>
          <CatalystScoringRadar
            score={selected.score}
            title={selected.name}
            size={400}
            showLegend={true}
            animate={true}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.infoBox}>
          <h4>📊 SCORING METHODOLOGY</h4>
          <ul>
            <li><strong>Event Leverage (0-4):</strong> Hard endpoint likely? Prespecified? Clinically persuasive?</li>
            <li><strong>Timing Clarity (0-3):</strong> Fixed PDUFA vs event-driven fog</li>
            <li><strong>Surprise Factor (0-3):</strong> Street models anchored on surrogate only? Precedent weak?</li>
            <li><strong>Downside Contained (0-3):</strong> CRL-type or class read-through favors asymmetry?</li>
            <li><strong>Market Depth (0-3):</strong> Payer appetite + population size + guideline friendliness</li>
          </ul>
        </div>

        <div className={styles.infoBox}>
          <h4>🎯 TIER CLASSIFICATIONS</h4>
          <ul>
            <li><strong>High-Torque (&gt;8/16):</strong> High asymmetric upside with contained downside</li>
            <li><strong>Tradable (6-8/16):</strong> Moderate setup with tradable risk/reward</li>
            <li><strong>Watch (&lt;6/16):</strong> Watch list candidate - lower conviction or clarity</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
