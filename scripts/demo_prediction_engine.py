#!/usr/bin/env python3
"""
Prediction Engine Demo

Quick demonstration of the enhanced prediction engine capabilities.
Shows timing, outcome, and momentum predictions for catalyst events.
"""

import sys
import os
from datetime import datetime, timedelta, date
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from bt_platform.core.prediction.timing_predictor import predict_quarterly_distribution
from bt_platform.core.prediction.outcome_predictor import predict_outcome_bayesian
from bt_platform.core.prediction.momentum_scorer import score_company_advanced


def print_section(title):
    """Print a formatted section header."""
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print(f"{'=' * 70}\n")


def demo_timing_prediction():
    """Demonstrate Weibull-based timing prediction."""
    print_section("TIMING PREDICTION - Weibull Quarterly Distribution")
    
    # Example 1: PDUFA date (known date)
    print("Example 1: PDUFA Date (High Confidence)")
    print("-" * 70)
    pdufa_date = date.today() + timedelta(days=75)
    
    timing = predict_quarterly_distribution(
        catalyst_type="PDUFA",
        phase="FDA",
        pdufa_date=pdufa_date,
    )
    
    print(f"PDUFA Date: {pdufa_date}")
    print(f"Confidence: {timing['confidence']:.1%}")
    print(f"Reference: {timing['reference']}")
    print("\nQuarterly Probabilities:")
    for i, ((start, end), prob) in enumerate(zip(timing['bins'], timing['quarterly_probabilities']), 1):
        print(f"  Q{i} ({start} to {end}): {prob:.1%}")
    
    # Example 2: Phase 3 trial readout (Weibull distribution)
    print("\n\nExample 2: Phase 3 Trial Readout (Weibull Model)")
    print("-" * 70)
    anchor_date = date.today() - timedelta(days=450)
    
    timing = predict_quarterly_distribution(
        catalyst_type="TRIAL_READOUT",
        phase="P3",
        anchor_date=anchor_date,
        therapeutic_area="Oncology",
    )
    
    print(f"Trial Started: {anchor_date}")
    print(f"Therapeutic Area: Oncology (0.9x adjustment)")
    print(f"Confidence: {timing['confidence']:.1%}")
    print(f"Reference: {timing['reference']}")
    print("\nQuarterly Probabilities:")
    for i, ((start, end), prob) in enumerate(zip(timing['bins'], timing['quarterly_probabilities']), 1):
        print(f"  Q{i} ({start} to {end}): {prob:.1%}")
    print(f"\nOutside 4Q Window: {timing['outside_window']:.1%}")


def demo_outcome_prediction():
    """Demonstrate Bayesian outcome prediction."""
    print_section("OUTCOME PREDICTION - Bayesian with Odds-Space Stacking")
    
    # Example 1: Baseline prediction
    print("Example 1: Baseline Phase 3 (No Evidence)")
    print("-" * 70)
    
    baseline = predict_outcome_bayesian(phase="P3")
    
    print(f"Prior Probability: {baseline['prior_probability']:.1%}")
    print(f"Probability of Success: {baseline['probability_of_success']:.1%}")
    print(f"Evidence Factors: {len(baseline['evidence_factors'])}")
    
    # Example 2: With positive evidence
    print("\n\nExample 2: Phase 3 with Positive Evidence")
    print("-" * 70)
    
    with_evidence = predict_outcome_bayesian(
        phase="P3",
        therapeutic_area="Rare Disease",
        prior_phase_success=True,
        biomarker_enrichment=True,
        hard_endpoints=True,
        large_trial=True,
    )
    
    print(f"Prior Probability: {with_evidence['prior_probability']:.1%}")
    print(f"Probability of Success: {with_evidence['probability_of_success']:.1%}")
    print(f"\nEvidence Factors Applied:")
    for factor in with_evidence['evidence_factors']:
        print(f"  - {factor['factor']}: {factor['impact']}")
        print(f"    ({factor['description']})")
    
    print(f"\nNet Uplift: +{(with_evidence['probability_of_success'] - baseline['probability_of_success']) * 100:.1f} percentage points")


def demo_momentum_scoring():
    """Demonstrate advanced momentum scoring."""
    print_section("MOMENTUM SCORING - Decay, Streaks, and TA Comparison")
    
    today = date.today()
    
    # Example 1: Strong positive momentum
    print("Example 1: Company with Strong Positive Momentum")
    print("-" * 70)
    
    positive_events = [
        (today - timedelta(days=15), 1, 1.0),   # Recent win
        (today - timedelta(days=35), 1, 1.0),   # Win
        (today - timedelta(days=60), 1, 1.5),   # Important win
        (today - timedelta(days=90), 1, 1.0),   # Win
        (today - timedelta(days=200), -1, 1.0), # Old loss (decayed)
    ]
    
    momentum = score_company_advanced(positive_events, ta_events_map=None)
    
    print(f"Momentum Score: {momentum['momentum_score']:.1f}/100")
    print(f"Event Count: {momentum['event_count']}")
    print("\nComponent Breakdown:")
    print(f"  Base (recency-weighted): {momentum['components']['base']:.3f}")
    print(f"  Streak bonus: {momentum['components']['streak']:.3f}")
    print(f"  TA z-score: {momentum['components']['ta_z']:.3f}")
    
    # Example 2: Negative momentum
    print("\n\nExample 2: Company with Negative Momentum")
    print("-" * 70)
    
    negative_events = [
        (today - timedelta(days=10), -1, 1.0),  # Recent loss
        (today - timedelta(days=25), -1, 1.0),  # Loss
        (today - timedelta(days=45), -1, 1.5),  # Important loss
    ]
    
    momentum = score_company_advanced(negative_events, ta_events_map=None)
    
    print(f"Momentum Score: {momentum['momentum_score']:.1f}/100")
    print(f"Event Count: {momentum['event_count']}")
    print("\nComponent Breakdown:")
    print(f"  Base (recency-weighted): {momentum['components']['base']:.3f}")
    print(f"  Streak penalty: {momentum['components']['streak']:.3f}")
    print(f"  TA z-score: {momentum['components']['ta_z']:.3f}")
    
    # Example 3: With TA comparison
    print("\n\nExample 3: Company vs Therapeutic Area Peers")
    print("-" * 70)
    
    company_events = [
        (today - timedelta(days=20), 1, 1.0),
        (today - timedelta(days=40), 1, 1.0),
    ]
    
    ta_events_map = {
        "Oncology": [
            (today - timedelta(days=15), -1, 1.0),
            (today - timedelta(days=30), -1, 1.0),
            (today - timedelta(days=50), -1, 1.0),
        ],
        "Cardiology": [
            (today - timedelta(days=25), -1, 1.0),
            (today - timedelta(days=60), 1, 1.0),
        ],
    }
    
    momentum = score_company_advanced(company_events, ta_events_map)
    
    print(f"Momentum Score: {momentum['momentum_score']:.1f}/100")
    print(f"Event Count: {momentum['event_count']}")
    print("\nComponent Breakdown:")
    print(f"  Base (recency-weighted): {momentum['components']['base']:.3f}")
    print(f"  Streak bonus: {momentum['components']['streak']:.3f}")
    print(f"  TA z-score: {momentum['components']['ta_z']:.3f}")
    print("\n  → Positive z-score indicates company outperforming peers")


def demo_integration():
    """Demonstrate end-to-end integration."""
    print_section("INTEGRATION EXAMPLE - Complete Catalyst Analysis")
    
    print("Catalyst: Tectonic Therapeutic - TX23 Phase 3 Readout")
    print("-" * 70)
    
    today = date.today()
    
    # Timing prediction
    timing = predict_quarterly_distribution(
        catalyst_type="TRIAL_READOUT",
        phase="P3",
        anchor_date=today - timedelta(days=540),
        therapeutic_area="Cardiovascular",
    )
    
    # Outcome prediction
    outcome = predict_outcome_bayesian(
        phase="P3",
        therapeutic_area="Cardiovascular",
        prior_phase_success=True,
        biomarker_enrichment=True,
        hard_endpoints=True,
        large_trial=True,
    )
    
    # Momentum scoring
    company_events = [
        (today - timedelta(days=30), 1, 1.0),
        (today - timedelta(days=120), 1, 1.0),
        (today - timedelta(days=220), 1, 1.0),
    ]
    momentum = score_company_advanced(company_events, ta_events_map=None)
    
    # Display results
    print("\n📅 TIMING FORECAST")
    print(f"   Most Likely Quarter: Q{timing['quarterly_probabilities'].index(max(timing['quarterly_probabilities'])) + 1}")
    print(f"   Confidence: {timing['confidence']:.1%}")
    
    print("\n🎯 SUCCESS PROBABILITY")
    print(f"   Probability: {outcome['probability_of_success']:.1%}")
    print(f"   Prior: {outcome['prior_probability']:.1%}")
    print(f"   Evidence Factors: {len(outcome['evidence_factors'])}")
    
    print("\n📈 MOMENTUM SCORE")
    print(f"   Score: {momentum['momentum_score']:.1f}/100")
    print(f"   Recent Events: {momentum['event_count']}")
    
    print("\n💡 INVESTMENT THESIS")
    if outcome['probability_of_success'] > 0.6 and momentum['momentum_score'] > 60:
        print("   ✅ POSITIVE: High success probability + strong momentum")
    elif outcome['probability_of_success'] > 0.5 or momentum['momentum_score'] > 55:
        print("   ⚠️  NEUTRAL: Moderate indicators, monitor closely")
    else:
        print("   ❌ NEGATIVE: Lower success probability and/or weak momentum")


def main():
    """Run all demos."""
    print("\n" + "=" * 70)
    print("  PREDICTION ENGINE DEMONSTRATION")
    print("  Enhanced Biotech Catalyst Predictions")
    print("=" * 70)
    
    demo_timing_prediction()
    demo_outcome_prediction()
    demo_momentum_scoring()
    demo_integration()
    
    print("\n" + "=" * 70)
    print("  Demo Complete!")
    print("=" * 70)
    print("\nTo use in your code:")
    print("  from bt_platform.core.prediction import (")
    print("      predict_quarterly_distribution,")
    print("      predict_outcome_bayesian,")
    print("      score_company_advanced,")
    print("  )")
    print()


if __name__ == "__main__":
    main()
