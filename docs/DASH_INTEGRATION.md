# Dash Integration - Evidence Graph Visualization

## Overview

This implementation adds a Plotly Dash application mounted within the existing FastAPI backend to provide interactive visualization of Evidence Graph data without leaving Python.

## What Was Added

### 1. New API Endpoints

Two new endpoints were added to `/bt_platform/core/endpoints/evidence.py`:

#### `/api/v1/evidence/pos` - Probability of Success (PoS) Time Series
- **Method**: GET
- **Parameters**: 
  - `series` (optional): Series identifier (default: "SRRK_SMA")
  - Options: "SRRK_SMA", "IONIS_ATTR", "KRYS_CF"
- **Returns**: Array of objects with `t` (timestamp) and `pos` (probability value)
- **Example**:
  ```bash
  curl http://localhost:8000/api/v1/evidence/pos?series=SRRK_SMA
  ```

#### `/api/v1/evidence/vol` - Implied Volatility (IV) Time Series
- **Method**: GET
- **Parameters**:
  - `ticker` (optional): Stock ticker symbol (default: "SRRK")
  - Options: "SRRK", "IONIS", "KRYS"
- **Returns**: Array of objects with `t` (timestamp) and `iv` (implied volatility value)
- **Example**:
  ```bash
  curl http://localhost:8000/api/v1/evidence/vol?ticker=SRRK
  ```

### 2. Dash Application

Located at `/bt_platform/core/dash_integration.py`:

- **Interactive Dashboard**: Dropdown menus for series/ticker selection
- **Dual-Axis Visualization**: PoS line chart + IV bar chart overlay
- **Auto-Refresh**: 30-second interval for live data updates
- **Aurora Eclipse Theme**: Custom CSS styling matching terminal aesthetics
- **Responsive Layout**: Clean, professional UI with monospace fonts

### 3. Dash Mounting

The Dash app is mounted at `/dash` route in the main FastAPI application using Starlette's WSGIMiddleware.

**Access URL**: `http://localhost:8000/dash/`

**Note**: Due to WSGI middleware limitations with Starlette in test environments, the Dash UI may not render perfectly in all deployment scenarios. The underlying API endpoints work correctly and can be consumed by any frontend.

### 4. Custom Styling

Aurora Eclipse CSS theme (`/bt_platform/core/assets/aurora-eclipse.css`):
- Terminal-style dark background (#0a0e27)
- Accent colors: Primary (#00ff9f), Secondary (#3b82f6)
- Monospace fonts throughout
- Custom scrollbars and dropdowns
- Bloomberg Terminal-inspired corner brackets (optional)

### 5. Comprehensive Tests

Added `/tests/test_dash_integration.py` with 10 passing tests:

**Endpoint Tests**:
- ✅ test_get_pos_endpoint
- ✅ test_get_pos_default_series
- ✅ test_get_pos_different_series
- ✅ test_get_vol_endpoint
- ✅ test_get_vol_default_ticker
- ✅ test_get_vol_different_tickers
- ✅ test_pos_data_ascending_trend
- ✅ test_vol_data_ascending_trend

**Integration Tests**:
- ✅ test_dash_route_accessible
- ✅ test_dash_assets_loadable

## Usage

### Start the Server

```bash
# Using Poetry
poetry run uvicorn bt_platform.core.app:app --reload --port 8000

# Or using the setup script
./scripts/setup.sh dev
```

### Test the Endpoints

```bash
# Get PoS data for SRRK SMA program
curl http://localhost:8000/api/v1/evidence/pos?series=SRRK_SMA

# Get IV data for SRRK ticker
curl http://localhost:8000/api/v1/evidence/vol?ticker=SRRK

# Access Dash UI
open http://localhost:8000/dash/
```

### Run Tests

```bash
poetry run pytest tests/test_dash_integration.py -v
```

## Architecture

```
┌─────────────────────────────────────────┐
│         FastAPI Application             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  /api/v1/evidence/pos             │ │
│  │  Returns PoS time series JSON     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  /api/v1/evidence/vol             │ │
│  │  Returns IV time series JSON      │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  /dash  (WSGI Middleware)         │ │
│  │  ┌─────────────────────────────┐  │ │
│  │  │    Dash Application         │  │ │
│  │  │  - Interactive dropdowns    │  │ │
│  │  │  - Plotly charts           │  │ │
│  │  │  - Auto-refresh (30s)      │  │ │
│  │  │  - Calls local endpoints   │  │ │
│  │  └─────────────────────────────┘  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Data Flow

1. User selects series/ticker in Dash UI
2. Dash callback triggers on selection change or 30s interval
3. Dash makes HTTP requests to local FastAPI endpoints:
   - `GET /api/v1/evidence/pos?series=X`
   - `GET /api/v1/evidence/vol?ticker=Y`
4. FastAPI returns JSON time series data
5. Dash processes data and updates Plotly figure
6. Interactive chart displays PoS (line) + IV (bars) overlay

## Benefits

### One Stack, Zero Context-Switching
- Keep FastAPI for data & auth
- Dash for interactive visualization
- No React/Next.js build needed

### Real-time Feel
- `dcc.Interval` component auto-refreshes every 30 seconds
- Perfect for tracking PoS deltas during catalyst windows

### Redmile-Friendly Demo
- Send stakeholders to `/dash` for clean, clickable Evidence Graph
- No frontend setup required
- Professional terminal aesthetics out of the box

## Future Enhancements

### Quick Polish Checklist (from problem statement)
- [ ] Gate the Dash route behind FastAPI authentication (session cookie)
- [ ] Swap loopback calls to internal services (currently uses httpx.Client)
- [ ] Move to httpx.AsyncClient + async callbacks for better scalability
- [ ] Add tabs:
  - PoS Timeline
  - Event Map
  - Competitor Overlay
  - IV Spike Detector
- [ ] Export buttons:
  - PNG download
  - CSV of charted series
  - "Copy to GG Excel" endpoint

### Integration with Existing Endpoints
The mock data can be replaced with actual data from:
- `/api/v1/evidence/journal` - Journal entries
- `/api/v1/pipelines` - Pipeline data
- `/api/v1/catalysts` - Catalyst events
- `/api/v1/iv` - Real IV catalyst signals

## Dependencies Added

- `dash` - Plotly Dash framework for interactive Python dashboards
- Integrated via `poetry add dash`
- Already had `plotly` dependency (version ^5.17.0)

## Files Modified

1. `pyproject.toml` - Added dash dependency
2. `bt_platform/core/app.py` - Mount Dash app at /dash route
3. `bt_platform/core/endpoints/evidence.py` - Added /pos and /vol endpoints
4. `bt_platform/core/dash_integration.py` - New file with Dash app
5. `bt_platform/core/assets/aurora-eclipse.css` - New CSS theme file
6. `tests/test_dash_integration.py` - New test file with 10 tests

## Testing Results

```
====== 10 passed, 28 warnings in 1.69s ======
```

All tests pass successfully! The new endpoints return proper JSON data structures and integrate cleanly with the existing FastAPI application.
