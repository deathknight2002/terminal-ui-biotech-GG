"""
Counterfactual Validation Runner

A lightweight counterfactual tracker that logs "what would've happened" if you'd
acted (or not) on every predicted catalyst. Isolates signal decay, bias drift,
and regime-dependence to validate MVM Alpha scoring.

Key Features:
- Pairs predicted IV-spike events with missed neutral/negative catalysts
- Simulates both paths: "took the trade" vs "did nothing / chose the other catalyst"
- Logs realized outcomes with comprehensive metrics
- Compares in rolling windows to detect signal decay and regime shifts

Usage:
    runner = CounterfactualRunner(db_session)
    results = await runner.run_validation(
        start_date='2020-01-01',
        end_date='2025-10-31',
        horizons=[1, 3, 5],
        vix_buckets=[(0, 20), (20, 30), (30, 100)],
        n_alternatives=3
    )
"""

from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

import numpy as np
from scipy import stats
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from ..database import (
    CounterfactualEvent,
    RealizedOutcome,
)

logger = logging.getLogger(__name__)


@dataclass
class CounterfactualConfig:
    """Configuration for counterfactual validation"""

    start_date: str
    end_date: str
    horizons: list[int] = field(default_factory=lambda: [1, 3, 5])
    vix_buckets: list[tuple[float, float]] = field(
        default_factory=lambda: [(0, 20), (20, 30), (30, 100)]
    )
    n_alternatives: int = 3  # Number of randomized alternatives per event
    propensity_seed: int = 42  # Seed for reproducible propensity matching
    matching_window_days: int = 3  # Window for finding alternative catalysts
    min_market_cap: float = 100_000_000  # Minimum market cap for matching


@dataclass
class EdgeMetrics:
    """Edge quality metrics vs counterfactual baseline"""

    event_id: str
    actual_delta_iv: float
    cf_median_delta_iv: float
    edge: float  # actual - cf_median
    actual_pnl_bp: float
    cf_median_pnl_bp: float
    edge_pnl_bp: float
    time_to_alpha_days: int
    sharpe_ratio: float | None = None
    hit_rate: float | None = None


@dataclass
class RegimeMetrics:
    """Performance metrics by market regime"""

    regime_name: str
    n_events: int
    avg_edge: float
    avg_pnl_bp: float
    sharpe_ratio: float
    hit_rate: float
    max_dd_bp: float
    precision: float
    recall: float
    f1_score: float


class CounterfactualRunner:
    """Main counterfactual validation runner"""

    def __init__(self, db_session: Session, config: CounterfactualConfig | None = None):
        self.db = db_session
        self.config = config or CounterfactualConfig(
            start_date="2020-01-01", end_date="2025-10-31"
        )
        np.random.seed(self.config.propensity_seed)

    async def run_validation(self) -> dict[str, Any]:
        """
        Run full counterfactual validation pipeline

        Returns:
            Dict with validation results including edge metrics, regime analysis,
            drift detection, and risk metrics
        """
        logger.info(
            f"Starting counterfactual validation from {self.config.start_date} to {self.config.end_date}"
        )

        # Load events
        events = await self._load_events()
        logger.info(f"Loaded {len(events)} events for validation")

        # Build counterfactuals for each event
        results = []
        for event in events:
            event_results = await self._process_event(event)
            results.append(event_results)

        # Aggregate metrics
        edge_metrics = self._calculate_edge_metrics(results)
        regime_metrics = self._analyze_regime_performance(results)
        drift_metrics = self._detect_drift(results)
        risk_metrics = self._calculate_risk_metrics(results)

        return {
            "summary": {
                "n_events": len(events),
                "date_range": (self.config.start_date, self.config.end_date),
                "avg_edge": np.mean([r["edge"] for r in results]),
                "overall_sharpe": risk_metrics["sharpe"],
                "overall_hit_rate": risk_metrics["hit_rate"],
            },
            "edge_metrics": edge_metrics,
            "regime_metrics": regime_metrics,
            "drift_metrics": drift_metrics,
            "risk_metrics": risk_metrics,
            "raw_results": results,
        }

    async def _load_events(self) -> list[CounterfactualEvent]:
        """Load events from database or external source"""
        # This would load actual events from the database
        # For now, return empty list - to be implemented with real data integration
        stmt = select(CounterfactualEvent).where(
            and_(
                CounterfactualEvent.dt_trade >= self.config.start_date,
                CounterfactualEvent.dt_trade <= self.config.end_date,
            )
        )
        result = self.db.execute(stmt)
        return result.scalars().all()

    async def _process_event(self, event: CounterfactualEvent) -> dict[str, Any]:
        """
        Process a single event and generate counterfactuals

        Steps:
        1. Get realized outcome for the actual trade
        2. Generate skip baseline (no trade)
        3. Find nearest alternative catalysts
        4. Generate randomized propensity-matched alternatives
        5. Calculate edge vs counterfactuals
        """
        # Get realized outcome
        realized = await self._get_realized_outcome(event)

        # Generate skip baseline
        skip_cf = await self._generate_skip_counterfactual(event)

        # Find nearest alternative catalysts
        alt_catalysts = await self._find_alternative_catalysts(event)

        # Generate propensity-matched alternatives
        propensity_alts = await self._generate_propensity_matched_alternatives(
            event, n=self.config.n_alternatives
        )

        # Combine all counterfactuals
        all_cfs = [skip_cf] + alt_catalysts + propensity_alts

        # Calculate edge
        cf_pnls = [cf["pnl_bp_t5"] for cf in all_cfs if cf["pnl_bp_t5"] is not None]
        cf_median_pnl = np.median(cf_pnls) if cf_pnls else 0.0
        edge = (
            realized["pnl_bp_t5"] - cf_median_pnl
            if realized["pnl_bp_t5"] is not None
            else 0.0
        )

        return {
            "event_id": event.event_id,
            "ticker": event.ticker,
            "score": event.score,
            "dt_trade": event.dt_trade,
            "realized": realized,
            "counterfactuals": all_cfs,
            "edge": edge,
            "cf_median_pnl": cf_median_pnl,
        }

    async def _get_realized_outcome(self, event: CounterfactualEvent) -> dict[str, Any]:
        """Get the realized outcome for an event"""
        stmt = select(RealizedOutcome).where(RealizedOutcome.event_id == event.event_id)
        result = self.db.execute(stmt)
        outcome = result.scalars().first()

        if outcome:
            return {
                "iv30_pre": outcome.iv30_pre,
                "iv30_post_t5": outcome.iv30_post_t5,
                "pnl_bp_t1": outcome.pnl_bp_t1,
                "pnl_bp_t3": outcome.pnl_bp_t3,
                "pnl_bp_t5": outcome.pnl_bp_t5,
                "dd_bp": outcome.dd_bp,
                "days_to_peak_pnl": outcome.days_to_peak_pnl,
            }
        else:
            # Return None values if no outcome recorded
            return {
                "iv30_pre": None,
                "iv30_post_t5": None,
                "pnl_bp_t1": None,
                "pnl_bp_t3": None,
                "pnl_bp_t5": None,
                "dd_bp": None,
                "days_to_peak_pnl": None,
            }

    async def _generate_skip_counterfactual(
        self, event: CounterfactualEvent
    ) -> dict[str, Any]:
        """Generate skip baseline - what happens if we don't trade"""
        # Skip means PnL = 0 (no trade, no gain/loss)
        return {
            "cf_type": "skip",
            "selection_rule": "noop",
            "pnl_bp_t5": 0.0,
            "iv30_delta": 0.0,
            "alt_ticker": None,
            "alt_score": None,
        }

    async def _find_alternative_catalysts(
        self, event: CounterfactualEvent
    ) -> list[dict[str, Any]]:
        """
        Find nearest alternative catalysts in same window

        Selection criteria:
        - Same date window (±3 days)
        - Same catalyst type OR therapeutic area
        - Different ticker
        - Closest by score
        """
        window_start = event.dt_trade - timedelta(days=self.config.matching_window_days)
        window_end = event.dt_trade + timedelta(days=self.config.matching_window_days)

        stmt = select(CounterfactualEvent).where(
            and_(
                CounterfactualEvent.ticker != event.ticker,
                CounterfactualEvent.dt_trade >= window_start,
                CounterfactualEvent.dt_trade <= window_end,
                or_(
                    CounterfactualEvent.catalyst_type == event.catalyst_type,
                    CounterfactualEvent.therapeutic_area == event.therapeutic_area,
                ),
            )
        )
        result = self.db.execute(stmt)
        candidates = result.scalars().all()

        if not candidates:
            return []

        # Find nearest by score
        candidates_with_distance = [(c, abs(c.score - event.score)) for c in candidates]
        candidates_with_distance.sort(key=lambda x: x[1])

        # Take the nearest one
        nearest = candidates_with_distance[0][0] if candidates_with_distance else None

        if nearest:
            # Get its realized outcome
            realized = await self._get_realized_outcome(nearest)
            return [
                {
                    "cf_type": "alt_name",
                    "selection_rule": "nearest_name_match",
                    "pnl_bp_t5": realized["pnl_bp_t5"],
                    "iv30_delta": (realized["iv30_post_t5"] - realized["iv30_pre"])
                    if realized["iv30_post_t5"] and realized["iv30_pre"]
                    else None,
                    "alt_ticker": nearest.ticker,
                    "alt_score": nearest.score,
                }
            ]

        return []

    async def _generate_propensity_matched_alternatives(
        self, event: CounterfactualEvent, n: int = 3
    ) -> list[dict[str, Any]]:
        """
        Generate propensity-matched alternatives

        Match on:
        - Market cap decile
        - Liquidity bucket
        - Date proximity
        """
        window_start = event.dt_trade - timedelta(days=self.config.matching_window_days)
        window_end = event.dt_trade + timedelta(days=self.config.matching_window_days)

        stmt = select(CounterfactualEvent).where(
            and_(
                CounterfactualEvent.ticker != event.ticker,
                CounterfactualEvent.dt_trade >= window_start,
                CounterfactualEvent.dt_trade <= window_end,
                CounterfactualEvent.market_cap_decile == event.market_cap_decile,
                CounterfactualEvent.liquidity_bucket == event.liquidity_bucket,
            )
        )
        result = self.db.execute(stmt)
        candidates = result.scalars().all()

        if not candidates:
            return []

        # Randomly sample up to n candidates
        sample_size = min(n, len(candidates))
        sampled = np.random.choice(candidates, size=sample_size, replace=False)

        alternatives = []
        for alt_event in sampled:
            realized = await self._get_realized_outcome(alt_event)
            alternatives.append(
                {
                    "cf_type": "alt_ticker",
                    "selection_rule": "propensity_match",
                    "pnl_bp_t5": realized["pnl_bp_t5"],
                    "iv30_delta": (realized["iv30_post_t5"] - realized["iv30_pre"])
                    if realized["iv30_post_t5"] and realized["iv30_pre"]
                    else None,
                    "alt_ticker": alt_event.ticker,
                    "alt_score": alt_event.score,
                }
            )

        return alternatives

    def _calculate_edge_metrics(self, results: list[dict[str, Any]]) -> dict[str, Any]:
        """Calculate edge quality metrics"""
        edges = [r["edge"] for r in results if r["edge"] is not None]

        if not edges:
            return {
                "mean_edge": 0.0,
                "median_edge": 0.0,
                "std_edge": 0.0,
                "percentile_25": 0.0,
                "percentile_75": 0.0,
                "n_positive_edge": 0,
                "n_negative_edge": 0,
            }

        return {
            "mean_edge": float(np.mean(edges)),
            "median_edge": float(np.median(edges)),
            "std_edge": float(np.std(edges)),
            "percentile_25": float(np.percentile(edges, 25)),
            "percentile_75": float(np.percentile(edges, 75)),
            "n_positive_edge": sum(1 for e in edges if e > 0),
            "n_negative_edge": sum(1 for e in edges if e < 0),
        }

    def _analyze_regime_performance(
        self, results: list[dict[str, Any]]
    ) -> dict[str, RegimeMetrics]:
        """Analyze performance by market regime (VIX buckets, XBI quartiles)"""
        # Group results by regime
        # For now, return empty dict - to be implemented with regime data
        return {}

    def _detect_drift(self, results: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Detect drift in model performance over time

        Uses PSI (Population Stability Index) for feature distributions
        and Kendall τ for score-outcome correlation
        """
        # Calculate rolling Kendall τ
        if len(results) < 30:
            return {
                "drift_detected": False,
                "psi": None,
                "kendall_tau": None,
                "p_value": None,
            }

        # Sort by date
        sorted_results = sorted(results, key=lambda x: x["dt_trade"])

        # Calculate Kendall τ between score and edge
        scores = [
            r["score"]
            for r in sorted_results
            if r["score"] is not None and r["edge"] is not None
        ]
        edges = [
            r["edge"]
            for r in sorted_results
            if r["score"] is not None and r["edge"] is not None
        ]

        if len(scores) < 10:
            return {
                "drift_detected": False,
                "psi": None,
                "kendall_tau": None,
                "p_value": None,
            }

        tau, p_value = stats.kendalltau(scores, edges)

        return {
            "drift_detected": p_value > 0.05,  # No significant correlation
            "psi": None,  # To be implemented with feature distributions
            "kendall_tau": float(tau),
            "p_value": float(p_value),
            "n_observations": len(scores),
        }

    def _calculate_risk_metrics(self, results: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Calculate risk-adjusted metrics

        Includes:
        - Sharpe ratio
        - Sortino ratio
        - Hit rate
        - Max drawdown
        - VaR and CVaR
        """
        pnls = [
            r["realized"]["pnl_bp_t5"]
            for r in results
            if r["realized"]["pnl_bp_t5"] is not None
        ]

        if not pnls:
            return {
                "sharpe": 0.0,
                "sortino": 0.0,
                "hit_rate": 0.0,
                "max_dd_bp": 0.0,
                "var_95": 0.0,
                "cvar_95": 0.0,
                "n_trades": 0,
            }

        pnls_array = np.array(pnls)

        # Sharpe ratio (assuming daily PnL)
        mean_pnl = np.mean(pnls_array)
        std_pnl = np.std(pnls_array)
        sharpe = (mean_pnl / std_pnl) if std_pnl > 0 else 0.0

        # Sortino ratio (downside deviation)
        downside_returns = pnls_array[pnls_array < 0]
        downside_std = np.std(downside_returns) if len(downside_returns) > 0 else 1.0
        sortino = (mean_pnl / downside_std) if downside_std > 0 else 0.0

        # Hit rate
        hit_rate = sum(1 for p in pnls if p > 0) / len(pnls) if pnls else 0.0

        # Max drawdown
        cumulative = np.cumsum(pnls_array)
        running_max = np.maximum.accumulate(cumulative)
        drawdown = cumulative - running_max
        max_dd = abs(np.min(drawdown)) if len(drawdown) > 0 else 0.0

        # VaR and CVaR at 95% confidence
        var_95 = np.percentile(pnls_array, 5)  # 5th percentile (left tail)
        cvar_95 = (
            np.mean(pnls_array[pnls_array <= var_95])
            if np.any(pnls_array <= var_95)
            else var_95
        )

        return {
            "sharpe": float(sharpe),
            "sortino": float(sortino),
            "hit_rate": float(hit_rate),
            "max_dd_bp": float(max_dd),
            "var_95": float(var_95),
            "cvar_95": float(cvar_95),
            "n_trades": len(pnls),
        }

    def generate_report(self, results: dict[str, Any], output_path: str) -> None:
        """
        Generate markdown report with validation results

        Args:
            results: Validation results from run_validation()
            output_path: Path to save the report
        """
        with open(output_path, "w") as f:
            f.write("# MVM Alpha Counterfactual Validation Report\n\n")
            f.write(
                f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            )

            # Summary
            f.write("## Summary\n\n")
            summary = results["summary"]
            f.write(
                f"- **Date Range:** {summary['date_range'][0]} to {summary['date_range'][1]}\n"
            )
            f.write(f"- **Total Events:** {summary['n_events']}\n")
            f.write(f"- **Average Edge:** {summary['avg_edge']:.2f} bp\n")
            f.write(f"- **Overall Sharpe:** {summary['overall_sharpe']:.2f}\n")
            f.write(f"- **Hit Rate:** {summary['overall_hit_rate']:.2%}\n\n")

            # Edge Metrics
            f.write("## Edge Quality Metrics\n\n")
            edge = results["edge_metrics"]
            f.write(f"- **Mean Edge:** {edge.get('mean_edge', 0):.2f} bp\n")
            f.write(f"- **Median Edge:** {edge.get('median_edge', 0):.2f} bp\n")
            f.write(f"- **Standard Deviation:** {edge.get('std_edge', 0):.2f} bp\n")
            f.write(f"- **25th Percentile:** {edge.get('percentile_25', 0):.2f} bp\n")
            f.write(f"- **75th Percentile:** {edge.get('percentile_75', 0):.2f} bp\n\n")

            # Risk Metrics
            f.write("## Risk Metrics\n\n")
            risk = results["risk_metrics"]
            f.write(f"- **Sharpe Ratio:** {risk['sharpe']:.2f}\n")
            f.write(f"- **Sortino Ratio:** {risk['sortino']:.2f}\n")
            f.write(f"- **Hit Rate:** {risk['hit_rate']:.2%}\n")
            f.write(f"- **Max Drawdown:** {risk['max_dd_bp']:.2f} bp\n")
            f.write(f"- **VaR (95%):** {risk['var_95']:.2f} bp\n")
            f.write(f"- **CVaR (95%):** {risk['cvar_95']:.2f} bp\n\n")

            # Drift Detection
            f.write("## Drift Detection\n\n")
            drift = results["drift_metrics"]
            f.write(
                f"- **Drift Detected:** {'Yes' if drift.get('drift_detected') else 'No'}\n"
            )
            f.write(f"- **Kendall τ:** {drift.get('kendall_tau', 'N/A')}\n")
            f.write(f"- **P-value:** {drift.get('p_value', 'N/A')}\n\n")

            logger.info(f"Report generated at {output_path}")


def create_counterfactual_id(
    event_id: str, cf_type: str, alt_ticker: str | None = None
) -> str:
    """Generate unique counterfactual ID"""
    components = [event_id, cf_type]
    if alt_ticker:
        components.append(alt_ticker)
    return hashlib.md5("_".join(components).encode()).hexdigest()
