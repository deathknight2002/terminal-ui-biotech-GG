# Command Palette & Function Codes Reference

## Overview

The Biotech Terminal features a Bloomberg-style command palette with function codes for rapid navigation and data operations. Access the command palette with `⌘+K` (Mac) or `Ctrl+K` (Windows/Linux).

## Function Code Categories

### Navigation Codes
Quick access to core pages and modules.

| Code | Label | Description | Shortcut |
|------|-------|-------------|----------|
| HO | HOME | Main dashboard and overview | ⌘+H |
| NE | NEWS | Latest biotech news and articles | ⌘+N |
| CO | COMPANIES | Company profiles and information | ⌘+C |
| TR | TRIALS | Clinical trial database and tracker | ⌘+T |
| CA | CATALYST CALENDAR | Upcoming market-moving events | ⌘+K |
| PI | PIPELINE | Drug pipeline and development tracker | - |
| EP | EPIDEMIOLOGY | Disease epidemiology and patient populations | ⌘+E |
| CM | COMPETITORS | Competitive landscape analysis | - |
| MI | MARKET INTEL | Market intelligence and trends | - |
| DC | DATA CATALOG | Browse available datasets | - |
| AL | AUDIT LOG | System audit log and history | - |

### Financial Analysis Codes

| Code | Label | Description |
|------|-------|-------------|
| FI | FINANCIALS | Financial overview and models |
| PT | PRICE TARGETS | Analyst price targets and consensus |
| VA | VALUATION | DCF and multiples valuation |
| LO | LOE TIMELINE | Loss of exclusivity timeline |

### Data Operation Codes

| Code | Label | Description |
|------|-------|-------------|
| EX | EXPORT | Export data to Excel/PowerPoint |
| IM | IMPORT | Import data from Excel/CSV |
| SE | SEARCH | Global search across all data |
| RE | REFRESH | Refresh data from sources |

### Analytics & Reporting Codes

| Code | Label | Description |
|------|-------|-------------|
| RP | REPORTS | Generate and download reports |
| SN | SENSITIVITY | Sensitivity analysis tables |
| CP | COMPARABLES | Comparable companies analysis |

## Usage Examples

### Basic Navigation
```
Type: HO <Enter>
Action: Navigate to home dashboard

Type: TR <Enter>
Action: Open clinical trials page
```

### Search with Context
```
Type: CO ARYAZ <Enter>
Action: Search companies for "ARYAZ"

Type: TR oncology <Enter>
Action: Search trials for "oncology"

Type: NE FDA approval <Enter>
Action: Search news for "FDA approval"
```

### Data Operations
```
Type: EX <Enter>
Action: Open export dialog

Type: IM <Enter>
Action: Open import wizard

Type: RE <Enter>
Action: Refresh current page data
```

### Report Generation
```
Type: RP <Enter>
Action: Open reports generator

Type: VA <Enter>
Action: Run valuation model
```

## Command Palette Features

### Fuzzy Search
The command palette supports fuzzy matching:
- Type "comp" → matches "COMPANIES", "COMPETITORS", "COMPARABLES"
- Type "fin" → matches "FINANCIALS"
- Type "cat" → matches "CATALYST CALENDAR", "DATA CATALOG"

### Recent Commands
The palette tracks your 10 most recent commands for quick access:
- Recent commands appear at the top
- Press `↑` / `↓` to navigate
- Press `Enter` to execute

### Keyboard Navigation
- `⌘+K` / `Ctrl+K`: Open command palette
- `↑` / `↓`: Navigate results
- `Enter`: Execute selected command
- `Esc`: Close palette

### Category Filtering
Commands are organized by category:
- **navigation**: Page navigation
- **financials**: Financial analysis tools
- **data**: Data import/export operations
- **analytics**: Reports and analysis

## Integration with Global Search

Function codes work seamlessly with global search:
1. Type a function code to select the data type
2. Add a space and your search query
3. Results are filtered by the selected type

Example:
```
CO NUVL → Search companies for "NUVL"
TR DMD → Search trials for "DMD"
NE Phase 3 → Search news for "Phase 3"
```

## Customization

Function codes are defined in `src/config/functionCodes.ts` and can be extended with:
- Custom navigation paths
- Action handlers for data operations
- Additional categories
- Custom keyboard shortcuts

## Best Practices

1. **Memorize Core Codes**: Learn HO, NE, CO, TR, FI for daily use
2. **Use Shortcuts**: Keyboard shortcuts are faster than typing codes
3. **Leverage Fuzzy Search**: Type partial matches when unsure
4. **Recent Commands**: Frequent tasks appear in recent list
5. **Search Integration**: Combine codes with search terms for precision

## Developer Notes

### Adding New Function Codes

```typescript
// src/config/functionCodes.ts
{
  code: 'XX',              // 2-4 letter code
  label: 'MY FEATURE',     // Display label (uppercase)
  description: 'Feature description',
  path: '/my-feature',     // Navigation path or #action
  keywords: ['search', 'terms'],
  shortcut: '⌘+X',        // Optional keyboard shortcut
  category: 'navigation',  // Category for grouping
}
```

### Handling Action Codes

For action codes (path starts with #), implement handlers in the command palette hook:

```typescript
// terminal/src/hooks/useCommandPalette.ts
if (path.startsWith('#')) {
  // Handle action-based function codes
  handleAction(path.substring(1));
} else {
  // Navigate to path
  navigate(path);
}
```

## See Also

- [Global Search Integration](./SEARCH_INTEGRATION.md)
- [Import/Export Workflows](./IMPORT_EXPORT.md)
- [Report Generation](./REPORT_TEMPLATES.md)
- [Keyboard Shortcuts Guide](./TERMINAL_GRADE_FEATURES.md)
