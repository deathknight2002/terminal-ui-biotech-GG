#!/usr/bin/env python3
"""
MVM Alpha API Demonstration Script

Demonstrates the MVM scoring API endpoints without requiring a full FastAPI server.
Shows example requests and responses for all endpoints.
"""

from pprint import pprint

# Import directly to avoid dependency issues
import sys
import importlib.util

# Load module directly
spec = importlib.util.spec_from_file_location(
    "mvm_alpha", "bt_platform/core/prediction/mvm_alpha.py"
)
mvm = importlib.util.module_from_spec(spec)
sys.modules["mvm_alpha"] = mvm
spec.loader.exec_module(mvm)


def demo_backtest_endpoint():
    """Demonstrate GET /api/v1/scores/mvm/backtest"""
    print("=" * 80)
    print("ENDPOINT: GET /api/v1/scores/mvm/backtest")
    print("=" * 80)
    print("\nDescription: Get backtest results on recent 2025 market-moving events\n")

    result = mvm.mini_backtest()

    print("Response:")
    print("-" * 80)
    pprint(result)
    print("\n")


def demo_upcoming_endpoint():
    """Demonstrate GET /api/v1/scores/mvm/upcoming"""
    print("=" * 80)
    print("ENDPOINT: GET /api/v1/scores/mvm/upcoming")
    print("=" * 80)
    print("\nDescription: Get MVM scores for upcoming catalyst events\n")

    events = mvm.upcoming_watchlist()
    predictions = mvm.score_events(events)
    result = {"predictions": predictions}

    print("Response:")
    print("-" * 80)
    pprint(result)
    print("\n")


def demo_score_single_endpoint():
    """Demonstrate POST /api/v1/scores/mvm/score"""
    print("=" * 80)
    print("ENDPOINT: POST /api/v1/scores/mvm/score")
    print("=" * 80)
    print("\nDescription: Score a custom catalyst event\n")

    # Example request body
    request = {
        "ticker": "ACME",
        "company": "Acme Biotech",
        "date": "2025-12-15",
        "event_type": "Phase3_readout",
        "note": "Phase 3 ACME-301 trial readout for novel cancer therapy",
        "cap_tier": "smid",
        "effect_ratio": 3.5,
        "attention": "press",
    }

    print("Request Body:")
    print("-" * 80)
    pprint(request)
    print()

    # Create catalyst event
    event = mvm.CatalystEvent(
        ticker=request["ticker"],
        company=request["company"],
        date=request["date"],
        event_type=request["event_type"],
        note=request["note"],
        cap_tier=request["cap_tier"],
        effect_ratio=request.get("effect_ratio"),
        attention=request.get("attention", "press"),
    )

    # Score the event
    result = mvm.score_events([event])[0]

    print("Response:")
    print("-" * 80)
    pprint(result)
    print("\n")


def demo_score_batch_endpoint():
    """Demonstrate POST /api/v1/scores/mvm/score-batch"""
    print("=" * 80)
    print("ENDPOINT: POST /api/v1/scores/mvm/score-batch")
    print("=" * 80)
    print("\nDescription: Score multiple catalyst events in batch\n")

    # Example request body
    request = {
        "events": [
            {
                "ticker": "BETA",
                "company": "Beta Pharma",
                "date": "2025-11-20",
                "event_type": "Phase2_readout",
                "note": "Phase 2 interim analysis",
                "cap_tier": "micro",
                "effect_ratio": 2.1,
                "attention": "press",
            },
            {
                "ticker": "GAMMA",
                "company": "Gamma Therapeutics",
                "date": "2025-12-01",
                "event_type": "CRL",
                "note": "Complete Response Letter expected",
                "cap_tier": "smid",
                "effect_ratio": None,
                "attention": "FDA_CR",
            },
        ]
    }

    print("Request Body:")
    print("-" * 80)
    print(f"Number of events: {len(request['events'])}")
    for i, evt in enumerate(request["events"], 1):
        print(f"\nEvent {i}:")
        pprint(evt)
    print()

    # Create catalyst events
    catalysts = [
        mvm.CatalystEvent(
            ticker=e["ticker"],
            company=e["company"],
            date=e["date"],
            event_type=e["event_type"],
            note=e["note"],
            cap_tier=e["cap_tier"],
            effect_ratio=e.get("effect_ratio"),
            attention=e.get("attention", "press"),
        )
        for e in request["events"]
    ]

    # Score all events
    predictions = mvm.score_events(catalysts)
    result = {"predictions": predictions}

    print("Response:")
    print("-" * 80)
    pprint(result)
    print("\n")


def demo_metrics_endpoint():
    """Demonstrate GET /api/v1/scores/mvm/metrics"""
    print("=" * 80)
    print("ENDPOINT: GET /api/v1/scores/mvm/metrics")
    print("=" * 80)
    print("\nDescription: Get MVM scoring methodology and performance metrics\n")

    backtest_results = mvm.mini_backtest()

    result = {
        "methodology": {
            "name": "Market-Moving (MVM) Score",
            "description": "Interpretable, monotone scoring for biotech catalyst events",
            "features": {
                "impact": {
                    "weight": 0.40,
                    "description": "Event type importance (Phase 3, CRL, Approval)",
                },
                "surprise": {
                    "weight": 0.30,
                    "description": "Effect size or event-type prior (PFS ratios, etc.)",
                },
                "attention": {
                    "weight": 0.15,
                    "description": "Visibility channel (ESMO, FDA, BTD viral)",
                },
                "asymmetry": {
                    "weight": 0.15,
                    "description": "Cap-tier potential (micro > smid > large)",
                },
            },
            "score_bands": {
                "high": {"range": "70-100", "stance": "Long gamma into event"},
                "medium": {
                    "range": "60-69",
                    "stance": "Directional with defined risk",
                },
                "low": {"range": "0-59", "stance": "Sell premium / fade IV"},
            },
        },
        "backtest_performance": backtest_results["metrics"],
        "backtest_date_range": "2025-08-21 to 2025-10-23",
        "n_events": 5,
    }

    print("Response:")
    print("-" * 80)
    pprint(result)
    print("\n")


def main():
    """Run all demonstrations"""
    print("\n" + "=" * 80)
    print("MVM ALPHA SCORING API DEMONSTRATION")
    print("=" * 80)
    print("\nThis script demonstrates all MVM scoring API endpoints")
    print("without requiring a full FastAPI server.\n")

    try:
        demo_backtest_endpoint()
        demo_upcoming_endpoint()
        demo_score_single_endpoint()
        demo_score_batch_endpoint()
        demo_metrics_endpoint()

        print("=" * 80)
        print("✅ ALL ENDPOINTS DEMONSTRATED SUCCESSFULLY")
        print("=" * 80)
        print("\nTo use these endpoints in production:")
        print("1. Start the FastAPI server: poetry run uvicorn bt_platform.core.app:app")
        print("2. Access endpoints at: http://localhost:8000/api/v1/scores/mvm/...")
        print("3. View interactive docs at: http://localhost:8000/docs")
        print("\n")

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback

        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
