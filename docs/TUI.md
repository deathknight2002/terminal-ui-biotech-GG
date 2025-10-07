# Biotech Terminal User Interface (TUI)

## Overview

The Biotech Terminal provides an interactive command-line interface for biotech portfolio analysis. It offers a terminal-style user experience with real-time data visualization, asset tracking, and risk assessment tools.

## Features

### 🎯 Onboarding Panel
- Displays usage instructions on first launch
- Shows the three most recently accessed assets
- Can be toggled on/off with F1 key

### 📊 Watchlist Management
- Track multiple biotech assets of interest
- Add/remove assets during session
- View all watched assets at once
- Sidebar displays current watchlist

### 🕒 Recent Assets Tracking
- Automatically tracks last 3 accessed assets
- Updates in real-time as you view assets
- Displayed in both onboarding panel and sidebar

### 📈 Risk Metrics Display
- Success probability analysis
- Monthly burn rate tracking
- Runway estimation (months of cash remaining)
- Risk category classification (Low/Medium/High)

### 🔄 Data Refresh
- Manual data refresh with status updates
- Loading indicators during refresh
- Success/error feedback
- Graceful error handling

## Installation

### Prerequisites
- Python 3.9 or higher
- pip package manager

### Install Dependencies

```bash
pip install textual rich
```

Or if using the full platform with Poetry:

```bash
poetry install
```

## Quick Start

### Launch the Terminal

```bash
# From project root
python3 -m platform.tui

# Or if installed via Poetry
poetry run python -m platform.tui
```

The terminal will launch with the onboarding panel displayed.

## Commands Reference

### Asset Viewing
```bash
view <asset_id>         # View detailed information about an asset
                        # Example: view BCRX-001
```

### Watchlist Management
```bash
watch <asset_id>        # Add an asset to your watchlist
                        # Example: watch BCRX-001

unwatch <asset_id>      # Remove an asset from watchlist
                        # Example: unwatch BCRX-001

watchlist               # Display all assets in watchlist
```

### Data Management
```bash
refresh                 # Refresh data from all sources
                        # Shows progress indicator and completion status
```

### Help & Navigation
```bash
help                    # Show onboarding panel with commands
quit                    # Exit the terminal
exit                    # Exit the terminal (alternative)
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F1` | Toggle onboarding panel |
| `Ctrl+R` | Refresh data |
| `Ctrl+C` | Quit application |
| `Tab` | Navigate between input and output |

## Terminal Layout

```
╔════════════════════════════════════════════════════════════════════════╗
║                    Biotech Portfolio Analysis Terminal                  ║
╠═══════════════════════╦═══════════════════════════════════════════════╣
║                       ║                                                ║
║   WATCHLIST           ║                                                ║
║   ▸ BCRX-001         ║            MAIN CONTENT AREA                  ║
║   ▸ SRPT-001         ║                                                ║
║                       ║      (Asset details, outputs, etc.)           ║
║   RECENT ASSETS       ║                                                ║
║   1. BCRX-001        ║                                                ║
║   2. NTLA-001        ║                                                ║
║                       ║                                                ║
╠═══════════════════════╩═══════════════════════════════════════════════╣
║ Command: _                                                             ║
╚════════════════════════════════════════════════════════════════════════╝
```

## Usage Examples

### Example 1: View Asset Details with Risk Metrics

```bash
> view BCRX-001

╔════════════════════════════════════════════════════════════╗
║  ASSET DETAILS:              BCRX-001                     ║
╚════════════════════════════════════════════════════════════╝

RISK ASSESSMENT
────────────────────────────────────────────────────────────
  Success Probability:  65.0%
  Monthly Burn Rate:    $4.8M
  Runway:               18 months
  Risk Category:        Medium

FINANCIAL OVERVIEW
────────────────────────────────────────────────────────────
  Market Cap:           $8.9B
  Pipeline Stage:       Phase III
  Indication:           Oncology

Use 'watch BCRX-001' to add to watchlist
```

### Example 2: Managing Your Watchlist

```bash
# Add assets to watchlist
> watch BCRX-001
✓ Added BCRX-001 to watchlist

> watch SRPT-001
✓ Added SRPT-001 to watchlist

# View complete watchlist
> watchlist
Current Watchlist:

  1. BCRX-001
  2. SRPT-001

Total: 2 asset(s)

# Remove an asset
> unwatch BCRX-001
✓ Removed BCRX-001 from watchlist
```

### Example 3: Refreshing Data

```bash
> refresh
⟳ Refreshing data...

# After completion:
✓ Data refresh completed successfully!
```

## Asset IDs Available

The following mock assets are available for testing:

| Asset ID | Company | Risk Category | Success Probability |
|----------|---------|---------------|---------------------|
| BCRX-001 | Beigene | Medium | 65% |
| SRPT-001 | Sarepta | Low | 78% |
| BEAM-001 | Beam Therapeutics | High | 58% |
| NTLA-001 | Intellia | Medium | 62% |
| REGN-001 | Regeneron | Low | 82% |

## Architecture

### Services
- **WatchlistManager**: Manages in-memory watchlist storage
- **RecentAssetsTracker**: Tracks last 3 accessed assets
- **RefreshService**: Handles data refresh with status updates

### Widgets
- **OnboardingWidget**: Welcome screen and command reference
- **WatchlistSidebar**: Displays current watchlist
- **RecentAssetsWidget**: Shows recently accessed assets
- **AssetDetailWidget**: Displays asset information with risk metrics

### Helpers
- **risk_metrics**: Provides risk assessment data for assets

## Development

### Running Tests

```bash
# Run all TUI tests
python3 -m pytest tests/tui/ -v

# Run specific test file
python3 -m pytest tests/tui/test_watchlist_manager.py -v

# Run with coverage
python3 -m pytest tests/tui/ --cov=platform.tui --cov-report=html
```

### Project Structure

```
platform/tui/
├── __init__.py           # Module initialization
├── __main__.py           # CLI entry point
├── app.py                # Main TUI application
├── services/             # Business logic services
│   ├── __init__.py
│   ├── watchlist_manager.py
│   ├── recent_assets_tracker.py
│   └── refresh_service.py
├── widgets/              # UI components
│   ├── __init__.py
│   ├── onboarding.py
│   ├── watchlist_sidebar.py
│   ├── recent_assets.py
│   └── asset_detail.py
└── helpers/              # Utility modules
    ├── __init__.py
    └── risk_metrics.py
```

## Troubleshooting

### Terminal Won't Start

**Issue**: Module not found errors
```bash
ModuleNotFoundError: No module named 'textual'
```

**Solution**: Install dependencies
```bash
pip install textual rich
```

### Display Issues

**Issue**: Terminal colors or formatting look wrong

**Solution**: Ensure your terminal supports 256 colors
```bash
# Check terminal capabilities
echo $TERM

# Should be something like: xterm-256color
```

### Asset Not Found

**Issue**: "Risk metrics not available"

**Solution**: Use one of the predefined asset IDs (BCRX-001, SRPT-001, etc.)

## Future Enhancements

- [ ] Persistent storage for watchlist across sessions
- [ ] Export watchlist to CSV/JSON
- [ ] Sparkline trend indicators in watchlist
- [ ] Command history with up/down arrows
- [ ] Autocomplete for asset IDs
- [ ] Integration with real backend API
- [ ] Custom alert thresholds
- [ ] Portfolio comparison view

## Contributing

Contributions are welcome! Please ensure:
1. All tests pass: `pytest tests/tui/ -v`
2. Code follows style guidelines: `ruff check platform/tui/`
3. New features include tests
4. Documentation is updated

## Support

For issues or questions:
- File an issue on GitHub
- Check existing documentation
- Review test files for usage examples

## License

MIT License - See LICENSE file for details
