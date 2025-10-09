# Import/Export Data Workflows

## Overview

The Biotech Terminal supports comprehensive data import and export workflows for financial models, consensus estimates, price targets, and LoE timelines. Data flows seamlessly between Excel, PowerPoint, and the database.

## Supported Formats

### Import Formats
- **Excel (.xlsx)**: Financial models with multiple sheets
- **CSV (.csv)**: Single-table data imports
- **JSON (.json)**: API-compatible structured data

### Export Formats
- **Excel (.xlsx)**: Formatted financial models
- **PowerPoint (.pptx)**: Presentation decks
- **PDF (.pdf)**: Static reports (future)
- **JSON (.json)**: API-compatible exports

## Excel Import/Export

### Architecture

Excel import/export uses YAML cell maps to define the structure:
- **Cell Maps**: Define sheet names, ranges, data types
- **Round-Trip**: Import → Database → Export maintains structure
- **Validation**: Type checking and data validation on import

### Cell Map Structure

Cell maps are located in `platform/ingest/cell_maps/`:

```yaml
# financial_model.yaml
version: "1.0"

consensus_estimates:
  sheet: "Consensus Estimates"
  range: "A2:F100"
  has_header: true
  columns:
    - name: ticker
      type: string
    - name: metric
      type: string
    - name: period
      type: string
    - name: value
      type: float
    - name: source
      type: string
    - name: currency
      type: string

price_targets:
  sheet: "Price Targets"
  range: "A2:E50"
  has_header: true
  columns:
    - name: source
      type: string
    - name: date
      type: date
    - name: price_target
      type: float
    - name: rationale
      type: string
    - name: currency
      type: string
```

### Import Workflow

#### Using Python API

```python
from platform.ingest.importers import ExcelImporter

# Initialize with cell map
importer = ExcelImporter('platform/ingest/cell_maps/financial_model.yaml')

# Load Excel file
importer.load_workbook('path/to/financial_model.xlsx')

# Import specific data types
consensus = importer.import_consensus_estimates()
targets = importer.import_price_targets()
loe_events = importer.import_loe_events()

# Or import all at once
all_data = importer.import_all()
```

#### Using REST API

```bash
# Upload Excel file
POST /api/v1/financials/consensus/upload
Content-Type: multipart/form-data

{
  "file": <excel_file>,
  "ticker": "NUVL",
  "source": "analyst_upload"
}
```

**Response:**
```json
{
  "status": "success",
  "imported": {
    "consensus_estimates": 45,
    "price_targets": 12,
    "loe_events": 3
  },
  "warnings": [],
  "errors": []
}
```

### Export Workflow

#### Using Python API

```python
from platform.ingest.exporters import ExcelExporter

# Initialize with cell map
exporter = ExcelExporter('platform/ingest/cell_maps/financial_model.yaml')

# Create workbook
exporter.create_workbook()

# Export data
data = {
    'consensus_estimates': [...],
    'price_targets': [...],
    'loe_events': [...]
}

exporter.export_all(data)

# Save to file
exporter.save('output/financial_model.xlsx')
```

#### Using REST API

```bash
POST /api/v1/reports/export
Content-Type: application/json

{
  "ticker": "NUVL",
  "template_id": "dcf_model",
  "file_type": "xlsx",
  "params": {
    "include_consensus": true,
    "include_price_targets": true,
    "include_loe": true
  }
}
```

**Response:**
```json
{
  "status": "success",
  "artifact_id": 123,
  "file_name": "NUVL_dcf_model_20250115.xlsx",
  "download_url": "/api/v1/reports/download/abc123...",
  "expiry_date": "2025-01-22T12:00:00Z"
}
```

## PowerPoint Export

### Presentation Templates

Templates are located in `platform/templates/powerpoint/`:
- `banker_deck.pptx`: Investment banking presentation
- `board_presentation.pptx`: Board meeting deck
- `investor_update.pptx`: Investor relations update

### Export Workflow

#### Using Python API

```python
from platform.ingest.exporters import PPTXExporter

# Initialize with template
exporter = PPTXExporter('platform/templates/powerpoint/banker_deck.pptx')

# Generate deck
exporter.generate_banker_deck(
    ticker='NUVL',
    valuation_data={
        'dcf': {'enterprise_value': 2500},
        'multiples': {'implied_value': 2800},
        'wacc': 0.12,
        'tgr': 0.025,
        'scenario': 'Base Case'
    },
    price_targets=[...],
    loe_events=[...]
)

# Save presentation
exporter.save('output/NUVL_banker_deck.pptx')
```

#### Using REST API

```bash
POST /api/v1/reports/export
Content-Type: application/json

{
  "ticker": "NUVL",
  "template_id": "banker_deck",
  "file_type": "pptx",
  "params": {
    "include_sensitivity": true,
    "include_comparables": true,
    "analyst_name": "John Smith"
  }
}
```

## CSV Import/Export

### Import CSV

```bash
POST /api/v1/financials/consensus/upload
Content-Type: multipart/form-data

{
  "file": <csv_file>,
  "data_type": "consensus_estimates",
  "ticker": "NUVL"
}
```

### Export CSV

```bash
GET /api/v1/financials/consensus?ticker=NUVL&format=csv
```

## Data Validation

### Import Validation Rules

1. **Type Checking**: Values must match column types
2. **Required Fields**: Non-nullable columns must have values
3. **Format Validation**: Dates, numbers, enums checked
4. **Business Rules**: Custom validation (e.g., price > 0)

### Validation Errors

```json
{
  "status": "error",
  "imported": 0,
  "errors": [
    {
      "row": 5,
      "column": "price_target",
      "error": "Invalid float value: 'N/A'"
    },
    {
      "row": 12,
      "column": "date",
      "error": "Invalid date format: '2025-13-01'"
    }
  ]
}
```

## Round-Trip Workflow

### Complete Import-Export Cycle

1. **Export Template**: Download Excel template with cell map
2. **Fill Data**: Add financial data to template
3. **Import**: Upload to platform via API
4. **Validate**: System validates and stores data
5. **Export**: Generate reports from stored data

### Maintaining Structure

- **Cell Positions**: Preserved in cell map
- **Formatting**: Styles applied on export
- **Formulas**: Preserved where possible
- **Sheet Names**: Consistent across import/export

## Best Practices

### Excel Import
- Use provided templates to ensure compatibility
- Validate data in Excel before uploading
- Keep cell map versions in sync with Excel structure
- Test with small datasets first

### Excel Export
- Use cell maps that match your data structure
- Apply professional formatting
- Include metadata (date, analyst, version)
- Test exports on Windows and Mac

### PowerPoint Export
- Start with standard templates
- Customize templates for branding
- Keep slide counts reasonable (15-25 slides)
- Include appendix for detailed tables

### API Usage
- Handle upload timeouts for large files
- Check download link expiry dates
- Store artifact IDs for audit trails
- Use async export for large datasets

## Error Handling

### Common Issues

**Issue**: Import fails with "Invalid cell map"
- **Solution**: Verify cell map YAML syntax
- **Check**: Sheet names match exactly

**Issue**: Export generates empty file
- **Solution**: Verify data exists in database
- **Check**: Query filters are correct

**Issue**: Download link expired
- **Solution**: Re-generate export
- **Check**: Download within 7-day window

## Command Palette Integration

### Quick Access

- `IM <Enter>`: Open import wizard
- `EX <Enter>`: Open export dialog
- `RP <Enter>`: Generate reports

### Import from Command Palette

1. Press `⌘+K` to open command palette
2. Type `IM` or `IMPORT`
3. Select import type (Excel, CSV, JSON)
4. Choose file and upload

### Export from Command Palette

1. Press `⌘+K` to open command palette
2. Type `EX` or `EXPORT`
3. Select export format (Excel, PPTX, PDF)
4. Configure options and generate

## Developer Guide

### Creating Custom Cell Maps

1. Define your Excel structure
2. Create YAML cell map in `platform/ingest/cell_maps/`
3. Specify sheets, ranges, columns, types
4. Test import/export round-trip

### Extending Exporters

```python
# Custom Excel export
class CustomExporter(ExcelExporter):
    def export_custom_sheet(self, data):
        # Add custom logic
        pass
```

### Adding New Templates

1. Create PowerPoint template in `platform/templates/powerpoint/`
2. Define slide layouts
3. Add to PPTXExporter template registry
4. Test with sample data

## See Also

- [Report Templates](./REPORT_TEMPLATES.md)
- [Financials Module](./FINANCIALS_MODULE.md)
- [Command Palette](./COMMAND_PALETTE.md)
- [API Integration](./API_INTEGRATION.md)
