"""
Unit tests for Production Validation System

Tests all components of the MVM alpha production validation system:
- Purged cross-validation
- Probability calibration
- Position sizing
- Drift monitoring
- Stress testing
- Integrated production validator
"""

import pytest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from bt_platform.core.validation.purged_cv import PurgedKFold, EmbargoValidator
from bt_platform.core.validation.probability_calibration import (
    PlattScaling, IsotonicCalibration, AutoCalibrator, CalibrationEvaluator
)
from bt_platform.core.validation.position_sizing import (
    PositionSizer, PositionSizingConfig, KellyCriterion
)
from bt_platform.core.validation.drift_monitoring import (
    DriftMonitor, PSICalculator, KSTestCalculator
)
from bt_platform.core.validation.stress_testing import BiotechStressTester


class TestPurgedCV:
    """Test purged cross-validation"""
    
    def test_purged_kfold_basic(self):
        """Test basic purged K-fold functionality"""
        # Create sample data
        dates = pd.date_range(start='2023-01-01', periods=50, freq='W')
        X = pd.DataFrame({'feature': np.random.randn(50)}, index=dates)
        y = np.random.randint(0, 2, 50)
        
        cv = PurgedKFold(n_splits=5, embargo_pct=0.01)
        
        splits = list(cv.split(X, y))
        assert len(splits) > 0, "Should generate at least one split"
        
        for train_idx, test_idx in splits:
            assert len(train_idx) > 0, "Training set should not be empty"
            assert len(test_idx) > 0, "Test set should not be empty"
            assert len(set(train_idx) & set(test_idx)) == 0, "Train and test should not overlap"
    
    def test_embargo_validator(self):
        """Test embargo validator"""
        dates = pd.date_range(start='2023-01-01', periods=100, freq='D')
        pred_times = pd.Series(dates, index=dates)
        eval_times = pd.Series(dates + pd.Timedelta(days=7), index=dates)
        
        train_idx = np.arange(50)
        test_idx = np.arange(60, 70)
        
        validator = EmbargoValidator()
        result = validator.validate_no_leakage(
            train_idx, test_idx, pred_times, eval_times, min_embargo_days=1
        )
        
        assert 'valid' in result
        assert 'stats' in result


class TestProbabilityCalibration:
    """Test probability calibration components"""
    
    def test_platt_scaling(self):
        """Test Platt scaling"""
        np.random.seed(42)
        scores = np.random.uniform(30, 95, 100)
        labels = (scores > 60).astype(int)
        
        platt = PlattScaling()
        platt.fit(scores, labels)
        
        assert platt.is_fitted
        
        probs = platt.predict_proba(scores)
        assert len(probs) == len(scores)
        assert np.all((probs >= 0) & (probs <= 1)), "Probabilities should be in [0,1]"
    
    def test_isotonic_calibration(self):
        """Test isotonic regression"""
        np.random.seed(42)
        scores = np.random.uniform(30, 95, 100)
        labels = (scores > 60).astype(int)
        
        isotonic = IsotonicCalibration()
        isotonic.fit(scores, labels)
        
        assert isotonic.is_fitted
        
        probs = isotonic.predict_proba(scores)
        assert len(probs) == len(scores)
        assert np.all((probs >= 0) & (probs <= 1))
    
    def test_auto_calibrator(self):
        """Test automatic calibrator selection"""
        np.random.seed(42)
        scores = np.random.uniform(30, 95, 200)
        labels = (scores > 60).astype(int)
        
        calibrator = AutoCalibrator()
        best_method = calibrator.fit(scores, labels)
        
        assert best_method in ['platt', 'isotonic']
        
        probs = calibrator.predict_proba(scores)
        assert len(probs) == len(scores)
    
    def test_calibration_metrics(self):
        """Test calibration metrics calculation"""
        y_true = np.array([0, 1, 1, 0, 1])
        y_prob = np.array([0.2, 0.8, 0.7, 0.3, 0.9])
        
        # Brier score
        brier = CalibrationEvaluator.brier_score(y_true, y_prob)
        assert 0 <= brier <= 1
        
        # Log loss
        logloss = CalibrationEvaluator.log_loss(y_true, y_prob)
        assert logloss > 0
        
        # ECE
        ece, mce = CalibrationEvaluator.expected_calibration_error(y_true, y_prob, n_bins=5)
        assert 0 <= ece <= 1
        assert 0 <= mce <= 1


class TestPositionSizing:
    """Test position sizing components"""
    
    def test_kelly_criterion(self):
        """Test Kelly criterion calculation"""
        kelly = KellyCriterion.calculate_kelly_fraction(
            win_prob=0.75,
            expected_gain_pct=0.30,
            expected_loss_pct=0.15
        )
        
        assert 0 <= kelly <= 1
        assert kelly > 0  # Should have positive edge
    
    def test_kelly_edge(self):
        """Test Kelly edge calculation"""
        edge = KellyCriterion.calculate_kelly_edge(
            win_prob=0.75,
            expected_gain_pct=0.30,
            expected_loss_pct=0.15
        )
        
        assert edge > 0  # Positive expected value
    
    def test_position_sizer_basic(self):
        """Test basic position sizing"""
        config = PositionSizingConfig(
            kelly_fraction=0.25,
            max_position_pct=0.08,
            max_adv_pct=0.10
        )
        
        sizer = PositionSizer(config)
        sizer.set_portfolio_state(
            portfolio_value=1_000_000,
            current_drawdown=0.05,
            current_positions={}
        )
        
        rec = sizer.calculate_position(
            ticker='TEST',
            win_prob=0.80,
            expected_gain_pct=0.35,
            expected_loss_pct=0.15,
            current_price=50.0,
            avg_daily_volume=500_000,
            realized_volatility=0.40
        )
        
        assert rec.final_position_pct >= 0
        assert rec.final_position_pct <= config.max_position_pct
    
    def test_kill_switch(self):
        """Test kill switch activation"""
        config = PositionSizingConfig(drawdown_critical_pct=0.20)
        sizer = PositionSizer(config)
        
        # Set critical drawdown
        sizer.set_portfolio_state(
            portfolio_value=1_000_000,
            current_drawdown=0.25,  # Exceeds critical threshold
            current_positions={}
        )
        
        rec = sizer.calculate_position(
            ticker='TEST',
            win_prob=0.80,
            expected_gain_pct=0.35,
            expected_loss_pct=0.15,
            current_price=50.0,
            avg_daily_volume=500_000
        )
        
        assert rec.kill_switch_active
        assert rec.final_position_pct == 0


class TestDriftMonitoring:
    """Test drift monitoring components"""
    
    def test_psi_calculator_no_drift(self):
        """Test PSI with no drift"""
        np.random.seed(42)
        baseline = np.random.normal(0, 1, 1000)
        current = np.random.normal(0, 1, 100)
        
        psi, _ = PSICalculator.calculate_psi(baseline, current)
        
        assert psi >= 0
        assert psi < 0.15  # Should indicate no/low significant drift
    
    def test_psi_calculator_with_drift(self):
        """Test PSI with drift"""
        np.random.seed(42)
        baseline = np.random.normal(0, 1, 1000)
        current = np.random.normal(2, 1, 100)  # Mean shifted
        
        psi, _ = PSICalculator.calculate_psi(baseline, current)
        
        assert psi > 0.2  # Should indicate significant drift
    
    def test_ks_test(self):
        """Test Kolmogorov-Smirnov test"""
        np.random.seed(42)
        baseline = np.random.normal(0, 1, 1000)
        current = np.random.normal(0, 1, 100)
        
        ks_stat, p_value = KSTestCalculator.calculate_ks_statistic(baseline, current)
        
        assert 0 <= ks_stat <= 1
        assert 0 <= p_value <= 1
    
    def test_drift_monitor(self):
        """Test drift monitor"""
        np.random.seed(42)
        baseline_df = pd.DataFrame({
            'feature1': np.random.normal(0, 1, 100),
            'feature2': np.random.normal(10, 2, 100)
        })
        
        monitor = DriftMonitor(psi_threshold=0.2)
        monitor.set_baseline(baseline_df, ['feature1', 'feature2'])
        
        # Add current data (no drift)
        current_df = pd.DataFrame({
            'feature1': np.random.normal(0, 1, 50),
            'feature2': np.random.normal(10, 2, 50)
        })
        monitor.add_observations(current_df, ['feature1', 'feature2'])
        
        drift_status = monitor.check_drift(['feature1', 'feature2'])
        
        assert len(drift_status) == 2
        assert 'feature1' in drift_status
        assert 'feature2' in drift_status


class TestStressTesting:
    """Test stress testing components"""
    
    def test_biotech_stress_tester_initialization(self):
        """Test stress tester initialization"""
        tester = BiotechStressTester()
        
        assert len(tester.scenarios) > 0
        assert all(hasattr(s, 'name') for s in tester.scenarios)
        assert all(hasattr(s, 'shock_type') for s in tester.scenarios)
    
    def test_stress_test_execution(self):
        """Test stress test execution"""
        portfolio = pd.DataFrame([
            {
                'ticker': 'TEST1',
                'position_pct': 0.08,
                'mvm_score': 85,
                'win_prob': 0.80,
                'phase': 'Phase3',
                'market_cap': 800e6
            }
        ])
        
        tester = BiotechStressTester()
        scenario = tester.scenarios[0]  # First scenario
        
        result = tester.run_stress_test(portfolio, scenario)
        
        assert result is not None
        assert hasattr(result, 'portfolio_return')
        assert hasattr(result, 'max_drawdown')
        assert hasattr(result, 'kill_switch_activated')


# Run all tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
