# IV Catalyst Tracking - User Guide

## Overview

The **IV Catalyst Tracker** uses implied volatility (IV) patterns in options markets to identify high-probability, asymmetric trading setups ahead of biotech catalyst events (FDA approvals, clinical trial readouts, ad-coms, etc.).

## Why Implied Volatility Matters

Implied volatility is the market's forecast of future price movement, embedded in option prices. In biotech:

- **IV creeps up** days to weeks before known catalysts, sometimes ahead of headlines
- **Clean IV drift** (without major price moves) flags early sentiment shifts that models miss
- **Term structure changes** signal sophisticated traders positioning ahead of events

## What the System Tracks

### 1. Term Structure (7D, 14D, 30D, 60D IV)
- **Normal**: Short-dated IV < long-dated IV (contango)
- **Backwardation**: Short-dated IV > long-dated IV → Event risk being priced in
- **Signal**: 7D-30D spread turning positive = front-end bulge into catalyst date

### 2. IV/RV Ratio (Implied vs Realized Volatility)
- **IV/20D RV > 1.4** while price flat (-2% to +2% over 5D) = quiet accumulation of optionality
- Market paying up for protection/speculation without moving the stock

### 3. Skew (Downside vs Upside IV)
- **25-delta skew**: Put IV - Call IV
- Pre-readout, skew often inverts (calls pricier than usual)
- **Signal**: Skew change > 10 delta-points vs 20D median

### 4. Open Interest & Gamma
- OI clustered at strikes around likely outcomes
- New OI > 2× 30D average at event-relevant strikes

## Signal Generation Rules

The system flags tickers when **any 2 of 4 criteria** are met:

### Flag 1: Backwardation ⚠
- 7D IV ↑ >20% week-over-week AND
- 7D-30D contango turns to backwardation (7D > 30D)

### Flag 2: IV/RV Elevated 📈
- IV/20D RV > 1.4 while
- 5D spot return between -2% and +2% (price quiet)

### Flag 3: Skew Significant 📊
- 30D call-skew ↑ >10 delta-points vs 20D median

### Flag 4: OI Spike 💥
- New OI at event-relevant strikes > 2× 30D average

## Using the Dashboard

### Signal Cards

Each signal card shows:

```
┌──────────────────────────────────────┐
│ TICKER: VRTX          Quality: High  │
│ Score: 3/4                            │
├──────────────────────────────────────┤
│ FDA APPROVAL                          │
│ Mar 15, 2025 (45d)                    │
├──────────────────────────────────────┤
│ Flags: ⚠ BACKWD  📈 IV/RV  📊 SKEW   │
├──────────────────────────────────────┤
│ IV7: 65.2%  IV30: 58.1%  Pctile: 72% │
│ IV/RV: 1.52  Skew: 12.3  Ret5d: 0.8% │
├──────────────────────────────────────┤
│ Confidence: ████████░░ 80%            │
└──────────────────────────────────────┘
```

**Quality Tiers:**
- **High**: Score ≥3 and IV percentile <85 (room to run)
- **Medium**: Score =2 or IV percentile 85-95
- **Low**: Score <2 or IV >95%ile (already priced)

### IV Calendar Heatmap

Calendar view shows:
- **Timeline**: D-30, D-7, D-3, D-1, EVENT, D+1
- **Color coding** by IV percentile:
  - 🟢 Green (< 30%ile): IV low, setup could develop
  - 🟡 Yellow (30-50%ile): Normal range
  - 🟠 Orange (50-70%ile): Elevated
  - 🔴 Red (70-85%ile): High but tradeable
  - 🔴🔴 Dark Red (>85%ile): Likely priced in, avoid naked longs

### Filtering Controls

- **Min Score**: Require at least N flags (0-4)
- **Max Days**: How far ahead to look for catalysts (7-90 days)
- **Quality**: Filter by High/Medium/Low quality signals

## Trading Playbook

### Pre-Event Setup (When Signal Appears)

**If IV is LOW (<50%ile):**
- ✅ Consider **debit call spreads** (defined risk)
- ✅ Consider **calendar spreads** if expecting IV rise
- ✅ **Naked long calls** if conviction high and IV cheap

**If IV is MEDIUM (50-85%ile):**
- ⚠️ Use **vertical spreads** to reduce theta/vega risk
- ⚠️ Consider **ratio spreads** if expecting explosive move
- ⚠️ Avoid naked longs unless IV trending up into event

**If IV is HIGH (>85%ile):**
- ❌ **Avoid naked long premium** - decay working against you
- ⚠️ Only enter if IV still rising and event has binary nature
- ✅ Consider **selling premium** to fade the IV spike (high risk)

### Position Sizing

Rule of thumb: **Risk 1-3% of portfolio per position**

Example for $100k portfolio:
- High quality signal (score 3-4): Risk $2,000-3,000
- Medium quality (score 2): Risk $1,000-2,000
- Low quality (score 1): Risk $500-1,000

### Exit Strategy

**Pre-Event:**
- Close at 50-100% profit if IV spikes dramatically
- Stop loss at -40% to -50% max
- Roll out in time if IV declining but thesis intact

**Post-Event:**
- **If directional**: Switch to **stock/shares** (IV will collapse)
- **If fading pop**: Use **put spreads** to capture relief rally fade
- IV typically collapses 50-80% within 1-2 days post-event

## Risk Management

### Sanity Checks (Avoid False Positives)

1. **Earnings Overlap**: Check if signal coincides with earnings - mask with sector IV (XBI)
2. **FDA Class Actions**: Look for FDA-wide guidances affecting whole sectors
3. **Macro Vol Spikes**: During VIX >30, biotech IV elevates sector-wide
4. **Micro-cap Liquidity**: Require minimum OI >1,000 contracts
5. **Re-dated Events**: Check IR updates - companies slip dates frequently

### Position Limits

- **Max 5 active setups** at once to avoid over-concentration
- **Max 20% exposure** to single catalyst type (e.g., all PDUFA dates)
- **Max 30% exposure** to single therapeutic area (e.g., all oncology)

### Kill Switches (When to Exit)

Exit immediately if:
- Company announces **trial delay** or **FDA CRL** (Complete Response Letter)
- **Insider selling** spikes suddenly
- **IV collapses** before event without news (smart money exiting)
- **Peer readout** in same MOA shows negative data
- **Adverse macro event** (e.g., new FDA commissioner with biotech-negative stance)

## Example Scenario Walkthrough

### Setup: SAREPTA (SRPT) - DMD Gene Therapy PDUFA

**Day -45 (Signal Generated):**
```
Score: 3/4
Flags: ⚠ Backwardation, 📈 IV/RV, 📊 Skew
IV7: 58%  IV30: 51%  IV Percentile: 62%ile
IV/RV: 1.48  Skew Change: +12.5
Price: $142.50  5D Return: +1.2%
Quality: High
```

**Analysis:**
- Term structure inverted (7D > 30D) = traders pricing event risk
- IV/RV ratio 1.48 while price quiet = options expensive vs recent moves
- Skew change +12.5 = demand for calls increasing
- IV percentile 62% = not priced to perfection yet
- **Verdict: Good setup**

**Entry (Day -45):**
- Buy **Mar 150/160 call spread** for $4.00 debit
- Max risk: $4,000 per contract
- Max profit: $6,000 (if expires ITM)
- R:R = 1.5:1

**Day -7 (Update):**
- IV7 rises to 72% (+14 points)
- Spread now worth $5.50
- Profit: +37.5%
- **Action: Hold or take partial (50%) off**

**Event Day:**
- FDA approves - stock gaps to $168
- Spread worth $8.50 (near max value)
- Profit: +112.5%
- **Action: Close remaining position before IV crush**

### Failed Setup Example

**Scenario: BIIB - Alzheimer's Drug Readout**

**Day -30:**
```
Score: 2/4
Flags: ⚠ Backwardation, 📊 Skew
IV7: 95%  IV Percentile: 92%ile
IV/RV: 1.25
Quality: Low
```

**Analysis:**
- Only 2 flags (marginal signal)
- IV percentile 92% = already priced in
- IV/RV only 1.25 = not much premium over realized
- **Verdict: Pass - IV too rich**

**What Happened:**
- Stock moved +2% on positive data
- Options collapsed 70% post-event due to IV crush
- Even being right on direction, options buyers lost money
- **Lesson: Respect IV percentiles**

## Advanced Strategies

### 1. Peer Basket Hedging
- Long SRPT calls for DMD PDUFA
- Short XBI calls (2:1 ratio) to hedge sector beta
- Isolates SRPT-specific event risk

### 2. Multi-Leg Calendar
- Sell front-month 160 calls (high IV)
- Buy back-month 160 calls (lower IV)
- Profit from IV term structure collapse post-event

### 3. Butterfly Payoff Targeting
If expecting approval but modest +15% move:
- Buy 140/155/170 call butterfly
- Cheap structure with defined max risk
- Peaks at $155 (estimated fair value post-approval)

## API Integration

For programmatic access, see [API Documentation](./IV_CATALYST_API.md)

### Quick Examples

**Get today's signals:**
```bash
curl "https://api.terminal.gg/api/v1/iv/signals?min_score=2&max_days_to_event=60"
```

**Get IV data for ticker:**
```bash
curl "https://api.terminal.gg/api/v1/iv/data/VRTX?tenors=7,30"
```

**Compute new signals:**
```bash
curl -X POST "https://api.terminal.gg/api/v1/iv/compute-signals"
```

## Frequently Asked Questions

### Q: How often should I check for new signals?
**A:** Daily refresh recommended. Most setups develop over 2-4 weeks.

### Q: Can I use this for FDA ad-com meetings?
**A:** Yes! Ad-coms are high-IV events. System tracks PDUFA, ad-coms, readouts, and M&A.

### Q: What if IV spikes after I enter?
**A:** Good problem to have! Take partial profits at 50-75% gain. Let remainder run.

### Q: Should I trade biotech options if I'm new to options?
**A:** No. Start with paper trading or very small size. Biotech options are high risk.

### Q: What percentage of signals are profitable?
**A:** Historical hit rate ~55-60% on Score 3+ signals. Position sizing is key.

### Q: Do you provide live data feeds?
**A:** System uses end-of-day data. For intraday, integrate with your options data provider.

## Data Sources

- **Options Data**: End-of-day IV, skew, OI from market data providers
- **Catalyst Calendar**: FDA.gov, ClinicalTrials.gov, company filings
- **Price Data**: Yahoo Finance, free tier APIs
- **Realized Vol**: Computed from 20-day price history

## Glossary

- **IV (Implied Volatility)**: Market's forecast of volatility embedded in option prices (%)
- **RV (Realized Volatility)**: Actual historical volatility of stock over period (%)
- **Skew**: Difference between put and call IV at same expiry
- **OI (Open Interest)**: Total outstanding option contracts
- **Backwardation**: Short-dated IV > long-dated IV (inverted term structure)
- **Contango**: Normal term structure (short IV < long IV)
- **Percentile**: Where current IV ranks vs past 1-year (0-100%)
- **Tenor**: Time to expiration (7D, 30D, etc.)

## Support & Community

- **GitHub Issues**: Report bugs or request features
- **Discord**: Join #iv-catalyst channel for discussions
- **Email**: support@terminal.gg

---

**Disclaimer**: This is educational material only. Not financial advice. Trade at your own risk. Past performance does not guarantee future results. Options trading involves substantial risk of loss.
