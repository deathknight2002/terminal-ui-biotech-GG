"""
Backtest and Calibration Utilities

Tools for backtesting prediction models and calibrating parameters using
historical data. Uses only stdlib to maintain no-dependency philosophy.

This module helps tune:
- Weibull shape/scale parameters per phase/TA
- Evidence impact weights in outcome prediction
- Momentum decay rates and streak weights
"""

import json
from datetime import datetime, timedelta, date
from typing import List, Dict, Tuple, Optional
from collections import defaultdict

# Import prediction functions
from .timing_predictor import weibull_cdf, predict_quarterly_distribution
from .outcome_predictor import predict_outcome_bayesian
from .momentum_scorer import score_company_advanced


def fit_weibull_moments(durations: List[float]) -> Tuple[float, float]:
    """
    Fit Weibull parameters using method of moments (stdlib only).
    
    Args:
        durations: List of observed durations in days
        
    Returns:
        (shape_k, scale_lambda) parameters
    """
    if not durations:
        return (1.5, 365.0)  # Default fallback
    
    n = len(durations)
    mean_dur = sum(durations) / n
    
    # Variance calculation
    variance = sum((d - mean_dur) ** 2 for d in durations) / n
    std_dev = variance ** 0.5
    
    # Coefficient of variation
    cv = std_dev / mean_dur if mean_dur > 0 else 1.0
    
    # Approximate shape parameter from CV
    # For Weibull: CV ≈ sqrt(Γ(1+2/k)/Γ(1+1/k)^2 - 1)
    # Rough approximation: k ≈ 1/cv for cv near 1
    if cv < 0.3:
        k = 3.5
    elif cv < 0.5:
        k = 2.5
    elif cv < 0.8:
        k = 1.8
    elif cv < 1.2:
        k = 1.4
    else:
        k = 1.0
    
    # Scale parameter from mean
    # For Weibull: mean ≈ λ * Γ(1 + 1/k)
    # Rough approximation: λ ≈ mean / 0.9 for k around 1.5
    gamma_approx = 0.88 if k > 2 else 0.90 if k > 1.5 else 0.93
    lam = mean_dur / gamma_approx
    
    return (k, lam)


def calibrate_weibull_by_phase(
    historical_catalysts: List[Dict],
    phase_filter: Optional[str] = None,
) -> Dict[str, Tuple[float, float]]:
    """
    Calibrate Weibull parameters from historical catalyst durations.
    
    Args:
        historical_catalysts: List of catalyst dicts with 'phase', 'start_date', 'end_date'
        phase_filter: Optional phase to filter to (e.g., "P3")
        
    Returns:
        Dict mapping phase -> (shape_k, scale_lambda)
    """
    # Group durations by phase
    phase_durations = defaultdict(list)
    
    for cat in historical_catalysts:
        phase = cat.get("phase")
        start = cat.get("start_date")
        end = cat.get("end_date")
        
        if not (phase and start and end):
            continue
        
        if phase_filter and phase != phase_filter:
            continue
        
        # Calculate duration in days
        if isinstance(start, str):
            start = datetime.fromisoformat(start.replace("Z", ""))
        if isinstance(end, str):
            end = datetime.fromisoformat(end.replace("Z", ""))
        
        duration = (end - start).days
        if duration > 0:  # Valid duration
            phase_durations[phase].append(duration)
    
    # Fit Weibull for each phase
    calibrated_params = {}
    for phase, durations in phase_durations.items():
        if len(durations) >= 3:  # Need minimum samples
            k, lam = fit_weibull_moments(durations)
            calibrated_params[phase] = (k, lam)
            print(f"Phase {phase}: k={k:.2f}, λ={lam:.0f} (n={len(durations)})")
    
    return calibrated_params


def calculate_reliability_curve(
    predictions: List[Dict],
    outcomes: List[bool],
    n_bins: int = 10,
) -> Dict:
    """
    Calculate reliability (calibration) curve for outcome predictions.
    
    Args:
        predictions: List of prediction dicts with 'probability_of_success'
        outcomes: List of actual outcomes (True=success, False=failure)
        n_bins: Number of probability bins
        
    Returns:
        Dict with bin midpoints, observed frequencies, and calibration score
    """
    if len(predictions) != len(outcomes):
        raise ValueError("Predictions and outcomes must have same length")
    
    # Bin predictions
    bins = defaultdict(list)
    bin_size = 1.0 / n_bins
    
    for pred, outcome in zip(predictions, outcomes):
        prob = pred.get("probability_of_success", 0.5)
        bin_idx = min(n_bins - 1, int(prob / bin_size))
        bins[bin_idx].append(1 if outcome else 0)
    
    # Calculate observed frequency per bin
    calibration_data = []
    total_squared_error = 0.0
    total_count = 0
    
    for i in range(n_bins):
        bin_mid = (i + 0.5) * bin_size
        
        if i in bins and bins[i]:
            observed = sum(bins[i]) / len(bins[i])
            count = len(bins[i])
            
            # Calibration error (squared)
            error = (observed - bin_mid) ** 2
            total_squared_error += error * count
            total_count += count
            
            calibration_data.append({
                "predicted_prob": round(bin_mid, 3),
                "observed_freq": round(observed, 3),
                "count": count,
            })
    
    # Brier score (mean squared error)
    brier_score = total_squared_error / total_count if total_count > 0 else 0.0
    
    return {
        "calibration_curve": calibration_data,
        "brier_score": round(brier_score, 4),
        "n_predictions": total_count,
    }


def backtest_momentum_scoring(
    company_history: List[Dict],
    forward_window_days: int = 90,
) -> Dict:
    """
    Backtest momentum scoring by rolling forward and checking predictive power.
    
    Args:
        company_history: List of catalyst events with 'date', 'outcome', 'weight'
        forward_window_days: Days forward to check for positive outcomes
        
    Returns:
        Dict with backtest results and correlation stats
    """
    if len(company_history) < 5:
        return {"error": "Insufficient history for backtest"}
    
    # Sort by date
    history = sorted(company_history, key=lambda x: x["date"])
    
    scores = []
    future_outcomes = []
    
    # Roll forward through history
    for i in range(len(history) - 2):
        # Score momentum at this point in time
        lookback_events = history[:i+1]
        
        # Convert to format expected by scorer
        events = [
            (e["date"], e.get("polarity", 1), e.get("weight", 1.0))
            for e in lookback_events
        ]
        
        score_result = score_company_advanced(events, ta_events_map=None)
        scores.append(score_result["momentum_score"])
        
        # Look forward to see if positive outcomes occurred
        forward_date = history[i]["date"] + timedelta(days=forward_window_days)
        future_events = [e for e in history[i+1:] if e["date"] <= forward_date]
        
        if future_events:
            positive_count = sum(1 for e in future_events if e.get("polarity", 1) > 0)
            future_outcomes.append(1 if positive_count > 0 else 0)
        else:
            future_outcomes.append(0)
    
    # Calculate correlation between momentum score and future success
    if len(scores) != len(future_outcomes):
        return {"error": "Score/outcome length mismatch"}
    
    # Simple correlation calculation (Pearson)
    n = len(scores)
    if n < 3:
        return {"error": "Insufficient data points"}
    
    mean_score = sum(scores) / n
    mean_outcome = sum(future_outcomes) / n
    
    cov = sum((scores[i] - mean_score) * (future_outcomes[i] - mean_outcome) for i in range(n)) / n
    var_score = sum((s - mean_score) ** 2 for s in scores) / n
    var_outcome = sum((o - mean_outcome) ** 2 for o in future_outcomes) / n
    
    correlation = cov / ((var_score * var_outcome) ** 0.5) if var_score > 0 and var_outcome > 0 else 0.0
    
    return {
        "correlation": round(correlation, 3),
        "n_datapoints": n,
        "mean_momentum_score": round(mean_score, 1),
        "future_success_rate": round(mean_outcome, 3),
    }


def run_calibration_suite(data_file: str) -> Dict:
    """
    Run full calibration suite on historical data.
    
    Args:
        data_file: Path to JSON file with historical catalyst data
        
    Returns:
        Dict with calibration results for all models
    """
    try:
        with open(data_file, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        return {"error": f"Data file not found: {data_file}"}
    
    results = {}
    
    # 1. Calibrate Weibull timing parameters
    if "catalysts" in data:
        print("\n=== Calibrating Weibull Timing Parameters ===")
        weibull_params = calibrate_weibull_by_phase(data["catalysts"])
        results["weibull_calibration"] = weibull_params
    
    # 2. Check outcome prediction calibration
    if "outcome_predictions" in data and "outcome_actuals" in data:
        print("\n=== Checking Outcome Prediction Calibration ===")
        reliability = calculate_reliability_curve(
            data["outcome_predictions"],
            data["outcome_actuals"],
        )
        results["outcome_calibration"] = reliability
        print(f"Brier Score: {reliability['brier_score']:.4f}")
    
    # 3. Backtest momentum scoring
    if "company_histories" in data:
        print("\n=== Backtesting Momentum Scoring ===")
        momentum_results = {}
        for company, history in data["company_histories"].items():
            bt_result = backtest_momentum_scoring(history)
            momentum_results[company] = bt_result
            print(f"{company}: correlation={bt_result.get('correlation', 'N/A')}")
        results["momentum_backtest"] = momentum_results
    
    return results


if __name__ == "__main__":
    """
    Example usage:
    
    python -m bt_platform.core.prediction.backtest_calibrate data/historical_catalysts.json
    """
    import sys
    
    if len(sys.argv) > 1:
        data_file = sys.argv[1]
        print(f"Running calibration suite on {data_file}...")
        results = run_calibration_suite(data_file)
        
        # Save results
        output_file = data_file.replace(".json", "_calibration_results.json")
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to {output_file}")
    else:
        print("Usage: python -m bt_platform.core.prediction.backtest_calibrate <data_file.json>")
        print("\nExpected data format:")
        print(json.dumps({
            "catalysts": [
                {"phase": "P3", "start_date": "2023-01-01", "end_date": "2024-06-01"}
            ],
            "outcome_predictions": [
                {"probability_of_success": 0.65}
            ],
            "outcome_actuals": [True],
            "company_histories": {
                "Company A": [
                    {"date": "2023-01-01", "polarity": 1, "weight": 1.0}
                ]
            }
        }, indent=2))
