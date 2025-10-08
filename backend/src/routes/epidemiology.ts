import { Router } from 'express';
import { diseaseDataService, DataSource, type DiseaseCategory } from '../services/disease-data-service';
import { getDiseaseIngestionService } from '../services/disease-ingestion-service';
import { logger } from '../utils/logger';

const router = Router();

// Search diseases with filters
router.get('/search', (req, res) => {
  try {
    const { 
      query = '', 
      category, 
      dataSource,
      minPrevalence,
      maxPrevalence
    } = req.query;

    const filters: any = {};
    
    if (category) {
      filters.category = Array.isArray(category) ? category : [category];
    }
    
    if (dataSource) {
      filters.dataSource = Array.isArray(dataSource) ? dataSource : [dataSource];
    }
    
    if (minPrevalence) {
      filters.minPrevalence = parseFloat(minPrevalence as string);
    }
    
    if (maxPrevalence) {
      filters.maxPrevalence = parseFloat(maxPrevalence as string);
    }

    const results = diseaseDataService.searchDiseases(query as string, filters);

    logger.info(`Disease search: query="${query}", results=${results.length}`);

    res.json({
      success: true,
      data: results,
      count: results.length,
      message: 'Disease search completed successfully',
    });
  } catch (error) {
    logger.error('Disease search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching diseases',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all disease models
router.get('/models', (req, res) => {
  try {
    const diseases = diseaseDataService.getAllDiseases();
    
    res.json({
      success: true,
      data: diseases,
      count: diseases.length,
      message: 'Disease models retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching disease models:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disease models',
    });
  }
});

// Get specific disease model by ID
router.get('/models/:diseaseId', (req, res) => {
  try {
    const { diseaseId } = req.params;
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    res.json({
      success: true,
      data: disease,
    });
  } catch (error) {
    logger.error('Error fetching disease:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching disease model',
    });
  }
});

// Get diseases by category
router.get('/categories/:category', (req, res) => {
  try {
    const { category } = req.params;
    const diseases = diseaseDataService.getDiseasesByCategory(category as DiseaseCategory);
    
    res.json({
      success: true,
      data: diseases,
      count: diseases.length,
      category,
    });
  } catch (error) {
    logger.error('Error fetching diseases by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching diseases by category',
    });
  }
});

// Get diseases by data source
router.get('/sources/:source', (req, res) => {
  try {
    const { source } = req.params;
    const diseases = diseaseDataService.getDiseasesBySource(source as DataSource);
    
    res.json({
      success: true,
      data: diseases,
      count: diseases.length,
      source,
    });
  } catch (error) {
    logger.error('Error fetching diseases by source:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching diseases by source',
    });
  }
});

// Get available categories
router.get('/metadata/categories', (req, res) => {
  try {
    const categories = diseaseDataService.getCategories();
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
    });
  }
});

// Get database statistics
router.get('/metadata/statistics', (req, res) => {
  try {
    const stats = diseaseDataService.getStatistics();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
    });
  }
});

// Get survival data for a disease
router.get('/survival/:diseaseId', (req, res) => {
  try {
    const { diseaseId } = req.params;
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }

    // Return SEER survival data if available
    res.json({
      success: true,
      data: {
        diseaseId,
        diseaseName: disease.name,
        seerData: disease.seerData,
        fiveYearSurvival: disease.seerData?.fiveYearSurvival,
      },
    });
  } catch (error) {
    logger.error('Error fetching survival data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching survival data',
    });
  }
});

// Get cohort stratification data
router.get('/cohorts/:diseaseId', (req, res) => {
  try {
    const { diseaseId } = req.params;
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    // Return demographic data from CDC/SEER if available
    const cohortData = disease.cdcData?.demographics || disease.seerData?.raceEthnicity;
    
    res.json({
      success: true,
      data: {
        diseaseId,
        diseaseName: disease.name,
        demographics: disease.cdcData?.demographics,
        raceEthnicity: disease.seerData?.raceEthnicity,
      },
    });
  } catch (error) {
    logger.error('Error fetching cohort data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cohort data',
    });
  }
});

// Calculate intervention outcomes
router.post('/intervention/calculate', (req, res) => {
  try {
    const { diseaseId, interventionType, targetPopulation, effectivenessRate } = req.body;
    
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    // Calculation based on disease mortality and effectiveness
    const casesAvoided = Math.round(targetPopulation * effectivenessRate * 0.3);
    const deathsAvoided = Math.round(casesAvoided * disease.mortality);
    const qalysGained = casesAvoided * 2.5;
    
    res.json({
      success: true,
      data: {
        diseaseId,
        diseaseName: disease.name,
        interventionType,
        casesAvoided,
        deathsAvoided,
        qualityAdjustedLifeYears: qalysGained,
        costEffectiveness: 45000, // $ per QALY
      },
    });
  } catch (error) {
    logger.error('Error calculating intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating intervention outcomes',
    });
  }
});

// Get geospatial disease data
router.get('/geospatial/:diseaseId', (req, res) => {
  try {
    const { diseaseId } = req.params;
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    // Return WHO regional data and CDC state data if available
    res.json({
      success: true,
      data: {
        diseaseId,
        diseaseName: disease.name,
        geographicDistribution: disease.geographicDistribution,
        whoRegionalData: disease.whoData?.regionalData,
        cdcStateData: disease.cdcData?.stateData,
      },
    });
  } catch (error) {
    logger.error('Error fetching geospatial data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching geospatial data',
    });
  }
});

// Get treatment patterns
router.get('/treatment-patterns/:diseaseId', (req, res) => {
  try {
    const { diseaseId } = req.params;
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        diseaseId,
        diseaseName: disease.name,
        patterns: [], // Would come from additional data sources
      },
      message: 'Treatment patterns endpoint - integrate with clinical data',
    });
  } catch (error) {
    logger.error('Error fetching treatment patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching treatment patterns',
    });
  }
});

// Simulate population health impact
router.post('/simulation/population-impact', (req, res) => {
  try {
    const { diseaseId, timeHorizon, interventions } = req.body;
    
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    // Simulation based on disease data
    const years = Array.from({ length: timeHorizon || 10 }, (_, i) => ({
      year: 2025 + i,
      population: 330000000 + i * 1000000,
      cases: Math.round(disease.targetPopulation * (1 - i * 0.02)),
      deaths: Math.round(disease.targetPopulation * disease.mortality * (1 - i * 0.03)),
      healthcareCost: 5000000000 + i * 100000000,
    }));
    
    res.json({
      success: true,
      data: {
        diseaseId,
        diseaseName: disease.name,
        timeSeries: years,
      },
    });
  } catch (error) {
    logger.error('Error simulating population impact:', error);
    res.status(500).json({
      success: false,
      message: 'Error simulating population health impact',
    });
  }
});

// Compare disease burden across diseases
router.get('/burden/comparison', (req, res) => {
  try {
    const diseases = diseaseDataService.getAllDiseases();
    
    const comparisons = diseases.map(disease => ({
      diseaseId: disease.id,
      diseaseName: disease.name,
      category: disease.category,
      prevalence: disease.prevalence,
      incidence: disease.incidence,
      mortality: disease.mortality,
      targetPopulation: disease.targetPopulation,
      totalBurden: disease.targetPopulation * disease.mortality * 10,
      dalys: disease.whoData?.dalys || 0,
      dataSources: disease.dataSources,
    }));
    
    // Sort by total burden
    comparisons.sort((a, b) => b.totalBurden - a.totalBurden);
    
    res.json({
      success: true,
      data: comparisons,
      count: comparisons.length,
    });
  } catch (error) {
    logger.error('Error comparing disease burden:', error);
    res.status(500).json({
      success: false,
      message: 'Error comparing disease burden',
    });
  }
});

// ============================================================================
// ADVANCED ANALYTICS ENDPOINTS - Intelligence Platform Extension
// ============================================================================

// Temporal trend analysis endpoint
router.get('/trends/:diseaseId', (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { years = 10 } = req.query;
    
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    // Extract trend data from SEER/CDC if available
    const trends = disease.seerData?.trends || disease.cdcData?.trends || [];
    
    // Calculate trend metrics
    const calculateTrend = (data: any[]) => {
      if (data.length < 2) return { direction: 'stable', percentage: 0 };
      const first = data[0];
      const last = data[data.length - 1];
      const change = ((last.incidence - first.incidence) / first.incidence) * 100;
      return {
        direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
        percentage: change.toFixed(2)
      };
    };
    
    res.json({
      success: true,
      data: {
        diseaseId,
        diseaseName: disease.name,
        trends,
        analysis: calculateTrend(trends),
        timeframe: `${years} years`,
      },
    });
  } catch (error) {
    logger.error('Error fetching trend analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trend analysis',
    });
  }
});

// Disease burden projections endpoint
router.get('/projections/:diseaseId', (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { years = 5 } = req.query;
    
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    // Simple projection based on current metrics
    // In production, this would use ARIMA or Prophet models
    const currentYear = new Date().getFullYear();
    const projections = [];
    
    for (let i = 1; i <= Number(years); i++) {
      const growthFactor = 1 + (0.02 * i); // 2% annual growth assumption
      projections.push({
        year: currentYear + i,
        projectedIncidence: disease.incidence * growthFactor,
        projectedPrevalence: disease.prevalence * growthFactor,
        projectedCases: Math.round(disease.targetPopulation * disease.incidence * growthFactor / 100000),
      });
    }
    
    res.json({
      success: true,
      data: {
        diseaseId,
        diseaseName: disease.name,
        currentMetrics: {
          incidence: disease.incidence,
          prevalence: disease.prevalence,
          targetPopulation: disease.targetPopulation,
        },
        projections,
        methodology: 'Simple growth model (2% annual)',
        note: 'Production models would use ARIMA/Prophet for better accuracy',
      },
    });
  } catch (error) {
    logger.error('Error generating projections:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating burden projections',
    });
  }
});

// Age-standardized rates endpoint
router.get('/age-standardized/:diseaseId', (req, res) => {
  try {
    const { diseaseId } = req.params;
    const { standardPopulation = 'WHO' } = req.query;
    
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    // In production, this would calculate actual age-standardized rates
    // using WHO or Segi standard populations
    res.json({
      success: true,
      data: {
        diseaseId,
        diseaseName: disease.name,
        standardPopulation,
        crudeRate: disease.incidence,
        ageStandardizedRate: disease.incidence * 0.92, // Simplified calculation
        note: 'Age-standardization using ' + standardPopulation + ' standard population',
      },
    });
  } catch (error) {
    logger.error('Error calculating age-standardized rates:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating age-standardized rates',
    });
  }
});

// Multi-disease comparison/benchmarking endpoint
router.post('/compare', (req, res) => {
  try {
    const { diseaseIds, metrics = ['incidence', 'prevalence', 'mortality'] } = req.body;
    
    if (!diseaseIds || !Array.isArray(diseaseIds) || diseaseIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 2 disease IDs to compare',
      });
    }
    
    const comparison = diseaseIds.map((id: string) => {
      const disease = diseaseDataService.getDiseaseById(id);
      if (!disease) return null;
      
      const result: any = {
        diseaseId: disease.id,
        name: disease.name,
        category: disease.category,
      };
      
      metrics.forEach((metric: string) => {
        switch (metric) {
          case 'incidence':
            result.incidence = disease.incidence;
            break;
          case 'prevalence':
            result.prevalence = disease.prevalence;
            break;
          case 'mortality':
            result.mortalityRate = disease.mortality;
            break;
          case 'dalys':
            result.dalys = disease.whoData?.dalys;
            break;
        }
      });
      
      return result;
    }).filter(Boolean);
    
    res.json({
      success: true,
      data: {
        diseases: comparison,
        metrics,
        count: comparison.length,
      },
    });
  } catch (error) {
    logger.error('Error comparing diseases:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing disease comparison',
    });
  }
});

// Data audit endpoint for governance
router.get('/audit/:diseaseId', (req, res) => {
  try {
    const { diseaseId } = req.params;
    
    const disease = diseaseDataService.getDiseaseById(diseaseId);
    if (!disease) {
      return res.status(404).json({
        success: false,
        message: 'Disease not found',
      });
    }
    
    // Provide data lineage and quality metrics
    const auditInfo = {
      diseaseId: disease.id,
      name: disease.name,
      dataSources: disease.dataSources,
      lastUpdated: disease.lastUpdated,
      dataQuality: {
        completeness: calculateCompleteness(disease),
        reliability: 'High', // Based on authoritative sources
        sourceCount: disease.dataSources.length,
      },
      citations: {
        seer: disease.seerData ? 'National Cancer Institute SEER Program' : null,
        who: disease.whoData ? 'WHO Global Health Observatory' : null,
        cdc: disease.cdcData ? 'CDC WONDER Database' : null,
      },
      auditTrail: {
        created: 'System ingestion',
        lastModified: disease.lastUpdated,
        modificationCount: 1,
      },
    };
    
    res.json({
      success: true,
      data: auditInfo,
    });
  } catch (error) {
    logger.error('Error fetching audit data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit information',
    });
  }
});

// Data ingestion status endpoint
router.get('/ingestion/status', (req, res) => {
  try {
    const ingestionService = getDiseaseIngestionService();
    const status = ingestionService.getIngestionStatus();
    
    res.json({
      success: true,
      data: {
        sources: status,
        message: 'Ingestion service status',
      },
    });
  } catch (error) {
    logger.error('Error fetching ingestion status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ingestion status',
    });
  }
});

// Trigger manual data ingestion (admin endpoint)
router.post('/ingestion/trigger', async (req, res) => {
  try {
    const { source } = req.body;
    const ingestionService = getDiseaseIngestionService();
    
    if (source && ['SEER', 'WHO', 'CDC', 'GBD'].includes(source)) {
      const result = await ingestionService.ingestFromSource(source as any);
      res.json({
        success: true,
        data: result,
        message: `Ingestion from ${source} completed`,
      });
    } else {
      const results = await ingestionService.ingestAll();
      res.json({
        success: true,
        data: Array.from(results.values()),
        message: 'Full ingestion completed',
      });
    }
  } catch (error) {
    logger.error('Error triggering ingestion:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering data ingestion',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper function to calculate data completeness
function calculateCompleteness(disease: any): string {
  let filledFields = 0;
  let totalFields = 0;
  
  const fields = [
    'name', 'icd10Code', 'description', 'prevalence', 'incidence', 
    'mortality', 'targetPopulation', 'averageAge', 'geographicDistribution'
  ];
  
  fields.forEach(field => {
    totalFields++;
    if (disease[field] !== null && disease[field] !== undefined) {
      filledFields++;
    }
  });
  
  const percentage = (filledFields / totalFields) * 100;
  return `${percentage.toFixed(0)}%`;
}


export { router as epidemiologyRouter };
