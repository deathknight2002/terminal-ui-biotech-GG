import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { CohortData } from '../../../src/types/biotech';
import styles from './CohortStratificationChart.module.css';

export interface CohortStratificationChartProps {
  cohorts: CohortData[];
  metric?: 'population' | 'percentage' | 'prevalence' | 'incidence' | 'mortality';
  title?: string;
  height?: number;
  className?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const CohortStratificationChart: React.FC<CohortStratificationChartProps> = ({
  cohorts,
  metric = 'population',
  title = 'Cohort Stratification',
  height = 400,
  className,
}) => {
  // Group cohorts by stratification type
  const groupedCohorts = cohorts.reduce((acc, cohort) => {
    if (!acc[cohort.stratification]) {
      acc[cohort.stratification] = [];
    }
    acc[cohort.stratification].push(cohort);
    return acc;
  }, {} as Record<string, CohortData[]>);

  const getMetricValue = (cohort: CohortData): number => {
    switch (metric) {
      case 'population':
        return cohort.population;
      case 'percentage':
        return cohort.percentage;
      case 'prevalence':
        return cohort.prevalence || 0;
      case 'incidence':
        return cohort.incidence || 0;
      case 'mortality':
        return cohort.mortality || 0;
      default:
        return cohort.population;
    }
  };

  const getMetricLabel = (): string => {
    switch (metric) {
      case 'population':
        return 'Population';
      case 'percentage':
        return 'Percentage (%)';
      case 'prevalence':
        return 'Prevalence (per 100k)';
      case 'incidence':
        return 'Incidence (per 100k/yr)';
      case 'mortality':
        return 'Mortality Rate';
      default:
        return 'Value';
    }
  };

  const formatValue = (value: number): string => {
    if (metric === 'population') {
      return value.toLocaleString();
    } else if (metric === 'percentage') {
      return `${value.toFixed(1)}%`;
    } else if (metric === 'mortality') {
      return `${(value * 100).toFixed(2)}%`;
    } else {
      return value.toFixed(2);
    }
  };

  return (
    <div className={`${styles.cohortChart} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.metricLabel}>{getMetricLabel()}</div>
      </div>

      {Object.entries(groupedCohorts).map(([stratification, cohortGroup]) => {
        const chartData = cohortGroup.map((cohort) => ({
          name: cohort.category,
          value: getMetricValue(cohort),
          fullData: cohort,
        }));

        return (
          <div key={stratification} className={styles.chartSection}>
            <h4 className={styles.sectionTitle}>{stratification}</h4>
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  stroke="#cbd5e1"
                  style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <YAxis
                  stroke="#cbd5e1"
                  style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}
                  tickFormatter={(value) => {
                    if (metric === 'population' && value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    } else if (metric === 'population' && value >= 1000) {
                      return `${(value / 1000).toFixed(0)}K`;
                    }
                    return value.toString();
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.8125rem',
                  }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                  formatter={(value: number) => [formatValue(value), getMetricLabel()]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
};
