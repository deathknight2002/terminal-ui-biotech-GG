# IV Catalyst Playbook - Complete Trading Framework

> **Fast, practical playbook for using implied volatility (IV) spikes ahead of biotech catalysts to spot asymmetric setups**

---

## Why IV Matters (In Plain English)

- **Implied volatility** = the market's forecast of future movement embedded in option prices
- In biotech, IV often creeps up before known catalysts (trial readouts, ad-coms, PDUFAs), sometimes days-weeks ahead of headlines
- A clean IV drift (without price moving much) can flag early sentiment shifts that models and consensus miss

---

## What to Track (Signal Anatomy)

### Core Metrics
1. **Term Structure**: 7D, 14D, 30D, 60D IV
   - Look for front-end bulges into dates
   - Backwardation (7D > 30D) signals imminent event risk pricing

2. **Skew**: Downside vs upside IV
   - Pre-readout, skew often inverts (calls pricier)
   - 25-delta put-call spread is the standard measure

3. **IV vs RV**: IV/realized vol ratio
   - Ratio > 1.3 with flat price = quiet accumulation of optionality
   - Sweet spot: 1.4-1.7 range

4. **Open Interest (OI) & Gamma**: 
   - Clustered strikes around likely outcomes or IR deck guideposts
   - OI spikes > 2× 30D average signal positioning

5. **Cross-Section**: Peer IV comparison
   - Same MOA/endpoint to catch idiosyncratic vs sector-wide moves
   - Sector median deviation > 20 percentile points = ticker-specific

---

## Simple, Repeatable Screen (Daily Routine)

### Universe
- US-listed biotech (XBI + SMID extensions)
- Minimum liquidity: OI > 1,000, average volume > 100K shares/day

### Catalyst Window
- Look ahead: 0-60 days
- Types: Readouts, ad-coms, PDUFAs, interim looks

### Signal Rules (2-of-4 Flags Trigger Alert)

1. **Backwardation Flag**
   - 7D IV ↑ >20% w/w AND 7D-30D contango turns backwardation
   - Formula: `iv7 > iv30 * 1.1`

2. **IV/RV Elevated Flag**
   - IV/20D RV > 1.4 while 5D spot return between -2% and +2%
   - Formula: `(iv7 / rv20 > 1.4) AND (abs(ret5d) < 0.02)`

3. **Skew Shift Flag**
   - 30D call-skew ↑ >10 delta-points vs 20D median
   - Formula: `skew_change > 10`

4. **OI Spike Flag**
   - New OI at event-relevant strikes > 2× 30D avg
   - Formula: `current_oi > 2 * oi_30d_avg`

---

## Risk-Reward Framing (Pre/Post Event)

### Pre-Event Strategy

#### High-Quality Setup (3-4 flags, IV <85%ile)
**Position**: Debit call spreads or calendar spreads
- **Why**: IV is rising but not yet at extremes
- **Risk**: 40-50% stop loss
- **Target**: 100-150% gain on spread
- **Timing**: Enter D-45 to D-30

**Example**:
```
VRTX Phase 3 readout in 35 days
Flags: 3/4 (backwardation, IV/RV, skew)
IV7: 58% (68%ile)
Action: Buy 450/460 call spread @ $4.50
Risk: $450/contract | Target: $550+ (50% intrinsic)
```

#### Medium Setup (2 flags, IV 75-85%ile)
**Position**: Tighter call spreads (3-5 wide) or butterflies
- **Why**: IV elevated, need tighter risk management
- **Risk**: 30-40% stop loss
- **Target**: 50-80% gain
- **Timing**: Enter D-21 to D-14

**Example**:
```
MRNA vaccine data in 25 days
Flags: 2/4 (IV/RV, OI spike)
IV7: 72% (81%ile)
Action: Buy 140/145 call spread @ $2.20
Risk: $220/contract | Target: $280+ (30% gain)
```

#### Low Setup (1 flag or IV >85%ile)
**Action**: AVOID or FADE
- **Why**: IV already priced to perfection
- **Alternative**: Consider put spreads or iron condors (advanced)
- **Rule**: Never buy naked premium above 90%ile

### Post-Event Strategy

#### Positive Outcome (Approval/Good Data)
**Day 0-1**: Close 100% of option positions immediately
- IV collapses 50-80% within hours
- Switch to shares if maintaining directional view

**Example**:
```
Before: 150/160 call spread worth $6.50 (65% gain)
After: Stock +18%, spread worth $9.20 (105% gain)
Action: CLOSE immediately, don't wait for max value
Reality: IV crush next day drops spread to $10 (intrinsic only)
```

#### Negative Outcome (CRL/Bad Data)
**Day 0**: Close all long positions
- Don't hold through IV crush hoping for recovery
- Reassess company thesis separately

**Day 1-3**: Consider put spreads if fading relief bounces
- IV still elevated but declining
- Shorter-dated puts (2-4 weeks out)

---

## Position Sizing Framework

### Allocation Rules
| Signal Quality | Max Position Size | Stop Loss | Target |
|---------------|------------------|-----------|---------|
| High (3-4 flags, <85%ile) | 2-3% portfolio | -40% | +100-150% |
| Medium (2 flags, 75-85%ile) | 1-2% portfolio | -35% | +50-80% |
| Low (1 flag, >85%ile) | Skip or 0.5% | -30% | +30-50% |

### Portfolio Level Limits
- **Max IV positions**: 10% of portfolio across all trades
- **Max single event**: 3% portfolio risk
- **Max correlated bets**: 5% (e.g., multiple IL-23 plays)

### Entry Timing by Days to Event
```
D-60 to D-45: Build positions gradually (25-50%)
D-45 to D-30: Primary entry window (full size)
D-30 to D-14: Tactical additions only
D-14 to D-7:  Final adjustments
D-7 to D-1:   RISK-OFF - no new entries
```

---

## Kill-Switch Criteria (Exit Immediately)

### Thesis Invalidation
- ❌ Company announces event delay/cancellation
- ❌ Peer with similar MOA reports negative data
- ❌ FDA raises new concerns (CRL for comparable drug)
- ❌ Enrollment issues or trial design criticism

### Technical Invalidation
- ❌ IV percentile drops below 50%ile (signal fading)
- ❌ Stock breaks key support with rising IV (bad combo)
- ❌ OI collapses suddenly (smart money exiting)
- ❌ Sector-wide vol spike (macro event, not catalyst)

### Time-Based Exits
- ⏰ D-3 with underwater position and falling IV
- ⏰ Position down >40% (hard stop)
- ⏰ Theta decay exceeding IV expansion (calendar spreads)

---

## Profit Taking Rules

### Scaling Out Strategy
| IV Rise | Action | Rationale |
|---------|--------|-----------|
| +20-30% | Take 25% off | Lock in IV expansion gains |
| +50-75% | Take 50% off | Secure capital, reduce risk |
| +100%+  | Take 75% off | Exceptional move, book wins |
| Event D-1 | Consider 100% | Avoid binary risk if already profitable |

### Rolling Positions
**When to Roll**:
- IV declining but thesis intact
- Position profitable but more runway needed
- Approaching expiry (>50% theta decay)

**How to Roll**:
- Roll out 1 month + up 1 strike (capture profits)
- Roll at 50% gain level to lock in partial win
- Never roll underwater positions without fresh catalyst

---

## Sanity Checks (Avoid False Positives)

### Macro/Sector Controls
1. **XBI Sector IV Subtraction**
   - Subtract XBI IV move from ticker IV
   - If ticker IV driven by sector, not catalyst → SKIP
   - Formula: `adj_iv = ticker_iv - xbi_iv_change`

2. **Earnings Week Masking**
   - Exclude signals within ±5 days of earnings
   - Earnings IV dominates catalyst IV
   - Exception: If catalyst date = earnings date (intentional)

3. **FDA Class-Wide Actions**
   - Check for recent FDA class warnings
   - Examples: BTK class liver concerns, PCSK9 safety
   - Mask tickers in affected class for 30 days

### Liquidity Filters
1. **Minimum OI Threshold**
   - OI > 1,000 contracts (liquid enough to trade)
   - OI/Float sanity: OI > 0.1% of float

2. **Volume Requirements**
   - Average daily volume > 100,000 shares
   - Options volume > 500 contracts/day

3. **Micro-Cap Exclusion**
   - Market cap > $500M (avoid illiquid pump scenarios)
   - Exclude SPAC mergers until proven track record

### Event Re-Dating Logic
1. **Guidance Slip Detection**
   - Monitor company IR updates for date changes
   - Re-anchor catalyst dates within 24 hours
   - Flag positions with slipped dates for review

2. **Regulatory Delays**
   - Track FDA CRL patterns (60-90 day delays typical)
   - PDUFA extensions (3-month review extensions)
   - EU EMA decisions (slower than FDA)

---

## Common IV Regimes & Playbook

### Regime 1: Quiet Accumulation
**Pattern**: IV/RV > 1.4, ret5d ±2%, OI building
**Interpretation**: Smart money quietly positioning
**Action**: Enter debit spreads, size 2-3%
**Example**: VRTX pre-VX-548 data (Apr 2024)

### Regime 2: Front-End Bulge
**Pattern**: 7D > 30D, backwardation forming
**Interpretation**: Event imminent, market pricing binary
**Action**: Shorter-dated spreads, reduce size to 1-2%
**Example**: SRPT pre-Elevidys approval (Jun 2023)

### Regime 3: Skew Inversion
**Pattern**: Call skew > put skew (unusual for biotech)
**Interpretation**: Upside optionality premium
**Action**: Long calls or call spreads, 2% size
**Example**: MRNA pre-COVID vaccine approval (Dec 2020)

### Regime 4: OI Clustering
**Pattern**: Heavy OI at specific strikes (e.g., $50, $75)
**Interpretation**: Market consensus on outcomes
**Action**: Confirm strikes align with analyst targets
**Example**: BLUE pre-beti-cel approval (Aug 2022)

### Regime 5: Extreme IV (>90%ile)
**Pattern**: IV already priced to perfection
**Interpretation**: Risk/reward unfavorable for longs
**Action**: AVOID or fade with short premium (advanced)
**Example**: BIIB pre-Aduhelm decision (Jun 2021)

---

## Quick Start Workflow (Today)

### Setup (One-Time, 30 minutes)
1. Load XBI names into watchlist (120 names)
2. Backfill 1Y IV percentiles (7D/30D) per ticker
3. Set up catalyst calendar (next 60 days)
4. Configure alert thresholds in system

### Daily Routine (15 minutes)
```
Morning (9:00 AM ET)
├─ 1. Check overnight alerts (5 min)
│  ├─ Review new 2-of-4 flag signals
│  └─ Verify no thesis invalidations
│
├─ 2. Cross-reference peer IV (5 min)
│  ├─ Confirm idiosyncratic moves
│  └─ Check XBI sector IV level
│
└─ 3. Update positions (5 min)
   ├─ Check P&L and IV changes
   ├─ Scale out if profit targets hit
   └─ Set new stops based on IV drift
```

### Pre-Market Catalyst Scan
```python
# Pseudocode for daily scan
signals = fetch_signals(min_score=2, max_days=60)
for signal in signals:
    if signal.quality == "High" and signal.iv7_pctile < 85:
        peer_data = fetch_peer_comparison(signal.ticker)
        if peer_data.is_idiosyncratic:
            # High-conviction setup
            add_to_watchlist(signal, priority="High")
        else:
            # Sector-wide move, lower priority
            add_to_watchlist(signal, priority="Medium")
```

---

## Example Trade Journal Template

### Trade Entry Log
```markdown
**Date**: 2024-10-28
**Ticker**: VRTX
**Setup**: Phase 3 VX-548 pain data
**Days to Event**: 35
**Signal Score**: 3/4
**Flags**: Backwardation, IV/RV, Skew

**Entry**:
- Position: 450/460 call spread
- Contracts: 10
- Cost: $4.50/spread ($4,500 total)
- Risk: 3% portfolio

**Metrics**:
- IV7: 58% (68%ile)
- IV/RV: 1.65
- IV30: 51%
- Skew Change: +12 pts

**Thesis**:
- Novel non-opioid MOA
- Positive Phase 2 data (Oct 2023)
- Analyst consensus: 70% approval odds
- No peer competition in this class

**Exits**:
- Stop: -40% ($2.70)
- Target 1 (50%): +75% ($7.88) - take 50% off
- Target 2 (50%): +125% ($10.00+) - close remainder
```

### Trade Exit Log
```markdown
**Exit Date**: 2024-11-15
**Days Held**: 18
**Outcome**: Positive data announced

**Exit**:
- Spread Value: $8.20
- Profit: $3.70/spread ($3,700 total)
- Return: +82%
- Closed: 100% (D+1 after announcement)

**What Worked**:
- Entered at optimal IV level (68%ile)
- 3-flag signal was high-quality
- Peer comparison confirmed idiosyncratic move
- Closed immediately post-event (avoided IV crush)

**What to Improve**:
- Could have scaled out 25% at $7.00 (day before event)
- Missed +10% IV expansion in final week (could have added)

**Key Lesson**:
Discipline on exit timing paid off - spread worth $10 intrinsic
but IV collapsed next day, actual sellable price was $8.50
```

---

## Advanced Tactics (For Experienced Traders)

### Calendar Spreads for IV Expansion
**Setup**: Sell front-month, buy back-month
**When**: IV rising but not extreme (<75%ile)
**Goal**: Capture IV expansion + theta decay

**Example**:
```
Sell Dec 450 call @ $8.00
Buy Jan 450 call @ $12.00
Net Cost: $4.00
Target: IV expansion makes Jan call $15+, Dec expires
```

### Ratio Spreads for Explosive Moves
**Setup**: Buy 1, sell 2 at higher strike
**When**: High conviction on large move (>30%)
**Risk**: Capped upside, unlimited downside past upper strike

**Example**:
```
Buy 1x 450 call @ $10.00
Sell 2x 500 calls @ $3.00
Net Cost: $4.00 credit
Target: Stock goes to $490-500 range
Max Profit: $46/spread at $500 stock
```

### Butterfly Spreads for Precision
**Setup**: 1-2-1 structure (buy 1, sell 2, buy 1)
**When**: High confidence in specific price target
**Best Use**: Post-positive event, targeting revaluation price

**Example**:
```
Buy 450 call @ $10.00
Sell 2x 475 calls @ $6.00 each
Buy 500 call @ $3.00
Net Cost: $1.00
Target: Stock settles $475 (max profit $24)
```

---

## Resources & Tools

### Data Sources (Free)
- **CBOE**: VIX-style indices for biotech (VXEEM)
- **Barchart**: Options volume and OI data
- **ClinicalTrials.gov**: Event dates and trial details
- **FDA.gov**: PDUFA calendar, ad-com schedules
- **Company IR**: Investor presentations, guidance

### Paid Tools (Optional)
- **Trade Alert**: Options flow tracking
- **Market Chameleon**: IV percentile data
- **LiveVol**: Options chain analysis
- **Thinkback**: Backtesting options strategies

### Community
- **Twitter**: Follow @biotechoptionz, @optionflow
- **Discord**: Biotech options trading groups
- **r/BiotechPlays**: Reddit community

---

## Risk Disclaimers

⚠️ **Options involve substantial risk and are not suitable for all investors.**

- You can lose 100% of your investment
- Past performance does not guarantee future results
- IV signals are probabilistic, not deterministic
- Always risk only what you can afford to lose
- Consult a financial advisor before trading

---

## Quick Reference Checklist

### Before Every Trade
- [ ] Signal score ≥ 2 flags
- [ ] IV percentile < 85%
- [ ] Position size ≤ 3% portfolio
- [ ] Peer comparison confirms idiosyncratic
- [ ] No sector-wide vol spike (check XBI)
- [ ] Catalyst date confirmed (no slippage)
- [ ] Liquidity meets minimums (OI > 1K)
- [ ] Stop loss level defined
- [ ] Profit targets set
- [ ] Journal entry created

### Daily Monitoring
- [ ] Check signal alerts (new 2-of-4 flags)
- [ ] Review P&L on open positions
- [ ] Update stops (trailing or fixed)
- [ ] Scale out if profit targets hit
- [ ] Scan for thesis invalidations
- [ ] Monitor IV drift (rising or falling?)
- [ ] Check catalyst calendar for date changes

### Post-Event Review
- [ ] Close positions immediately (within 24 hours)
- [ ] Document outcome in trade journal
- [ ] Calculate actual return vs target
- [ ] Analyze what worked / didn't work
- [ ] Update personal playbook notes
- [ ] Review for pattern recognition

---

**Version**: 1.0  
**Last Updated**: 2024-10-28  
**Maintained By**: Biotech Terminal Platform Team

For questions or contributions, see [IV_CATALYST_QUICK_START.md](./IV_CATALYST_QUICK_START.md)
