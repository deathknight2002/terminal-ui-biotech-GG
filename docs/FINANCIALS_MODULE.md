# Financials Module Documentation

## Overview

The Financials Module provides comprehensive valuation and financial modeling capabilities integrated with the Epidemiology Builder. It enables House projections, Street consensus tracking, and banker-grade report generation.

## Architecture

### Database Models

#### PriceTarget
Stores analyst price targets from various sources.

**Fields:**
- `ticker`: Company ticker symbol
- `source`: Bank/analyst name (e.g., "Goldman Sachs", "Morgan Stanley")
- `date`: Date of price target publication
- `price_target`: Target price value
- `rationale`: Justification for the target
- `currency`: Currency code (default: USD)

#### ConsensusEstimate
Street consensus estimates for financial metrics.

**Fields:**
- `ticker`: Company ticker
- `metric`: Metric type (revenue, EPS, GM, OPEX, shares, WACC, TGR)
- `period`: Time period (YYYY or YYYY-Q1 format)
- `value`: Estimate value
- `source`: Consensus source
- `currency`: Currency code
- `unit`: Unit of measurement (millions, billions, percentage)

#### RevenueLine
Revenue projections by asset, region, and year.

**Fields:**
- `asset_id`: Therapeutic/asset identifier
- `asset_name`: Asset name
- `region`: Geographic region (US, EU, ROW)
- `year`: Projection year
- `net_price`: Price per patient
- `uptake`: Market penetration (0-1)
- `probability_of_success`: PoS by phase (0-1)
- `patients`: Patient count
- `revenue`: Total revenue
- `scenario`: Scenario type (base, bull, bear)

#### PatentExpiry
Loss of exclusivity events and erosion curves.

**Fields:**
- `asset_id`: Asset identifier
- `asset_name`: Asset name
- `region`: Geographic region
- `expiry_date`: Patent expiry date
- `exclusivity_type`: Type (patent, data_exclusivity, orphan)
- `erosion_curve_id`: Reference to erosion curve
- `peak_revenue_before_loe`: Peak revenue before LoE
- `year_1_erosion_rate`: Year 1 erosion percentage
- `year_2_erosion_rate`: Year 2 erosion percentage
- `steady_state_share`: Long-term generic share

#### ValuationRun
Tracks valuation model runs with full reproducibility.

**Fields:**
- `ticker`: Company ticker
- `run_timestamp`: Execution timestamp
- `inputs`: Full input parameters (JSON)
- `inputs_hash`: SHA256 hash for deduplication
- `outputs`: Valuation results (JSON)
- `scenario`: Scenario identifier
- `version`: Model version
- `user`: User who executed the run
- `notes`: Optional notes

#### ReportArtifact
Generated report files (XLSX, PPTX, PDF).

**Fields:**
- `file_type`: File extension (xlsx, pptx, pdf)
- `template_id`: Template identifier
- `ticker`: Company ticker
- `params`: Generation parameters (JSON)
- `file_path`: Storage path or URL
- `file_size`: File size in bytes
- `file_hash`: SHA256 hash
- `download_url`: Signed download URL
- `expiry_date`: URL expiration date
- `generated_by`: User who generated the report

## Valuation Engine

### Core Functions

#### compute_revenue_projection()
Computes revenue projections from epidemiology inputs.

**Inputs:**
- Addressable population by region
- Eligible rate (addressable → eligible)
- S-curve uptake rates by year
- Net pricing by region
- Probability of success (PoS) by phase

**Outputs:**
- Revenue by asset, region, and year
- Patient counts
- Total company rollup

**Formula:**
```
Revenue = Addressable × Eligible_Rate × Uptake × Net_Price × PoS
```

#### apply_loe_erosion()
Applies patent expiry erosion curves to revenue projections.

**Erosion Model:**
- Year 1 post-LoE: 60% revenue drop (generic entry)
- Year 2 post-LoE: Additional 20% erosion
- Steady state: 85% total branded market share loss
- Region-specific curves based on historical precedent

#### compute_dcf()
Computes discounted cash flow valuation.

**Steps:**
1. Calculate EBITDA: Revenue × Gross Margin - OPEX
2. Calculate NOPAT: EBITDA × (1 - Tax Rate)
3. Calculate FCF: NOPAT - CapEx - Working Capital Change
4. Discount FCFs at WACC
5. Calculate terminal value: Terminal FCF / (WACC - TGR)
6. Sum to enterprise value
7. Adjust for net debt → equity value
8. Divide by FDSO → per-share value

**Assumptions:**
- `gross_margin`: Gross margin percentage (default: 85%)
- `opex_rate`: Operating expenses as % of revenue (default: 35%)
- `tax_rate`: Corporate tax rate (default: 21%)
- `wacc`: Weighted average cost of capital (default: 10%)
- `tgr`: Terminal growth rate (default: 3%)
- `capex_rate`: CapEx as % of revenue (default: 5%)
- `working_capital_rate`: WC change as % of revenue (default: 10%)
- `explicit_years`: Number of explicit forecast years (default: 10)

#### compute_multiples()
Computes multiples-based valuation cross-check.

**Methodology:**
- Apply EV/Sales multiples by year
- Year 1: 8.0x
- Year 2: 6.5x
- Year 3: 5.5x
- Peak: 4.5x

**Formula:**
```
Enterprise Value = Revenue × EV/Sales Multiple
Equity Value = EV - Net Debt
Per Share = Equity Value / FDSO
```

#### run_valuation()
Orchestrates complete valuation run.

**Process:**
1. Compute revenue projections from Epi Builder
2. Apply LoE erosion if applicable
3. Compute DCF valuation
4. Compute multiples valuation
5. Calculate blended value (70% DCF + 30% Multiples)
6. Generate inputs hash for reproducibility
7. Store run in database

**Output:**
```json
{
  "ticker": "NUVL",
  "scenario_id": "base",
  "inputs_hash": "abc123...",
  "timestamp": "2025-01-15T12:00:00Z",
  "revenue_projections": {...},
  "dcf_valuation": {...},
  "multiples_valuation": {...},
  "summary": {
    "dcf_per_share": 42.50,
    "multiples_avg_per_share": 38.25,
    "blended_value_per_share": 41.03
  }
}
```

## API Endpoints

### GET /api/v1/financials/overview
Returns financial overview with House vs Street comparison.

**Response:**
```json
{
  "ticker": "NUVL",
  "last_refresh": "2025-01-15T12:00:00Z",
  "house_valuation": {
    "per_share": 42.50,
    "method": "DCF (70%) + Multiples (30%)",
    "last_updated": "2025-01-15T10:00:00Z"
  },
  "street_consensus": {
    "avg_price_target": 38.25,
    "min_price_target": 28.00,
    "max_price_target": 52.00,
    "num_analysts": 12
  },
  "diff": {
    "absolute": 4.25,
    "percentage": 0.111,
    "since_last_refresh": "+2.3%"
  }
}
```

### GET /api/v1/financials/price-targets
Returns analyst price targets.

**Query Parameters:**
- `ticker` (optional): Filter by ticker
- `limit` (optional): Max results (default: 50)

### POST /api/v1/financials/price-targets
Creates new price target entry.

**Request Body:**
```json
{
  "ticker": "NUVL",
  "source": "Goldman Sachs",
  "date": "2025-01-15",
  "price_target": 52.00,
  "rationale": "Strong pipeline momentum",
  "currency": "USD"
}
```

### GET /api/v1/financials/consensus
Returns Street consensus estimates.

**Query Parameters:**
- `ticker` (optional): Filter by ticker
- `metric` (optional): Filter by metric type

### POST /api/v1/financials/consensus/upload
Uploads consensus data from CSV/XLSX file.

### POST /api/v1/financials/valuation/run
Executes valuation model run.

**Request Body:**
```json
{
  "ticker": "NUVL",
  "scenario_id": "base",
  "epi_params": {
    "US_addressable": 50000,
    "EU_addressable": 30000,
    "ROW_addressable": 20000,
    "US_eligible_rate": 0.7,
    "EU_eligible_rate": 0.65,
    "ROW_eligible_rate": 0.6
  },
  "financial_assumptions": {
    "asset_id": "NUVL-lead",
    "pricing": {
      "US": 150000,
      "EU": 120000,
      "ROW": 80000
    },
    "uptake_curve": {
      "2026": 0.05,
      "2027": 0.15,
      "2028": 0.30,
      "2029": 0.50,
      "2030": 0.65
    },
    "pos_by_phase": 0.65,
    "wacc": 0.10,
    "tgr": 0.03,
    "gross_margin": 0.85,
    "shares_outstanding": 100000000,
    "net_debt": -200000000
  },
  "loe_events": [
    {
      "asset_id": "NUVL-lead",
      "expiry_year": 2032,
      "erosion_rates": {
        "year_1": 0.60,
        "year_2": 0.20,
        "steady_state": 0.85
      }
    }
  ],
  "user": "analyst@biotech.com"
}
```

### GET /api/v1/financials/audit
Returns valuation run history.

**Query Parameters:**
- `ticker` (optional): Filter by ticker
- `limit` (optional): Max results (default: 50)

### GET /api/v1/loe/timeline
Returns LoE cliff timeline visualization data.

### POST /api/v1/reports/export
Generates report artifacts.

**Request Body:**
```json
{
  "ticker": "NUVL",
  "template_id": "banker_deck",
  "file_type": "pptx",
  "params": {
    "include_sensitivity": true,
    "include_comparables": true
  },
  "user": "analyst@biotech.com"
}
```

## Manual Refresh Workflow

The Financials Module follows the manual-refresh-only pattern:

1. User clicks refresh button in top-right corner
2. Select data sources to refresh:
   - Excel models (consensus estimates)
   - LoE workbooks
   - Price target updates
3. Data is ingested and processed
4. UI updates with "Last refreshed" timestamp
5. No background polling or automatic updates

## Integration with Epidemiology Builder

The Financials Module directly consumes Epi Builder outputs:

**Flow:**
```
Epi Builder → Addressable Population
            → Eligible Rate
            → Treatment Patterns
            ↓
Valuation Engine → Revenue Projections
                 → DCF Analysis
                 → Per-Share Value
```

**Key Linkages:**
- Disease prevalence/incidence → Addressable population
- Treatment paradigm shifts → Uptake curves
- Geographic distribution → Regional pricing
- Clinical success probabilities → PoS adjustments

## Best Practices

### Reproducibility
- Every valuation run stores inputs hash
- Audit trail tracks all parameter changes
- Version control on model logic

### Data Provenance
- Citation of data sources alongside all figures
- Inputs hash enables exact reproduction
- Source timestamps tracked

### Units and Currency
- All currency in USD unless specified
- Revenue in millions
- Percentages as decimals (0.65 = 65%)
- Patients as absolute counts

### Guardrails
- WACC typically 8-15%
- TGR typically 2-4%
- Gross margins 70-95% for biotech
- PoS by phase: Preclinical 10%, Phase I 20%, Phase II 40%, Phase III 65%

## Future Enhancements

- Real-time Street data feeds
- Automated sensitivity analysis
- Monte Carlo simulation
- Portfolio optimization
- Scenario comparison views
- Enhanced PPTX templates matching Nuvalent style
