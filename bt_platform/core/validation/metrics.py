"""
Performance and calibration metrics for MVM Alpha Scoring.

Implements probability quality metrics, return quality metrics, and statistical tests.
"""

from __future__ import annotations

import numpy as np
from scipy import stats


def brier_score(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """
    Calculate Brier score (mean squared error of probability predictions).

    Lower is better. Perfect score = 0.0.

    Args:
        y_true: Binary outcomes (0 or 1)
        y_prob: Predicted probabilities [0, 1]

    Returns:
        Brier score
    """
    return float(np.mean((y_true - y_prob) ** 2))


def log_loss(y_true: np.ndarray, y_prob: np.ndarray, eps: float = 1e-15) -> float:
    """
    Calculate log loss (cross-entropy loss).

    Lower is better. Perfect score = 0.0.

    Args:
        y_true: Binary outcomes (0 or 1)
        y_prob: Predicted probabilities [0, 1]
        eps: Small epsilon to avoid log(0)

    Returns:
        Log loss
    """
    # Clip probabilities to avoid log(0)
    y_prob = np.clip(y_prob, eps, 1 - eps)
    return -float(np.mean(y_true * np.log(y_prob) + (1 - y_true) * np.log(1 - y_prob)))


def expected_calibration_error(
    y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10
) -> float:
    """
    Calculate Expected Calibration Error (ECE).

    Measures how well predicted probabilities match empirical frequencies.
    Lower is better. Perfect score = 0.0.

    Args:
        y_true: Binary outcomes (0 or 1)
        y_prob: Predicted probabilities [0, 1]
        n_bins: Number of bins for calibration

    Returns:
        Expected calibration error
    """
    # Create bins
    bins = np.linspace(0, 1, n_bins + 1)
    bin_indices = np.digitize(y_prob, bins) - 1
    bin_indices = np.clip(bin_indices, 0, n_bins - 1)

    ece = 0.0
    total_samples = len(y_true)

    for bin_idx in range(n_bins):
        mask = bin_indices == bin_idx
        if not np.any(mask):
            continue

        bin_probs = y_prob[mask]
        bin_true = y_true[mask]

        # Mean predicted probability in bin
        avg_pred_prob = np.mean(bin_probs)

        # Empirical frequency in bin
        empirical_freq = np.mean(bin_true)

        # Weighted contribution to ECE
        bin_weight = len(bin_true) / total_samples
        ece += bin_weight * abs(avg_pred_prob - empirical_freq)

    return float(ece)


def calculate_deflated_sharpe(
    returns: np.ndarray,
    n_trials: int = 1,
    skewness: float | None = None,
    kurtosis: float | None = None,
) -> dict[str, float]:
    """
    Calculate Deflated Sharpe Ratio (DSR) to account for multiple testing.

    From Bailey & López de Prado (2014) "The Deflated Sharpe Ratio".

    Args:
        returns: Array of portfolio returns
        n_trials: Number of strategy trials/variants tested
        skewness: Optional skewness of returns (calculated if None)
        kurtosis: Optional excess kurtosis of returns (calculated if None)

    Returns:
        Dict with sharpe_ratio, deflated_sharpe, and p_value
    """
    # Calculate Sharpe ratio
    mean_return = np.mean(returns)
    std_return = np.std(returns, ddof=1)
    sharpe = mean_return / std_return if std_return > 0 else 0.0

    # Annualize (assuming daily returns)
    sharpe_annual = sharpe * np.sqrt(252)

    # Calculate skewness and kurtosis if not provided
    if skewness is None:
        skewness = stats.skew(returns)
    if kurtosis is None:
        kurtosis = stats.kurtosis(returns, fisher=True)  # Excess kurtosis

    # Calculate variance of Sharpe ratio
    n = len(returns)
    var_sharpe = (1 + 0.5 * sharpe**2 - skewness * sharpe + (kurtosis - 1) / 4 * sharpe**2) / n

    # Deflated Sharpe Ratio
    # Account for multiple trials
    if n_trials > 1:
        # Expected maximum Sharpe under null (Euler-Mascheroni constant)
        expected_max_sharpe = (1 - np.euler_gamma) * stats.norm.ppf(1 - 1 / n_trials) + (
            np.euler_gamma * stats.norm.ppf(1 - 1 / (n_trials * np.e))
        )

        # Deflated Sharpe
        deflated_sharpe = (sharpe_annual - expected_max_sharpe) / np.sqrt(var_sharpe * 252)

        # P-value
        p_value = stats.norm.cdf(deflated_sharpe)
    else:
        deflated_sharpe = sharpe_annual / np.sqrt(var_sharpe * 252)
        p_value = 1 - stats.norm.cdf(sharpe_annual / np.sqrt(var_sharpe * 252))

    return {
        "sharpe_ratio": float(sharpe_annual),
        "deflated_sharpe": float(deflated_sharpe),
        "p_value": float(p_value),
        "n_trials": n_trials,
        "n_observations": n,
    }


def calculate_information_coefficient(
    predictions: np.ndarray, actuals: np.ndarray, method: str = "spearman"
) -> float:
    """
    Calculate Information Coefficient (IC).

    Measures rank correlation between predictions and actual outcomes.

    Args:
        predictions: Predicted values
        actuals: Actual values
        method: 'spearman' or 'pearson'

    Returns:
        Information coefficient
    """
    if method == "spearman":
        ic, _ = stats.spearmanr(predictions, actuals)
    elif method == "pearson":
        ic, _ = stats.pearsonr(predictions, actuals)
    else:
        raise ValueError(f"Unknown method: {method}")

    return float(ic) if not np.isnan(ic) else 0.0


def calculate_sortino_ratio(returns: np.ndarray, target_return: float = 0.0) -> float:
    """
    Calculate Sortino ratio (downside deviation adjusted return).

    Args:
        returns: Array of returns
        target_return: Target return (default 0)

    Returns:
        Sortino ratio (annualized)
    """
    mean_return = np.mean(returns)
    downside_returns = returns[returns < target_return]

    if len(downside_returns) == 0:
        return float("inf")

    downside_std = np.std(downside_returns, ddof=1)

    if downside_std == 0:
        return float("inf")

    sortino = (mean_return - target_return) / downside_std
    return float(sortino * np.sqrt(252))  # Annualize


def calculate_max_drawdown(cumulative_returns: np.ndarray) -> dict[str, float]:
    """
    Calculate maximum drawdown from cumulative returns.

    Args:
        cumulative_returns: Cumulative return series

    Returns:
        Dict with max_drawdown (as fraction), peak_idx, trough_idx
    """
    # Calculate running maximum
    running_max = np.maximum.accumulate(cumulative_returns)

    # Calculate drawdown
    drawdown = (cumulative_returns - running_max) / running_max

    # Find maximum drawdown
    max_dd = np.min(drawdown)
    trough_idx = int(np.argmin(drawdown))

    # Find peak before trough
    peak_idx = int(np.argmax(cumulative_returns[:trough_idx + 1])) if trough_idx > 0 else 0

    return {
        "max_drawdown": float(max_dd),
        "peak_idx": peak_idx,
        "trough_idx": trough_idx,
    }


def calculate_calmar_ratio(returns: np.ndarray) -> float:
    """
    Calculate Calmar ratio (annualized return / max drawdown).

    Args:
        returns: Array of returns

    Returns:
        Calmar ratio
    """
    cumulative = np.cumprod(1 + returns)
    max_dd_info = calculate_max_drawdown(cumulative)
    max_dd = abs(max_dd_info["max_drawdown"])

    if max_dd == 0:
        return float("inf")

    annual_return = np.mean(returns) * 252
    return float(annual_return / max_dd)
