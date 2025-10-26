# IV Catalyst Playbook - Entry/Exit Strategies

## Quick Reference Guide for Trading IV Catalyst Signals

### Entry Framework

#### TIER 1: High-Quality Setup (Score 3-4, IV <75%ile)
**Position Sizing**: 2-3% of portfolio risk  
**Structures**:
- ✅ **Debit Call Spreads** (5-10 wide, 1-2 months out)
- ✅ **Naked Long Calls** (if very high conviction)
- ✅ **Call Calendar Spreads** (sell front, buy back)

**Entry Timing**: Enter at signal generation (D-45 to D-30)

**Example**:
```
VRTX FDA PDUFA in 45 days
Signal Score: 3/4
IV7: 62% (65%ile)
→ Buy Mar 150/160 call spread @ $4.00
   Max Risk: $400/contract
   Max Profit: $600/contract (expires ITM)
```

---

#### TIER 2: Medium Setup (Score 2, IV 75-85%ile)
**Position Sizing**: 1-2% of portfolio risk  
**Structures**:
- ⚠️ **Tighter Call Spreads** (3-5 wide)
- ⚠️ **Butterfly Spreads** (target specific price)
- ⚠️ **Ratio Spreads** (if expecting explosive move)

**Entry Timing**: Enter closer to event (D-21 to D-14)

**Example**:
```
BIIB Alzheimer's Readout in 30 days
Signal Score: 2/4
IV7: 78% (82%ile)
→ Buy 280/290 call spread @ $3.50
   Tighter spread to manage theta decay
```

---

#### TIER 3: Avoid or Fade (Score <2 or IV >85%ile)
**Structures**:
- ❌ **Do NOT buy naked premium** (IV crush will destroy)
- ⚠️ **Sell Premium** (advanced only - high risk)
- ⚠️ **Iron Condors** (if expecting IV collapse without big move)

**Example - FADE Setup**:
```
REGN Trial Data in 14 days
IV7: 95% (96%ile) - Already priced in
→ SKIP or consider selling call spreads if bearish
```

---

### Position Management

#### Stop Loss Rules
- **Hard Stop**: -40% to -50% max loss
- **Time Stop**: Close at D-3 if position underwater and IV declining
- **Thesis Stop**: Exit if negative peer data or company delays event

#### Profit Taking
| IV Rise | Action | Rationale |
|---------|--------|-----------|
| +20-30% | Take 25% off | Lock in gains from IV expansion |
| +50-75% | Take 50% off | Secure capital, let rest run |
| +100%+ | Take 75% off | Exceptional IV spike, take most off |

#### Rolling Strategy
- If IV declining but thesis intact: **Roll out 1 month + up 1 strike**
- If approaching expiry with no catalyst: **Close and reassess**

---

### Exit Strategy by Outcome

#### POSITIVE OUTCOME (Drug Approved / Data Positive)
**Immediate (Day 0-1)**:
- **Option holders**: Close 100% immediately (IV will collapse 50-80%)
- **Stock conversion**: Switch to shares if long-term bullish

**Example**:
```
SRPT DMD gene therapy approved
Pre-announcement: 150/160 call spread worth $6.50
Post-announcement: Stock +18% to $168
→ Spread worth $9.00 (near max)
→ CLOSE IMMEDIATELY before IV crush
```

**Day 1-3 Post-Event**:
- IV collapses 60-80% typically
- Even if stock rises, option values decline (vega loss > delta gain)

---

#### NEGATIVE OUTCOME (Drug Fails / Data Negative)
**Immediate**:
- **Cut losses** immediately - no point holding
- **Do NOT average down** - catalyst already happened

**Alternative**:
- If stock oversold: Switch to **put spreads** to fade panic selling
- If you're long shares: Add **protective puts** for further downside

---

#### NEUTRAL/MIXED OUTCOME
**Immediate**:
- Assess if new catalyst timeline emerges
- If yes: Hold or roll to new date
- If no: **Close - IV will still collapse**

**Example**:
```
INCY Trial Data: Effective but safety signal
Stock flat/down slightly
→ Close options (IV collapse coming)
→ Reassess if follow-up trial scheduled
```

---

### Risk Management Matrix

| Days to Event | Max Position Size | Stop Loss | Profit Target |
|---------------|-------------------|-----------|---------------|
| 60-45 | 3% risk | -40% | +75% |
| 44-30 | 2.5% risk | -40% | +100% |
| 29-14 | 2% risk | -50% | +125% |
| 13-7 | 1.5% risk | -50% | +150% |
| <7 | 1% risk | -60% | Hold to event |

---

### Portfolio Construction

#### Diversification Rules
1. **Max 5 active IV setups** at once
2. **Max 20% exposure** to single catalyst type (e.g., all PDUFAs)
3. **Max 30% exposure** to single therapeutic area (e.g., all oncology)
4. **Stagger event dates** - don't cluster events in same week

#### Example Portfolio
```
Position 1: VRTX FDA PDUFA (2% risk, D-45)
Position 2: BMRN Gene Therapy Data (1.5% risk, D-28)
Position 3: EXAS Guardant 360 CMS (2% risk, D-37)
Position 4: RARE Acquisition Rumor (1% risk, D-14)
Position 5: ALNY TTR Data (2.5% risk, D-52)

Total IV Risk: 9% of portfolio
```

---

### Common Mistakes to Avoid

#### ❌ MISTAKE #1: Buying Peak IV
**Error**: Entering when IV at 95%ile because you see headline  
**Fix**: Wait for pullback or skip - IV already priced in

#### ❌ MISTAKE #2: Holding Through Event
**Error**: "I'll see what happens" - holds through FDA approval  
**Fix**: Close before or at announcement - IV crush is certain

#### ❌ MISTAKE #3: Over-concentrating
**Error**: 5 positions all in same therapeutic area  
**Fix**: Diversify across areas and catalyst types

#### ❌ MISTAKE #4: Ignoring Skew
**Error**: Buying OTM calls when skew heavily against them  
**Fix**: Check skew - if puts cheaper, consider put spreads instead

#### ❌ MISTAKE #5: No Stop Loss
**Error**: Holding -70% position hoping for reversal  
**Fix**: Hard stop at -50%, move on to next setup

---

### Advanced Techniques

#### 1. Pairs Trading
```
Long SRPT DMD gene therapy
Short BMRN competing DMD drug (2:1 ratio)
→ Isolates SRPT event risk, hedges sector beta
```

#### 2. Calendar Spread Arbitrage
```
Sell front-month 150 calls (IV 80%)
Buy back-month 150 calls (IV 60%)
→ Profit from term structure collapse post-event
```

#### 3. Gamma Scalping
```
Long straddle at D-7
Delta hedge daily to capture gamma
Exit before event or hold through
```

---

### Catalyst Type Strategies

#### FDA PDUFA Dates
- **Highest probability**: Binary, date-certain
- **Best structure**: Debit call spreads
- **Timing**: Enter D-45, exit D-1 or at approval

#### Clinical Trial Data Readouts
- **Moderate probability**: Can slip dates
- **Best structure**: Calendars or naked calls (smaller size)
- **Timing**: Enter D-30, monitor for date changes

#### Advisory Committee (AdCom) Meetings
- **High volatility**: Can go either way
- **Best structure**: Straddles or iron condors
- **Timing**: Enter D-14, exit D-1 (don't hold through)

#### M&A Speculation
- **Lowest probability**: Rumors often false
- **Best structure**: Cheap OTM calls only
- **Timing**: Very small size, exit at +50% or -100%

---

### Checklists

#### Entry Checklist
- [ ] Signal score ≥2?
- [ ] IV percentile <85%?
- [ ] Quality tier High or Medium?
- [ ] Event date confirmed (not rumor)?
- [ ] Position size within limits?
- [ ] Stop loss defined?
- [ ] Profit target set?
- [ ] Catalyst type understood?
- [ ] No conflicting positions?
- [ ] Room in portfolio (max 5 setups)?

#### Exit Checklist
- [ ] Profit target hit?
- [ ] Stop loss triggered?
- [ ] Event approaching (<3 days)?
- [ ] IV collapsing pre-event?
- [ ] Negative peer data?
- [ ] Thesis changed?
- [ ] Better opportunity elsewhere?

---

### Performance Tracking

Track these metrics per setup:

```
Setup ID: VRTX-PDUFA-2025-03
Entry Date: 2025-01-15
Entry Price: $4.00 (150/160 call spread)
Exit Date: 2025-02-28
Exit Price: $8.50
P&L: +112.5%
Duration: 44 days
Score: 3/4
IV Entry: 62%ile
IV Exit: 88%ile
Outcome: Win (FDA approved)
Notes: Good setup, took 50% off at +75%, let rest run
```

**Monthly Review**:
- Win Rate: X% of setups profitable
- Avg Win: +X%
- Avg Loss: -X%
- Sharpe Ratio: X
- Best performers: [catalyst type, therapeutic area]

---

### Psychology Tips

1. **Trade the setup, not the story**: Don't fall in love with the drug
2. **Respect the math**: If IV is 95%ile, it's priced in - skip it
3. **Take profits early**: Better to leave money on table than give it back
4. **Don't revenge trade**: Lost on a setup? Move on, next one coming
5. **Journal everything**: Learn from wins AND losses

---

## Quick Decision Tree

```
Signal Generated
    │
    ├─ Score ≥3 & IV <75%ile? → YES → Enter Tier 1 structure
    │                         → NO  → Check Score 2?
    │
    ├─ Score =2 & IV <85%ile? → YES → Enter Tier 2 structure (smaller size)
    │                         → NO  → Skip or Fade
    │
    └─ Monitor position:
         ├─ +50% profit? → Take 50% off
         ├─ -40% loss?   → Stop out
         ├─ D-3?         → Exit if underwater
         └─ Event occurs → Close ALL immediately
```

---

## Resources

- **Live Dashboard**: `/iv-catalyst` route
- **API Access**: See [IV_CATALYST_API.md](./IV_CATALYST_API.md)
- **User Guide**: See [IV_CATALYST_USER_GUIDE.md](./IV_CATALYST_USER_GUIDE.md)

---

**Remember**: This is a probability game. No setup is guaranteed. Position sizing and risk management are your edge, not being right every time.

**Disclaimer**: Not financial advice. For educational purposes only. Options trading involves substantial risk.
