# Epidemiology Disease Models

This directory contains comprehensive epidemiologic data models for pharmaceutical and biotech analysis.

## Available Models

### 1. Duchenne Muscular Dystrophy (DMD)

**Disease Type:** Rare Genetic Disease

**Key Statistics:**
- Prevalence: 1.5 per 100,000
- Incidence: 0.05 per 100,000/year
- Target Population: ~15,000 patients (US)
- Gender Ratio: 100:1 (almost exclusively male)
- Average Age at Diagnosis: 12 years

**Includes:**
- Natural history survival curve
- Corticosteroid treatment survival
- Gene therapy projected survival (experimental)
- Age-based cohort stratification
- Disease stage stratification
- Geographic distribution data

### 2. Non-Small Cell Lung Cancer (nSCLC)

**Disease Type:** Oncology

**Key Statistics:**
- Prevalence: 65 per 100,000
- Incidence: 42 per 100,000/year
- Target Population: ~215,000 new cases annually (US)
- Gender Ratio: 1.2:1 (M:F)
- Average Age at Diagnosis: 68 years

**Includes:**
- Stage-specific survival curves (I, III, IV)
- Treatment pattern analysis (5 modalities)
- Stage-based cohort stratification
- Histology-based stratification
- Modern immunotherapy outcomes

### 3. Type 2 Diabetes (T2D)

**Disease Type:** Chronic Metabolic Disease

**Key Statistics:**
- Prevalence: 10,500 per 100,000 (10.5%)
- Incidence: 550 per 100,000/year
- Target Population: ~34.6M patients (US)
- Gender Ratio: 1.1:1 (M:F)
- Average Age at Diagnosis: 55 years

**Includes:**
- Glycemic control stratification
- Complication status cohorts
- Treatment patterns (6 medication classes)
- Prediabetes population data
- Global geographic distribution

### 4. COVID-19 (SARS-CoV-2)

**Disease Type:** Infectious Respiratory Disease

**Key Statistics:**
- Prevalence: 450 per 100,000 (active cases)
- Incidence: 1,200 per 100,000/year
- Case Fatality Rate: 0.8%
- Average Age: 42 years
- Gender Ratio: 1.0:1

**Includes:**
- Age-stratified cohorts
- Severity-based stratification
- Treatment patterns (6 interventions)
- Age-specific mortality rates
- Pandemic wave dynamics

### 5. Sickle Cell Disease (SCD)

**Disease Type:** Rare Blood Disorder

**Key Statistics:**
- Prevalence: 30 per 100,000
- Incidence: 0.9 per 100,000/year
- Target Population: ~100,000 patients (US)
- Gender Ratio: 1.0:1
- Average Age: 25 years

**Includes:**
- Standard care survival curve
- Hydroxyurea treatment survival
- Gene therapy survival (emerging)
- Age-based cohort stratification
- Crisis frequency stratification
- Treatment patterns (6 therapies)

## Data Structure

Each disease model includes:

### Core Model
```typescript
{
  id: string;
  name: string;
  diseaseArea: DiseaseAreaType;
  description: string;
  prevalence: number;
  incidence: number;
  mortality: number;
  targetPopulation: number;
  averageAge: number;
  genderRatio?: number;
  geographicDistribution?: Record<GeographicRegion, number>;
  lastUpdated: string;
}
```

### Survival Curves (where applicable)
- Multiple treatment cohorts
- Monthly time intervals
- Survival probability with confidence intervals
- Number at risk, events, and censored
- Median survival time
- Hazard ratios and p-values

### Cohort Stratification
- Age groups
- Disease stage/severity
- Treatment history
- Biomarker status
- Geographic location

### Treatment Patterns
- Line of therapy
- Usage percentage
- Treatment duration
- Annual cost
- Relative effectiveness

## Usage Examples

### Import All Models
```typescript
import {
  ALL_DISEASE_MODELS,
  DISEASE_MODEL_MAP,
  SURVIVAL_CURVES_MAP,
  COHORTS_MAP,
  TREATMENT_PATTERNS_MAP,
} from './epidemiologyModels';
```

### Get Specific Disease Data
```typescript
// Get DMD model
const dmdModel = DISEASE_MODEL_MAP.DMD;
console.log(dmdModel.prevalence); // 1.5

// Get nSCLC survival curves
const nsclcCurves = SURVIVAL_CURVES_MAP.nSCLC;
console.log(nsclcCurves[0].label); // "Stage I"

// Get T2D cohorts
const t2dCohorts = COHORTS_MAP.T2D;
console.log(t2dCohorts[0].category); // "Prediabetes"
```

### Filter and Transform Data
```typescript
// Get all rare diseases
const rareDiseases = ALL_DISEASE_MODELS.filter(
  model => model.prevalence < 10
);

// Get high-mortality diseases
const highMortality = ALL_DISEASE_MODELS.filter(
  model => model.mortality > 0.1
);

// Calculate total target population
const totalPopulation = ALL_DISEASE_MODELS.reduce(
  (sum, model) => sum + model.targetPopulation,
  0
);
```

## Data Sources and Methodology

### Data Sources
- Published clinical trial data
- FDA approval documents
- CDC and WHO epidemiologic databases
- Peer-reviewed medical literature
- Patient registry data
- Health economics studies

### Survival Analysis
- Kaplan-Meier method for survival curves
- Cox proportional hazards for hazard ratios
- Confidence intervals at 95% level
- Right-censored data handling
- Step function visualization

### Cohort Classification
- Standard medical staging systems
- ICD-10 disease classifications
- Age groups by clinical relevance
- Severity scales (disease-specific)

### Treatment Patterns
- Current standard of care
- Emerging therapies
- Real-world usage data
- Cost data from IQVIA and similar sources
- Effectiveness from clinical trials and RWE

## Validation and Updates

### Data Quality
- Cross-referenced with multiple sources
- Peer-reviewed where possible
- Conservative estimates when uncertain
- Documented assumptions

### Update Schedule
- Quarterly review of all models
- Immediate updates for breakthrough therapies
- Annual comprehensive revision
- Version tracking via lastUpdated field

### Known Limitations
- Some geographic data is US-centric
- Treatment patterns reflect current practice (2025)
- Emerging therapies have limited long-term data
- Cost data subject to regional variation

## Contributing

To add or update disease models:

1. Follow existing model structure
2. Include comprehensive documentation
3. Cite data sources
4. Add test data for validation
5. Update type definitions if needed
6. Submit pull request with rationale

## Related Documentation

- [Epidemiology Module Documentation](../docs/EPIDEMIOLOGY_MODULE.md)
- [Type Definitions](../src/types/biotech.ts)
- [Visualization Components](../frontend-components/src/epidemiology/)
- [Backend API](../backend/src/routes/epidemiology.ts)
