import React, { useState, useMemo } from 'react';
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

// Backend API URL
const API_URL = 'http://localhost:3001/api';

// Fetch disease data from backend
const fetchDiseaseData = async (diseaseId?: string) => {
  const endpoint = diseaseId 
    ? `${API_URL}/epidemiology/models/${diseaseId}`
    : `${API_URL}/epidemiology/models`;
    
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('Failed to fetch disease data');
  }
  const result = await response.json();
  return result.data;
};

// Search diseases from backend
const searchDiseases = async (query: string, filters?: any) => {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (filters?.category) {
    filters.category.forEach((cat: string) => params.append('category', cat));
  }
  if (filters?.dataSource) {
    filters.dataSource.forEach((src: string) => params.append('dataSource', src));
  }
  
  const response = await fetch(`${API_URL}/epidemiology/search?${params}`);
  if (!response.ok) {
    throw new Error('Failed to search diseases');
  }
  const result = await response.json();
  return result.data;
};

// Legacy API fetch function for fallback
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'population' | 'prevalence' | 'mortality'>('population');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dataSourceFilter, setDataSourceFilter] = useState<string[]>([]);

  // Search query for diseases
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['diseaseSearch', searchQuery, categoryFilter, dataSourceFilter],
    queryFn: () => searchDiseases(searchQuery, { category: categoryFilter, dataSource: dataSourceFilter }),
    staleTime: 5 * 60 * 1000,
    enabled: true,
  });

  // Query for selected disease detail
  const { data: selectedDisease, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['diseaseDetail', selectedDiseaseId],
    queryFn: () => selectedDiseaseId ? fetchDiseaseData(selectedDiseaseId) : null,
    staleTime: 5 * 60 * 1000,
    enabled: !!selectedDiseaseId,
  });

  // Available categories for filtering
  const categories = useMemo(() => {
    const cats = new Set<string>();
    searchResults?.forEach((disease: any) => {
      cats.add(disease.category);
    });
    return Array.from(cats);
  }, [searchResults]);

  // Available data sources
  const dataSources = useMemo(() => {
    const sources = new Set<string>();
    searchResults?.forEach((disease: any) => {
      disease.dataSources?.forEach((src: string) => sources.add(src));
    });
    return Array.from(sources);
  }, [searchResults]);

  const handleCategoryToggle = (category: string) => {
    setCategoryFilter(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleDataSourceToggle = (source: string) => {
    setDataSourceFilter(prev => 
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const displayedResults = searchResults || [];

  return (
    <div className="terminal-frame aurora-shimmer">
      <div className="terminal-headline">
        <div className="eyebrow">EPIDEMIOLOGY & POPULATION HEALTH ANALYTICS</div>
        <h1>DISEASE MODELING & INTERVENTION ANALYSIS</h1>
        <div className="subtitle">
          Comprehensive disease data from SEER, WHO, and CDC • {displayedResults.length} diseases indexed
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Panel title="Search & Filter" variant="glass" cornerBrackets>
        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search diseases by name, description, or ICD-10 code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className={styles.clearButton}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Categories:</label>
              <div className={styles.filterTags}>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`${styles.filterTag} ${categoryFilter.includes(category) ? styles.active : ''}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Data Sources:</label>
              <div className={styles.filterTags}>
                {dataSources.map(source => (
                  <button
                    key={source}
                    onClick={() => handleDataSourceToggle(source)}
                    className={`${styles.filterTag} ${dataSourceFilter.includes(source) ? styles.active : ''}`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Search Results */}
      <Panel title={`Disease Database (${displayedResults.length} results)`} variant="glass" cornerBrackets>
        {isSearching ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Searching diseases...</p>
          </div>
        ) : (
          <div className={styles.diseaseGrid}>
            {displayedResults.map((disease: any) => (
              <button
                key={disease.id}
                className={`${styles.diseaseCard} ${selectedDiseaseId === disease.id ? styles.active : ''}`}
                onClick={() => setSelectedDiseaseId(disease.id)}
              >
                <div className={styles.diseaseCardHeader}>
                  <h4 className={styles.diseaseName}>{disease.name}</h4>
                  <span className={styles.diseaseCategory}>{disease.category}</span>
                </div>
                {disease.icd10Code && (
                  <div className={styles.icd10Code}>ICD-10: {disease.icd10Code}</div>
                )}
                <div className={styles.diseaseStats}>
                  <div className={styles.diseaseStat}>
                    <span className={styles.statLabel}>Prevalence</span>
                    <span className={styles.statValue}>{disease.prevalence.toFixed(1)}</span>
                  </div>
                  <div className={styles.diseaseStat}>
                    <span className={styles.statLabel}>Population</span>
                    <span className={styles.statValue}>{(disease.targetPopulation / 1000000).toFixed(2)}M</span>
                  </div>
                </div>
                <div className={styles.dataSources}>
                  {disease.dataSources?.map((source: string) => (
                    <span key={source} className={styles.dataSourceBadge}>{source}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      {/* Selected Disease Detail */}
      {selectedDisease && (
        <>
          {/* Key Metrics */}
          <div className={styles.metricsGrid}>
            <MetricCard
              label="Prevalence"
              value={selectedDisease.prevalence.toFixed(2)}
              subtitle="per 100,000 population"
              variant="primary"
              cornerBrackets
            />
            <MetricCard
              label="Incidence"
              value={selectedDisease.incidence.toFixed(2)}
              subtitle="per 100,000 per year"
              variant="secondary"
              cornerBrackets
            />
            <MetricCard
              label="Target Population"
              value={selectedDisease.targetPopulation.toLocaleString()}
              subtitle="patients globally"
              variant="revenue"
              cornerBrackets
            />
            <MetricCard
              label="Mortality Rate"
              value={`${(selectedDisease.mortality * 100).toFixed(2)}%`}
              subtitle="annual mortality"
              variant="error"
              cornerBrackets
            />
            <MetricCard
              label="Average Age"
              value={selectedDisease.averageAge.toString()}
              subtitle="years at diagnosis"
              variant="info"
              cornerBrackets
            />
            <MetricCard
              label="Gender Ratio"
              value={selectedDisease.genderRatio?.toFixed(1) || 'N/A'}
              subtitle="M:F ratio"
              variant="primary"
              cornerBrackets
            />
          </div>

          {/* Disease Description */}
          <Panel title="Disease Overview" variant="glass" cornerBrackets>
            <p className={styles.description}>{selectedDisease.description}</p>
            
            {selectedDisease.geographicDistribution && (
              <div className={styles.geographicDistribution}>
                <h4>Geographic Distribution</h4>
                <div className={styles.distributionGrid}>
                  {Object.entries(selectedDisease.geographicDistribution).map(([region, percentage]) => (
                    <div key={region} className={styles.distributionItem}>
                      <span className={styles.regionName}>{region}</span>
                      <span className={styles.regionPercentage}>
                        {((percentage as number) * 100).toFixed(0)}%
                      </span>
                      <div className={styles.distributionBar}>
                        <div
                          className={styles.distributionFill}
                          style={{ width: `${(percentage as number) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Source Information */}
            <div className={styles.dataSourceInfo}>
              <h4>Data Sources</h4>
              <div className={styles.dataSourceDetails}>
                {selectedDisease.seerData && (
                  <div className={styles.sourceDetail}>
                    <strong>SEER (Cancer Statistics):</strong> 5-year survival: {selectedDisease.seerData.fiveYearSurvival}%
                  </div>
                )}
                {selectedDisease.whoData && (
                  <div className={styles.sourceDetail}>
                    <strong>WHO (Global Health):</strong> DALYs: {(selectedDisease.whoData.dalys / 1000000).toFixed(1)}M
                  </div>
                )}
                {selectedDisease.cdcData && (
                  <div className={styles.sourceDetail}>
                    <strong>CDC (US Surveillance):</strong> US Cases: {selectedDisease.cdcData.usCases.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* WHO Regional Data */}
          {selectedDisease.whoData?.regionalData && (
            <Panel title="WHO Regional Disease Burden" variant="glass" cornerBrackets>
              <div className={styles.regionalDataGrid}>
                {selectedDisease.whoData.regionalData.map((region: any) => (
                  <div key={region.region} className={styles.regionalCard}>
                    <h4>{region.region}</h4>
                    <div className={styles.regionalStats}>
                      <div>
                        <span className={styles.statLabel}>Prevalence</span>
                        <span className={styles.statValue}>{region.prevalence.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className={styles.statLabel}>Mortality</span>
                        <span className={styles.statValue}>{(region.mortality * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* CDC Demographics */}
          {selectedDisease.cdcData?.demographics && (
            <Panel title="CDC US Demographics" variant="glass" cornerBrackets>
              <div className={styles.demographicsGrid}>
                {selectedDisease.cdcData.demographics.map((demo: any) => (
                  <div key={demo.ageGroup} className={styles.demographicCard}>
                    <h4>{demo.ageGroup}</h4>
                    <div className={styles.demographicStats}>
                      <div>
                        <span className={styles.statLabel}>Cases</span>
                        <span className={styles.statValue}>{demo.cases.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className={styles.statLabel}>Rate</span>
                        <span className={styles.statValue}>{demo.rate.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}

      {!selectedDiseaseId && !isSearching && (
        <div className={styles.emptyState}>
          <p>Select a disease from the database to view detailed epidemiological information</p>
        </div>
      )}

      {isLoadingDetail && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading disease details...</p>
        </div>
      )}
    </div>
  );
}
