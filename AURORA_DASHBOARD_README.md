# Aurora Lava Dashboard - Evidence Graph UI

## Overview

The Aurora Lava Dashboard is a high-polish, real-time biotech trading dashboard with a Bloomberg Terminal-inspired aesthetic and animated WebGL background. It provides interactive visualization of Probability of Success (PoS), Implied Volatility (IV), and catalyst events.

## Features

### Visual Design
- **Aurora Theme**: Dark terminal aesthetic with neon accents (#00ff9f cyan-green, #9a4dff magenta)
- **Animated Background**: Subtle WebGL lava/aurora effect using Vanta.js (respects `prefers-reduced-motion`)
- **Bloomberg-Style UI**: Corner brackets, monospace fonts, uppercase labels, high contrast (WCAG AAA)
- **Glass Panels**: Frosted glass effect with backdrop blur

### Components

#### 1. Header Bar
- **App Branding**: "EVIDENCE GRAPH" title with "Live PoS & IV" subtitle
- **Series Dropdown**: Select series (SRRK_SMA, IONIS_ATTR, KRYS_CF)
- **Ticker Dropdown**: Select ticker symbol (SRRK, IONIS, KRYS)
- **Auto-Refresh Control**: 15s/30s/60s/Off options
- **Status Indicators**: Last updated timestamp and latency pill (color-coded)

#### 2. PoS Gauge
- Animated donut chart showing Probability of Success
- Color gradient based on value:
  - Red (#ff5a5f): 0-33% (low probability)
  - Amber (#ffcc00): 34-66% (medium probability)
  - Green (#29d344): 67-100% (high probability)
- Delta indicator showing change vs previous value
- Smooth 350ms cubic-in-out animation

#### 3. IV Chart
- Combo chart with dual y-axes
- IV bars (cyan #00d9ff) with opacity 0.7
- HV sparkline (magenta #9a4dff) on secondary axis
- Average IV threshold line (dashed amber)
- Unified hover mode for easy comparison

#### 4. Catalyst Heatmap
- Matrix visualization of catalysts by ticker and time
- Color-coded by IV Rank (0-100 scale)
- Hover tooltips with event details:
  - Event type and description
  - Date and certainty level
  - Binary risk assessment
  - IV rank percentile

#### 5. KPI Tiles
- **PoS 7D Change**: Week-over-week change percentage
- **IV Rank**: Current percentile ranking
- **Next Catalyst**: Upcoming event date
- **Binary Risk**: Risk level (LOW/MEDIUM/HIGH) with color indicator

### Technical Architecture

```
bt_platform/core/
├── dashapp/                    # Aurora Lava dashboard
│   ├── __init__.py            # App factory
│   ├── layout.py              # Main layout composition
│   ├── callbacks.py           # Interactive callbacks
│   ├── components/            # Modular UI components
│   │   ├── header.py          # Header bar with controls
│   │   ├── pos_gauge.py       # PoS donut chart
│   │   ├── iv_chart.py        # IV combo chart
│   │   ├── catalyst_heatmap.py # Catalyst matrix
│   │   ├── tiles.py           # KPI tile grid
│   │   └── loaders.py         # Skeleton loaders
│   └── services/              # Backend services
│       ├── api.py             # HTTP client with caching
│       └── cache.py           # Flask-Caching wrapper
└── assets/                    # Static assets
    ├── aurora-vars.css        # CSS variables/tokens
    ├── aurora.css             # Theme styles
    ├── lava-bg.js             # WebGL background
    └── aurora-eclipse.css     # Legacy theme (fallback)
```

## Development

### Prerequisites
- Python 3.9+ with Poetry
- Node.js 18+ (for frontend dependencies if needed)

### Installation

```bash
# Install dependencies
poetry install

# Or add individual packages
poetry add dash-mantine-components dash-iconify dash-extensions flask-caching
```

### Running the Dashboard

```bash
# Start the FastAPI server with mounted Dash app
poetry run uvicorn bt_platform.core.app:app --reload

# Or use the app directly
poetry run python -m bt_platform.core.app
```

The dashboard will be available at:
- **Dashboard**: http://localhost:8000/dash
- **API**: http://localhost:8000/api/v1
- **API Docs**: http://localhost:8000/docs

### API Endpoints Used

The dashboard consumes these FastAPI endpoints:

```bash
# Get PoS time series
GET /api/v1/evidence/pos?series=SRRK_SMA

# Get IV time series
GET /api/v1/evidence/vol?ticker=SRRK

# Get catalyst heatmap (future)
GET /api/v1/catalyst/heatmap
```

### Testing

```bash
# Run all dashboard tests
poetry run pytest tests/test_dash_aurora.py -v

# Run with coverage
poetry run pytest tests/test_dash_aurora.py --cov=bt_platform.core.dashapp

# Run all tests
poetry run pytest tests/
```

### Linting and Formatting

```bash
# Check code style
poetry run ruff check bt_platform/core/dashapp/

# Auto-fix issues
poetry run ruff check bt_platform/core/dashapp/ --fix

# Format code
poetry run ruff format bt_platform/core/dashapp/
```

## Configuration

### Environment Variables

```bash
# API base URL (default: http://127.0.0.1:8000)
API_BASE_URL=http://localhost:8000

# Cache configuration
CACHE_TYPE=SimpleCache  # or RedisCache
CACHE_DEFAULT_TIMEOUT=15  # seconds
```

### Customization

#### Change Color Scheme
Edit `bt_platform/core/assets/aurora-vars.css`:

```css
:root {
    --accent: #00ff9f;      /* Primary accent color */
    --magenta: #9a4dff;     /* Secondary accent */
    --cyan: #00d9ff;        /* Tertiary accent */
    
    --heat-lo: #ff5a5f;     /* Low probability - red */
    --heat-mid: #ffcc00;    /* Medium - amber */
    --heat-hi: #29d344;     /* High - green */
}
```

#### Disable WebGL Background
Edit `bt_platform/core/assets/lava-bg.js`:

```javascript
// Set to true to disable background
const reduceMotion = true;
```

Or use CSS `prefers-reduced-motion` in system settings.

#### Adjust Refresh Intervals
Edit `bt_platform/core/dashapp/components/header.py`:

```python
dcc.Dropdown(
    id="refresh-interval-dropdown",
    options=[
        {"label": "5s", "value": 5000},     # Add faster refresh
        {"label": "15s", "value": 15000},
        {"label": "30s", "value": 30000},
        {"label": "60s", "value": 60000},
        {"label": "Off", "value": 0},
    ],
    value=30000,  # Default interval
)
```

## Performance

### Optimization Strategies

1. **Caching**: 15-second cache on API responses (Flask-Caching)
2. **Memoization**: Figure construction memoized in components
3. **uirevision**: Plotly preserves zoom/pan state across updates
4. **Debouncing**: Callbacks debounced to prevent excessive renders
5. **Lazy Loading**: Components load with skeleton states
6. **Asset Serving**: `serve_locally=True` for Dash assets

### Metrics

- **TTI (Time to Interactive)**: < 1.5s on localhost
- **Handler Response**: < 100ms for callbacks
- **Animation Frame Rate**: 60fps for WebGL background
- **Bundle Size**: ~2MB (including Plotly, Vanta.js)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

**Note**: WebGL background requires WebGL 2.0 support. Falls back to gradient if unavailable.

## Accessibility

- **Contrast**: WCAG AAA compliant (7:1 minimum)
- **Keyboard Navigation**: Full keyboard support for all controls
- **Screen Readers**: ARIA labels on all interactive elements
- **Reduced Motion**: Respects `prefers-reduced-motion` preference
- **Focus Indicators**: Visible focus rings on all focusable elements

## Troubleshooting

### Dashboard Not Loading

1. Check FastAPI server is running:
   ```bash
   curl http://localhost:8000/health
   ```

2. Verify Dash app is mounted:
   ```bash
   curl http://localhost:8000/dash/
   ```

3. Check browser console for JavaScript errors

### WebGL Background Not Showing

1. Check browser WebGL support:
   - Visit: chrome://gpu (Chrome) or about:support (Firefox)
   - Look for "WebGL" status

2. Verify Vanta.js is loaded:
   - Open browser console
   - Type: `typeof VANTA`
   - Should return `"object"`

3. Check `prefers-reduced-motion` setting:
   - System Settings → Accessibility → Reduce Motion

### Slow Performance

1. Disable WebGL background (see Customization above)
2. Increase cache timeout in `services/cache.py`
3. Reduce refresh interval in header dropdown
4. Check network latency to API endpoints

### API Connection Errors

The dashboard gracefully handles API failures:
- Uses cached "last good data" when API is unavailable
- Shows error states with helpful messages
- Latency pill turns amber/red when response is slow

Check API service logs:
```bash
# View API service status
grep "API" logs/app.log

# Test endpoint directly
curl http://localhost:8000/api/v1/evidence/pos?series=SRRK_SMA
```

## Future Enhancements

- [ ] Shader switcher (Aurora / Lava / Particles)
- [ ] Download PNG/CSV buttons on each card
- [ ] Alert rules (e.g., IV Rank > 70 → toast + glow)
- [ ] Historical comparison overlay
- [ ] Multi-ticker comparison view
- [ ] Mobile-optimized layout
- [ ] Dark/light theme toggle
- [ ] Custom date range picker

## Contributing

When contributing to the Aurora dashboard:

1. Follow the existing component structure
2. Use TypeScript-style type hints in Python
3. Add tests for new components
4. Maintain WCAG AAA contrast compliance
5. Ensure animations respect `prefers-reduced-motion`
6. Document all configuration options

## License

MIT - See LICENSE file for details
