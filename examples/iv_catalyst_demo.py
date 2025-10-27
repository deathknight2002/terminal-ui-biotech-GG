"""
IV Catalyst System - Example Usage Demo

This script demonstrates how to use the IV catalyst tracking system
programmatically through the API.
"""

import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict


BASE_URL = "http://localhost:8000/api/v1"


def get_iv_signals(min_score: int = 2, max_days: int = 60, quality: str = None) -> Dict:
    """
    Fetch IV catalyst signals from the API
    
    Args:
        min_score: Minimum signal score (0-4)
        max_days: Maximum days to catalyst event
        quality: Filter by quality (High, Medium, Low)
    
    Returns:
        Dict with signals data
    """
    params = {
        "min_score": min_score,
        "max_days_to_event": max_days,
    }
    
    if quality:
        params["quality"] = quality
    
    response = requests.get(f"{BASE_URL}/iv/signals", params=params)
    response.raise_for_status()
    return response.json()


def get_peer_comparison(ticker: str, therapeutic_area: str = None) -> Dict:
    """
    Get peer IV percentile comparison
    
    Args:
        ticker: Ticker symbol
        therapeutic_area: Optional filter by therapeutic area
    
    Returns:
        Dict with peer comparison data
    """
    params = {}
    if therapeutic_area:
        params["therapeutic_area"] = therapeutic_area
    
    response = requests.get(f"{BASE_URL}/iv/peer-comparison/{ticker}", params=params)
    response.raise_for_status()
    return response.json()


def get_iv_stats(ticker: str) -> Dict:
    """
    Get IV statistics and percentiles for a ticker
    
    Args:
        ticker: Ticker symbol
    
    Returns:
        Dict with IV stats
    """
    response = requests.get(f"{BASE_URL}/iv/stats/{ticker}")
    response.raise_for_status()
    return response.json()


def get_calendar_data(from_date: str = None, to_date: str = None, tickers: List[str] = None) -> Dict:
    """
    Get catalyst calendar with IV overlay
    
    Args:
        from_date: Start date (ISO format)
        to_date: End date (ISO format)
        tickers: List of tickers to filter
    
    Returns:
        Dict with calendar data
    """
    params = {}
    if from_date:
        params["from_date"] = from_date
    if to_date:
        params["to_date"] = to_date
    if tickers:
        params["tickers"] = ",".join(tickers)
    
    response = requests.get(f"{BASE_URL}/iv/calendar", params=params)
    response.raise_for_status()
    return response.json()


def compute_signals(min_iv_rv_ratio: float = 1.4, min_skew_change: float = 10.0) -> Dict:
    """
    Trigger signal computation
    
    Args:
        min_iv_rv_ratio: Minimum IV/RV ratio threshold
        min_skew_change: Minimum skew change (delta points)
    
    Returns:
        Dict with computation results
    """
    params = {
        "min_iv_rv_ratio": min_iv_rv_ratio,
        "min_skew_change": min_skew_change,
    }
    
    response = requests.post(f"{BASE_URL}/iv/compute-signals", params=params)
    response.raise_for_status()
    return response.json()


def analyze_signal(signal: Dict) -> Dict:
    """
    Analyze a signal and provide trading recommendation
    
    Args:
        signal: Signal data from API
    
    Returns:
        Dict with analysis and recommendation
    """
    ticker = signal["ticker"]
    score = signal["signal_score"]
    quality = signal["quality"]
    iv7_pctile = signal["metrics"]["iv7_pctile"]
    days_to_event = signal["days_to_event"]
    
    # Determine recommended structure based on quality and IV percentile
    if quality == "High" and iv7_pctile < 85:
        structure = "Debit Call Spread (5-10 wide)"
        position_size = "2-3% portfolio risk"
        stop_loss = -0.40
    elif quality == "Medium" or (quality == "High" and iv7_pctile >= 85):
        structure = "Tight Call Spread (3-5 wide)"
        position_size = "1-2% portfolio risk"
        stop_loss = -0.50
    else:
        structure = "AVOID - Low quality or IV too high"
        position_size = "0%"
        stop_loss = 0
    
    # Get peer comparison for context
    try:
        peer_data = get_peer_comparison(ticker)
        is_idiosyncratic = peer_data.get("is_idiosyncratic", False)
    except:
        is_idiosyncratic = None
    
    return {
        "ticker": ticker,
        "recommendation": structure,
        "position_size": position_size,
        "stop_loss": f"{stop_loss:.0%}" if stop_loss else "N/A",
        "days_to_entry": "ASAP" if days_to_event > 14 else "D-14 to D-7",
        "is_idiosyncratic": is_idiosyncratic,
        "analysis": {
            "signal_quality": quality,
            "signal_score": f"{score}/4",
            "iv_percentile": f"{iv7_pctile:.1f}%ile",
            "days_to_event": days_to_event,
        }
    }


def main():
    """Main demo script"""
    
    print("=" * 60)
    print("IV CATALYST TRACKING SYSTEM - DEMO")
    print("=" * 60)
    print()
    
    # Step 1: Compute fresh signals
    print("Step 1: Computing signals...")
    try:
        result = compute_signals()
        print(f"✓ Generated {result['signals_generated']} signals from {result['catalysts_analyzed']} catalysts")
    except Exception as e:
        print(f"⚠️ Could not compute signals: {e}")
    print()
    
    # Step 2: Fetch all high-quality signals
    print("Step 2: Fetching high-quality signals...")
    signals_data = get_iv_signals(min_score=3, quality="High")
    signals = signals_data["signals"]
    print(f"✓ Found {len(signals)} high-quality signals")
    print()
    
    # Step 3: Analyze each signal
    if signals:
        print("Step 3: Analyzing signals...")
        print()
        
        for i, signal in enumerate(signals[:5], 1):  # Limit to top 5
            print(f"Signal #{i}: {signal['ticker']}")
            print("-" * 40)
            
            # Analyze
            analysis = analyze_signal(signal)
            
            # Display
            print(f"Event: {signal['event_type']} on {signal['event_date'][:10]}")
            print(f"Quality: {analysis['analysis']['signal_quality']} ({analysis['analysis']['signal_score']})")
            print(f"IV7: {signal['metrics']['iv7']:.1f}% ({analysis['analysis']['iv_percentile']})")
            print(f"IV/RV: {signal['metrics']['iv_rv_ratio']:.2f}")
            print()
            
            print("Flags:")
            for flag, value in signal['flags'].items():
                status = "✓" if value else "○"
                print(f"  {status} {flag.replace('_', ' ').title()}")
            print()
            
            print(f"Recommendation: {analysis['recommendation']}")
            print(f"Position Size: {analysis['position_size']}")
            print(f"Stop Loss: {analysis['stop_loss']}")
            
            if analysis['is_idiosyncratic'] is not None:
                status = "IDIOSYNCRATIC ⚠️" if analysis['is_idiosyncratic'] else "Sector Move"
                print(f"Move Type: {status}")
            
            print()
            print("=" * 60)
            print()
    
    # Step 4: Get calendar view
    print("Step 4: Fetching catalyst calendar...")
    today = datetime.now()
    from_date = today.strftime("%Y-%m-%d")
    to_date = (today + timedelta(days=30)).strftime("%Y-%m-%d")
    
    calendar = get_calendar_data(from_date=from_date, to_date=to_date)
    print(f"✓ Found {calendar['count']} upcoming catalysts")
    print()
    
    # Display summary by ticker
    if calendar['events']:
        print("Upcoming Events (Next 30 Days):")
        print("-" * 40)
        for event in sorted(calendar['events'], key=lambda x: x['days_to_event'])[:10]:
            ticker = event['ticker']
            days = event['days_to_event']
            event_type = event['event_type']
            iv7 = event['iv_data']['iv7']
            
            if iv7:
                print(f"{ticker:6} | D-{days:2} | {event_type:30} | IV: {iv7:.1f}%")
            else:
                print(f"{ticker:6} | D-{days:2} | {event_type:30} | IV: N/A")
        print()
    
    print("=" * 60)
    print("Demo complete!")
    print("For more info, visit: http://localhost:3000/iv-catalyst")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API")
        print("Please ensure the backend is running:")
        print("  poetry run uvicorn bt_platform.core.app:app --reload --port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
