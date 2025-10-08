# Epidemiology Module Documentation

## Overview

The Epidemiology Module provides comprehensive disease modeling, population health analytics, and intervention scenario planning capabilities for biotech and pharmaceutical applications. It includes visualization components, pre-built disease models, and API endpoints for epidemiologic analysis.

## Features

### 1. Disease-Specific Models

Five comprehensive disease models with realistic epidemiologic data:

- **Duchenne Muscular Dystrophy (DMD)** - Rare genetic disease
- **Non-Small Cell Lung Cancer (nSCLC)** - Oncology
- **Type 2 Diabetes (T2D)** - Chronic metabolic disease
- **COVID-19** - Infectious respiratory disease  
- **Sickle Cell Disease (SCD)** - Rare blood disorder

Each model includes:
- Prevalence and incidence rates
- Mortality data
- Target population estimates
- Geographic distribution
- Survival curves (where applicable)
- Treatment patterns
- Cohort stratification

### 2. Visualization Components

#### Survival Curve Chart

Displays Kaplan-Meier survival curves with confidence intervals for different treatment cohorts.

```tsx
import { SurvivalCurveChart } from '@biotech-terminal/frontend-components/epidemiology';
import { DMD_SURVIVAL_CURVES } from '../src/data/epidemiologyModels';

<SurvivalCurveChart
  curves={DMD_SURVIVAL_CURVES}
  title="DMD Survival Analysis"
  showConfidenceIntervals={true}
  height={500}
/>
```

**Features:**
- Step function for survival probability
- Confidence interval bands
- Median survival display
- Hazard ratio comparison
- Interactive hover tooltips
- Terminal-themed styling

#### Hazard Ratio Chart

Forest plot visualization for comparing treatment effectiveness across interventions.

```tsx
import { HazardRatioChart } from '@biotech-terminal/frontend-components/epidemiology';

const hazardData = [
  {
    intervention: 'Drug A',
    control: 'Placebo',
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

<HazardRatioChart
  data={hazardData}
  title="Treatment Efficacy Comparison"
  showPValues={true}
/>
```

**Features:**
- Log-scale x-axis for HR display
- 95% confidence intervals
- P-value significance display
- Color-coded by effect direction
- Reference line at HR = 1

#### Cohort Stratification Chart

Bar charts showing disease burden across different patient cohorts (age, stage, severity, etc.).

```tsx
import { CohortStratificationChart } from '@biotech-terminal/frontend-components/epidemiology';
import { DMD_COHORTS } from '../src/data/epidemiologyModels';

<CohortStratificationChart
  cohorts={DMD_COHORTS}
  metric="population"
  title="DMD Patient Cohorts"
  height={350}
/>
```

**Supported Metrics:**
- `population` - Absolute patient numbers
- `percentage` - Percentage distribution
- `prevalence` - Per 100,000 population
- `incidence` - New cases per 100,000/year
- `mortality` - Mortality rate

**Features:**
- Grouped by stratification type (Age, Stage, Severity)
- Color-coded bars
- Responsive grid layout
- Formatted axis labels

### 3. EpidemiologyPage Component

Full-featured page component integrating all visualization and modeling tools.

```tsx
import { EpidemiologyPage } from './pages/EpidemiologyPage';

// In App.tsx routes
<Route path="/epidemiology" element={<EpidemiologyPage />} />
```

**Page Features:**
- Disease selector with 5 pre-built models
- Key metrics dashboard (prevalence, incidence, mortality)
- Disease overview with geographic distribution
- Survival curve visualization (where applicable)
- Cohort stratification with metric selector
- Treatment pattern cards with effectiveness metrics
- Real-time parameter manipulation
- Loading states and error handling

## Type Definitions

### Core Types

```typescript
// Disease area classification
export type DiseaseAreaType = 
  | "DMD" 
  | "nSCLC" 
  | "T2D" 
  | "COVID19" 
  | "SCD" 
  | "Rare Disease"
  | "Chronic Disease"
  | "Infectious Disease"
  | "Other";

// Disease model with epidemiologic parameters
export interface DiseaseModel {
  id: string;
  name: string;
  diseaseArea: DiseaseAreaType;
  description: string;
  prevalence: number; // per 100,000 population
  incidence: number; // per 100,000 per year
  mortality: number; // annual mortality rate
  targetPopulation: number;
  averageAge: number;
  genderRatio?: number;
  geographicDistribution?: Record<GeographicRegion, number>;
  lastUpdated: string;
}

// Survival analysis data point
export interface SurvivalData {
  time: number; // months or years
  survival: number; // 0-1 probability
  atRisk: number;
  events: number;
  censored: number;
  ci_lower?: number;
  ci_upper?: number;
}

// Complete survival curve for a cohort
export interface SurvivalCurve {
  id: string;
  label: string;
  cohort: string;
  data: SurvivalData[];
  medianSurvival: number;
  hazardRatio?: number;
  pValue?: number;
  color?: string;
}

// Hazard ratio comparison
export interface HazardRatioData {
  intervention: string;
  control: string;
  hazardRatio: number;
  ci_lower: number;
  ci_upper: number;
  pValue: number;
  events_intervention: number;
  events_control: number;
  n_intervention: number;
  n_control: number;
}

// Patient cohort stratification
export interface CohortData {
  id: string;
  stratification: CohortStratification;
  category: string;
  population: number;
  percentage: number;
  prevalence?: number;
  incidence?: number;
  mortality?: number;
}

// Treatment pattern data
export interface TreatmentPattern {
  id: string;
  name: string;
  lineOfTherapy: number;
  percentage: number; // % of patients
  duration: number; // months (999 = ongoing)
  cost: number; // annual cost
  effectiveness: number; // 0-1 relative effectiveness
}
```

## Backend API Endpoints

All epidemiology endpoints are prefixed with `/api/epidemiology/`.

### Get All Disease Models

```http
GET /api/epidemiology/models
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dmd-001",
      "name": "Duchenne Muscular Dystrophy",
      "diseaseArea": "DMD",
      "prevalence": 1.5,
      "incidence": 0.05,
      "mortality": 0.03,
      "targetPopulation": 15000
    }
  ]
}
```

### Get Specific Disease Model

```http
GET /api/epidemiology/models/:diseaseArea
```

**Example:** `GET /api/epidemiology/models/DMD`

### Calculate Intervention Outcomes

```http
POST /api/epidemiology/intervention/calculate
```

**Request Body:**
```json
{
  "diseaseArea": "DMD",
  "interventionType": "Gene Therapy",
  "targetPopulation": 15000,
  "effectivenessRate": 0.75
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "diseaseArea": "DMD",
    "interventionType": "Gene Therapy",
    "casesAvoided": 3375,
    "deathsAvoided": 506,
    "qualityAdjustedLifeYears": 8437.5,
    "costEffectiveness": 45000
  }
}
```

### Simulate Population Health Impact

```http
POST /api/epidemiology/simulation/population-impact
```

**Request Body:**
```json
{
  "diseaseArea": "T2D",
  "timeHorizon": 10,
  "interventions": [
    {
      "type": "Prevention",
      "targetPopulation": 88000000,
      "penetrationRate": 0.2,
      "effectiveness": 0.3
    }
  ]
}
```

### Compare Disease Burden

```http
GET /api/epidemiology/burden/comparison
```

Returns comparative disease burden metrics across all disease models.

## Data Sources

All disease models are located in:
```
src/data/epidemiologyModels.ts
```

### Available Model Maps

```typescript
import {
  ALL_DISEASE_MODELS,      // Array of all 5 disease models
  DISEASE_MODEL_MAP,       // Map by disease area
  SURVIVAL_CURVES_MAP,     // Survival curves by disease
  COHORTS_MAP,             // Cohort data by disease
  TREATMENT_PATTERNS_MAP,  // Treatment patterns by disease
  GEOSPATIAL_MAP,          // Geographic data by disease
} from '../src/data/epidemiologyModels';
```

### Example Usage

```typescript
// Get DMD model
const dmdModel = DISEASE_MODEL_MAP.DMD;

// Get nSCLC survival curves
const nsclcSurvival = SURVIVAL_CURVES_MAP.nSCLC;

// Get T2D treatment patterns
const t2dTreatments = TREATMENT_PATTERNS_MAP.T2D;
```

## Styling and Theming

All epidemiology components use terminal-themed styling with:
- JetBrains Mono monospace font
- Bloomberg Terminal-inspired colors
- Glassmorphism effects
- Dark theme optimization
- Responsive grid layouts

CSS modules are co-located with each component:
- `SurvivalCurveChart.module.css`
- `HazardRatioChart.module.css`
- `CohortStratificationChart.module.css`
- `EpidemiologyPage.module.css`

## Integration Example

Complete example integrating epidemiology into a biotech application:

```tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  SurvivalCurveChart,
  CohortStratificationChart 
} from '@biotech-terminal/frontend-components/epidemiology';
import { 
  DMD_MODEL,
  DMD_SURVIVAL_CURVES,
  DMD_COHORTS 
} from '../src/data/epidemiologyModels';

function DMDAnalysisPage() {
  return (
    <div className="terminal-frame">
      <h1>{DMD_MODEL.name}</h1>
      <p>{DMD_MODEL.description}</p>
      
      <div className="metrics-grid">
        <MetricCard 
          label="Prevalence" 
          value={`${DMD_MODEL.prevalence}/100k`}
        />
        <MetricCard 
          label="Target Population" 
          value={DMD_MODEL.targetPopulation.toLocaleString()}
        />
      </div>

      <SurvivalCurveChart 
        curves={DMD_SURVIVAL_CURVES}
        title="DMD Survival by Treatment"
        showConfidenceIntervals={true}
      />

      <CohortStratificationChart
        cohorts={DMD_COHORTS}
        metric="population"
        title="Patient Distribution"
      />
    </div>
  );
}
```

## Testing

Testing considerations for epidemiology components:

```tsx
import { render, screen } from '@testing-library/react';
import { SurvivalCurveChart } from './SurvivalCurveChart';

test('renders survival curves', () => {
  const mockCurves = [
    {
      id: 'test-1',
      label: 'Treatment A',
      cohort: 'Test Cohort',
      data: [
        { time: 0, survival: 1.0, atRisk: 100, events: 0, censored: 0 },
        { time: 12, survival: 0.8, atRisk: 80, events: 20, censored: 0 },
      ],
      medianSurvival: 36,
    },
  ];

  render(<SurvivalCurveChart curves={mockCurves} />);
  expect(screen.getByText('Treatment A')).toBeInTheDocument();
});
```

## Performance Considerations

- Survival curves use memoized data transformations
- Large datasets (>1000 points) are decimated for visualization
- Plotly charts use WebGL rendering for better performance
- Cohort charts use virtualization for large patient cohorts
- API responses are cached with React Query (5 min stale time)

## Future Enhancements

Planned additions:
- [ ] Interactive parameter sliders for scenario modeling
- [ ] Real-time incidence/prevalence projections
- [ ] Monte Carlo simulation for uncertainty analysis
- [ ] Geospatial heat maps with disease tracking
- [ ] Cost-effectiveness plane visualizations
- [ ] Treatment pathway flowcharts (Sankey diagrams)
- [ ] Comparative effectiveness network meta-analysis
- [ ] Population pyramid visualizations

## Support

For issues or questions:
- Review existing components in `frontend-components/src/epidemiology/`
- Check data models in `src/data/epidemiologyModels.ts`
- Consult type definitions in `src/types/biotech.ts`
- Refer to backend endpoints in `backend/src/routes/epidemiology.ts`
