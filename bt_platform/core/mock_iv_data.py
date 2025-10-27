"""
Mock IV Catalyst Data Generator

Generates realistic mock data for frontend development and testing
when real options data is not available.
"""

from datetime import datetime, timedelta
from typing import List, Dict
import random


def generate_mock_iv_signals(count: int = 10) -> List[Dict]:
    """Generate mock IV catalyst signals"""
    
    tickers = ["REGN", "VRTX", "MRNA", "BNTX", "ARGX", "SRPT", "BBIO", "NTLA", "NBIX", "ALNY",
               "BMRN", "IONS", "EXEL", "INCY", "TECH", "JAZZ", "UTHR", "RARE", "FOLD", "BLUE"]
    
    event_types = [
        "Phase 3 Data Readout",
        "PDUFA Date",
        "AdCom Meeting",
        "Phase 2 Results",
        "FDA Filing",
        "Interim Analysis",
        "EU MAA Decision",
        "Label Expansion"
    ]
    
    signals = []
    today = datetime.utcnow()
    
    for i in range(min(count, len(tickers))):
        ticker = tickers[i]
        days_to_event = random.randint(7, 60)
        event_date = today + timedelta(days=days_to_event)
        
        # Generate correlated metrics for realistic signals
        base_iv = random.uniform(35, 70)
        iv7 = base_iv + random.gauss(0, 5)
        iv30 = base_iv + random.gauss(0, 3)
        
        # Backwardation more likely near events
        if days_to_event < 21:
            iv7 += random.uniform(5, 15)
        
        iv_rv_ratio = iv7 / random.uniform(25, 45)
        term_backwardation = iv7 - iv30
        
        # Skew
        skew25d = random.uniform(3, 12)
        skew_change = random.uniform(-5, 15)
        
        # IV percentile
        iv7_pctile = random.uniform(40, 95)
        
        # Price metrics
        price = random.uniform(50, 300)
        ret5d = random.gauss(0, 0.015)  # Quiet price action
        
        # Signal flags
        backw_flag = 1 if term_backwardation > iv30 * 0.1 else 0
        ivrv_flag = 1 if iv_rv_ratio > 1.4 and abs(ret5d) < 0.02 else 0
        skew_flag = 1 if skew_change > 10 else 0
        oi_flag = random.choice([0, 1])
        
        signal_score = backw_flag + ivrv_flag + skew_flag + oi_flag
        
        # Quality based on score and IV percentile
        if signal_score >= 3 and iv7_pctile < 85:
            quality = "High"
            confidence = 0.75 + random.uniform(0, 0.2)
        elif signal_score >= 2:
            quality = "Medium"
            confidence = 0.5 + random.uniform(0, 0.25)
        else:
            quality = "Low"
            confidence = 0.3 + random.uniform(0, 0.3)
        
        signal = {
            "ticker": ticker,
            "signal_date": today.isoformat(),
            "event_date": event_date.isoformat(),
            "event_type": random.choice(event_types),
            "days_to_event": days_to_event,
            "signal_score": signal_score,
            "confidence": round(confidence, 2),
            "quality": quality,
            "metrics": {
                "iv7": round(iv7, 1),
                "iv30": round(iv30, 1),
                "iv_rv_ratio": round(iv_rv_ratio, 2),
                "term_backwardation": round(term_backwardation, 1),
                "skew25d": round(skew25d, 1),
                "skew_change": round(skew_change, 1),
                "iv7_pctile": round(iv7_pctile, 1),
                "price": round(price, 2),
                "ret5d": round(ret5d, 4)
            },
            "flags": {
                "backwardation": bool(backw_flag),
                "iv_rv_elevated": bool(ivrv_flag),
                "skew_significant": bool(skew_flag),
                "oi_spike": bool(oi_flag)
            }
        }
        
        signals.append(signal)
    
    # Sort by signal score descending
    signals.sort(key=lambda x: (x["signal_score"], -x["days_to_event"]), reverse=True)
    
    return signals


def generate_mock_iv_calendar(days_ahead: int = 60, tickers: List[str] = None) -> List[Dict]:
    """Generate mock IV calendar events"""
    
    if not tickers:
        tickers = ["REGN", "VRTX", "MRNA", "BNTX", "ARGX", "SRPT", "BBIO", "NTLA", "NBIX", "ALNY"]
    
    event_types = [
        "Phase 3 Data",
        "PDUFA",
        "AdCom",
        "Phase 2 Data",
        "FDA Filing",
        "Interim"
    ]
    
    events = []
    today = datetime.utcnow()
    
    for ticker in tickers:
        # Generate 1-3 events per ticker
        num_events = random.randint(1, 3)
        
        for _ in range(num_events):
            days_to_event = random.randint(1, days_ahead)
            event_date = today + timedelta(days=days_to_event)
            
            # Determine marker
            if days_to_event <= 1:
                marker = "D-1"
            elif days_to_event <= 3:
                marker = "D-3"
            elif days_to_event <= 7:
                marker = "D-7"
            elif days_to_event <= 30:
                marker = "D-30"
            else:
                marker = None
            
            # Generate IV data
            base_iv = random.uniform(35, 65)
            iv7 = base_iv + (random.uniform(5, 20) if days_to_event < 21 else 0)
            iv30 = base_iv
            iv7_pctile = random.uniform(45, 90)
            skew_25d = random.uniform(3, 12)
            is_backwardation = iv7 > iv30 * 1.1
            
            event = {
                "id": random.randint(1000, 9999),
                "ticker": ticker,
                "name": f"{ticker} {random.choice(event_types)}",
                "event_date": event_date.isoformat(),
                "event_type": random.choice(event_types),
                "days_to_event": days_to_event,
                "marker": marker,
                "iv_data": {
                    "iv7": round(iv7, 1),
                    "iv30": round(iv30, 1),
                    "iv7_pctile": round(iv7_pctile, 1),
                    "skew_25d": round(skew_25d, 1),
                    "is_backwardation": is_backwardation,
                    "iv_date": today.isoformat()
                },
                "price_data": {
                    "price": round(random.uniform(50, 300), 2),
                    "returns_5d": round(random.gauss(0, 0.02), 4),
                    "realized_vol_20d": round(random.uniform(25, 50), 1)
                }
            }
            
            events.append(event)
    
    # Sort by event date
    events.sort(key=lambda x: x["event_date"])
    
    return events


def generate_mock_iv_data(ticker: str, days: int = 90, tenors: List[int] = None) -> Dict:
    """Generate mock IV time series data for a ticker"""
    
    if not tenors:
        tenors = [7, 30]
    
    today = datetime.utcnow()
    data_by_tenor = {}
    
    for tenor in tenors:
        base_iv = 40 + (tenor / 30) * 5  # Term structure
        series = []
        
        for i in range(days):
            date = today - timedelta(days=days - i - 1)
            
            # Add some drift and noise
            drift = (i / days) * 10  # Gradual increase
            noise = random.gauss(0, 3)
            iv_mid = base_iv + drift + noise
            
            record = {
                "date": date.isoformat(),
                "iv_mid": round(iv_mid, 1),
                "iv_pctile_1y": round(random.uniform(40, 85), 1),
                "skew_25d": round(random.uniform(4, 10), 1),
                "total_oi": random.randint(5000, 50000),
                "put_call_ratio": round(random.uniform(0.8, 1.5), 2),
                "is_backwardation": False
            }
            
            series.append(record)
        
        data_by_tenor[tenor] = series
    
    return {
        "ticker": ticker,
        "tenors": data_by_tenor,
        "count": len(series) * len(tenors)
    }


def generate_mock_iv_stats(ticker: str) -> Dict:
    """Generate mock IV statistics for a ticker"""
    
    # Generate current IV across tenors
    base_iv = random.uniform(40, 65)
    iv_by_tenor = {}
    
    for tenor in [7, 14, 30, 60]:
        iv_mid = base_iv + (tenor / 30) * random.uniform(2, 8)
        
        iv_by_tenor[tenor] = {
            "iv_mid": round(iv_mid, 1),
            "iv_pctile_1y": round(random.uniform(50, 85), 1),
            "iv_pctile_6m": round(random.uniform(55, 80), 1),
            "skew_25d": round(random.uniform(4, 11), 1),
            "is_backwardation": tenor == 7 and random.random() > 0.7,
            "total_oi": random.randint(10000, 100000),
            "put_call_ratio": round(random.uniform(0.9, 1.4), 2)
        }
    
    # Determine term structure
    if iv_by_tenor[7]["iv_mid"] > iv_by_tenor[30]["iv_mid"]:
        term_structure = "backwardation"
    elif iv_by_tenor[7]["iv_mid"] < iv_by_tenor[30]["iv_mid"] * 0.9:
        term_structure = "steep_contango"
    else:
        term_structure = "normal"
    
    realized_vol_20d = random.uniform(25, 45)
    iv_rv_ratio = iv_by_tenor[7]["iv_mid"] / realized_vol_20d
    
    return {
        "ticker": ticker,
        "as_of_date": datetime.utcnow().isoformat(),
        "term_structure": term_structure,
        "iv_by_tenor": iv_by_tenor,
        "iv_rv_ratio": round(iv_rv_ratio, 2),
        "realized_vol_20d": round(realized_vol_20d, 1),
        "price": round(random.uniform(80, 250), 2),
        "returns_5d": round(random.gauss(0, 0.015), 4)
    }


# For MSW (Mock Service Worker) integration in frontend
def get_mock_handlers():
    """
    Returns mock data handlers for frontend MSW setup
    
    Usage in frontend:
    ```typescript
    import { rest } from 'msw';
    
    export const handlers = [
      rest.get('/api/v1/iv/signals', (req, res, ctx) => {
        return res(
          ctx.json({
            signals: generateMockIvSignals(10),
            count: 10
          })
        );
      }),
      // ... more handlers
    ];
    ```
    """
    return {
        "signals": generate_mock_iv_signals,
        "calendar": generate_mock_iv_calendar,
        "data": generate_mock_iv_data,
        "stats": generate_mock_iv_stats
    }


if __name__ == "__main__":
    # Demo output
    import json
    
    print("=== Mock IV Signals ===")
    signals = generate_mock_iv_signals(5)
    print(json.dumps(signals[:2], indent=2))
    
    print("\n=== Mock IV Calendar ===")
    calendar = generate_mock_iv_calendar(days_ahead=30, tickers=["REGN", "VRTX"])
    print(json.dumps(calendar[:2], indent=2))
    
    print("\n=== Mock IV Stats ===")
    stats = generate_mock_iv_stats("REGN")
    print(json.dumps(stats, indent=2))
