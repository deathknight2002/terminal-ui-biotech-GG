import { Router } from 'express';
import { diseaseDataService, DataSource, type DiseaseCategory } from '../services/disease-data-service';
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

export { router as epidemiologyRouter };
