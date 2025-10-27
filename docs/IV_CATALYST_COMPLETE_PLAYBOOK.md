# IV Catalyst Playbook - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Why IV Matters](#why-iv-matters)
3. [Signal Anatomy](#signal-anatomy)
4. [Daily Screening Methodology](#daily-screening-methodology)
5. [Risk-Reward Framing](#risk-reward-framing)
6. [Data Architecture](#data-architecture)
7. [UI Components](#ui-components)
8. [Sanity Checks](#sanity-checks)
9. [Quick Start](#quick-start)
10. [Entry/Exit Strategies](#entryexit-strategies)

---

## Overview

This playbook provides a fast, practical approach for using **implied volatility (IV) spikes** ahead of biotech catalysts to spot asymmetric trading setups. It's fully integrated into the GGets terminal with automated signal generation, real-time monitoring, and comprehensive risk management.

---

## Why IV Matters (in plain English)

- **Implied volatility** = the market's forecast of future movement embedded in option prices
- In biotech, IV often creeps up **before** known catalysts (trial readouts, ad-coms, PDUFAs), sometimes days-weeks ahead of headlines
- A clean **IV drift** (without price moving much) can flag early sentiment shifts that models and consensus miss

**Key Insight**: IV rise + flat price = "smart money" quietly accumulating optionality before the crowd arrives

---

## Signal Anatomy

### What to Track

#### 1. Term Structure
Monitor **7D, 14D, 30D, 60D IV**:
- Look for **front-end bulges** into catalyst dates
- Normal: 7D < 30D < 60D (contango)
- Alert: 7D > 30D (backwardation = near-term event expected)

#### 2. Skew
Track **downside vs upside IV**:
- Pre-readout, skew often inverts (calls pricier than puts)
- 25-delta skew = IV(25Δ put) - IV(25Δ call)
- Rising call skew = bullish positioning

#### 3. IV vs RV (Realized Volatility)
**IV/RV ratio > 1.3** with flat price:
- Indicates options are pricing in MORE volatility than recent history
- Combined with quiet price action = accumulation phase
- Ratio > 1.5 = strong signal

#### 4. Open Interest (OI) & Gamma
- **Clustered strikes** around likely outcomes
- **IR deck guideposts** (e.g., company guidance on success probability)
- OI spikes > 2× 30-day average = institutional positioning

#### 5. Cross-Section Analysis
Compare **peer IV** (same MOA/endpoint):
- Catch **idiosyncratic** vs **sector-wide** moves
- If VRTX IV spikes but ALNY/IONS flat = company-specific catalyst
- If all rare disease names spike = sector rotation

---

## Daily Screening Methodology

### Universe Definition
- **US-listed biotech** (XBI constituents + SMID extensions)
- Market cap: $200M - $50B (liquid options, institutional interest)
- Minimum options volume: 100 contracts/day

### Catalyst Window
**Upcoming events (0-60 days)**:
- Phase 2/3 data readouts
- AdCom meetings
- PDUFA dates
- Interim analysis releases
- Major conference presentations

### Signal Rules (Any 2 Trigger a Flag)

#### Rule 1: Term Structure Inversion
```
7D IV ↑ >20% w/w AND 7D–30D contango turns backwardation
```
**Example**:
```
SRPT (Week -2): IV7=45%, IV30=48% (normal contango)
SRPT (Week -1): IV7=58%, IV30=47% (backwardation ⚠️)
→ Signal triggered: Front-end IV spiking into catalyst
```

#### Rule 2: IV/RV Expansion with Quiet Price
```
IV/20D RV > 1.4 WHILE 5D spot return between -2% and +2%
```
**Example**:
```
REGN: IV7=62%, RV20D=42%, 5D return=+0.8%
IV/RV = 62/42 = 1.48 ✓
5D return within ±2% ✓
→ Signal triggered: IV rising without price move
```

#### Rule 3: Call Skew Surge
```
30D call-skew ↑ >10 delta-points vs 20D median
```
**Example**:
```
VRTX 20D median skew: 5.2 pts
VRTX current skew: 16.8 pts
Change: +11.6 pts ⚠️
→ Signal triggered: Unusual call demand
```

#### Rule 4: OI Spike at Event-Relevant Strikes
```
New OI at event-relevant strikes > 2× 30D avg
```
**Example**:
```
BMRN has $100 strike (IR deck suggests success = $95-$105)
30D avg OI at $100 strike: 2,500 contracts
Today's OI: 6,200 contracts (2.48× avg) ⚠️
→ Signal triggered: Institutional accumulation
```

---

## Risk-Reward Framing

### Pre-Event Positioning

#### When IV is Rising but Still Low (IV percentile < 75%)
**Preferred Structures**:
- ✅ **Debit Call Spreads** (5-10 wide, 1-2 months out)
- ✅ **Call Calendars** (sell front month, buy back month)
- ✅ **Naked Calls** (if very high conviction)

**Example Entry**:
```
ALNY Phase 3 data in 42 days
IV7: 52% (68th percentile)
Signal Score: 3/4 (High Quality)

Entry: Buy Apr 200/210 call spread @ $4.50
- Max risk: $450/contract
- Max profit: $550/contract
- Breakeven: $204.50
```

#### When IV is Already Elevated (IV percentile 75-90%)
**Preferred Structures**:
- ⚠️ **Tighter Spreads** (3-5 wide)
- ⚠️ **Butterflies** (target specific price)
- ⚠️ **Ratio Spreads** (1×2 or 1×3 if expecting big move)

**Caution**: Time decay accelerates as event approaches

#### When IV is Extreme (IV percentile > 90%)
**AVOID or FADE**:
- ❌ **Do NOT buy naked premium** (IV crush will destroy value)
- ⚠️ **Consider selling premium** (advanced traders only)
- ⚠️ **Iron condors** if expecting IV collapse without big move

### Post-Event Handling

#### IV Collapse Dynamics
**Typical post-event IV behavior**:
- Day 0 (announcement): IV drops 40-60%
- Day 1-3: IV drops another 20-30%
- Total collapse: 60-80% from pre-event levels

**Critical Rule**: **CLOSE OPTIONS IMMEDIATELY** after event, even if stock moves favorably
- Vega loss often exceeds delta gain
- Exception: Deep ITM options (delta ≈ 1.0, minimal vega)

#### Delta Expressions Post-Event
If thesis is directional:
- Switch to **stock** or **ITM LEAPS** (high delta, low vega)
- Avoid buying new ATM options (IV too crushed)

If fading a relief pop:
- **Put spreads** to capture post-event reversion
- **Covered calls** if long stock

---

## Data Architecture

### Database Schema

#### `options_iv` Table
```sql
CREATE TABLE options_iv (
    id INTEGER PRIMARY KEY,
    ticker VARCHAR NOT NULL,
    date DATETIME NOT NULL,
    tenor_days INTEGER NOT NULL,  -- 7, 14, 30, 60
    
    -- IV metrics
    iv_mid FLOAT NOT NULL,
    iv_bid FLOAT,
    iv_ask FLOAT,
    
    -- Skew metrics
    skew_25d FLOAT,  -- 25Δ put IV - 25Δ call IV
    skew_10d FLOAT,  -- 10Δ skew for deeper OTM
    
    -- Open interest and volume
    total_oi INTEGER,
    total_volume INTEGER,
    call_oi INTEGER,
    put_oi INTEGER,
    put_call_ratio FLOAT,
    
    -- Historical context
    iv_pctile_1y FLOAT,  -- 0-100
    iv_pctile_6m FLOAT,
    skew_25d_20d_median FLOAT,
    
    -- Flags
    is_backwardation BOOLEAN,
    
    INDEX idx_ticker_date (ticker, date),
    INDEX idx_ticker_tenor_date (ticker, tenor_days, date)
);
```

#### `price_data` Table
```sql
CREATE TABLE price_data (
    id INTEGER PRIMARY KEY,
    ticker VARCHAR NOT NULL,
    date DATETIME NOT NULL,
    
    -- OHLCV
    open FLOAT,
    high FLOAT,
    low FLOAT,
    close FLOAT NOT NULL,
    volume INTEGER,
    
    -- Returns
    returns_1d FLOAT,
    returns_5d FLOAT,
    returns_20d FLOAT,
    
    -- Realized volatility
    realized_vol_20d FLOAT,
    realized_vol_60d FLOAT,
    
    INDEX idx_ticker_date (ticker, date)
);
```

#### `catalysts` Table
```sql
CREATE TABLE catalysts (
    id INTEGER PRIMARY KEY,
    ticker VARCHAR NOT NULL,
    event_date DATETIME NOT NULL,
    event_type VARCHAR,  -- PDUFA, Phase3, AdCom, etc.
    confidence FLOAT,  -- 0-1
    source VARCHAR,
    notes TEXT,
    
    INDEX idx_ticker_event_date (ticker, event_date)
);
```

### ETL Pipeline (Nightly Job)

#### Step 1: Fetch Options Chains
```python
# Pseudocode
for ticker in xbi_universe:
    chain = fetch_options_chain(ticker)
    for tenor in [7, 14, 30, 60]:
        iv_data = calculate_iv_for_tenor(chain, tenor)
        save_to_db(iv_data)
```

#### Step 2: Compute IV Metrics
```python
# Calculate percentiles
iv_1y_history = get_iv_history(ticker, days=365)
iv7_pctile = percentile_rank(current_iv7, iv_1y_history)

# Compute skew
skew_25d = iv_put_25d - iv_call_25d

# Detect backwardation
is_backwardation = (iv7 > iv30)
```

#### Step 3: Compute Realized Volatility
```python
# 20-day realized vol
returns = get_price_returns(ticker, days=20)
rv_20d = np.std(returns) * np.sqrt(252) * 100
```

#### Step 4: Normalize Catalyst Dates
```python
# Parse catalyst calendar
for catalyst in upcoming_catalysts:
    catalyst.event_date = parse_to_utc(catalyst.event_date)
    catalyst.event_window = {
        "D-30": event_date - 30 days,
        "D-15": event_date - 15 days,
        "D-7": event_date - 7 days,
        "D-3": event_date - 3 days,
        "D-1": event_date - 1 day,
        "D+1": event_date + 1 day
    }
```

### Signal Generation View

```sql
CREATE VIEW v_iv_catalyst_signals AS
SELECT
    c.ticker,
    c.event_date,
    c.event_type,
    o7.iv_mid AS iv7,
    o30.iv_mid AS iv30,
    (o7.iv_mid / NULLIF(p.rv20,0)) AS iv_rv_ratio,
    (o7.iv_mid - o30.iv_mid) AS term_backw,
    o7.skew_25d AS skew25d,
    o7.iv_pctile_1y AS iv7_pctile,
    p.ret_5d AS ret5d,
    
    -- Signal flags
    CASE WHEN o7.iv_mid/o30.iv_mid > 1.1 THEN 1 ELSE 0 END AS backw_flag,
    CASE WHEN (o7.iv_mid/p.rv20) > 1.4 THEN 1 ELSE 0 END AS ivrv_flag,
    CASE WHEN o7.skew_25d - o7.skew_25d_20d_median > 10 THEN 1 ELSE 0 END AS skew_flag,
    CASE WHEN o7.total_oi > o7.total_oi_30d_avg * 2 THEN 1 ELSE 0 END AS oi_flag
    
FROM catalysts c
JOIN options_iv o7 ON c.ticker=o7.ticker AND o7.date=CURDATE() AND o7.tenor_days=7
JOIN options_iv o30 ON c.ticker=o30.ticker AND o30.date=CURDATE() AND o30.tenor_days=30
JOIN price_data p ON c.ticker=p.ticker AND p.date=CURDATE()
WHERE c.event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 60 DAY);
```

### Alert Rule (Automated Daily)

```sql
SELECT *
FROM v_iv_catalyst_signals
WHERE event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 60 DAY)
  AND ret5d BETWEEN -0.02 AND 0.02  -- Quiet price action
  AND (backw_flag + ivrv_flag + skew_flag + oi_flag) >= 2  -- At least 2 signals
  AND iv7_pctile <= 85  -- Avoid "priced to perfection"
ORDER BY (backw_flag + ivrv_flag + skew_flag + oi_flag) DESC, event_date ASC;
```

---

## UI Components

### 1. Catalyst Calendar + IV Overlay

**Visual Layout**:
```
┌─ CATALYST CALENDAR (D-30 → D+5) ─────────────────────────────────┐
│                                                                    │
│ TICKER │ D-30 │ D-15 │ D-7  │ D-3  │ D-1  │ EVENT│ D+1 │ D+5 │  │
│────────┼──────┼──────┼──────┼──────┼──────┼──────┼─────┼──────┤  │
│ REGN   │  ░░  │  ▓▓  │  ██  │  ██  │  ██  │  ⚠️  │     │      │  │
│ VRTX   │      │      │  ░░  │  ▓▓  │  ██  │  📅  │     │      │  │
│ SRPT   │  ░░  │  ▓▓  │  ██  │  ███ │  ███ │  ⚠️  │     │      │  │
│                                                                    │
│ Legend: ░░ = IV rising | ▓▓ = IV elevated | ██ = IV high         │
│         ⚠️ = Signal active | 📅 = Event today                     │
└────────────────────────────────────────────────────────────────────┘
```

**Cells shaded by IV7 z-score**:
- Green/low: z < 0.5
- Yellow/medium: 0.5 < z < 1.5
- Red/high: z > 1.5

**Badges on critical days** (D-7, D-3, D-1):
- Tooltip shows: IV drift, skew change, OI spikes

### 2. Spark Tile (Per Ticker)

**Visual Components**:
```
┌─ REGN SPARK TILE ──────────────┐
│                                 │
│  REGN              $487.50 ▲2% │
│  ┌─────────────────────────┐   │
│  │ Price Line (gray)       │   │
│  │ IV7 Filled Area (amber) │   │
│  │ IV/RV Band (thin)       │   │
│  └─────────────────────────┘   │
│                                 │
│  IV7: 58.2% (82%ile)            │
│  IV/RV: 1.52 ⚠️                  │
│  Skew: +12.3 pts ⚠️              │
│                                 │
└─────────────────────────────────┘
```

**Hover Tooltip**:
```
┌─ REGN IV METRICS ──────┐
│ IV Drift (7D): +8.5% ⬆ │
│ Skew Change: +12.3 ⚠️   │
│ OI Spike: YES ⚠️        │
│ Current IV7: 58.2%     │
│ IV/RV Ratio: 1.52 ⚠️    │
└────────────────────────┘
```

### 3. Peer Comparison Strip

**Visual Layout**:
```
┌─ PEER IV PERCENTILE COMPARISON ────────────────────┐
│                                                      │
│  YOU → REGN  ████████████████░░░░ 75%              │
│        VRTX  ██████████████░░░░░░ 68%              │
│        ALNY  ████████░░░░░░░░░░░░ 52%              │
│        BMRN  ████████████░░░░░░░░ 61%              │
│        IONS  ██████████░░░░░░░░░░ 55%              │
│                                                      │
│  Sector Median: 61% | You: 75% (IDIOSYNCRATIC ⚠️)  │
└──────────────────────────────────────────────────────┘
```

**Interpretation**:
- If ticker's IV >> sector median → idiosyncratic (company-specific catalyst)
- If ticker's IV ≈ sector median → sector-wide move (ignore or reduce size)

---

## Sanity Checks (Avoid False Positives)

### 1. Earnings Weeks Filter
```python
# Mask earnings-related IV spikes
if is_earnings_week(ticker):
    signal.add_warning("Earnings week - IV spike may be earnings-related")
    signal.confidence *= 0.7  # Reduce confidence
```

### 2. FDA Class-Wide Actions
```python
# Check if FDA issued class warning
if fda_class_action(therapeutic_area, date_range):
    signal.add_warning("FDA class action may affect sector IV")
    # Subtract XBI IV move to isolate idiosyncratic component
    signal.adjusted_iv7 = ticker_iv7 - xbi_iv7_change
```

### 3. Macro Volatility Spikes (VIX)
```python
# If VIX spikes, all IV rises
if vix_change_7d > 20%:
    signal.add_warning("Macro vol spike (VIX +20%) - may contaminate signal")
    # Require higher threshold for signal (3 flags instead of 2)
    signal.min_flags = 3
```

### 4. Micro-Cap Illiquidity
```python
# Minimum liquidity thresholds
if total_oi < 1000:
    signal.reject("Insufficient OI - illiquid options")
    
if total_oi / float_shares > 0.05:
    signal.add_warning("OI/Float ratio too high - potential manipulation")
```

### 5. Re-Dated Events
```python
# Anchor to company IR updates
if event_date != latest_guidance_date:
    signal.add_warning("Catalyst date drifted - verify with IR")
    # Auto-update if company announced new timeline
    if ir_update_available:
        signal.event_date = new_guided_date
```

---

## Quick Start (Today)

### Step 1: Load XBI Universe + Catalysts
```bash
# Ingest XBI constituents
python -m bt_platform.core.ingest_xbi_companies

# Load catalyst calendar (next 60 days)
python -m bt_platform.ingestion.ingest_catalysts --days 60
```

### Step 2: Backfill IV Percentiles
```bash
# Backfill 1-year IV history for percentile calculations
python -m bt_platform.ingestion.iv_etl --backfill --days 365
```

### Step 3: Enable Daily Alert
```bash
# Set up cron job for daily signal generation
# Run every day at 4:30 PM ET (after market close)
30 16 * * 1-5 python -m bt_platform.ingestion.iv_etl --compute-signals
```

### Step 4: Review Daily Shortlist
```bash
# Fetch today's signals via API
curl http://localhost:8000/api/v1/iv/signals?min_score=2&max_days_to_event=60

# Or use the web UI
open http://localhost:3000/iv-catalyst
```

### Step 5: For Each Signal, Document:
1. **Setup**: What triggered the signal?
2. **Expression**: What structure will you trade?
3. **Kill-switch**: What invalidates the thesis?

**Example Documentation**:
```markdown
## REGN - Phase 3 Eczema Data (2024-12-15)

**Setup** (2024-11-01):
- Signal Score: 3/4 (High)
- IV7: 58% (82%ile) - elevated but not extreme
- IV/RV: 1.52 - options pricing in volatility spike
- Term backwardation: IV7 > IV30 by 11 pts
- Skew: +12.3 pts above median (call buying)

**Expression**:
- Buy Dec 480/490 call spread @ $4.20
- Max risk: $420/contract × 10 contracts = $4,200
- Max profit: $5,800 (138% RoR)
- Position size: 2.5% of portfolio

**Kill-Switch**:
- Stop loss: -50% ($2,100 loss)
- Thesis invalidation: Negative peer data from VTYX trial
- Time stop: Exit by Dec 12 if underwater and IV declining
```

---

## Entry/Exit Strategies

### Entry Checklist
- [ ] Signal score ≥ 2 (preferably 3-4)
- [ ] IV percentile < 85% (room for expansion)
- [ ] Days to event: 14-60 days (avoid last-minute)
- [ ] Price action quiet (5D return ±2%)
- [ ] No conflicting catalysts in next 7 days
- [ ] Passed all sanity checks (earnings, FDA, VIX)
- [ ] Position size: 1-3% portfolio risk
- [ ] Exit plan documented

### Position Management Rules

#### Profit Taking
| IV Rise from Entry | Action | Rationale |
|-------------------|--------|-----------|
| +20-30% | Take 25% off | Lock in gains |
| +50-75% | Take 50% off | Secure capital |
| +100%+ | Take 75% off | Exceptional spike |

#### Stop Loss
- **Hard stop**: -40% to -50% max loss
- **Time stop**: Exit at D-3 if position underwater and IV declining
- **Thesis stop**: Exit if negative peer data or company delays event

#### Rolling Strategy
- If IV declining but thesis intact: **Roll out 1 month + up 1 strike**
- If approaching expiry with no catalyst: **Close and reassess**

### Post-Event Exits

#### POSITIVE OUTCOME
- **Close 100% immediately** (Day 0-1)
- IV collapses 60-80% even if stock rises
- Switch to stock if long-term bullish

#### NEGATIVE OUTCOME
- **Cut losses immediately**
- Do NOT average down
- Consider put spreads if stock oversold

#### NEUTRAL/MIXED
- **Close** - IV still collapses
- Reassess if new catalyst timeline emerges

---

## Advanced: Portfolio Construction

### Diversification Rules
1. **Max 5 active IV setups** at once
2. **Max 20% exposure** to single catalyst type (e.g., all PDUFAs)
3. **Max 30% exposure** to single therapeutic area
4. **Stagger event dates** - avoid clustering events in same week

### Correlation Management
- Monitor **XBI beta** for each position
- If all positions are high-beta biotech → reduce total exposure
- Consider **hedging** with XBI puts if >3 positions open

### Kelly Criterion Sizing
```python
# Optimal position size
win_rate = 0.60  # 60% win rate on High signals
avg_win = 0.75  # 75% average gain
avg_loss = 0.40  # 40% average loss

kelly_fraction = (win_rate * avg_win - (1 - win_rate) * avg_loss) / avg_win
# = (0.60 * 0.75 - 0.40 * 0.40) / 0.75
# = (0.45 - 0.16) / 0.75
# = 0.387 = 38.7% of bankroll

# Use 1/2 Kelly for safety = 19% max position size
safe_position_size = kelly_fraction * 0.5
```

---

## Appendix: API Endpoints

### Get IV Signals
```http
GET /api/v1/iv/signals?min_score=2&max_days_to_event=60&quality=High
```

### Get Catalyst Calendar with IV
```http
GET /api/v1/iv/calendar?from_date=2024-11-01&to_date=2024-12-31&tickers=REGN,VRTX
```

### Get IV Data Time Series
```http
GET /api/v1/iv/data/REGN?from_date=2024-01-01&tenors=7,30
```

### Get IV Stats & Percentiles
```http
GET /api/v1/iv/stats/REGN
```

### Compute Signals (Trigger Manually)
```http
POST /api/v1/iv/compute-signals?lookback_days=90&min_iv_rv_ratio=1.4
```

### Peer Comparison
```http
GET /api/v1/iv/peer-comparison/REGN?therapeutic_area=Rare%20Disease
```

---

## Support & Feedback

For questions or issues:
- GitHub Issues: https://github.com/deathknight2002/terminal-ui-biotech-GG/issues
- Documentation: `/docs/IV_CATALYST_*.md`
- API Docs: http://localhost:8000/docs

---

**Last Updated**: 2024-10-27
**Version**: 1.0.0
**Maintained by**: GGets Terminal Team
