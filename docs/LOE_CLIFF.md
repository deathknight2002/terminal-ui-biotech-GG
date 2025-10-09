# Loss of Exclusivity (LoE) Cliff Module

## Overview

The LoE Cliff module tracks patent expiries and regulatory exclusivity losses for pharmaceutical assets, modeling revenue erosion using region-specific curves based on historical precedent.

## Key Concepts

### Patent Exclusivity Types

1. **Patent Protection**
   - Composition of matter patents
   - Method of use patents
   - Formulation patents
   - Typical duration: 20 years from filing

2. **Data Exclusivity**
   - FDA data exclusivity (5-12 years)
   - EMA data exclusivity (8-10 years)
   - Prevents generic manufacturers from referencing originator data

3. **Orphan Drug Exclusivity**
   - FDA: 7 years
   - EMA: 10 years
   - Additional protection for rare disease therapies

4. **Pediatric Exclusivity**
   - Additional 6 months in US
   - Granted for completing pediatric studies

## Erosion Curves

### Standard Erosion Model

Default erosion assumptions based on historical small molecule losses:

**Year 1 Post-LoE:**
- US: 60% revenue erosion (rapid generic entry)
- EU: 55% revenue erosion (slower uptake)
- ROW: 50% revenue erosion (varied market dynamics)

**Year 2 Post-LoE:**
- Additional 20-25% erosion across regions
- Market stabilization begins

**Steady State (Year 3+):**
- 80-85% total branded market share loss
- 15-20% branded retention (brand loyalty, authorized generics)

### Biologics Erosion Model

Slower erosion for biologics/biosimilars:

**Year 1 Post-LoE:**
- US: 35% revenue erosion
- EU: 40% revenue erosion
- ROW: 30% revenue erosion

**Year 2 Post-LoE:**
- Additional 20% erosion

**Steady State:**
- 60-70% total share loss (higher branded retention)

### Specialty Drug Model

Even slower erosion for complex therapies:

**Year 1 Post-LoE:**
- 20-30% erosion
- High switching barriers (administration, monitoring)

**Year 2+:**
- Gradual decline to 40-50% total loss

## Database Schema

### PatentExpiry Table

```sql
CREATE TABLE patent_expiries (
  id INTEGER PRIMARY KEY,
  asset_id VARCHAR NOT NULL,
  asset_name VARCHAR NOT NULL,
  region VARCHAR NOT NULL,
  expiry_date DATETIME NOT NULL,
  exclusivity_type VARCHAR NOT NULL,
  erosion_curve_id VARCHAR NOT NULL,
  peak_revenue_before_loe FLOAT,
  year_1_erosion_rate FLOAT,
  year_2_erosion_rate FLOAT,
  steady_state_share FLOAT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patent_asset_region ON patent_expiries(asset_id, region);
CREATE INDEX idx_patent_expiry_date ON patent_expiries(expiry_date);
```

## Timeline Visualization

### Stacked Bar Chart

Shows revenue-at-risk by year:

```
2030  ████░░░░░░ $500M
2031  ██░░░░░░░░ $200M
2032  ██████████ $2.8B  ← Major cliff
2033  ███░░░░░░░ $1.2B
2034  ░░░░░░░░░░ $0
2035  ████░░░░░░ $1.5B
```

**Interaction:**
- Hover: Show asset details and erosion parameters
- Click: Drill through to asset-level detail
- Toggle: Filter by company or therapeutic area

### Gantt Timeline

Lane-by-asset view:

```
Asset A (US)   |----[Protection]----[X]--[Erosion]--→
Asset A (EU)   |----[Protection]-----[X]--[Erosion]--→
Asset B (US)   |----[Protection]--------[X]--[Erosion]--→
               2025  2028  2031  2034  2037  2040
```

**Legend:**
- [Protection]: Exclusivity period
- [X]: LoE event
- [Erosion]: Generic erosion period

## API Endpoints

### GET /api/v1/loe/timeline

Returns LoE timeline with stacked revenue-at-risk.

**Query Parameters:**
- `ticker` (optional): Filter by company ticker
- `company` (optional): Filter by company name

**Response:**
```json
{
  "timeline": [
    {
      "year": 2032,
      "events": [
        {
          "asset_id": "NUVL-lead",
          "asset_name": "Nuvalent Lead Asset",
          "region": "US",
          "expiry_date": "2032-06-15",
          "exclusivity_type": "patent",
          "peak_revenue": 2800,
          "erosion_curve_id": "small_molecule_us"
        }
      ],
      "total_revenue_at_risk": 2800
    },
    {
      "year": 2033,
      "events": [
        {
          "asset_id": "NUVL-lead",
          "asset_name": "Nuvalent Lead Asset",
          "region": "EU",
          "expiry_date": "2033-08-20",
          "exclusivity_type": "patent",
          "peak_revenue": 1200,
          "erosion_curve_id": "small_molecule_eu"
        }
      ],
      "total_revenue_at_risk": 1200
    }
  ],
  "total_events": 2
}
```

### GET /api/v1/loe/events/{asset_id}

Returns all LoE events for a specific asset.

**Response:**
```json
{
  "asset_id": "NUVL-lead",
  "count": 2,
  "events": [
    {
      "id": 1,
      "region": "US",
      "expiry_date": "2032-06-15",
      "exclusivity_type": "patent",
      "peak_revenue": 2800,
      "erosion_rates": {
        "year_1": 0.60,
        "year_2": 0.20,
        "steady_state": 0.85
      }
    },
    {
      "id": 2,
      "region": "EU",
      "expiry_date": "2033-08-20",
      "exclusivity_type": "patent",
      "peak_revenue": 1200,
      "erosion_rates": {
        "year_1": 0.55,
        "year_2": 0.25,
        "steady_state": 0.85
      }
    }
  ]
}
```

### POST /api/v1/loe/events

Creates new LoE event.

**Request Body:**
```json
{
  "asset_id": "NUVL-lead",
  "asset_name": "Nuvalent Lead Asset",
  "region": "US",
  "expiry_date": "2032-06-15",
  "exclusivity_type": "patent",
  "erosion_curve_id": "small_molecule_us",
  "peak_revenue": 2800,
  "year_1_erosion_rate": 0.60,
  "year_2_erosion_rate": 0.20,
  "steady_state_share": 0.85
}
```

## Integration with Valuation Engine

The valuation engine automatically applies LoE erosion to revenue projections:

### Example Calculation

**Pre-LoE Revenue Projection:**
```
2030: $2,000M
2031: $2,500M
2032: $2,800M (peak, LoE in June)
2033: $2,800M → $1,120M (60% erosion)
2034: $1,120M → $896M (20% additional erosion)
2035: $896M → $420M (steady state 85% loss)
```

### Code Integration

```python
from platform.logic.valuation import ValuationEngine

engine = ValuationEngine()

# LoE events
loe_events = [
    {
        "asset_id": "NUVL-lead",
        "expiry_year": 2032,
        "erosion_rates": {
            "year_1": 0.60,
            "year_2": 0.20,
            "steady_state": 0.85
        }
    }
]

# Apply erosion
revenue_projections = {...}  # From Epi Builder
adjusted = engine.apply_loe_erosion(revenue_projections, loe_events)
```

## UI Components

### LoE Cliff Page

Located at `/financials/loe-cliff`

**Features:**
1. **Stacked Bar Chart**
   - Revenue at risk by year
   - Color-coded by asset
   - Interactive hover details

2. **Gantt Timeline**
   - Lane per asset
   - Protection period visualization
   - Erosion period display

3. **Event Table**
   - Sortable by asset, region, date
   - Drill-through to asset details
   - Export to CSV/XLSX

4. **Erosion Model Parameters**
   - Display current assumptions
   - Link to edit modal
   - Historical precedent references

### Refresh Workflow

1. User clicks "Refresh" → "LoE Workbook"
2. Upload Excel file with LoE data
3. System parses and validates:
   - Asset IDs match database
   - Dates are valid
   - Erosion rates in range [0, 1]
4. Preview changes before committing
5. Commit updates database
6. UI refreshes timeline view

## Data Sources

### Internal Sources
- R&D team patent tracking
- Legal department exclusivity records
- Regulatory affairs filings

### External Sources
- FDA Orange Book
- EMA Register
- Patent databases (Google Patents, USPTO)
- Regulatory agency websites

### Import Format

Excel workbook with tabs:
- **Summary**: Overview of all LoE events
- **US_Patents**: US-specific exclusivity
- **EU_Patents**: EU-specific exclusivity
- **ROW_Patents**: Rest-of-world exclusivity
- **Erosion_Curves**: Custom erosion parameters

**Required Columns:**
- Asset_ID
- Asset_Name
- Region
- Expiry_Date (YYYY-MM-DD)
- Exclusivity_Type
- Peak_Revenue_Before_LoE
- Erosion_Curve_ID

## Best Practices

### Data Quality
- Verify patent filing dates
- Cross-reference with regulatory databases
- Update quarterly or upon material changes

### Erosion Assumptions
- Use historical comparables when available
- Consider market dynamics (crowded vs. orphan)
- Account for authorized generics

### Scenario Analysis
- Model optimistic (slower erosion)
- Model base case (standard curves)
- Model pessimistic (faster erosion)

### Communication
- Flag major cliffs in executive summaries
- Provide context (precedent, market structure)
- Highlight mitigation strategies (lifecycle management)

## Historical Precedents

### Lipitor (atorvastatin)
- US LoE: November 2011
- Peak revenue: $13B (2006)
- Year 1 erosion: ~70%
- Year 2 erosion: Additional 20%

### Humira (adalimumab)
- US LoE: January 2023 (expected)
- Biologics erosion slower than small molecules
- Authorized biosimilars strategy

### Revlimid (lenalidomide)
- US LoE: 2027 (extended exclusivity)
- Oncology specialty drug
- Expected 40-50% erosion due to switching costs

## Future Enhancements

- Machine learning models for erosion prediction
- Competitive landscape impact modeling
- Lifecycle management strategy simulation
- Real-time patent status monitoring
- Integration with SEC filings for peer analysis
