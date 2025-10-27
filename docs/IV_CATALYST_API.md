# IV Catalyst Tracking - API Documentation

## Overview

RESTful API for accessing implied volatility catalyst signals and data. All endpoints return JSON.

**Base URL**: `https://api.terminal.gg/api/v1/iv`

## Authentication

Currently no authentication required for read operations. Future versions may require API keys.

## Endpoints

### 1. Get IV Catalyst Signals

Retrieve pre-computed IV catalyst signals based on screening rules.

**Endpoint**: `GET /signals`

**Query Parameters**:
- `min_score` (integer, optional, default: 2): Minimum signal score (0-4)
- `max_days_to_event` (integer, optional, default: 60): Maximum days to catalyst event
- `min_confidence` (float, optional, default: 0.5): Minimum confidence (0-1)
- `ticker` (string, optional): Filter by ticker symbol
- `quality` (string, optional): Filter by quality (High, Medium, Low)

**Example Request**:
```bash
GET /api/v1/iv/signals?min_score=2&max_days_to_event=60&quality=High
```

**Example Response**:
```json
{
  "signals": [
    {
      "ticker": "VRTX",
      "signal_date": "2025-01-15T00:00:00Z",
      "event_date": "2025-03-01T00:00:00Z",
      "event_type": "FDA Approval",
      "days_to_event": 45,
      "signal_score": 3,
      "confidence": 0.75,
      "quality": "High",
      "metrics": {
        "iv7": 65.2,
        "iv30": 58.1,
        "iv_rv_ratio": 1.52,
        "term_backwardation": 7.1,
        "skew25d": 12.3,
        "skew_change": 8.7,
        "iv7_pctile": 72,
        "price": 142.50,
        "ret5d": 0.012
      },
      "flags": {
        "backwardation": true,
        "iv_rv_elevated": true,
        "skew_significant": true,
        "oi_spike": false
      }
    }
  ],
  "count": 1,
  "filters": {
    "min_score": 2,
    "max_days_to_event": 60,
    "min_confidence": 0.5,
    "ticker": null,
    "quality": "High"
  }
}
```

**Response Fields**:
- `signals`: Array of signal objects
- `count`: Total number of signals returned
- `filters`: Applied filter values

**Signal Object**:
- `ticker`: Stock ticker symbol
- `signal_date`: Date signal was generated (ISO 8601)
- `event_date`: Date of catalyst event (ISO 8601)
- `event_type`: Type of catalyst (FDA Approval, Data Readout, etc.)
- `days_to_event`: Days until catalyst event
- `signal_score`: Combined score from flags (0-4)
- `confidence`: Signal confidence (0-1)
- `quality`: Signal quality tier (High, Medium, Low)
- `metrics`: IV and price metrics object
- `flags`: Boolean flags for each signal criterion

**HTTP Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server error

---

### 2. Get IV Calendar

Retrieve catalyst calendar with IV overlay for visualization.

**Endpoint**: `GET /calendar`

**Query Parameters**:
- `from_date` (string, optional): Start date (ISO 8601), default: 30 days ago
- `to_date` (string, optional): End date (ISO 8601), default: 60 days ahead
- `tickers` (string, optional): Comma-separated ticker list (e.g., "VRTX,BIIB,REGN")

**Example Request**:
```bash
GET /api/v1/iv/calendar?from_date=2025-01-01&to_date=2025-06-01&tickers=VRTX,BIIB
```

**Example Response**:
```json
{
  "events": [
    {
      "id": 123,
      "ticker": "VRTX",
      "name": "VX-880 Phase 1/2 Data Readout",
      "event_date": "2025-03-01T00:00:00Z",
      "event_type": "Data Readout",
      "days_to_event": 45,
      "marker": "D-7",
      "iv_data": {
        "iv7": 65.2,
        "iv30": 58.1,
        "iv7_pctile": 72,
        "skew_25d": 12.3,
        "is_backwardation": true,
        "iv_date": "2025-01-14T00:00:00Z"
      },
      "price_data": {
        "price": 142.50,
        "returns_5d": 0.012,
        "realized_vol_20d": 42.8
      }
    }
  ],
  "count": 1,
  "months": {
    "2025-03": [
      { /* event object */ }
    ]
  },
  "date_range": {
    "from": "2025-01-01T00:00:00Z",
    "to": "2025-06-01T00:00:00Z"
  }
}
```

**Response Fields**:
- `events`: Array of calendar events with IV data
- `count`: Total events
- `months`: Events grouped by month (YYYY-MM)
- `date_range`: Queried date range

**Event Markers**:
- `D-30`: 30 days before event
- `D-7`: 7 days before event
- `D-3`: 3 days before event
- `D-1`: 1 day before event
- `null`: Outside marker windows

---

### 3. Get IV Data by Ticker

Retrieve raw IV time series data for specific ticker.

**Endpoint**: `GET /data/{ticker}`

**Path Parameters**:
- `ticker` (string, required): Stock ticker symbol

**Query Parameters**:
- `from_date` (string, optional): Start date (ISO 8601), default: 1 year ago
- `tenors` (string, optional): Comma-separated tenors (e.g., "7,14,30,60"), default: "7,30"

**Example Request**:
```bash
GET /api/v1/iv/data/VRTX?from_date=2024-06-01&tenors=7,14,30,60
```

**Example Response**:
```json
{
  "ticker": "VRTX",
  "tenors": {
    "7": [
      {
        "date": "2024-06-01T00:00:00Z",
        "iv_mid": 52.3,
        "iv_pctile_1y": 45,
        "skew_25d": 8.2,
        "total_oi": 15420,
        "put_call_ratio": 0.82,
        "is_backwardation": false
      },
      { /* more 7D data points */ }
    ],
    "30": [
      {
        "date": "2024-06-01T00:00:00Z",
        "iv_mid": 48.7,
        "iv_pctile_1y": 42,
        "skew_25d": 6.1,
        "total_oi": 28340,
        "put_call_ratio": 0.91,
        "is_backwardation": false
      },
      { /* more 30D data points */ }
    ]
  },
  "count": 240
}
```

**Response Fields**:
- `ticker`: Stock ticker
- `tenors`: Object with tenor-keyed arrays of IV data points
- `count`: Total data points across all tenors

**IV Data Point**:
- `date`: Observation date (ISO 8601)
- `iv_mid`: Mid-point implied volatility (%)
- `iv_pctile_1y`: 1-year percentile rank (0-100)
- `skew_25d`: 25-delta put-call skew
- `total_oi`: Total open interest
- `put_call_ratio`: Put OI / Call OI
- `is_backwardation`: Whether term structure is inverted

---

### 4. Get IV Statistics

Retrieve current IV statistics and summary for ticker.

**Endpoint**: `GET /stats/{ticker}`

**Path Parameters**:
- `ticker` (string, required): Stock ticker symbol

**Example Request**:
```bash
GET /api/v1/iv/stats/VRTX
```

**Example Response**:
```json
{
  "ticker": "VRTX",
  "as_of_date": "2025-01-14T00:00:00Z",
  "term_structure": "backwardation",
  "iv_by_tenor": {
    "7": {
      "iv_mid": 65.2,
      "iv_pctile_1y": 72,
      "iv_pctile_6m": 68,
      "skew_25d": 12.3,
      "is_backwardation": true,
      "total_oi": 18230,
      "put_call_ratio": 0.87
    },
    "30": {
      "iv_mid": 58.1,
      "iv_pctile_1y": 65,
      "iv_pctile_6m": 62,
      "skew_25d": 9.8,
      "is_backwardation": false,
      "total_oi": 31240,
      "put_call_ratio": 0.94
    }
  },
  "iv_rv_ratio": 1.52,
  "realized_vol_20d": 42.8,
  "price": 142.50,
  "returns_5d": 0.012
}
```

**Response Fields**:
- `ticker`: Stock ticker
- `as_of_date`: Data timestamp (ISO 8601)
- `term_structure`: Current term structure (normal, backwardation, steep_contango)
- `iv_by_tenor`: IV metrics by tenor
- `iv_rv_ratio`: IV7 / Realized Vol 20D ratio
- `realized_vol_20d`: 20-day realized volatility (%)
- `price`: Current stock price
- `returns_5d`: 5-day return (decimal)

**Term Structure Values**:
- `normal`: 7D < 30D (typical)
- `backwardation`: 7D > 30D (event risk)
- `steep_contango`: 7D < 30D * 0.9 (very flat curve)

---

### 5. Compute IV Signals

Trigger signal computation from current IV and catalyst data.

**Endpoint**: `POST /compute-signals`

**Query Parameters** (optional):
- `lookback_days` (integer, default: 90): Days of history to analyze
- `min_iv_rv_ratio` (float, default: 1.4): Minimum IV/RV ratio threshold
- `min_skew_change` (float, default: 10.0): Minimum skew change (delta points)

**Example Request**:
```bash
POST /api/v1/iv/compute-signals?lookback_days=90&min_iv_rv_ratio=1.4
```

**Example Response**:
```json
{
  "status": "success",
  "signals_generated": 12,
  "catalysts_analyzed": 47,
  "timestamp": "2025-01-15T12:34:56Z"
}
```

**Response Fields**:
- `status`: Operation status (success, partial, failed)
- `signals_generated`: Number of new signals created
- `catalysts_analyzed`: Total catalysts examined
- `timestamp`: Computation timestamp (ISO 8601)

**HTTP Status Codes**:
- `200 OK`: Success
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Computation error

---

## Data Models

### Signal Scoring Algorithm

Signals are scored 0-4 based on flags:

```python
backw_flag = 1 if (iv7 > iv30 * 1.1) else 0
ivrv_flag = 1 if (iv7/rv20 > 1.4 and abs(ret5d) < 0.02) else 0
skew_flag = 1 if (skew_change > 10.0) else 0
oi_flag = 1 if (current_oi > 2 * avg_oi_30d) else 0

signal_score = backw_flag + ivrv_flag + skew_flag + oi_flag
```

### Quality Tiers

```python
if signal_score >= 3 and iv7_pctile < 85:
    quality = "High"
elif signal_score >= 2:
    quality = "Medium"
else:
    quality = "Low"
```

### Confidence Calculation

```python
confidence = signal_score / 4.0
```

Simple linear mapping: Score 4 → 100% confidence, Score 0 → 0% confidence.

---

## Rate Limits

Current rate limits (subject to change):
- **Unauthenticated**: 60 requests/hour per IP
- **Authenticated**: 600 requests/hour per API key

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642432800
```

---

## Error Responses

Standard error format:

```json
{
  "detail": "Error message describing what went wrong",
  "status_code": 400
}
```

Common error codes:
- `400`: Invalid request parameters
- `404`: Resource not found (e.g., ticker not in database)
- `429`: Rate limit exceeded
- `500`: Internal server error

---

## Webhook Support (Coming Soon)

Subscribe to real-time signal updates:

```json
POST /api/v1/iv/webhooks
{
  "url": "https://your-server.com/webhook",
  "events": ["signal.created", "signal.updated"],
  "filters": {
    "min_score": 3,
    "quality": "High"
  }
}
```

---

## SDK Examples

### Python

```python
import requests

# Get high-quality signals
response = requests.get(
    "https://api.terminal.gg/api/v1/iv/signals",
    params={
        "min_score": 3,
        "quality": "High",
        "max_days_to_event": 45
    }
)
signals = response.json()["signals"]

for signal in signals:
    print(f"{signal['ticker']}: {signal['event_type']} in {signal['days_to_event']}d")
    print(f"  Score: {signal['signal_score']}/4, IV7: {signal['metrics']['iv7']:.1f}%")
```

### JavaScript/TypeScript

```typescript
async function getIVSignals(minScore: number = 2): Promise<any> {
  const response = await fetch(
    `https://api.terminal.gg/api/v1/iv/signals?min_score=${minScore}`
  );
  
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.signals;
}

// Usage
const signals = await getIVSignals(3);
console.log(`Found ${signals.length} high-score signals`);
```

### cURL

```bash
# Get all signals for next 30 days
curl -X GET "https://api.terminal.gg/api/v1/iv/signals?max_days_to_event=30"

# Get IV stats for VRTX
curl -X GET "https://api.terminal.gg/api/v1/iv/stats/VRTX"

# Compute new signals
curl -X POST "https://api.terminal.gg/api/v1/iv/compute-signals"
```

---

## Best Practices

1. **Cache responses**: IV data updates end-of-day, no need for frequent polling
2. **Use filters**: Apply min_score and quality filters to reduce noise
3. **Batch requests**: Group related queries when possible
4. **Handle errors**: Implement retry logic with exponential backoff
5. **Monitor rate limits**: Check rate limit headers and throttle accordingly

---

## Changelog

### Version 1.0 (2025-01-15)
- Initial release
- Core endpoints: signals, calendar, data, stats, compute-signals
- Support for 7D, 14D, 30D, 60D tenors
- Signal scoring with 4 flags
- Quality tier classification

---

## Support

- **Documentation**: https://docs.terminal.gg/iv-catalyst
- **GitHub Issues**: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
- **Email**: api-support@terminal.gg

---

**Note**: This API is in active development. Breaking changes will be announced with version bumps.
