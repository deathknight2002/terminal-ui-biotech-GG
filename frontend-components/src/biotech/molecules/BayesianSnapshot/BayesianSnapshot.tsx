import React from 'react';
import './BayesianSnapshot.css';

/**
 * Bayesian Snapshot Props
 */
export interface BayesianSnapshotProps {
  /** Prior probability (class/base rate) - between 0 and 1 */
  prior: number;
  /** Plain-English description of the prior (e.g., "30% of Phase II IBD trials succeed") */
  priorDescription: string;
  /** Likelihood description (trial design, power, multiplicity) */
  likelihoodDescription: string;
  /** Posterior thresholds for Win/Meh/Kill */
  posterior: {
    win: number;    // Threshold for "Win" outcome (e.g., 0.70 = 70%)
    meh: number;    // Threshold for "Meh" outcome (e.g., 0.40)
    kill: number;   // Threshold for "Kill" outcome (e.g., 0.15)
  };
  /** Source citations for prior/likelihood */
  sources?: Array<{
    label: string;
    url: string;
  }>;
  /** Optional: Show detailed math explanation */
  showMath?: boolean;
  /** Theme variant */
  variant?: 'default' | 'compact';
}

/**
 * Bayesian Snapshot Component
 * 
 * Displays plain-English Bayesian analysis for catalyst predictions:
 * - Prior: Class/base rates from historical data
 * - Likelihood: Trial design quality assessment
 * - Posterior: Specific Win/Meh/Kill thresholds
 * 
 * Example:
 * ```tsx
 * <BayesianSnapshot
 *   prior={0.30}
 *   priorDescription="30% of Phase II IBD trials achieve clinical remission (CT.gov 2015-2024)"
 *   likelihoodDescription="Double-blind, placebo-controlled, N=200, 80% power for ≥15% difference, pre-specified alpha=0.05"
 *   posterior={{ win: 0.70, meh: 0.40, kill: 0.15 }}
 *   sources={[
 *     { label: 'CT.gov Phase II IBD trials', url: 'https://clinicaltrials.gov' },
 *     { label: 'FDA UC Guidance 2016', url: 'https://www.fda.gov/...' }
 *   ]}
 * />
 * ```
 */
export const BayesianSnapshot: React.FC<BayesianSnapshotProps> = ({
  prior,
  priorDescription,
  likelihoodDescription,
  posterior,
  sources = [],
  showMath = false,
  variant = 'default',
}) => {
  // Format probability as percentage
  const formatProb = (p: number) => `${(p * 100).toFixed(0)}%`;

  // Determine outcome interpretation based on posterior values
  const getOutcomeLabel = (threshold: number): string => {
    if (threshold >= 0.7) return 'High confidence';
    if (threshold >= 0.5) return 'Moderate confidence';
    if (threshold >= 0.3) return 'Low confidence';
    return 'Very low confidence';
  };

  return (
    <div className={`bayesian-snapshot bayesian-snapshot--${variant}`}>
      <div className="bayesian-snapshot__header">
        <h4 className="bayesian-snapshot__title">BAYESIAN SNAPSHOT</h4>
        <span className="bayesian-snapshot__subtitle">Plain-English Math</span>
      </div>

      {/* Prior */}
      <div className="bayesian-snapshot__section">
        <div className="bayesian-snapshot__label">
          <span className="bayesian-snapshot__icon">📊</span>
          <strong>PRIOR (Base Rate)</strong>
        </div>
        <div className="bayesian-snapshot__value">{formatProb(prior)}</div>
        <p className="bayesian-snapshot__description">{priorDescription}</p>
      </div>

      {/* Likelihood */}
      <div className="bayesian-snapshot__section">
        <div className="bayesian-snapshot__label">
          <span className="bayesian-snapshot__icon">🔬</span>
          <strong>LIKELIHOOD (Trial Quality)</strong>
        </div>
        <p className="bayesian-snapshot__description">{likelihoodDescription}</p>
      </div>

      {/* Posterior Thresholds */}
      <div className="bayesian-snapshot__section">
        <div className="bayesian-snapshot__label">
          <span className="bayesian-snapshot__icon">🎯</span>
          <strong>POSTERIOR (Decision Thresholds)</strong>
        </div>
        
        <div className="bayesian-snapshot__thresholds">
          <div className="bayesian-snapshot__threshold bayesian-snapshot__threshold--win">
            <div className="bayesian-snapshot__threshold-label">
              <span className="bayesian-snapshot__threshold-icon">✓</span>
              <strong>WIN</strong>
            </div>
            <div className="bayesian-snapshot__threshold-value">
              ≥{formatProb(posterior.win)}
            </div>
            <div className="bayesian-snapshot__threshold-desc">
              {getOutcomeLabel(posterior.win)} for approval
            </div>
          </div>

          <div className="bayesian-snapshot__threshold bayesian-snapshot__threshold--meh">
            <div className="bayesian-snapshot__threshold-label">
              <span className="bayesian-snapshot__threshold-icon">~</span>
              <strong>MEH</strong>
            </div>
            <div className="bayesian-snapshot__threshold-value">
              {formatProb(posterior.kill)}–{formatProb(posterior.win)}
            </div>
            <div className="bayesian-snapshot__threshold-desc">
              Mixed signals; need more data
            </div>
          </div>

          <div className="bayesian-snapshot__threshold bayesian-snapshot__threshold--kill">
            <div className="bayesian-snapshot__threshold-label">
              <span className="bayesian-snapshot__threshold-icon">✗</span>
              <strong>KILL</strong>
            </div>
            <div className="bayesian-snapshot__threshold-value">
              &lt;{formatProb(posterior.kill)}
            </div>
            <div className="bayesian-snapshot__threshold-desc">
              Unlikely to meet regulatory bar
            </div>
          </div>
        </div>
      </div>

      {/* Math Explanation (optional) */}
      {showMath && (
        <div className="bayesian-snapshot__math">
          <details>
            <summary>Show Bayesian Math</summary>
            <div className="bayesian-snapshot__math-content">
              <p>
                <strong>Bayes' Theorem:</strong> P(Success|Evidence) = P(Evidence|Success) × P(Success) / P(Evidence)
              </p>
              <ul>
                <li><strong>Prior P(Success):</strong> {formatProb(prior)} (from historical CT.gov data)</li>
                <li><strong>Likelihood P(Evidence|Success):</strong> Assessed from trial design quality</li>
                <li><strong>Posterior P(Success|Evidence):</strong> Updated probability given the evidence</li>
              </ul>
              <p>
                Thresholds calibrated to regulatory decision-making context (FDA approval bar).
              </p>
            </div>
          </details>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="bayesian-snapshot__sources">
          <div className="bayesian-snapshot__sources-label">SOURCES:</div>
          <div className="bayesian-snapshot__sources-list">
            {sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                className="bayesian-snapshot__source-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
