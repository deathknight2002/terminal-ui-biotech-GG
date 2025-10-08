import { Router } from 'express';

const router = Router();

// Sample epidemiology data
const DISEASE_MODELS = {
  DMD: {
    id: 'dmd-001',
    name: 'Duchenne Muscular Dystrophy',
    diseaseArea: 'DMD',
    prevalence: 1.5,
    incidence: 0.05,
    mortality: 0.03,
    targetPopulation: 15000,
  },
  nSCLC: {
    id: 'nsclc-001',
    name: 'Non-Small Cell Lung Cancer',
    diseaseArea: 'nSCLC',
    prevalence: 65,
    incidence: 42,
    mortality: 0.35,
    targetPopulation: 215000,
  },
  T2D: {
    id: 't2d-001',
    name: 'Type 2 Diabetes Mellitus',
    diseaseArea: 'T2D',
    prevalence: 10500,
    incidence: 550,
    mortality: 0.015,
    targetPopulation: 34600000,
  },
  COVID19: {
    id: 'covid19-001',
    name: 'COVID-19 (SARS-CoV-2)',
    diseaseArea: 'COVID19',
    prevalence: 450,
    incidence: 1200,
    mortality: 0.008,
    targetPopulation: 1485000,
  },
  SCD: {
    id: 'scd-001',
    name: 'Sickle Cell Disease',
    diseaseArea: 'SCD',
    prevalence: 30,
    incidence: 0.9,
    mortality: 0.02,
    targetPopulation: 100000,
  },
};

// Get all disease models
router.get('/models', (req, res) => {
  res.json({
    success: true,
    data: Object.values(DISEASE_MODELS),
    message: 'Disease models retrieved successfully',
  });
});

// Get specific disease model
router.get('/models/:diseaseArea', (req, res) => {
  const { diseaseArea } = req.params;
  const model = DISEASE_MODELS[diseaseArea as keyof typeof DISEASE_MODELS];
  
  if (!model) {
    return res.status(404).json({
      success: false,
      message: 'Disease model not found',
    });
  }
  
  res.json({
    success: true,
    data: model,
  });
});

// Get survival data for a disease
router.get('/survival/:diseaseArea', (req, res) => {
  const { diseaseArea } = req.params;
  
  // Placeholder - would fetch from database
  res.json({
    success: true,
    data: {
      diseaseArea,
      curves: [],
    },
    message: 'Survival data endpoint - data available from frontend models',
  });
});

// Get cohort stratification data
router.get('/cohorts/:diseaseArea', (req, res) => {
  const { diseaseArea } = req.params;
  
  res.json({
    success: true,
    data: {
      diseaseArea,
      cohorts: [],
    },
    message: 'Cohort data endpoint - data available from frontend models',
  });
});

// Calculate intervention outcomes
router.post('/intervention/calculate', (req, res) => {
  const { diseaseArea, interventionType, targetPopulation, effectivenessRate } = req.body;
  
  // Placeholder calculation
  const casesAvoided = Math.round(targetPopulation * effectivenessRate * 0.3);
  const deathsAvoided = Math.round(casesAvoided * 0.15);
  const qalysGained = casesAvoided * 2.5;
  
  res.json({
    success: true,
    data: {
      diseaseArea,
      interventionType,
      casesAvoided,
      deathsAvoided,
      qualityAdjustedLifeYears: qalysGained,
      costEffectiveness: 45000, // $ per QALY
    },
  });
});

// Get geospatial disease data
router.get('/geospatial/:diseaseArea', (req, res) => {
  const { diseaseArea } = req.params;
  
  res.json({
    success: true,
    data: {
      diseaseArea,
      regions: [],
    },
    message: 'Geospatial data endpoint - data available from frontend models',
  });
});

// Get treatment patterns
router.get('/treatment-patterns/:diseaseArea', (req, res) => {
  const { diseaseArea } = req.params;
  
  res.json({
    success: true,
    data: {
      diseaseArea,
      patterns: [],
    },
    message: 'Treatment patterns endpoint - data available from frontend models',
  });
});

// Simulate population health impact
router.post('/simulation/population-impact', (req, res) => {
  const { diseaseArea, timeHorizon, interventions } = req.body;
  
  // Placeholder simulation results
  const years = Array.from({ length: timeHorizon || 10 }, (_, i) => ({
    year: 2025 + i,
    population: 330000000 + i * 1000000,
    cases: 100000 - i * 500,
    deaths: 5000 - i * 100,
    healthcareCost: 5000000000 + i * 100000000,
  }));
  
  res.json({
    success: true,
    data: {
      diseaseArea,
      timeSeries: years,
    },
  });
});

// Compare disease burden across diseases
router.get('/burden/comparison', (req, res) => {
  const comparisons = Object.entries(DISEASE_MODELS).map(([key, model]) => ({
    disease: model.diseaseArea,
    diseaseName: model.name,
    prevalence: model.prevalence,
    incidence: model.incidence,
    mortality: model.mortality,
    targetPopulation: model.targetPopulation,
    totalBurden: model.targetPopulation * model.mortality * 10, // Simplified calculation
  }));
  
  res.json({
    success: true,
    data: comparisons.sort((a, b) => b.totalBurden - a.totalBurden),
  });
});

export { router as epidemiologyRouter };
