#!/usr/bin/env python3
"""
TUI Demo Script

Demonstrates the Biotech Terminal TUI features for testing and screenshots.
"""

import asyncio
import sys
from textual.app import App
from textual.widgets import Static

# Import the TUI app components
from platform.tui.services import WatchlistManager, RecentAssetsTracker
from platform.tui.helpers import get_risk_metrics


def demo_services():
    """Demonstrate the service layer functionality."""
    print("=" * 60)
    print("BIOTECH TERMINAL TUI - DEMO")
    print("=" * 60)
    print()

    # Demo Watchlist Manager
    print("1. WATCHLIST MANAGER DEMO")
    print("-" * 60)
    watchlist = WatchlistManager()
    
    print("Adding assets to watchlist...")
    watchlist.add("BCRX-001")
    watchlist.add("SRPT-001")
    watchlist.add("BEAM-001")
    
    print(f"Current watchlist ({watchlist.count()} assets):")
    for asset in watchlist.get_all():
        print(f"  • {asset}")
    print()

    # Demo Recent Assets Tracker
    print("2. RECENT ASSETS TRACKER DEMO")
    print("-" * 60)
    tracker = RecentAssetsTracker()
    
    print("Viewing assets in sequence...")
    tracker.add("BCRX-001")
    tracker.add("NTLA-001")
    tracker.add("REGN-001")
    
    print(f"Recent assets (last {tracker.count()}):")
    for i, asset in enumerate(tracker.get_all(), 1):
        print(f"  {i}. {asset}")
    print()

    # Demo Risk Metrics
    print("3. RISK METRICS DEMO")
    print("-" * 60)
    
    test_assets = ["BCRX-001", "SRPT-001", "BEAM-001"]
    
    for asset_id in test_assets:
        metrics = get_risk_metrics(asset_id)
        if metrics:
            print(f"\n{asset_id}:")
            print(f"  Success Probability: {metrics.success_probability * 100:.1f}%")
            print(f"  Monthly Burn Rate:   ${metrics.monthly_burn_rate:.1f}M")
            print(f"  Runway:              {metrics.runway_months} months")
            print(f"  Risk Category:       {metrics.risk_category}")
    print()

    print("=" * 60)
    print("DEMO COMPLETE")
    print()
    print("To launch the full TUI, run:")
    print("  python3 -m platform.tui")
    print("=" * 60)


if __name__ == "__main__":
    demo_services()
