#!/usr/bin/env python3
"""
Catalyst Prediction Demo

Demonstrates the catalyst prediction engine capabilities.
"""

from datetime import datetime, timedelta
from bt_platform.core.prediction import (
    predict_catalyst_timing,
    predict_catalyst_outcome,
    calculate_momentum_score,
)


def demo_timing_prediction():
    """Demonstrate timing prediction."""
    print("=" * 80)
    print("TIMING PREDICTION DEMO")
    print("=" * 80)
    
    # Example: Phase 3 oncology trial
    result = predict_catalyst_timing(
        catalyst_type="Phase 3 Readout",
        phase="Phase 3",
        indication="Oncology",
        last_milestone_date=datetime(2024, 1, 1),
    )
    
    print("\n📅 Predicting Phase 3 Oncology Trial Readout")
    print(f"   Last Milestone: 2024-01-01")
    print(f"   Predicted Date: {result['predicted_date'][:10]}")
    print(f"   Confidence: {result['confidence_score'] * 100:.0f}%")
    print(f"   Range: {result['early_date'][:10]} to {result['late_date'][:10]}")
    print("\n   Quarterly Probabilities:")
    for quarter, prob in result['probability_by_quarter'].items():
        bar = "█" * int(prob * 50)
        print(f"     {quarter}: {bar} {prob:.1%}")
    
    # Example: PDUFA date (more predictable)
    pdufa_result = predict_catalyst_timing(
        catalyst_type="PDUFA",
        last_milestone_date=datetime.now(),
    )
    
    print("\n📅 Predicting PDUFA Date")
    print(f"   Predicted Date: {pdufa_result['predicted_date'][:10]}")
    print(f"   Confidence: {pdufa_result['confidence_score'] * 100:.0f}%")
    print(f"   Range: ±{pdufa_result['confidence_interval_days']} days")


def demo_outcome_prediction():
    """Demonstrate outcome prediction."""
    print("\n" + "=" * 80)
    print("OUTCOME PREDICTION DEMO")
    print("=" * 80)
    
    # Baseline prediction
    print("\n🎯 Baseline Phase 3 Oncology Trial")
    baseline = predict_catalyst_outcome(
        catalyst_type="Phase 3 Readout",
        phase="Phase 3",
        indication="Oncology",
    )
    
    print(f"   Success Probability: {baseline['probability_of_success']:.1%}")
    print(f"   Confidence Interval: {baseline['confidence_interval']['lower']:.1%} - {baseline['confidence_interval']['upper']:.1%}")
    print(f"   Prior (Industry Base Rate): {baseline['prior_probability']:.1%}")
    
    # With positive evidence
    print("\n🎯 Phase 3 Trial with Positive Evidence")
    enhanced = predict_catalyst_outcome(
        catalyst_type="Phase 3 Readout",
        phase="Phase 3",
        indication="Oncology",
        prior_phase_outcomes=["success", "success"],
        trial_design_factors={
            "biomarker_enrichment": True,
            "hard_endpoint": True,
            "trial_size": 600,
        },
    )
    
    print(f"   Success Probability: {enhanced['probability_of_success']:.1%}")
    print(f"   Boost vs Baseline: +{(enhanced['probability_of_success'] - baseline['probability_of_success']) * 100:.1f}%")
    print("\n   Evidence Factors:")
    for factor in enhanced['evidence_factors']:
        print(f"     • {factor['factor']}: {factor['impact']}")
        print(f"       → {factor['rationale']}")
    
    # Rare disease (higher success rate)
    print("\n🎯 Phase 3 Rare Disease Trial")
    rare = predict_catalyst_outcome(
        catalyst_type="Phase 3 Readout",
        phase="Phase 3",
        indication="Rare Disease",
    )
    
    print(f"   Success Probability: {rare['probability_of_success']:.1%}")
    print(f"   vs Oncology Baseline: +{(rare['probability_of_success'] - baseline['probability_of_success']) * 100:.1f}%")


def demo_momentum_scoring():
    """Demonstrate momentum scoring."""
    print("\n" + "=" * 80)
    print("MOMENTUM SCORING DEMO")
    print("=" * 80)
    
    # Company with positive momentum
    print("\n📈 Company A: Strong Positive Momentum")
    catalysts_a = [
        {"date": (datetime.now() - timedelta(days=30)).isoformat(), "outcome": "success"},
        {"date": (datetime.now() - timedelta(days=60)).isoformat(), "outcome": "success"},
        {"date": (datetime.now() - timedelta(days=90)).isoformat(), "outcome": "success"},
        {"date": (datetime.now() - timedelta(days=120)).isoformat(), "outcome": "success"},
    ]
    
    momentum_a = calculate_momentum_score(catalysts_a, lookback_months=6)
    
    print(f"   Overall Score: {momentum_a['overall_score']:.1f}/100")
    print(f"   Trend: {momentum_a['trend'].upper()}")
    print(f"   Success Rate: {momentum_a['success_rate']:.1%}")
    print(f"   Win Streak: {momentum_a['key_metrics']['streak']} consecutive wins")
    print(f"   Cadence: {momentum_a['key_metrics']['cadence']:.2f} catalysts/month")
    
    # Company with negative momentum
    print("\n📉 Company B: Negative Momentum")
    catalysts_b = [
        {"date": (datetime.now() - timedelta(days=30)).isoformat(), "outcome": "failure"},
        {"date": (datetime.now() - timedelta(days=60)).isoformat(), "outcome": "failure"},
        {"date": (datetime.now() - timedelta(days=90)).isoformat(), "outcome": "success"},
    ]
    
    momentum_b = calculate_momentum_score(catalysts_b, lookback_months=6)
    
    print(f"   Overall Score: {momentum_b['overall_score']:.1f}/100")
    print(f"   Trend: {momentum_b['trend'].upper()}")
    print(f"   Success Rate: {momentum_b['success_rate']:.1%}")
    print(f"   Current Streak: {abs(momentum_b['key_metrics']['streak'])} consecutive failures")
    
    # Therapeutic area comparison
    print("\n🔬 Therapeutic Area Momentum Comparison")
    from bt_platform.core.prediction.momentum_scorer import calculate_therapeutic_area_momentum
    
    catalysts_by_area = {
        "Oncology": [
            {"date": (datetime.now() - timedelta(days=30)).isoformat(), "outcome": "success"},
            {"date": (datetime.now() - timedelta(days=60)).isoformat(), "outcome": "success"},
            {"date": (datetime.now() - timedelta(days=90)).isoformat(), "outcome": "success"},
        ],
        "Rare Disease": [
            {"date": (datetime.now() - timedelta(days=30)).isoformat(), "outcome": "success"},
            {"date": (datetime.now() - timedelta(days=60)).isoformat(), "outcome": "failure"},
        ],
        "Neurology": [
            {"date": (datetime.now() - timedelta(days=30)).isoformat(), "outcome": "failure"},
            {"date": (datetime.now() - timedelta(days=60)).isoformat(), "outcome": "failure"},
        ],
    }
    
    area_momentum = calculate_therapeutic_area_momentum(catalysts_by_area)
    
    for area, data in sorted(area_momentum.items(), key=lambda x: x[1]['rank']):
        print(f"\n   #{data['rank']} {area}")
        print(f"      Score: {data['overall_score']:.1f}/100")
        print(f"      Success Rate: {data['success_rate']:.1%}")
        print(f"      Trend: {data['trend']}")


def main():
    """Run all demos."""
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 20 + "CATALYST PREDICTION ENGINE DEMO" + " " * 25 + "║")
    print("╚" + "═" * 78 + "╝")
    
    demo_timing_prediction()
    demo_outcome_prediction()
    demo_momentum_scoring()
    
    print("\n" + "=" * 80)
    print("DEMO COMPLETE")
    print("=" * 80)
    print("\nℹ️  API Endpoints:")
    print("   • GET /api/v1/predictions/predict/timing/{catalyst_id}")
    print("   • GET /api/v1/predictions/predict/outcome/{catalyst_id}")
    print("   • GET /api/v1/predictions/momentum/company/{company_name}")
    print("   • GET /api/v1/predictions/momentum/therapeutic-areas")
    print("\n📖 Documentation: docs/CATALYST_PREDICTION.md\n")


if __name__ == "__main__":
    main()
