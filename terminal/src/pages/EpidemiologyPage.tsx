import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ALL_DISEASE_MODELS,
  DISEASE_MODEL_MAP,
  SURVIVAL_CURVES_MAP,
  COHORTS_MAP,
  TREATMENT_PATTERNS_MAP,
} from '../../../src/data/epidemiologyModels';
import type { DiseaseAreaType } from '../../../src/types/biotech';
import { SurvivalCurveChart } from '../../../frontend-components/src/epidemiology/visualizations/SurvivalCurveChart';
import { CohortStratificationChart } from '../../../frontend-components/src/epidemiology/visualizations/CohortStratificationChart';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel';
import { MetricCard } from '../../../frontend-components/src/terminal/molecules/MetricCard/MetricCard';
import styles from './EpidemiologyPage.module.css';

// Mock API fetch function
const fetchEpidemiologyData = async (diseaseArea: DiseaseAreaType) => {
  // In production, this would fetch from backend API
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  return {
    model: DISEASE_MODEL_MAP[diseaseArea],
    survivalCurves: SURVIVAL_CURVES_MAP[diseaseArea] || [],
    cohorts: COHORTS_MAP[diseaseArea] || [],
    treatmentPatterns: TREATMENT_PATTERNS_MAP[diseaseArea] || [],
  };
};

export function EpidemiologyPage() {
  const [selectedDisease, setSelectedDisease] = useState<DiseaseAreaType>('DMD');
  const [selectedMetric, setSelectedMetric] = useState<'population' | 'prevalence' | 'mortality'>('population');

  const { data, isLoading } = useQuery({
    queryKey: ['epidemiology', selectedDisease],
    queryFn: () => fetchEpidemiologyData(selectedDisease),
    staleTime: 5 * 60 * 1000,
  });

  const model = data?.model;
  const survivalCurves = data?.survivalCurves || [];
  const cohorts = data?.cohorts || [];

  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">EPIDEMIOLOGY & POPULATION HEALTH ANALYTICS</div>
        <h1>DISEASE MODELING & INTERVENTION ANALYSIS</h1>
        <div className="subtitle">
          Survival analysis, cohort stratification, treatment patterns & population impact
        </div>
      </div>

      {/* Disease Selector */}
      <div className={styles.controls}>
        <Panel title="Disease Selection" variant="glass" cornerBrackets>
          <div className={styles.diseaseGrid}>
            {ALL_DISEASE_MODELS.map((diseaseModel) => (
              <button
                key={diseaseModel.id}
                className={`${styles.diseaseButton} ${
                  selectedDisease === diseaseModel.diseaseArea ? styles.active : ''
                }`}
                onClick={() => setSelectedDisease(diseaseModel.diseaseArea)}
              >
                <div className={styles.diseaseName}>{diseaseModel.name}</div>
                <div className={styles.diseaseType}>{diseaseModel.diseaseArea}</div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* Key Metrics */}
      {model && (
        <div className={styles.metricsGrid}>
          <MetricCard
            label="Prevalence"
            value={model.prevalence.toFixed(2)}
            subtitle="per 100,000 population"
            variant="primary"
            cornerBrackets
          />
          <MetricCard
            label="Incidence"
            value={model.incidence.toFixed(2)}
            subtitle="per 100,000 per year"
            variant="secondary"
            cornerBrackets
          />
          <MetricCard
            label="Target Population"
            value={model.targetPopulation.toLocaleString()}
            subtitle="patients globally"
            variant="revenue"
            cornerBrackets
          />
          <MetricCard
            label="Mortality Rate"
            value={`${(model.mortality * 100).toFixed(2)}%`}
            subtitle="annual mortality"
            variant="error"
            cornerBrackets
          />
          <MetricCard
            label="Average Age"
            value={model.averageAge.toString()}
            subtitle="years at diagnosis"
            variant="info"
            cornerBrackets
          />
          <MetricCard
            label="Gender Ratio"
            value={model.genderRatio.toFixed(1)}
            subtitle="M:F ratio"
            variant="primary"
            cornerBrackets
          />
        </div>
      )}

      {/* Disease Description */}
      {model && (
        <Panel title="Disease Overview" variant="glass" cornerBrackets>
          <p className={styles.description}>{model.description}</p>
          <div className={styles.geographicDistribution}>
            <h4>Geographic Distribution</h4>
            <div className={styles.distributionGrid}>
              {Object.entries(model.geographicDistribution || {}).map(([region, percentage]) => (
                <div key={region} className={styles.distributionItem}>
                  <span className={styles.regionName}>{region}</span>
                  <span className={styles.regionPercentage}>
                    {(percentage * 100).toFixed(0)}%
                  </span>
                  <div className={styles.distributionBar}>
                    <div
                      className={styles.distributionFill}
                      style={{ width: `${percentage * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* Survival Analysis */}
      {survivalCurves.length > 0 && (
        <Panel title="Survival Analysis" variant="glass" cornerBrackets>
          <SurvivalCurveChart curves={survivalCurves} height={500} />
        </Panel>
      )}

      {/* Cohort Stratification */}
      {cohorts.length > 0 && (
        <Panel title="Cohort Stratification" variant="glass" cornerBrackets>
          <div className={styles.metricSelector}>
            <label>Display Metric:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className={styles.metricDropdown}
            >
              <option value="population">Population</option>
              <option value="prevalence">Prevalence</option>
              <option value="mortality">Mortality</option>
            </select>
          </div>
          <CohortStratificationChart
            cohorts={cohorts}
            metric={selectedMetric}
            height={350}
          />
        </Panel>
      )}

      {/* Treatment Patterns */}
      {data?.treatmentPatterns && data.treatmentPatterns.length > 0 && (
        <Panel title="Treatment Patterns" variant="glass" cornerBrackets>
          <div className={styles.treatmentGrid}>
            {data.treatmentPatterns.map((treatment) => (
              <div key={treatment.id} className={styles.treatmentCard}>
                <div className={styles.treatmentHeader}>
                  <h4 className={styles.treatmentName}>{treatment.name}</h4>
                  <span className={styles.lineOfTherapy}>
                    L{treatment.lineOfTherapy}
                  </span>
                </div>
                <div className={styles.treatmentStats}>
                  <div className={styles.treatmentStat}>
                    <span className={styles.statLabel}>Usage</span>
                    <span className={styles.statValue}>{treatment.percentage}%</span>
                  </div>
                  <div className={styles.treatmentStat}>
                    <span className={styles.statLabel}>Duration</span>
                    <span className={styles.statValue}>
                      {treatment.duration === 999 ? 'Ongoing' : `${treatment.duration}mo`}
                    </span>
                  </div>
                  <div className={styles.treatmentStat}>
                    <span className={styles.statLabel}>Annual Cost</span>
                    <span className={styles.statValue}>
                      ${(treatment.cost / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className={styles.treatmentStat}>
                    <span className={styles.statLabel}>Effectiveness</span>
                    <span className={styles.statValue}>
                      {(treatment.effectiveness * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className={styles.effectivenessBar}>
                  <div
                    className={styles.effectivenessFill}
                    style={{ width: `${treatment.effectiveness * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading epidemiological data...</p>
        </div>
      )}
    </div>
  );
}
