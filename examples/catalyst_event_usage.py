"""
Catalyst Event System - Usage Examples

This script demonstrates how to use the catalyst event API endpoints.
Run this after starting the FastAPI server.
"""

import requests
import json
from typing import Dict, Any


BASE_URL = "http://localhost:8000/api/v1/catalysts"


def pretty_print(data: Dict[str, Any], title: str = ""):
    """Pretty print JSON data"""
    if title:
        print(f"\n{'=' * 80}")
        print(f"  {title}")
        print('=' * 80)
    print(json.dumps(data, indent=2))


def example_1_full_event():
    """Example 1: Get full catalyst event (Novartis → Avidity M&A)"""
    print("\n" + "=" * 80)
    print("  EXAMPLE 1: Full Catalyst Event - Novartis → Avidity M&A")
    print("=" * 80)
    
    response = requests.get(f"{BASE_URL}/events/1")
    if response.status_code == 200:
        data = response.json()
        event = data.get("event", {})
        
        print(f"\n📊 Event: {event.get('catalyst', {}).get('program')}")
        print(f"🏢 Company: {event.get('company', {}).get('name')}")
        print(f"📅 Date: {event.get('as_of')}")
        print(f"🏷️  Type: {event.get('catalyst', {}).get('type')}")
        
        # Show expectations vs outcomes
        expectations = event.get('expectations', {}).get('metrics', [])
        outcomes = event.get('outcome', {}).get('metrics', [])
        
        print(f"\n📈 Expectations vs Outcomes:")
        for exp in expectations:
            outcome = next((o for o in outcomes if o['name'] == exp['name']), None)
            if outcome:
                print(f"  • {exp['name']}: Expected {exp['expected']}{exp['unit']}, "
                      f"Got {outcome.get('value', outcome.get('value_str'))}{outcome['unit']}")
        
        # Show market reaction
        reactions = event.get('market_reaction', {}).get('price', [])
        if reactions:
            print(f"\n📊 Market Reaction:")
            for react in reactions:
                print(f"  • {react['window']}: {react['abs']:+.1f}% "
                      f"(vs XBI: {react.get('rel_vs_XBI', 0):+.1f}%)")
        
        pretty_print(data, "Full Response")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")


def example_2_expectation_deltas():
    """Example 2: Calculate expectation deltas (BridgeBio FORTIFY)"""
    print("\n" + "=" * 80)
    print("  EXAMPLE 2: Expectation Deltas - BridgeBio FORTIFY")
    print("=" * 80)
    
    response = requests.get(f"{BASE_URL}/events/2/deltas")
    if response.status_code == 200:
        data = response.json()
        deltas = data.get('deltas', [])
        
        print(f"\n📊 Expectation Delta Analysis:")
        print(f"{'Metric':<25} {'Expected':<12} {'Actual':<12} {'Result':<10} {'Score'}")
        print("-" * 75)
        
        for delta in deltas:
            metric = delta['metric']
            expected = delta['expected']
            actual = delta['actual']
            result_class = delta['delta']['class'].upper()
            score = delta['delta']['score']
            
            # Color code by class
            emoji = "✅" if result_class == "BEAT" else "⚠️" if result_class == "INLINE" else "❌"
            
            print(f"{metric:<25} {expected:<12.2f} {actual:<12.2f} {emoji} {result_class:<8} {score:.2f}")
        
        # Summary
        beats = sum(1 for d in deltas if d['delta']['class'] == 'beat')
        inlines = sum(1 for d in deltas if d['delta']['class'] == 'inline')
        misses = sum(1 for d in deltas if d['delta']['class'] == 'miss')
        
        print(f"\n📈 Summary: {beats} beats, {inlines} inline, {misses} misses")
        
        pretty_print(data, "Full Response")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")


def example_3_peer_analysis():
    """Example 3: Peer analysis (Intellia MAGNITUDE safety event)"""
    print("\n" + "=" * 80)
    print("  EXAMPLE 3: Peer Analysis - Intellia MAGNITUDE Safety Event")
    print("=" * 80)
    
    response = requests.get(f"{BASE_URL}/events/3/peers")
    if response.status_code == 200:
        data = response.json()
        peers = data.get('peers', [])
        peer_metrics = data.get('peer_metrics', [])
        
        print(f"\n🔗 Peer Companies:")
        print(f"{'Ticker':<10} {'Name':<25} {'Reason':<30} {'Weight':<8} {'Moat Axes'}")
        print("-" * 100)
        
        for peer in peers:
            ticker = peer['ticker']
            name = peer.get('name', 'N/A')
            reason = peer['reason_tag']
            weight = peer['weight']
            axes = ', '.join(peer.get('moat_axes', []))
            
            print(f"{ticker:<10} {name:<25} {reason:<30} {weight:<8.2f} {axes}")
        
        if peer_metrics:
            print(f"\n📊 Comparative Metrics:")
            for pm in peer_metrics:
                print(f"  • {pm['metric']}:")
                print(f"    - Primary: {pm['value']:.1f}")
                print(f"    - Peer Median: {pm['peer_median']:.1f}")
                print(f"    - Delta: {pm['delta_to_median']:+.1f}")
        
        pretty_print(data, "Full Response")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")


def example_4_market_reactions():
    """Example 4: Market reactions with IV data"""
    print("\n" + "=" * 80)
    print("  EXAMPLE 4: Market Reactions - Multiple Windows")
    print("=" * 80)
    
    # Try event 2 (BridgeBio) which has volume data
    response = requests.get(f"{BASE_URL}/events/2/reactions")
    if response.status_code == 200:
        data = response.json()
        price = data.get('price', [])
        iv = data.get('iv', [])
        volume = data.get('volume', [])
        
        print(f"\n📈 Price Reactions:")
        print(f"{'Window':<10} {'Ticker':<10} {'Abs Return':<15} {'vs XBI':<15}")
        print("-" * 50)
        
        for react in price:
            window = react['window']
            ticker = react['ticker']
            abs_ret = react['abs_return']
            rel_xbi = react.get('rel_vs_xbi', 0)
            
            print(f"{window:<10} {ticker:<10} {abs_ret:>+12.1f}%   {rel_xbi:>+12.1f}%")
        
        if iv:
            print(f"\n📊 Implied Volatility:")
            for iv_data in iv:
                print(f"  • {iv_data['tenor']} tenor: {iv_data['iv']:.1f}% "
                      f"(Z-score: {iv_data['zscore_vs_1y']:+.1f})")
        
        if volume:
            print(f"\n📦 Volume Multiples:")
            for vol_data in volume:
                print(f"  • {vol_data['window']}: "
                      f"{vol_data['volume_multiple_vs_30d']:.1f}x avg 30d")
        
        pretty_print(data, "Full Response")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")


def example_5_calendar_view():
    """Example 5: Calendar view of all catalysts"""
    print("\n" + "=" * 80)
    print("  EXAMPLE 5: Catalyst Calendar View")
    print("=" * 80)
    
    response = requests.get(f"{BASE_URL}/calendar")
    if response.status_code == 200:
        data = response.json()
        events = data.get('events', [])
        
        print(f"\n📅 Upcoming Catalysts ({len(events)} total):")
        print(f"{'Date':<12} {'Company':<20} {'Event':<40} {'Impact'}")
        print("-" * 90)
        
        for event in events[:10]:  # Show first 10
            date = event.get('date', 'TBD')[:10] if event.get('date') else 'TBD'
            company = event.get('company', 'N/A')[:18]
            event_name = (event.get('name') or event.get('title', 'N/A'))[:38]
            impact = event.get('impact', 'N/A')
            
            print(f"{date:<12} {company:<20} {event_name:<40} {impact}")
        
        # Show monthly summary
        months = data.get('months', {})
        if months:
            print(f"\n📊 Monthly Summary:")
            for month, month_events in sorted(months.items()):
                print(f"  • {month}: {len(month_events)} events")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")


def main():
    """Run all examples"""
    print("\n" + "=" * 80)
    print("  CATALYST EVENT SYSTEM - API USAGE EXAMPLES")
    print("=" * 80)
    print("\n⚠️  Make sure the FastAPI server is running:")
    print("   poetry run uvicorn bt_platform.core.app:app --reload --port 8000")
    print("\n" + "=" * 80)
    
    try:
        # Check if server is running
        response = requests.get(f"{BASE_URL}/calendar", timeout=2)
        response.raise_for_status()
        
        # Run examples
        example_1_full_event()
        input("\n\nPress Enter to continue to Example 2...")
        
        example_2_expectation_deltas()
        input("\n\nPress Enter to continue to Example 3...")
        
        example_3_peer_analysis()
        input("\n\nPress Enter to continue to Example 4...")
        
        example_4_market_reactions()
        input("\n\nPress Enter to continue to Example 5...")
        
        example_5_calendar_view()
        
        print("\n" + "=" * 80)
        print("  ✅ All examples completed successfully!")
        print("=" * 80)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to the API server.")
        print("   Please start the server with:")
        print("   poetry run uvicorn bt_platform.core.app:app --reload --port 8000")
        print("\n" + "=" * 80)
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        print("=" * 80)


if __name__ == "__main__":
    main()
