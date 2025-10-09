# Report Templates Documentation

## Overview

The Report Templates module generates banker-grade Excel models and PowerPoint presentations that mirror the style and structure of professional biotech valuation materials.

## Supported Formats

### Excel Models (.xlsx)

Professional DCF models with multiple linked worksheets.

**Template Types:**

1. **DCF Model** (`dcf_model`)
   - Assumptions sheet
   - Revenue projections by asset
   - EBITDA bridge
   - Free cash flow calculation
   - WACC calculation
   - Terminal value
   - Valuation summary
   - Sensitivity tables

2. **Comparables Model** (`comps_model`)
   - Trading comparables
   - Transaction comparables
   - EV/Sales by year
   - EV/EBITDA multiples
   - Valuation football field

3. **Integrated Model** (`integrated_model`)
   - Full DCF model
   - Comparables analysis
   - LoE erosion schedules
   - Consensus estimates
   - House vs Street comparison

### PowerPoint Decks (.pptx)

Investment banking-style presentations.

**Template Types:**

1. **Banker Deck** (`banker_deck`)
   - Executive summary
   - Investment thesis
   - DCF valuation (Appendix A)
   - Multiples valuation (Appendix B)
   - Sensitivity analysis
   - Comparable companies
   - LoE timeline

2. **Board Presentation** (`board_presentation`)
   - Strategic overview
   - Financial highlights
   - Valuation summary
   - Risk factors
   - Recommendations

3. **Investor Update** (`investor_update`)
   - Quarterly highlights
   - Pipeline progress
   - Financial performance
   - Guidance updates

### PDF Reports (.pdf)

Static reports for distribution.

**Template Types:**

1. **Valuation Report** (`valuation_report`)
   - Full valuation analysis
   - Methodology explanation
   - Assumptions and sources
   - Sensitivity analysis

2. **Executive Summary** (`exec_summary`)
   - One-page overview
   - Key metrics
   - Investment recommendation

## Excel Model Structure

### DCF Model Worksheets

#### 1. Cover Sheet
- Model title
- Company name and ticker
- Date prepared
- Analyst name
- Disclaimer

#### 2. Assumptions
```
Section                 | Parameters
------------------------|----------------------------------
Epidemiology           | Addressable population by region
                       | Eligible rate
                       | Treatment paradigm
------------------------|----------------------------------
Pricing                | US net price
                       | EU net price
                       | ROW net price
------------------------|----------------------------------
Uptake                 | S-curve parameters by year
                       | Peak penetration
------------------------|----------------------------------
Probability of Success | Phase-adjusted PoS
                       | Regulatory risk
------------------------|----------------------------------
Financial              | Gross margin
                       | OPEX as % of revenue
                       | Tax rate
                       | CapEx rate
                       | Working capital
------------------------|----------------------------------
Discount Rate          | Cost of equity
                       | Cost of debt
                       | Capital structure
                       | WACC calculation
------------------------|----------------------------------
Terminal Value         | Terminal growth rate
                       | Terminal FCF calculation
```

#### 3. Revenue Projections

**By Asset and Region:**
```
Year | US Patients | US Revenue | EU Patients | EU Revenue | ROW Patients | ROW Revenue | Total
-----|-------------|------------|-------------|------------|--------------|-------------|-------
2026 |         450 |      $180M |         200 |       $80M |          100 |       $30M | $290M
2027 |       1,200 |      $720M |         600 |      $240M |          300 |       $90M | $1.05B
2028 |       2,100 |     $1.26B |       1,000 |      $400M |          500 |      $150M | $1.81B
2029 |       3,200 |     $1.92B |       1,500 |      $600M |          800 |      $240M | $2.76B
2030 |       4,500 |     $2.70B |       2,000 |      $800M |        1,000 |      $300M | $3.80B
```

#### 4. EBITDA Bridge
```
Revenue                             $3,800M
  Less: COGS (15%)                   ($570M)
Gross Profit                        $3,230M
  Less: R&D                         ($500M)
  Less: SG&A                        ($800M)
EBITDA                              $1,930M
  Less: D&A                         ($100M)
EBIT                                $1,830M
  Less: Tax (21%)                   ($384M)
NOPAT                               $1,446M
```

#### 5. Free Cash Flow
```
NOPAT                               $1,446M
  Add: D&A                           $100M
  Less: CapEx                       ($190M)
  Less: Increase in NWC             ($380M)
Free Cash Flow                       $976M
```

#### 6. DCF Valuation
```
Year | FCF    | Discount Factor | PV of FCF
-----|--------|-----------------|----------
2026 | $100M  | 0.909          | $91M
2027 | $300M  | 0.826          | $248M
2028 | $600M  | 0.751          | $451M
2029 | $800M  | 0.683          | $546M
2030 | $976M  | 0.621          | $606M
-----|--------|-----------------|----------
Sum of PV (Explicit Years)          $1,942M
Terminal Value (PV)                 $8,500M
-----|--------|-----------------|----------
Enterprise Value                    $10,442M
  Less: Net Debt                    ($200M)
Equity Value                        $10,642M
  Shares Outstanding                100M
Value per Share                     $106.42
```

#### 7. Sensitivity Tables

**WACC / TGR Sensitivity:**
```
        TGR →    2.0%    2.5%    3.0%    3.5%    4.0%
WACC ↓
8.0%            $145    $158    $175    $198    $232
9.0%            $122    $132    $145    $162    $184
10.0%           $106    $114    $123    $135    $150
11.0%           $94     $100    $107    $116    $127
12.0%           $84     $89     $95     $102    $110
```

**Revenue / Margin Sensitivity:**
```
              Margin →   80%     82.5%   85%     87.5%   90%
Revenue ↓
$3.0B                   $85     $92     $99     $107    $115
$3.5B                   $95     $103    $112    $121    $131
$4.0B                   $106    $115    $125    $136    $148
$4.5B                   $117    $127    $138    $150    $164
$5.0B                   $128    $139    $151    $165    $180
```

#### 8. Multiples Cross-Check
```
Year | Revenue | EV/Sales | Implied EV | Implied Value/Share
-----|---------|----------|------------|--------------------
2026 |  $290M  |   8.0x   |  $2.32B   |      $23.20
2027 | $1.05B  |   6.5x   |  $6.83B   |      $68.30
2028 | $1.81B  |   5.5x   |  $9.96B   |      $99.60
2029 | $2.76B  |   5.0x   | $13.80B   |     $138.00
2030 | $3.80B  |   4.5x   | $17.10B   |     $171.00
```

## PowerPoint Deck Structure

### Banker Deck Template

#### Slide 1: Title
- Company name and logo
- "Financial Valuation Analysis"
- Date
- Analyst credentials

#### Slide 2: Executive Summary
- Investment thesis (3-5 bullets)
- Valuation summary table
- Key catalysts
- Price target

#### Slide 3: Company Overview
- Business description
- Pipeline overview
- Market opportunity

#### Slide 4: Valuation Methodology
- Approach (DCF + Multiples)
- Key assumptions
- Data sources

#### Slide 5: Revenue Projections
- Chart: Revenue by asset
- Table: Key drivers
- Assumptions footnotes

#### Slide 6: DCF Valuation (Appendix A)
- FCF table
- WACC calculation
- Terminal value
- Per-share value

#### Slide 7: DCF Sensitivity
- WACC/TGR grid (color-coded)
- Base case highlighted
- Range of outcomes

#### Slide 8: Multiples Valuation (Appendix B)
- Comparable companies table
- EV/Sales ladder chart
- Trading multiples
- Transaction multiples

#### Slide 9: LoE Timeline
- Gantt chart of patent expiries
- Revenue at risk
- Erosion assumptions

#### Slide 10: Catalysts
- Upcoming events
- Probability-weighted impact
- Timeline visualization

#### Slide 11: Risk Factors
- Clinical risks
- Regulatory risks
- Commercial risks
- Financial risks

#### Slide 12: Recommendation
- Price target
- Rating (Buy/Hold/Sell)
- Upside/downside scenarios

#### Slide 13: Disclaimers
- Standard banking disclaimers
- Data sources
- Analyst certifications

## Styling Guidelines

### Excel Formatting

**Colors:**
- Headers: Navy blue (#1f4e78)
- Assumptions: Light blue (#d9e2f3)
- Calculations: White
- Outputs: Light green (#e2efda)
- Warnings: Light yellow (#fff2cc)

**Fonts:**
- Headers: Calibri 11pt Bold
- Data: Calibri 10pt
- Numbers: Right-aligned
- Text: Left-aligned

**Number Formats:**
- Currency: $#,##0.0M (millions)
- Percentages: 0.0%
- Dates: mm/dd/yyyy
- Patients: #,##0

### PowerPoint Styling

**Theme:**
- Primary color: Navy (#1f4e78)
- Accent color: Teal (#0097a7)
- Background: White
- Text: Dark gray (#333333)

**Fonts:**
- Titles: Calibri 28pt Bold
- Headers: Calibri 18pt Bold
- Body: Calibri 14pt
- Footnotes: Calibri 10pt

**Charts:**
- Style: Professional, clean lines
- Colors: Consistent palette
- Labels: All axes labeled
- Legend: Bottom or right
- Data labels: On key metrics

## API Integration

### Generate Report

```python
POST /api/v1/reports/export
{
  "ticker": "NUVL",
  "template_id": "banker_deck",
  "file_type": "pptx",
  "params": {
    "include_sensitivity": true,
    "include_comparables": true,
    "analyst_name": "John Smith",
    "date": "2025-01-15"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "artifact_id": 123,
  "file_name": "NUVL_banker_deck_20250115.pptx",
  "download_url": "/api/v1/reports/download/abc123...",
  "expiry_date": "2025-01-22T12:00:00Z"
}
```

## Template Customization

### Excel Templates

Located in: `platform/templates/excel/`

**File Structure:**
```
excel/
├── dcf_model.xlsx          # Base DCF template
├── comps_model.xlsx        # Comparables template
├── integrated_model.xlsx   # Full integrated model
└── formatters/
    ├── number_formats.py   # Number formatting rules
    └── styles.py           # Cell styles and colors
```

### PowerPoint Templates

Located in: `platform/templates/powerpoint/`

**File Structure:**
```
powerpoint/
├── banker_deck.pptx        # Base banker presentation
├── board_presentation.pptx # Board template
├── investor_update.pptx    # Investor update
└── layouts/
    ├── title_slide.xml     # Title layout
    ├── content_slide.xml   # Content layout
    └── appendix_slide.xml  # Appendix layout
```

## Generation Workflow

### 1. Retrieve Data
- Fetch latest valuation run
- Get consensus estimates
- Load LoE events
- Pull revenue projections

### 2. Populate Template
- Open base template file
- Replace placeholders with actual data
- Format numbers and dates
- Generate charts

### 3. Apply Styling
- Apply color schemes
- Format tables
- Style charts
- Add branding

### 4. Validate Output
- Check all formulas
- Verify data integrity
- Ensure formatting consistent
- Test file opens correctly

### 5. Store and Serve
- Save to storage
- Generate download URL
- Set expiry date
- Log generation event

## Best Practices

### Excel Models
- Always include assumptions sheet
- Link cells, don't hardcode
- Use named ranges for clarity
- Include sensitivity tables
- Add data validation
- Protect calculation cells

### PowerPoint Decks
- Consistent slide layouts
- One message per slide
- Clear chart titles
- Source citations
- Appendix for details
- Professional formatting

### Quality Control
- Test with sample data
- Verify calculations manually
- Check formula links
- Ensure print-friendly
- Test on Windows and Mac
- PDF export verification

## Future Enhancements

- Custom branding per client
- Multi-language support
- Interactive Excel dashboards
- Animated PowerPoint charts
- Real-time data links
- PDF with embedded data
- HTML5 interactive reports
