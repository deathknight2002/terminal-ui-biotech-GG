# House vs Street: Epidemiology Builder to Valuation Flow

## Overview

This document explains how the Epidemiology Builder's disease burden analytics flow directly into the House financial projections, enabling data-driven valuations that differ from Street consensus.

## Conceptual Framework

### Street Approach (Top-Down)
Traditional sell-side analysts typically use top-down modeling:

1. Start with indication
2. Look up published prevalence/incidence
3. Apply generic assumptions
4. Use industry-standard pricing
5. Simple uptake curves
6. Generic PoS adjustments

**Limitations:**
- Ignores regional variations
- Misses addressable vs. eligible distinction
- Overlooks treatment paradigm complexities
- Doesn't account for diagnostic rates
- Generic, one-size-fits-all assumptions

### House Approach (Bottom-Up)
The Aurora platform enables bottom-up, data-driven modeling:

1. **Epidemiology Builder** → Precise disease burden
2. **Addressable Population** → Who can be treated
3. **Eligible Population** → Who meets criteria
4. **Treatment Paradigm** → Current standard of care
5. **Uptake Dynamics** → S-curve based on real-world adoption
6. **Regional Pricing** → Country-specific net pricing
7. **Probability of Success** → Phase-adjusted, mechanism-informed

**Advantages:**
- Granular, region-specific data
- Treatment funnel (addressable → eligible → treated)
- Real-world evidence incorporation
- Dynamic paradigm shifts
- Informed PoS adjustments

## Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                 EPIDEMIOLOGY BUILDER                            │
│                                                                  │
│  Disease Catalog → Prevalence/Incidence by Region              │
│                 → Age/Gender Distribution                       │
│                 → Geographic Burden Maps                        │
│                 → Comorbidity Patterns                          │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────────┐
│              ADDRESSABLE POPULATION                             │
│                                                                  │
│  Total Disease Burden → Diagnosed Patients                     │
│                       → Treatment-Eligible                      │
│                       → Accessible Market                       │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────────┐
│              TREATMENT FUNNEL                                   │
│                                                                  │
│  Addressable (100%) → Eligible (70%) → Treated (40%)          │
│                                                                  │
│  Example: NSCLC ROS1+ in US                                    │
│  - Total NSCLC: 240,000/year (prevalence)                     │
│  - ROS1+: 2,400 (1% of NSCLC)                                 │
│  - Diagnosed ROS1+: 1,680 (70% testing rate)                  │
│  - Treatment-eligible: 1,344 (80% meet criteria)              │
│  - Treated with TKI: 537 (40% uptake)                         │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────────┐
│              REVENUE PROJECTIONS                                │
│                                                                  │
│  Patients × Net Price × Uptake × PoS = Revenue                │
│                                                                  │
│  By Region: US, EU5, China, Japan, ROW                         │
│  By Year: 2026-2040 (explicit period)                          │
│  By Asset: Multi-asset portfolio rollup                        │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ↓
┌────────────────────────────────────────────────────────────────┐
│              HOUSE VALUATION                                    │
│                                                                  │
│  DCF (70%) + Multiples (30%) = Per-Share Value                │
└────────────────────────────────────────────────────────────────┘
```

## Detailed Example: NSCLC ROS1+ TKI

### Step 1: Epidemiology Builder Inputs

**Disease:** Non-Small Cell Lung Cancer (NSCLC)

**Global Burden:**
- US Prevalence: 240,000 patients
- EU5 Prevalence: 180,000 patients
- China Prevalence: 700,000 patients
- Japan Prevalence: 80,000 patients

**Biomarker:** ROS1 fusion (1% of NSCLC)

**Regional Breakdown:**
```
Region | Total NSCLC | ROS1+ (1%) | Testing Rate | Diagnosed ROS1+
-------|-------------|------------|--------------|----------------
US     | 240,000     | 2,400      | 70%          | 1,680
EU5    | 180,000     | 1,800      | 65%          | 1,170
China  | 700,000     | 7,000      | 50%          | 3,500
Japan  | 80,000      | 800        | 80%          | 640
-------|-------------|------------|--------------|----------------
Total  | 1,200,000   | 12,000     | 58%          | 6,990
```

### Step 2: Treatment Funnel

**Eligibility Criteria:**
- Metastatic/advanced stage (80% of diagnosed)
- Previously treated or 1L appropriate (100%)
- No brain mets or controlled (75%)
- **Eligible Rate: 60% overall**

**Treatment Paradigm:**
- Current SOC: Chemotherapy (50%), Entrectinib (30%), Crizotinib (20%)
- New TKI positioning: 1L/2L after chemo
- **Target treated population: 40% of eligible**

**Addressable → Eligible → Treated:**
```
Region | Diagnosed | Eligible (60%) | Treated (40%) | Uptake Curve
-------|-----------|----------------|---------------|-------------
US     | 1,680     | 1,008          | 403           | Year 1: 5%
       |           |                |               | Year 2: 15%
       |           |                |               | Year 3: 30%
       |           |                |               | Year 4: 50%
       |           |                |               | Year 5: 65%
-------|-----------|----------------|---------------|-------------
EU5    | 1,170     | 702            | 281           | (Similar)
China  | 3,500     | 2,100          | 840           | (Slower)
Japan  | 640       | 384            | 154           | (Faster)
```

### Step 3: Pricing Analysis

**Net Pricing (Annual Cost per Patient):**

```
Region | List Price | Discounts/Rebates | Net Price | Notes
-------|------------|-------------------|-----------|------
US     | $200,000   | 25%              | $150,000  | Commercial payers
EU5    | $160,000   | 25%              | $120,000  | National systems
China  | $100,000   | 20%              | $80,000   | NRDL pricing
Japan  | $180,000   | 15%              | $153,000  | NHI system
```

### Step 4: Revenue Projection (Year 5, Peak)

```
Region | Patients | Net Price | Revenue | % of Total
-------|----------|-----------|---------|------------
US     | 262      | $150,000  | $39.3M  | 34%
EU5    | 182      | $120,000  | $21.8M  | 19%
China  | 546      | $80,000   | $43.7M  | 38%
Japan  | 100      | $153,000  | $15.3M  | 13%
-------|----------|-----------|---------|------------
Total  | 1,090    | -         | $120.1M | 100%
```

**Note:** This is for ROS1+ TKI alone. Nuvalent has multiple assets.

### Step 5: Company Revenue Rollup

**Nuvalent Portfolio:**
- Asset 1 (ROS1+): Peak $120M
- Asset 2 (ALK): Peak $800M
- Asset 3 (HER2): Peak $450M
- Asset 4 (Pipeline): Peak $300M

**Total Peak Revenue: $1.67B**

### Step 6: DCF Valuation

**Assumptions:**
- Gross Margin: 85%
- OPEX: 35% of revenue
- Tax Rate: 21%
- WACC: 10%
- TGR: 3%

**Free Cash Flow (Peak Year):**
```
Revenue                    $1,670M
COGS (15%)                  ($250M)
Gross Profit               $1,420M
OPEX (35%)                  ($584M)
EBITDA                       $836M
Tax (21%)                   ($176M)
NOPAT                        $660M
CapEx (5%)                   ($84M)
WC Change (10%)             ($167M)
FCF                          $409M
```

**DCF Summary:**
- Sum of PV (Explicit): $2.8B
- Terminal Value (PV): $5.2B
- Enterprise Value: $8.0B
- Less: Net Debt: -$200M
- Equity Value: $8.2B
- Shares Outstanding: 100M
- **Value per Share: $82.00**

### Step 7: Multiples Cross-Check

**Trading Comparables:**
- Peer Group Median EV/Sales: 5.5x (peak year)
- Nuvalent Peak Revenue: $1.67B
- Implied EV: $9.2B
- Equity Value: $9.4B
- **Value per Share: $94.00**

### Step 8: Blended Valuation

**House Valuation:**
- DCF (70%): $82.00 × 0.7 = $57.40
- Multiples (30%): $94.00 × 0.3 = $28.20
- **Blended: $85.60**

### Step 9: Street Comparison

**Street Consensus:**
- Average Price Target: $72.00
- Range: $55.00 - $95.00
- Median: $70.00

**House vs Street:**
- House: $85.60
- Street: $72.00
- **Difference: +$13.60 (19% upside)**

## Why House Differs from Street

### 1. Granular Epidemiology
**House:** Regional testing rates, diagnosed vs. total prevalence
**Street:** Generic prevalence numbers

**Impact:** House captures 70% US testing rate vs. Street assuming 100%

### 2. Treatment Funnel
**House:** Addressable → Eligible → Treated
**Street:** Simple prevalence × uptake

**Impact:** House models 60% eligible rate, Street often assumes 80-90%

### 3. S-Curve Dynamics
**House:** Real-world adoption curves by region
**Street:** Linear ramps or generic S-curves

**Impact:** House models faster US uptake, slower China penetration

### 4. Net Pricing
**House:** Region-specific discounts, rebates, NRDL impact
**Street:** List price with generic discount

**Impact:** House captures 25% US discounts vs. Street 15%

### 5. Multi-Asset Synergies
**House:** Portfolio view with shared infrastructure
**Street:** Asset-by-asset without synergies

**Impact:** House benefits from OPEX leverage across portfolio

### 6. LoE Timing
**House:** Detailed patent analysis, erosion curves
**Street:** Generic exclusivity assumptions

**Impact:** House extends exclusivity via formulation patents

## Sensitivity to Key Variables

### Epidemiology Assumptions

**Testing Rate Sensitivity:**
```
Testing Rate | Diagnosed Patients | Peak Revenue | Impact
-------------|-------------------|--------------|--------
50%          | 1,200             | $102M        | -15%
60%          | 1,440             | $116M        | -3%
70% (Base)   | 1,680             | $120M        | 0%
80%          | 1,920             | $131M        | +9%
90%          | 2,160             | $147M        | +23%
```

**Eligible Rate Sensitivity:**
```
Eligible Rate | Treated Patients | Peak Revenue | Impact
--------------|------------------|--------------|--------
40%           | 672              | $80M         | -33%
50%           | 840              | $100M        | -17%
60% (Base)    | 1,008            | $120M        | 0%
70%           | 1,176            | $140M        | +17%
80%           | 1,344            | $161M        | +34%
```

### Pricing Sensitivity

**US Net Price Sensitivity:**
```
US Price  | US Revenue | Total Peak | Impact
----------|------------|------------|--------
$120,000  | $31M       | $112M      | -7%
$135,000  | $35M       | $116M      | -3%
$150,000  | $39M       | $120M      | 0%
$165,000  | $43M       | $124M      | +3%
$180,000  | $47M       | $128M      | +7%
```

## Model Governance

### Data Sources

**Epidemiology:**
- SEER database (US cancer registry)
- Globocan (WHO cancer statistics)
- Published literature
- KOL interviews

**Pricing:**
- SEC filings
- Press releases
- NRDL outcomes
- Payer contracts (where available)

**Uptake:**
- Historical analogs (similar MOA)
- Early launch metrics
- Physician surveys
- Competitive dynamics

### Update Frequency

**Quarterly Reviews:**
- Epidemiology data refreshes
- Pricing updates (NRDL, payer contracts)
- Uptake revisions (launch data)
- Competitive landscape changes

**Annual Reviews:**
- Full model refresh
- Assumption validation
- Scenario updates

### Audit Trail

Every valuation run includes:
- Inputs hash (SHA256)
- Data sources with timestamps
- Analyst attribution
- Change log vs. prior run

## Best Practices

### When House > Street
Typically occurs when:
- Granular epi data shows larger addressable
- Treatment funnel analysis reveals hidden eligible
- Net pricing analysis shows better realization
- Multi-asset synergies overlooked

### When House < Street
Can occur when:
- Street overestimates testing rates
- Eligible criteria more restrictive
- Competition more intense
- Pricing pressure underestimated

### Communication
When presenting House vs. Street:
1. Show data flow clearly
2. Explain key differences
3. Sensitivity to assumptions
4. Cite sources explicitly
5. Provide context (not just numbers)

## Conclusion

The Epidemiology Builder → House Valuation flow represents a paradigm shift from generic top-down modeling to granular bottom-up analytics. By leveraging precise disease burden data, treatment funnels, and regional dynamics, the House approach delivers differentiated, defensible valuations that often diverge meaningfully from Street consensus.

The key is transparency: every assumption is sourced, every calculation is reproducible, and every variance from Street is explained.
