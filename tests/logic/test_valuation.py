"""
Unit Tests for Valuation Engine

Tests revenue projection, LoE erosion, DCF, and sensitivity analysis.
"""

import pytest
from datetime import datetime
from platform.logic.valuation import ValuationEngine


class TestValuationEngine:
    """Test cases for ValuationEngine."""

    def setup_method(self):
        """Set up test fixtures."""
        self.engine = ValuationEngine()

    def test_initialization(self):
        """Test that engine initializes correctly."""
        assert self.engine.version == "1.0"

    def test_compute_revenue_projection_basic(self):
        """Test basic revenue projection calculation."""
        epi_params = {
            "US_addressable": 50000,
            "EU_addressable": 40000,
            "US_eligible_rate": 0.7,
            "EU_eligible_rate": 0.65,
        }

        pricing = {"US": 150000, "EU": 120000}

        uptake_curve = {2025: 0.05, 2026: 0.15, 2027: 0.30}

        results = self.engine.compute_revenue_projection(
            asset_id="TEST-001",
            epi_params=epi_params,
            pricing=pricing,
            uptake_curve=uptake_curve,
            pos_by_phase=0.65,
        )

        # Check structure
        assert "asset_id" in results
        assert results["asset_id"] == "TEST-001"
        assert "regions" in results
        assert "total_revenue_by_year" in results

        # Check regions
        assert "US" in results["regions"]
        assert "EU" in results["regions"]

        # Check US calculations
        us_data = results["regions"]["US"]
        assert len(us_data) == 3  # 3 years

        # Year 2025: 50000 * 0.7 * 0.05 * 150000 * 0.65 = 170,625,000
        assert us_data[0]["year"] == 2025
        assert us_data[0]["patients"] == int(50000 * 0.7 * 0.05)
        assert us_data[0]["revenue"] > 0

    def test_compute_revenue_projection_zero_uptake(self):
        """Test revenue projection with zero uptake."""
        epi_params = {
            "US_addressable": 50000,
            "US_eligible_rate": 0.7,
        }

        pricing = {"US": 150000}
        uptake_curve = {2025: 0.0}

        results = self.engine.compute_revenue_projection(
            asset_id="TEST-001",
            epi_params=epi_params,
            pricing=pricing,
            uptake_curve=uptake_curve,
            pos_by_phase=1.0,
        )

        us_data = results["regions"]["US"]
        assert us_data[0]["patients"] == 0
        assert us_data[0]["revenue"] == 0.0

    def test_compute_revenue_projection_multiple_years(self):
        """Test revenue projection across multiple years."""
        epi_params = {
            "US_addressable": 100000,
            "US_eligible_rate": 0.5,
        }

        pricing = {"US": 100000}
        uptake_curve = {
            2025: 0.10,
            2026: 0.25,
            2027: 0.40,
            2028: 0.50,
            2029: 0.55,
        }

        results = self.engine.compute_revenue_projection(
            asset_id="TEST-001",
            epi_params=epi_params,
            pricing=pricing,
            uptake_curve=uptake_curve,
            pos_by_phase=1.0,
        )

        us_data = results["regions"]["US"]
        assert len(us_data) == 5

        # Check increasing patient counts
        patients = [year["patients"] for year in us_data]
        assert patients == sorted(patients)  # Should be increasing

        # Check revenue scaling
        revenues = [year["revenue"] for year in us_data]
        assert revenues == sorted(revenues)  # Should be increasing

    def test_apply_loe_erosion_basic(self):
        """Test basic LoE erosion application."""
        revenue_projections = {
            "total_revenue_by_year": {
                2030: 1000000000,
                2031: 1000000000,
                2032: 1000000000,  # LoE year
                2033: 1000000000,
                2034: 1000000000,
            }
        }

        loe_events = [
            {
                "expiry_year": 2032,
                "erosion_rates": {"year_1": 0.60, "year_2": 0.80, "year_3": 0.90},
            }
        ]

        results = self.engine.apply_loe_erosion(revenue_projections, loe_events)

        adjusted_revenue = results["total_revenue_by_year"]

        # Pre-LoE years should be unchanged
        assert adjusted_revenue[2030] == 1000000000
        assert adjusted_revenue[2031] == 1000000000

        # Post-LoE years should be eroded
        # Year 1 after LoE: 1000M * (1 - 0.60) = 400M
        assert adjusted_revenue[2033] == pytest.approx(400000000, rel=0.01)

        # Year 2 after LoE: 1000M * (1 - 0.80) = 200M
        assert adjusted_revenue[2034] == pytest.approx(200000000, rel=0.01)

    def test_apply_loe_erosion_no_events(self):
        """Test LoE erosion with no events."""
        revenue_projections = {
            "total_revenue_by_year": {
                2030: 1000000000,
                2031: 1000000000,
            }
        }

        results = self.engine.apply_loe_erosion(revenue_projections, [])

        # Should return unchanged
        assert results == revenue_projections

    def test_compute_dcf_basic(self):
        """Test basic DCF valuation."""
        revenue_projections = {
            2025: 100000000,
            2026: 200000000,
            2027: 300000000,
            2028: 400000000,
            2029: 500000000,
        }

        wacc = 0.12
        tgr = 0.025
        ebitda_margin = 0.30

        results = self.engine.compute_dcf(
            revenue_projections=revenue_projections,
            wacc=wacc,
            tgr=tgr,
            ebitda_margin=ebitda_margin,
            tax_rate=0.25,
        )

        # Check structure
        assert "enterprise_value" in results
        assert "terminal_value" in results
        assert "pv_cash_flows" in results

        # Check that EV is positive
        assert results["enterprise_value"] > 0

        # Check that terminal value is reasonable
        assert results["terminal_value"] > 0

    def test_compute_dcf_high_wacc(self):
        """Test DCF with high WACC reduces valuation."""
        revenue_projections = {2025: 100000000, 2026: 110000000}

        # Low WACC
        results_low = self.engine.compute_dcf(
            revenue_projections=revenue_projections,
            wacc=0.08,
            tgr=0.02,
            ebitda_margin=0.30,
            tax_rate=0.25,
        )

        # High WACC
        results_high = self.engine.compute_dcf(
            revenue_projections=revenue_projections,
            wacc=0.15,
            tgr=0.02,
            ebitda_margin=0.30,
            tax_rate=0.25,
        )

        # Higher WACC should result in lower valuation
        assert results_low["enterprise_value"] > results_high["enterprise_value"]

    def test_compute_multiples_valuation(self):
        """Test multiples-based valuation."""
        revenue_projections = {2025: 100000000, 2026: 150000000, 2027: 200000000}

        sector_multiples = {"ev_to_revenue": 8.5, "ev_to_ebitda": 15.0}

        results = self.engine.compute_multiples_valuation(
            revenue_projections=revenue_projections,
            ebitda_margin=0.30,
            sector_multiples=sector_multiples,
        )

        # Check structure
        assert "ev_to_revenue" in results
        assert "ev_to_ebitda" in results
        assert "implied_value" in results

        # Check calculations
        assert results["implied_value"] > 0

    def test_compute_wacc_tgr_sensitivity(self):
        """Test WACC/TGR sensitivity analysis."""
        base_results = {
            "dcf": {
                "enterprise_value": 2000000000,
                "revenue_projections": {2025: 100000000, 2026: 150000000},
            },
            "ebitda_margin": 0.30,
            "tax_rate": 0.25,
        }

        wacc_range = [0.10, 0.12, 0.14]
        tgr_range = [0.02, 0.025, 0.03]

        results = self.engine.compute_wacc_tgr_sensitivity(
            base_results=base_results, wacc_range=wacc_range, tgr_range=tgr_range
        )

        # Check structure
        assert "wacc_values" in results
        assert "tgr_values" in results
        assert "sensitivity_matrix" in results

        # Check dimensions
        assert len(results["wacc_values"]) == 3
        assert len(results["tgr_values"]) == 3
        assert len(results["sensitivity_matrix"]) == 3
        assert len(results["sensitivity_matrix"][0]) == 3

    def test_run_valuation_complete(self):
        """Test complete valuation workflow."""
        epi_params = {
            "US_addressable": 50000,
            "EU_addressable": 40000,
            "US_eligible_rate": 0.7,
            "EU_eligible_rate": 0.65,
        }

        financial_assumptions = {
            "asset_id": "TEST-001",
            "wacc": 0.12,
            "tgr": 0.025,
            "ebitda_margin": 0.30,
            "tax_rate": 0.25,
            "pricing": {"US": 150000, "EU": 120000},
            "uptake_curve": {2025: 0.05, 2026: 0.15, 2027: 0.30},
            "pos_by_phase": 0.65,
            "sector_multiples": {"ev_to_revenue": 8.5, "ev_to_ebitda": 15.0},
        }

        results = self.engine.run_valuation(
            ticker="TEST",
            scenario_id="base",
            epi_params=epi_params,
            financial_assumptions=financial_assumptions,
        )

        # Check complete structure
        assert "inputs_hash" in results
        assert "version" in results
        assert "revenue_projections" in results
        assert "dcf" in results
        assert "multiples" in results
        assert "sensitivity" in results

        # Check hash is generated
        assert len(results["inputs_hash"]) == 64  # SHA256 hash

        # Check DCF results
        assert results["dcf"]["enterprise_value"] > 0

        # Check multiples results
        assert results["multiples"]["implied_value"] > 0

    def test_run_valuation_with_loe(self):
        """Test valuation with LoE events."""
        epi_params = {
            "US_addressable": 50000,
            "US_eligible_rate": 0.7,
        }

        financial_assumptions = {
            "asset_id": "TEST-001",
            "wacc": 0.12,
            "tgr": 0.025,
            "ebitda_margin": 0.30,
            "tax_rate": 0.25,
            "pricing": {"US": 150000},
            "uptake_curve": {
                2025: 0.30,
                2026: 0.50,
                2027: 0.60,
                2028: 0.60,
                2029: 0.60,
            },
            "pos_by_phase": 1.0,
            "sector_multiples": {"ev_to_revenue": 8.5},
        }

        loe_events = [
            {
                "expiry_year": 2027,
                "erosion_rates": {"year_1": 0.60, "year_2": 0.80},
            }
        ]

        results = self.engine.run_valuation(
            ticker="TEST",
            scenario_id="base_with_loe",
            epi_params=epi_params,
            financial_assumptions=financial_assumptions,
            loe_events=loe_events,
        )

        # Check LoE was applied
        revenue = results["revenue_projections"]["total_revenue_by_year"]

        # Revenue in 2028 (year after LoE) should be lower than 2027
        if 2027 in revenue and 2028 in revenue:
            assert revenue[2028] < revenue[2027]

    def test_inputs_hash_consistency(self):
        """Test that same inputs produce same hash."""
        epi_params = {"US_addressable": 50000}
        financial_assumptions = {"wacc": 0.12, "pricing": {"US": 150000}}

        results1 = self.engine.run_valuation(
            ticker="TEST",
            scenario_id="base",
            epi_params=epi_params,
            financial_assumptions=financial_assumptions,
        )

        results2 = self.engine.run_valuation(
            ticker="TEST",
            scenario_id="base",
            epi_params=epi_params,
            financial_assumptions=financial_assumptions,
        )

        # Same inputs should produce same hash
        assert results1["inputs_hash"] == results2["inputs_hash"]

    def test_inputs_hash_uniqueness(self):
        """Test that different inputs produce different hashes."""
        epi_params1 = {"US_addressable": 50000}
        epi_params2 = {"US_addressable": 60000}

        financial_assumptions = {"wacc": 0.12, "pricing": {"US": 150000}}

        results1 = self.engine.run_valuation(
            ticker="TEST",
            scenario_id="base",
            epi_params=epi_params1,
            financial_assumptions=financial_assumptions,
        )

        results2 = self.engine.run_valuation(
            ticker="TEST",
            scenario_id="base",
            epi_params=epi_params2,
            financial_assumptions=financial_assumptions,
        )

        # Different inputs should produce different hashes
        assert results1["inputs_hash"] != results2["inputs_hash"]
