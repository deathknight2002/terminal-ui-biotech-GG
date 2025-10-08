# Enhanced Epidemiology Terminal - SEER/WHO/CDC Integration

## Overview

The enhanced epidemiology terminal provides comprehensive disease surveillance and population health analytics by integrating data from three authoritative sources:

- **SEER (Surveillance, Epidemiology, and End Results)** - National Cancer Institute cancer statistics
- **WHO (World Health Organization)** - Global disease burden and health observatory data
- **CDC (Centers for Disease Control and Prevention)** - US disease surveillance and chronic disease data

## Features

### 1. Comprehensive Disease Database

The system includes **17+ diseases** across multiple categories:

#### Cancer (SEER Data)
- Lung and Bronchus Cancer
- Breast Cancer
- Colorectal Cancer
- Prostate Cancer
- Pancreatic Cancer

**SEER Data Includes:**
- 5-year survival rates
- Incidence and mortality rates by race/ethnicity
- Median age at diagnosis
- Trends over multiple years

#### Infectious Diseases (WHO Data)
- COVID-19 (SARS-CoV-2)
- Tuberculosis
- Malaria
- HIV/AIDS

**WHO Data Includes:**
- DALYs (Disability-Adjusted Life Years)
- YLLs (Years of Life Lost)
- YLDs (Years Lived with Disability)
- Regional disease burden data
- Risk factors

#### Chronic Diseases (CDC Data)
- Type 2 Diabetes Mellitus
- Coronary Heart Disease
- COPD (Chronic Obstructive Pulmonary Disease)
- Alzheimer's Disease
- Stroke

**CDC Data Includes:**
- US case counts and deaths
- State-level prevalence data
- Demographic breakdowns by age group
- Temporal trends

#### Genetic Disorders
- Sickle Cell Disease
- Duchenne Muscular Dystrophy

### 2. Advanced Search & Filtering

The epidemiology page features a robust search system:

#### Search Capabilities
- **Text Search**: Search by disease name, description, or ICD-10 code
- **Category Filters**: Filter by disease category (Cancer, Infectious Disease, Chronic Disease, etc.)
- **Data Source Filters**: Filter by SEER, WHO, or CDC data sources
- **Prevalence Filters**: Filter by prevalence ranges

#### Real-time Search
- Instant results as you type
- Fuzzy matching for disease names
- Sorted by relevance and prevalence

### 3. Disease Detail Views

When selecting a disease, users see:

#### Key Metrics
- Prevalence (per 100,000 population)
- Incidence (per 100,000 per year)
- Target population (global)
- Mortality rate (annual)
- Average age at diagnosis
- Gender ratio (M:F)

#### Geographic Distribution
- Regional prevalence breakdown
- Visual bar charts
- WHO regional data for global diseases
- CDC state-level data for US diseases

#### Data Source Attribution
- Clear indication of which data sources are used
- Source-specific metrics (e.g., SEER 5-year survival, WHO DALYs, CDC US cases)
- Last updated timestamps

#### Demographics & Stratification
- Age group breakdowns (from CDC data)
- Race/ethnicity data (from SEER data)
- Regional burden (from WHO data)

## API Endpoints

### Search Endpoint
```
GET /api/epidemiology/search?query={query}&category={category}&dataSource={source}
```

**Query Parameters:**
- `query` (string): Search term
- `category` (string[]): Filter by category (e.g., "Cancer", "Infectious Disease")
- `dataSource` (string[]): Filter by source (e.g., "SEER", "WHO", "CDC")
- `minPrevalence` (number): Minimum prevalence filter
- `maxPrevalence` (number): Maximum prevalence filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "seer-lung-cancer",
      "name": "Lung and Bronchus Cancer",
      "icd10Code": "C34",
      "category": "Cancer",
      "prevalence": 65.4,
      "incidence": 42.6,
      "mortality": 0.35,
      "targetPopulation": 215000,
      "dataSources": ["SEER", "CDC"],
      "seerData": { ... },
      "whoData": null,
      "cdcData": { ... }
    }
  ],
  "count": 1
}
```

### Get All Diseases
```
GET /api/epidemiology/models
```

Returns all diseases in the database with full details.

### Get Disease by ID
```
GET /api/epidemiology/models/{diseaseId}
```

Returns detailed information for a specific disease.

### Get Diseases by Category
```
GET /api/epidemiology/categories/{category}
```

Returns all diseases in a specific category.

### Get Diseases by Data Source
```
GET /api/epidemiology/sources/{source}
```

Returns all diseases from a specific data source (SEER, WHO, or CDC).

### Get Statistics
```
GET /api/epidemiology/metadata/statistics
```

Returns database statistics:
```json
{
  "totalDiseases": 17,
  "byCategory": {
    "Cancer": 5,
    "Infectious Disease": 4,
    "Metabolic": 1,
    ...
  },
  "bySource": {
    "SEER": 5,
    "WHO": 4,
    "CDC": 8
  },
  "totalPopulation": 450000000,
  "averagePrevalence": 1200
}
```

## Data Sources & Methodology

### SEER (National Cancer Institute)
**What it provides:**
- Authoritative cancer statistics for the United States
- Population-based cancer registries covering ~48% of US population
- Data on incidence, mortality, survival, prevalence
- Detailed demographic and geographic breakdowns

**Data Quality:**
- Gold standard for cancer surveillance
- Rigorous quality control and validation
- Annual updates
- Used by researchers and policy makers worldwide

### WHO (World Health Organization)
**What it provides:**
- Global disease burden estimates
- Regional health data for 6 WHO regions
- DALYs, YLLs, and YLDs calculations
- Risk factor analysis
- Infectious disease surveillance

**Data Quality:**
- Compiled from member states' health systems
- Standardized methodologies across countries
- Regular updates through Global Health Observatory
- Peer-reviewed estimation methods

### CDC (Centers for Disease Control)
**What it provides:**
- US disease surveillance data
- State-level prevalence and incidence
- Demographic breakdowns
- Behavioral risk factor surveillance
- Chronic disease tracking

**Data Quality:**
- Real-time surveillance systems
- State and local health department collaboration
- Validated case definitions
- Regular data quality assessments

## Usage Examples

### Example 1: Search for Diabetes
```typescript
// Frontend code
const { data: searchResults } = useQuery({
  queryKey: ['diseaseSearch', 'diabetes'],
  queryFn: () => searchDiseases('diabetes', {}),
});

// Returns: Type 2 Diabetes Mellitus with CDC data
```

### Example 2: Filter by Cancer Category
```typescript
const { data: cancers } = useQuery({
  queryKey: ['diseaseSearch', '', ['Cancer']],
  queryFn: () => searchDiseases('', { category: ['Cancer'] }),
});

// Returns: All SEER cancer data
```

### Example 3: WHO Data Only
```typescript
const { data: whoDiseases } = useQuery({
  queryKey: ['diseaseSearch', '', [], ['WHO']],
  queryFn: () => searchDiseases('', { dataSource: ['WHO'] }),
});

// Returns: COVID-19, Tuberculosis, Malaria, HIV/AIDS
```

## Technical Implementation

### Backend Architecture

```
backend/src/services/disease-data-service.ts
  ├── DiseaseDataService (singleton)
  ├── getSEERCancerData() - 5 cancer types with survival data
  ├── getWHODiseaseData() - 4 infectious diseases with DALYs
  ├── getCDCDiseaseData() - 7 chronic/genetic diseases with US data
  └── searchDiseases() - Unified search across all sources
```

### Data Models

```typescript
interface DiseaseData {
  id: string;
  name: string;
  icd10Code?: string;
  category: DiseaseCategory;
  description: string;
  prevalence: number;
  incidence: number;
  mortality: number;
  targetPopulation: number;
  dataSources: DataSource[];
  seerData?: SEERCancerData;
  whoData?: WHODiseaseData;
  cdcData?: CDCDiseaseData;
}
```

### Frontend Architecture

```
terminal/src/pages/EpidemiologyPage.tsx
  ├── Search bar with real-time filtering
  ├── Category and data source filters
  ├── Disease card grid with scrolling
  ├── Disease detail panel with:
  │   ├── Key metrics (6 metric cards)
  │   ├── Disease overview
  │   ├── Data source attribution
  │   ├── WHO regional data visualization
  │   └── CDC demographic breakdowns
  └── Empty state for no selection
```

## Performance Considerations

### Caching
- Frontend queries cached for 5 minutes
- Backend singleton service with in-memory data
- No database queries needed for initial load

### Search Performance
- Client-side filtering for instant results
- Server-side search for complex queries
- Optimized data structures (Map) for O(1) lookups

### Scalability
- Current implementation supports 100+ diseases
- Can easily extend to 1000+ with pagination
- Data service designed for future database integration

## Future Enhancements

### Data Source Expansion
1. **NCBI/PubMed** - Link to latest research
2. **ClinicalTrials.gov** - Active trials for each disease
3. **GBD (Global Burden of Disease)** - Additional metrics
4. **IARC (International Agency for Research on Cancer)** - Cancer statistics

### Feature Additions
1. **Comparison Mode** - Compare multiple diseases side-by-side
2. **Trend Visualization** - Time series charts for trends
3. **Export Functionality** - Export search results to CSV/PDF
4. **Bookmarking** - Save favorite diseases
5. **Advanced Analytics** - Burden calculation, cost analysis
6. **Geographic Maps** - Visual maps for regional data

### Data Quality Improvements
1. **Automatic Updates** - Schedule regular data refreshes
2. **Version Control** - Track data source versions
3. **Quality Metrics** - Data completeness indicators
4. **Citation Links** - Direct links to source publications

## Testing

### Manual Testing
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd terminal && npm run dev`
3. Navigate to Epidemiology page
4. Test search functionality
5. Verify data source badges
6. Check disease detail views

### API Testing
```bash
# Search for lung cancer
curl "http://localhost:3001/api/epidemiology/search?query=lung"

# Get all cancers
curl "http://localhost:3001/api/epidemiology/categories/Cancer"

# Get WHO data
curl "http://localhost:3001/api/epidemiology/sources/WHO"

# Get statistics
curl "http://localhost:3001/api/epidemiology/metadata/statistics"
```

## References

1. **SEER Program**: https://seer.cancer.gov/
2. **WHO GHO**: https://www.who.int/data/gho
3. **CDC Data & Statistics**: https://www.cdc.gov/datastatistics/
4. **ICD-10 Codes**: https://www.who.int/standards/classifications/classification-of-diseases

## License & Attribution

This implementation uses publicly available data from SEER, WHO, and CDC. All data sources should be properly cited when using this system in publications or presentations.

**Recommended Citation:**
```
Disease data sourced from:
- SEER Cancer Statistics (National Cancer Institute)
- WHO Global Health Observatory
- CDC National Center for Health Statistics
```
