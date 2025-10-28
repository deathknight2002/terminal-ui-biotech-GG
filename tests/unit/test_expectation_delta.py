"""
Unit Tests for Expectation Delta Computation
============================================

Tests the compute_expectation_delta and compute_aggregate_delta functions.
"""

import pytest

from bt_platform.core.services.expectation_delta import (
    DeltaClass,
    compute_aggregate_delta,
    compute_expectation_delta,
    format_delta_for_display,
)


class TestExpectationDelta:
    """Test suite for expectation delta computations."""

    def test_beat_simple(self):
        """Test a simple beat scenario."""
        delta = compute_expectation_delta(
            outcome_value=1.8,
            expected_value=1.5,
            band_low=1.3,
            band_high=1.6,
            metric_name="Test Metric"
        )

        assert delta.delta_class == DeltaClass.BEAT
        assert delta.delta_score > 0
        assert delta.raw_delta > 0
        assert "exceeded upper bound" in delta.explanation

    def test_miss_simple(self):
        """Test a simple miss scenario."""
        delta = compute_expectation_delta(
            outcome_value=1.0,
            expected_value=1.5,
            band_low=1.3,
            band_high=1.6,
            metric_name="Test Metric"
        )

        assert delta.delta_class == DeltaClass.MISS
        assert delta.delta_score > 0
        assert delta.raw_delta < 0
        assert "below lower bound" in delta.explanation

    def test_inline_simple(self):
        """Test a simple inline scenario."""
        delta = compute_expectation_delta(
            outcome_value=1.45,
            expected_value=1.5,
            band_low=1.3,
            band_high=1.6,
            metric_name="Test Metric"
        )

        assert delta.delta_class == DeltaClass.INLINE
        assert delta.delta_score <= 0.5
        assert "within band" in delta.explanation

    def test_beat_at_boundary(self):
        """Test beat exactly at upper boundary."""
        delta = compute_expectation_delta(
            outcome_value=1.6,
            expected_value=1.5,
            band_low=1.3,
            band_high=1.6,
            metric_name="Test Metric"
        )

        assert delta.delta_class == DeltaClass.INLINE
        assert "within band" in delta.explanation

    def test_miss_at_boundary(self):
        """Test miss exactly at lower boundary."""
        delta = compute_expectation_delta(
            outcome_value=1.3,
            expected_value=1.5,
            band_low=1.3,
            band_high=1.6,
            metric_name="Test Metric"
        )

        assert delta.delta_class == DeltaClass.INLINE
        assert "within band" in delta.explanation

    def test_statistical_significance(self):
        """Test p-value significance detection."""
        delta = compute_expectation_delta(
            outcome_value=1.8,
            expected_value=1.5,
            band_low=1.3,
            band_high=1.6,
            metric_name="Test Metric",
            p_value=0.001
        )

        assert delta.is_statistically_significant is True

        delta_ns = compute_expectation_delta(
            outcome_value=1.8,
            expected_value=1.5,
            band_low=1.3,
            band_high=1.6,
            metric_name="Test Metric",
            p_value=0.10
        )

        assert delta_ns.is_statistically_significant is False

    def test_missing_bands_default_to_expected(self):
        """Test behavior when bands are missing - should use expected ± 10%."""
        delta = compute_expectation_delta(
            outcome_value=1.8,
            expected_value=1.5,
            band_low=None,
            band_high=None,
            metric_name="Test Metric"
        )

        # Should still compute a delta
        assert delta.delta_class in [DeltaClass.BEAT, DeltaClass.INLINE, DeltaClass.MISS]
        assert delta.delta_score >= 0

    def test_no_expectations_available(self):
        """Test behavior when no expectations are available."""
        delta = compute_expectation_delta(
            outcome_value=1.8,
            expected_value=None,
            band_low=None,
            band_high=None,
            metric_name="Test Metric"
        )

        assert delta.delta_class == DeltaClass.INLINE
        assert delta.delta_score == 0.0
        assert "No expectation" in delta.explanation

    def test_percent_delta_computation(self):
        """Test percent delta calculation."""
        delta = compute_expectation_delta(
            outcome_value=60,
            expected_value=50,
            band_low=40,
            band_high=55,
            metric_name="CK reduction"
        )

        assert delta.percent_delta is not None
        assert delta.percent_delta == 20.0  # (60 - 50) / 50 * 100

    def test_magnitude_scaling(self):
        """Test that magnitude scales properly with distance from band."""
        # Just exceeds upper bound
        delta_small = compute_expectation_delta(
            outcome_value=1.65,
            expected_value=1.5,
            band_low=1.3,
            band_high=1.6,
            metric_name="Test"
        )

        # Greatly exceeds upper bound
        delta_large = compute_expectation_delta(
            outcome_value=2.0,
            expected_value=1.5,
            band_low=1.3,
            band_high=1.6,
            metric_name="Test"
        )

        assert delta_large.delta_score > delta_small.delta_score


class TestAggregateExpectationDelta:
    """Test suite for aggregate delta computations."""

    def test_all_beats(self):
        """Test aggregation when all metrics beat."""
        deltas = [
            compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "Metric 1"),
            compute_expectation_delta(82, 60, 50, 70, "Metric 2"),
            compute_expectation_delta(0.27, 0.20, 0.10, 0.25, "Metric 3")
        ]

        agg_class, agg_score = compute_aggregate_delta(deltas)

        assert agg_class == DeltaClass.BEAT
        assert agg_score > 0

    def test_all_misses(self):
        """Test aggregation when all metrics miss."""
        deltas = [
            compute_expectation_delta(1.0, 1.5, 1.3, 1.6, "Metric 1"),
            compute_expectation_delta(40, 60, 50, 70, "Metric 2"),
            compute_expectation_delta(0.05, 0.20, 0.10, 0.25, "Metric 3")
        ]

        agg_class, agg_score = compute_aggregate_delta(deltas)

        assert agg_class == DeltaClass.MISS
        assert agg_score > 0

    def test_mixed_results(self):
        """Test aggregation with mixed beat/inline/miss."""
        deltas = [
            compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "Beat"),  # Beat
            compute_expectation_delta(1.45, 1.5, 1.3, 1.6, "Inline"),  # Inline
            compute_expectation_delta(1.0, 1.5, 1.3, 1.6, "Miss")  # Miss
        ]

        agg_class, agg_score = compute_aggregate_delta(deltas)

        # Should classify based on dominant class
        assert agg_class in [DeltaClass.BEAT, DeltaClass.INLINE, DeltaClass.MISS]

    def test_weighted_aggregate(self):
        """Test weighted aggregation."""
        deltas = [
            compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "Primary"),
            compute_expectation_delta(1.0, 1.5, 1.3, 1.6, "Secondary")
        ]

        # Weight primary metric more heavily
        weights = [0.8, 0.2]

        agg_class, agg_score = compute_aggregate_delta(deltas, weights)

        # Should still be beat due to high weight on beat metric
        assert agg_class == DeltaClass.BEAT

    def test_empty_deltas(self):
        """Test aggregation with empty delta list."""
        agg_class, agg_score = compute_aggregate_delta([])

        assert agg_class == DeltaClass.INLINE
        assert agg_score == 0.0

    def test_single_delta(self):
        """Test aggregation with single delta."""
        delta = compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "Single")
        agg_class, agg_score = compute_aggregate_delta([delta])

        assert agg_class == delta.delta_class
        assert abs(agg_score - delta.delta_score) < 0.01

    def test_invalid_weights(self):
        """Test that invalid weights raise errors."""
        deltas = [
            compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "M1"),
            compute_expectation_delta(1.0, 1.5, 1.3, 1.6, "M2")
        ]

        # Wrong number of weights
        with pytest.raises(ValueError):
            compute_aggregate_delta(deltas, weights=[0.5])

        # Weights don't sum to 1.0
        with pytest.raises(ValueError):
            compute_aggregate_delta(deltas, weights=[0.3, 0.3])


class TestFormatDeltaForDisplay:
    """Test suite for delta formatting for UI."""

    def test_beat_formatting(self):
        """Test beat formatting."""
        delta = compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "Test")
        formatted = format_delta_for_display(delta)

        assert formatted["class"] == "beat"
        assert formatted["badge_color"] == "success"
        assert formatted["arrow"] == "↑"
        assert formatted["label"] == "Beat"

    def test_miss_formatting(self):
        """Test miss formatting."""
        delta = compute_expectation_delta(1.0, 1.5, 1.3, 1.6, "Test")
        formatted = format_delta_for_display(delta)

        assert formatted["class"] == "miss"
        assert formatted["badge_color"] == "error"
        assert formatted["arrow"] == "↓"
        assert formatted["label"] == "Miss"

    def test_inline_formatting(self):
        """Test inline formatting."""
        delta = compute_expectation_delta(1.45, 1.5, 1.3, 1.6, "Test")
        formatted = format_delta_for_display(delta)

        assert formatted["class"] == "inline"
        assert formatted["badge_color"] == "info"
        assert formatted["arrow"] == "→"
        assert formatted["label"] == "In-line"

    def test_magnitude_rounding(self):
        """Test that magnitude is properly rounded."""
        delta = compute_expectation_delta(1.777, 1.5, 1.3, 1.6, "Test")
        formatted = format_delta_for_display(delta)

        assert isinstance(formatted["magnitude"], float)
        # Should be rounded to 2 decimal places
        assert len(str(formatted["magnitude"]).split('.')[-1]) <= 2


# ============================================================================
# Integration Tests with Real Examples
# ============================================================================

class TestRealExamples:
    """Test delta computation with real catalyst examples."""

    def test_bridgebio_fortify_example(self):
        """Test BridgeBio FORTIFY example (all endpoints beat)."""
        # α-DG: 1.8× vs expected 1.5× (band 1.3-1.6×)
        alpha_dg = compute_expectation_delta(1.8, 1.5, 1.3, 1.6, "α-DG", p_value=0.002)
        assert alpha_dg.delta_class == DeltaClass.BEAT
        assert alpha_dg.is_statistically_significant

        # CK: -82% vs expected -60% (band -50% to -70%)
        ck = compute_expectation_delta(82, 60, 50, 70, "CK", p_value=0.001)
        assert ck.delta_class == DeltaClass.BEAT
        assert ck.is_statistically_significant

        # Aggregate
        agg_class, agg_score = compute_aggregate_delta([alpha_dg, ck])
        assert agg_class == DeltaClass.BEAT

    def test_novartis_avidity_ma_example(self):
        """Test Novartis → Avidity M&A example."""
        # Deal premium: 46% vs expected 30% (band 20-40%)
        premium = compute_expectation_delta(46, 30, 20, 40, "Deal Premium")
        assert premium.delta_class == DeltaClass.BEAT
        assert premium.raw_delta == 16

    def test_intellia_magnitude_pause_example(self):
        """Test Intellia MAGNITUDE safety pause (adverse event)."""
        # Safety grade: 4 vs expected 0 (band 0-2)
        safety = compute_expectation_delta(4, 0, 0, 2, "Safety Grade")
        assert safety.delta_class == DeltaClass.BEAT
        # Note: For safety events, "beat" means worse outcome (higher grade)
        # The interpretation depends on context


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
