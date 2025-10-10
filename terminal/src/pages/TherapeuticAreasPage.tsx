/**
 * Therapeutic Areas Intelligence Page
 * 
 * Spider web/radar chart visualization comparing therapeutic areas
 * across science attributes (unmet need, market size, etc.)
 * 
 * Features:
 * - Interactive radar chart with Aurora gradient theming
 * - Real biotech company data from DMD, Cardiology, IBD primers
 * - Mobile-responsive with liquid glass effects
 * - Hover tooltips and series toggling
 */

import React, { useEffect, useState } from 'react';
import { TherapeuticAreaRadarChart } from '../../../src/components/visualizations/TherapeuticAreaRadarChart/TherapeuticAreaRadarChart';
import styles from './TherapeuticAreasPage.module.css';

interface TherapeuticArea {
  id: string;
  name: string;
  attributes: {
    unmet_need: number;
    market_size: number;
    regulatory_support: number;
    scientific_validation: number;
    competitive_intensity: number;
    reimbursement_potential: number;
    patient_advocacy: number;
  };
  metadata: {
    description: string;
    prevalence: string;
    peak_sales_potential: string;
    key_mechanisms: string[];
  };
  companies: string[];
}

interface RadarChartData {
  chart_type: string;
  attributes: string[];
  series: Array<{
    id: string;
    name: string;
    values: number[];
    color: string;
    description: string;
  }>;
  scale: {
    min: number;
    max: number;
  };
  theme: string;
}

export const TherapeuticAreasPage: React.FC = () => {
  const [areas, setAreas] = useState<TherapeuticArea[]>([]);
  const [radarData, setRadarData] = useState<RadarChartData | null>(null);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchTherapeuticAreas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all therapeutic areas
      const areasResponse = await fetch('http://localhost:8000/api/v1/therapeutic-areas/areas');
      if (!areasResponse.ok) throw new Error('Failed to fetch therapeutic areas');
      const areasData = await areasResponse.json();
      setAreas(areasData.areas);

      // Fetch radar chart comparison data
      const radarResponse = await fetch('http://localhost:8000/api/v1/therapeutic-areas/areas/compare/radar');
      if (!radarResponse.ok) throw new Error('Failed to fetch radar data');
      const radarData = await radarResponse.json();
      setRadarData(radarData);
      
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching therapeutic areas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapeuticAreas();
  }, []);

  const handleRefresh = () => {
    fetchTherapeuticAreas();
  };

  const handleAreaFilter = (areaId: string) => {
    setSelectedAreas(prev => {
      if (prev.includes(areaId)) {
        return prev.filter(id => id !== areaId);
      } else {
        return [...prev, areaId];
      }
    });
  };

  // Filter radar data based on selected areas
  const filteredRadarData = radarData && selectedAreas.length > 0
    ? {
        ...radarData,
        series: radarData.series.filter(s => selectedAreas.includes(s.id))
      }
    : radarData;

  return (
    <div className={styles.therapeuticAreasPage}>
      {/* Header with Aurora glass effect */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <span className={styles.titleBracket}>[</span>
            THERAPEUTIC AREA INTELLIGENCE
            <span className={styles.titleBracket}>]</span>
          </h1>
          <p className={styles.subtitle}>
            Spider Web Analysis: Science Attributes × Market Dynamics
          </p>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? '⟳ REFRESHING...' : '↻ REFRESH DATA'}
          </button>
          <span className={styles.timestamp}>
            Last Updated: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorIcon}>⚠</span>
          <span className={styles.errorMessage}>{error}</span>
          <button className={styles.errorRetry} onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Left Panel - Area Cards */}
        <div className={styles.areasPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>THERAPEUTIC AREAS</h2>
            <span className={styles.areaCount}>{areas.length} AREAS</span>
          </div>

          <div className={styles.areasList}>
            {areas.map((area) => (
              <div 
                key={area.id}
                className={`${styles.areaCard} ${
                  selectedAreas.includes(area.id) ? styles.areaCardActive : ''
                }`}
                onClick={() => handleAreaFilter(area.id)}
              >
                <div className={styles.areaCardHeader}>
                  <h3 className={styles.areaName}>{area.name}</h3>
                  <div className={styles.areaIndicator} />
                </div>
                <p className={styles.areaDescription}>{area.metadata.description}</p>
                
                <div className={styles.areaMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>PREVALENCE</span>
                    <span className={styles.metricValue}>{area.metadata.prevalence}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>PEAK SALES</span>
                    <span className={styles.metricValue}>{area.metadata.peak_sales_potential}</span>
                  </div>
                </div>

                <div className={styles.areaCompanies}>
                  <span className={styles.companiesLabel}>COMPANIES:</span>
                  <span className={styles.companiesList}>
                    {area.companies.slice(0, 5).join(', ')}
                    {area.companies.length > 5 && ` +${area.companies.length - 5} more`}
                  </span>
                </div>

                <div className={styles.areaMechanisms}>
                  {area.metadata.key_mechanisms.slice(0, 3).map((mechanism, i) => (
                    <span key={i} className={styles.mechanismTag}>
                      {mechanism}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Spider Web Chart */}
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>SPIDER WEB ANALYSIS</h2>
            <span className={styles.chartSubtitle}>
              Science Attributes (0-10 Scale)
            </span>
          </div>

          {loading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p className={styles.loadingText}>Loading therapeutic area data...</p>
            </div>
          )}

          {!loading && filteredRadarData && (
            <div className={styles.chartContainer}>
              <TherapeuticAreaRadarChart
                series={filteredRadarData.series.map(s => ({
                  id: s.id,
                  name: s.name,
                  values: s.values,
                  color: s.color,
                  description: s.description
                }))}
                attributes={filteredRadarData.attributes}
                size={600}
                levels={5}
                animate={true}
                showLabels={true}
                showLegend={true}
                auroraGradient={true}
                maxValue={filteredRadarData.scale.max}
              />
            </div>
          )}

          {/* Legend / Attribute Descriptions */}
          <div className={styles.attributeGuide}>
            <h3 className={styles.guideTitle}>ATTRIBUTE DEFINITIONS</h3>
            <div className={styles.guideGrid}>
              <div className={styles.guideItem}>
                <span className={styles.guideDot} />
                <div>
                  <strong>Unmet Need</strong>: Medical necessity and current treatment gaps
                </div>
              </div>
              <div className={styles.guideItem}>
                <span className={styles.guideDot} />
                <div>
                  <strong>Market Size</strong>: Addressable patient population and revenue potential
                </div>
              </div>
              <div className={styles.guideItem}>
                <span className={styles.guideDot} />
                <div>
                  <strong>Regulatory Support</strong>: FDA/EMA pathway favorability and precedents
                </div>
              </div>
              <div className={styles.guideItem}>
                <span className={styles.guideDot} />
                <div>
                  <strong>Scientific Validation</strong>: Mechanism strength and clinical evidence
                </div>
              </div>
              <div className={styles.guideItem}>
                <span className={styles.guideDot} />
                <div>
                  <strong>Competitive Intensity</strong>: Number and quality of competing programs
                </div>
              </div>
              <div className={styles.guideItem}>
                <span className={styles.guideDot} />
                <div>
                  <strong>Reimbursement Potential</strong>: Payer willingness and pricing power
                </div>
              </div>
              <div className={styles.guideItem}>
                <span className={styles.guideDot} />
                <div>
                  <strong>Patient Advocacy</strong>: Community organization and awareness
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Insights Panel */}
      <div className={styles.insightsPanel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>KEY INSIGHTS</h2>
        </div>
        
        <div className={styles.insightsGrid}>
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>🧬</div>
            <h3 className={styles.insightTitle}>Rare Disease Dynamics</h3>
            <p className={styles.insightText}>
              DMD and other rare diseases show high unmet need (9.5+) and strong patient advocacy, 
              offset by smaller market size (6.5-7.8) and regulatory tailwinds via orphan drug status.
            </p>
          </div>

          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>❤️</div>
            <h3 className={styles.insightTitle}>Cardiology at Scale</h3>
            <p className={styles.insightText}>
              Cardiovascular area leads in market size (9.5) and scientific validation (9.0), 
              but faces intense competition (9.0) and complex reimbursement landscapes.
            </p>
          </div>

          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>🔬</div>
            <h3 className={styles.insightTitle}>Innovation Frontiers</h3>
            <p className={styles.insightText}>
              Gene therapy (DMD), RNAi therapeutics (Cardiology), and myosin inhibition represent 
              mechanistic differentiation opportunities with high scientific validation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
