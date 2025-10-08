import React, { useState } from 'react';
import {
  SurvivalCurveChart,
  HazardRatioChart,
  CohortStratificationChart,
} from '../src';
import {
  DMD_MODEL,
  DMD_SURVIVAL_CURVES,
  DMD_COHORTS,
  NSCLC_SURVIVAL_CURVES,
  NSCLC_COHORTS,
  NSCLC_TREATMENT_PATTERNS,
} from '../src/data/epidemiologyModels';
import type { HazardRatioData } from '../src';
import styles from './EpidemiologyExample.module.css';

// Sample hazard ratio data for demonstration
const SAMPLE_HAZARD_RATIOS: HazardRatioData[] = [
  {
    intervention: 'Gene Therapy',
    control: 'Standard Care',
    hazardRatio: 0.45,
    ci_lower: 0.28,
    ci_upper: 0.72,
    pValue: 0.002,
    events_intervention: 15,
    events_control: 32,
    n_intervention: 100,
    n_control: 100,
  },
  {
    intervention: 'Corticosteroids',
    control: 'No Treatment',
    hazardRatio: 0.65,
    ci_lower: 0.52,
    ci_upper: 0.81,
    pValue: 0.001,
    events_intervention: 42,
    events_control: 68,
    n_intervention: 150,
    n_control: 150,
  },
];

const EpidemiologyExample: React.FC = () => {
  const [selectedDisease, setSelectedDisease] = useState<'DMD' | 'nSCLC'>('DMD');
  const [cohortMetric, setCohortMetric] = useState<'population' | 'prevalence' | 'mortality'>('population');

  const currentSurvivalCurves = selectedDisease === 'DMD' ? DMD_SURVIVAL_CURVES : NSCLC_SURVIVAL_CURVES;
  const currentCohorts = selectedDisease === 'DMD' ? DMD_COHORTS : NSCLC_COHORTS;
  const currentModel = selectedDisease === 'DMD' ? DMD_MODEL : null;

  return (
    <div className={styles.exampleContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Epidemiology Components Example</h1>
        <p className={styles.subtitle}>
          Comprehensive disease modeling and population health analytics
        </p>
      </div>

      {/* Disease Selector */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>Select Disease:</label>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.button} ${selectedDisease === 'DMD' ? styles.active : ''}`}
              onClick={() => setSelectedDisease('DMD')}
            >
              Duchenne Muscular Dystrophy
            </button>
            <button
              className={`${styles.button} ${selectedDisease === 'nSCLC' ? styles.active : ''}`}
              onClick={() => setSelectedDisease('nSCLC')}
            >
              Non-Small Cell Lung Cancer
            </button>
          </div>
        </div>
      </div>

      {/* Disease Overview */}
      {currentModel && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Disease Overview</h2>
          <div className={styles.overviewCard}>
            <h3>{currentModel.name}</h3>
            <p className={styles.description}>{currentModel.description}</p>
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Prevalence</span>
                <span className={styles.metricValue}>{currentModel.prevalence}/100k</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Incidence</span>
                <span className={styles.metricValue}>{currentModel.incidence}/100k/yr</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Target Population</span>
                <span className={styles.metricValue}>{currentModel.targetPopulation.toLocaleString()}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Mortality</span>
                <span className={styles.metricValue}>{(currentModel.mortality * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Survival Curves */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Survival Analysis</h2>
        <SurvivalCurveChart
          curves={currentSurvivalCurves}
          title={`${selectedDisease} Survival Curves`}
          showConfidenceIntervals={true}
          height={500}
        />
      </div>

      {/* Hazard Ratio Chart (DMD only) */}
      {selectedDisease === 'DMD' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Treatment Efficacy Comparison</h2>
          <HazardRatioChart
            data={SAMPLE_HAZARD_RATIOS}
            title="Hazard Ratios for DMD Treatments"
            showPValues={true}
            height={400}
          />
        </div>
      )}

      {/* Cohort Stratification */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Cohort Stratification</h2>
        <div className={styles.controlGroup}>
          <label className={styles.label}>Display Metric:</label>
          <select
            value={cohortMetric}
            onChange={(e) => setCohortMetric(e.target.value as any)}
            className={styles.select}
          >
            <option value="population">Population</option>
            <option value="prevalence">Prevalence</option>
            <option value="mortality">Mortality</option>
          </select>
        </div>
        <CohortStratificationChart
          cohorts={currentCohorts}
          metric={cohortMetric}
          title={`${selectedDisease} Patient Cohorts`}
          height={350}
        />
      </div>

      {/* Treatment Patterns (nSCLC only) */}
      {selectedDisease === 'nSCLC' && NSCLC_TREATMENT_PATTERNS && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Treatment Patterns</h2>
          <div className={styles.treatmentGrid}>
            {NSCLC_TREATMENT_PATTERNS.map((treatment) => (
              <div key={treatment.id} className={styles.treatmentCard}>
                <div className={styles.treatmentHeader}>
                  <h4>{treatment.name}</h4>
                  <span className={styles.lineOfTherapy}>L{treatment.lineOfTherapy}</span>
                </div>
                <div className={styles.treatmentStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Usage</span>
                    <span className={styles.statValue}>{treatment.percentage}%</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Duration</span>
                    <span className={styles.statValue}>{treatment.duration}mo</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Annual Cost</span>
                    <span className={styles.statValue}>${(treatment.cost / 1000).toFixed(0)}K</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Effectiveness</span>
                    <span className={styles.statValue}>{(treatment.effectiveness * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <p>
          This example demonstrates the comprehensive epidemiology visualization components
          available in the Biotech Terminal platform. For full documentation, see{' '}
          <code>docs/EPIDEMIOLOGY_MODULE.md</code>
        </p>
      </div>
    </div>
  );
};

export default EpidemiologyExample;
