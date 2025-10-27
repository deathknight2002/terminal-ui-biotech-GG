# IV Catalyst System - Quick Start Guide

## 🚀 Overview

The IV Catalyst system helps you identify asymmetric trading opportunities by tracking implied volatility (IV) spikes ahead of biotech catalyst events.

---

## 📍 Access the System

Navigate to: `/iv-catalyst` in your terminal app

Or from the main menu: **Catalysts → IV Tracking**

---

## 🎯 Quick Workflow (5 Minutes)

### 1. Check Today's Signals

The **Signals** section shows tickers with elevated IV patterns:

```
┌─────────────────────────────────────────────┐
│ VRTX - Phase 3 Data in 28 days             │
│ Score: 3/4 • Quality: HIGH • Conf: 75%     │
│                                             │
│ Flags: ⚠ BACKWD | 📈 IV/RV | 📊 SKEW       │
│                                             │
│ IV7: 52% (75th %ile)  IV30: 46%            │
│ IV/RV: 1.65  Skew: 8.2  5D Ret: +0.3%      │
└─────────────────────────────────────────────┘
```

**What to look for:**
- Score ≥ 3 = High quality setup
- IV7 percentile 50-85% = Sweet spot (not overcrowded)
- Multiple flags triggered = Stronger signal

---

### 2. Review the Calendar Heatmap

Visual timeline of catalysts with IV overlay:

```
TICKER  │ D-30  │ D-7   │ D-3   │ D-1   │ EVENT
────────┼───────┼───────┼───────┼───────┼──────────
VRTX    │ 🟢65% │ 🟡75% │ 🟠82% │ 🔴88% │ Phase 3
MRNA    │ 🟢58% │ 🟢62% │ 🟡70% │ ...   │ PDUFA
BNTX    │ 🟢52% │ ...   │ ...   │ ...   │ Interim
```

**Color coding:**
- 🟢 Green (50-70%): Normal range
- 🟡 Yellow (70-85%): Elevated
- 🟠 Orange (85-95%): High
- 🔴 Red (>95%): Extreme (avoid buying premium)

---

### 3. Compare to Peers

Each signal card shows peer comparison:

```
┌─ PEER COMPARISON ─────────────────────┐
│ VRTX    ████████████████░░ 75% ← YOU  │
│ ALNY    ██████████████░░░░ 68%        │
│ SRPT    █████████░░░░░░░░░ 52%        │
│ BMRN    ████████████░░░░░░ 61%        │
│                                        │
│ Sector Median: 62%                    │
│ Status: IDIOSYNCRATIC (>20pts)        │
└────────────────────────────────────────┘
```

**Interpretation:**
- **Idiosyncratic** = Ticker-specific IV spike (good!)
- **Sector-wide** = All peers high (may be macro-driven)

---

## 🎲 Daily Routine (15 Minutes)

### Morning Checklist

1. **Review New Signals** (5 min)
   - Check for score ≥ 2
   - Filter by quality: High → Medium → Low
   - Note upcoming catalyst dates

2. **Monitor Existing Positions** (5 min)
   - Check IV percentile drift
   - Look for kill switches (see Playbook)
   - Update stop losses

3. **Check Calendar** (5 min)
   - Events 7-30 days out (prime entry window)
   - D-3 to D-1 markers (approaching event)
   - Post-event tickers (IV collapse plays)

---

## 🔧 Using Filters

### Score Filter
```
Min Score: [2] [3] [4]
```
- **2**: All signals (broader view)
- **3**: High quality only
- **4**: Best of the best (rare)

### Days to Event
```
Max Days: [30] [45] [60] [90]
```
- **30 days**: Near-term catalysts
- **60 days**: Full pipeline view
- **90 days**: Long-term planning

### Quality Filter
```
Quality: [All] [High] [Medium] [Low]
```
- **High**: Score ≥3, IV <85th percentile
- **Medium**: Score ≥2 or IV 85-95th
- **Low**: Score <2 or IV >95th

---

## 📊 Understanding Signal Flags

### ⚠ BACKWARDATION
```
7D IV > 30D IV by >10%
```
**Meaning**: Front-end vol elevated → Event risk priced in short-term options

**Action**: Consider calendar spreads (sell front, buy back)

---

### 📈 IV/RV ELEVATED
```
IV7 / Realized Vol 20D > 1.4
AND 5D return between -2% and +2%
```
**Meaning**: Implied vol rising while price stays flat → Silent accumulation

**Action**: Debit call spreads or naked calls (if high conviction)

---

### 📊 SKEW SIGNIFICANT
```
Current skew - 20D median > 10 pts
```
**Meaning**: Call demand increasing vs puts → Bullish positioning

**Action**: Bullish structures (calls, call spreads)

---

### 💥 OI SPIKE
```
Current OI > 2× 30D average
```
**Meaning**: Unusual options activity at event-relevant strikes

**Action**: Investigate strike clustering, may indicate smart money

---

## 💰 Position Sizing Quick Reference

### Conservative (Learning Phase)
- **Per Position**: 1-2% of portfolio
- **Max Aggregate**: 5-8% across all IV trades
- **Stop Loss**: -50% on premium

### Moderate (Experienced)
- **High Quality (Score 3-4)**: 3-4% per position
- **Medium Quality (Score 2)**: 1.5-2% per position
- **Max Aggregate**: 10-15%

### Aggressive (Advanced)
- **Highest Conviction**: Up to 5-7%
- **Max Aggregate**: 15-20%
- **Use Kelly Criterion** for optimal sizing

---

## 🚨 Kill Switches (When to Exit)

### Pre-Event Exits

1. **IV Spike to >90th percentile**
   - Book profit (vol already priced in)

2. **Thesis Breaks**
   - Trial hold, PDUFA delay, guidance change
   - Exit immediately

3. **Price Break (>5% on no news)**
   - Structure may have changed
   - Re-evaluate or exit

4. **<7 days to event, no IV lift**
   - Theta burn accelerates
   - Exit to avoid decay

### Post-Event Exits

1. **Premium Trades**
   - Exit within 24-48 hours (IV collapses)

2. **Delta Trades (Stock)**
   - Use technical stops (-10% from entry)
   - Positive data: Let winners run

3. **Spreads**
   - Close when profit >70% of max gain

---

## 🎓 Learning Path

### Week 1: Observation
- Track 5-10 signals daily
- Don't trade yet—just watch
- Note which patterns work

### Week 2: Paper Trading
- Simulate 3-5 positions
- Use conservative sizing
- Track outcomes vs signals

### Week 3: Small Live Trades
- Start with 1% positions
- Focus on score ≥3 signals
- Exit quickly if wrong

### Week 4+: Scale Up
- Increase to full sizing gradually
- Refine your entry/exit timing
- Build your own playbook

---

## 📚 Additional Resources

- **[Full Playbook](./IV_CATALYST_PLAYBOOK.md)**: Detailed strategies and examples
- **[API Documentation](./IV_CATALYST_API.md)**: For developers
- **[User Guide](./IV_CATALYST_USER_GUIDE.md)**: Comprehensive feature reference

---

## 🆘 Troubleshooting

### No Signals Showing
- Check filters (Score may be set too high)
- Ensure XBI companies loaded in database
- Run signal computation: `POST /api/v1/iv/compute-signals`

### Calendar is Empty
- Check date range (default is -30 to +60 days)
- Ensure catalysts loaded in database
- Verify IV data populated for tickers

### Peer Comparison Not Working
- Ensure company therapeutic areas populated
- Ticker must be XBI constituent
- Check backend logs for API errors

---

## 📞 Support

For issues or questions:
1. Check logs in browser console (F12)
2. Review backend logs: `bt_platform/core/endpoints/iv_catalyst.py`
3. File issue on GitHub with reproduction steps

---

**Last Updated**: 2024-10-27  
**Version**: 1.0  
**Author**: Biotech Terminal Platform Team
