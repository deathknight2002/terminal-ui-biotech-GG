"""
Unit tests for Counterfactual Validation System

Tests all components of the counterfactual validation tracker:
- Database models
- Counterfactual selection logic
- Edge metrics calculation
- Regime analysis
- Risk metrics
- CLI interface
"""

import pytest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch

from bt_platform.core.validation.counterfactual_runner import (
    CounterfactualRunner,
    CounterfactualConfig,
    EdgeMetrics,
    RegimeMetrics,
    create_counterfactual_id
)
from bt_platform.core.database import (
    CounterfactualEvent,
    RealizedOutcome,
    CounterfactualOutcome,
    RegimeContext,
)


class TestCounterfactualModels:
    """Test database models for counterfactual tracking"""
    
    def test_counterfactual_event_model(self):
        """Test CounterfactualEvent model"""
        event = CounterfactualEvent(
            event_id='test_event_001',
            ticker='SRPT',
            dt_announce_est=datetime(2024, 6, 20),
            dt_trade=datetime(2024, 6, 21),
            score=88.2,
            conf=0.92,
            catalyst_type='Phase 3',
            features_json={'feature1': 1.0, 'feature2': 2.0},
            therapeutic_area='Rare Disease',
            mechanism_of_action='Gene Therapy',
            market_cap_decile=7,
            liquidity_bucket='high',
        )
        
        assert event.event_id == 'test_event_001'
        assert event.ticker == 'SRPT'
        assert event.score == 88.2
        assert event.therapeutic_area == 'Rare Disease'
    
    def test_realized_outcome_model(self):
        """Test RealizedOutcome model"""
        outcome = RealizedOutcome(
            event_id='test_event_001',
            iv30_pre=45.2,
            iv30_post_t5=52.8,
            close_pre=100.0,
            close_post_t5=112.5,
            pnl_bp_t5=1250.0,
            dd_bp=-150.0,
            days_to_peak_pnl=3,
        )
        
        assert outcome.event_id == 'test_event_001'
        assert outcome.pnl_bp_t5 == 1250.0
        assert outcome.days_to_peak_pnl == 3
    
    def test_counterfactual_outcome_model(self):
        """Test CounterfactualOutcome model"""
        cf = CounterfactualOutcome(
            cf_id='cf_test_001',
            event_id='test_event_001',
            cf_type='skip',
            selection_rule='noop',
            realized_cf_metrics_json={'pnl_bp_t5': 0.0},
            cf_pnl_bp_t5=0.0,
        )
        
        assert cf.cf_id == 'cf_test_001'
        assert cf.cf_type == 'skip'
        assert cf.cf_pnl_bp_t5 == 0.0
    
    def test_regime_context_model(self):
        """Test RegimeContext model"""
        regime = RegimeContext(
            date=datetime(2024, 6, 21),
            vix=18.5,
            vix_bucket='<20',
            xbi_ret=1.2,
            xbi_quartile='Q3',
            liq_bucket='normal',
            spread_bp=15.0,
        )
        
        assert regime.vix == 18.5
        assert regime.vix_bucket == '<20'
        assert regime.liq_bucket == 'normal'


class TestCounterfactualConfig:
    """Test configuration for counterfactual validation"""
    
    def test_default_config(self):
        """Test default configuration"""
        config = CounterfactualConfig(
            start_date='2020-01-01',
            end_date='2025-10-31'
        )
        
        assert config.horizons == [1, 3, 5]
        assert config.vix_buckets == [(0, 20), (20, 30), (30, 100)]
        assert config.n_alternatives == 3
        assert config.propensity_seed == 42
    
    def test_custom_config(self):
        """Test custom configuration"""
        config = CounterfactualConfig(
            start_date='2024-01-01',
            end_date='2024-12-31',
            horizons=[1, 5, 10],
            vix_buckets=[(0, 15), (15, 25), (25, 100)],
            n_alternatives=5,
            propensity_seed=123,
        )
        
        assert config.horizons == [1, 5, 10]
        assert config.vix_buckets == [(0, 15), (15, 25), (25, 100)]
        assert config.n_alternatives == 5
        assert config.propensity_seed == 123


class TestCounterfactualRunner:
    """Test counterfactual runner logic"""
    
    @pytest.fixture
    def mock_db(self):
        """Create mock database session"""
        return Mock()
    
    @pytest.fixture
    def runner(self, mock_db):
        """Create counterfactual runner"""
        config = CounterfactualConfig(
            start_date='2024-01-01',
            end_date='2024-12-31'
        )
        return CounterfactualRunner(mock_db, config)
    
    def test_runner_initialization(self, runner):
        """Test runner initialization"""
        assert runner.config.start_date == '2024-01-01'
        assert runner.config.end_date == '2024-12-31'
        assert runner.config.n_alternatives == 3
    
    @pytest.mark.asyncio
    async def test_generate_skip_counterfactual(self, runner):
        """Test skip baseline generation"""
        event = Mock(spec=CounterfactualEvent)
        event.event_id = 'test_001'
        event.ticker = 'SRPT'
        
        skip_cf = await runner._generate_skip_counterfactual(event)
        
        assert skip_cf['cf_type'] == 'skip'
        assert skip_cf['selection_rule'] == 'noop'
        assert skip_cf['pnl_bp_t5'] == 0.0
        assert skip_cf['alt_ticker'] is None
    
    @pytest.mark.asyncio
    async def test_get_realized_outcome_exists(self, runner, mock_db):
        """Test getting realized outcome when it exists"""
        # Mock database query
        mock_outcome = Mock(spec=RealizedOutcome)
        mock_outcome.iv30_pre = 45.0
        mock_outcome.iv30_post_t5 = 52.0
        mock_outcome.pnl_bp_t5 = 1200.0
        mock_outcome.dd_bp = -100.0
        mock_outcome.days_to_peak_pnl = 3
        
        mock_result = Mock()
        mock_result.scalars().first.return_value = mock_outcome
        mock_db.execute.return_value = mock_result
        
        event = Mock(spec=CounterfactualEvent)
        event.event_id = 'test_001'
        
        outcome = await runner._get_realized_outcome(event)
        
        assert outcome['iv30_pre'] == 45.0
        assert outcome['pnl_bp_t5'] == 1200.0
        assert outcome['days_to_peak_pnl'] == 3
    
    @pytest.mark.asyncio
    async def test_get_realized_outcome_missing(self, runner, mock_db):
        """Test getting realized outcome when it doesn't exist"""
        # Mock database query returning None
        mock_result = Mock()
        mock_result.scalars().first.return_value = None
        mock_db.execute.return_value = mock_result
        
        event = Mock(spec=CounterfactualEvent)
        event.event_id = 'test_001'
        
        outcome = await runner._get_realized_outcome(event)
        
        assert outcome['iv30_pre'] is None
        assert outcome['pnl_bp_t5'] is None
        assert outcome['days_to_peak_pnl'] is None


class TestEdgeMetrics:
    """Test edge metrics calculation"""
    
    def test_calculate_edge_metrics_with_data(self):
        """Test edge metrics calculation with valid data"""
        results = [
            {'edge': 100.0, 'realized': {'pnl_bp_t5': 1200.0}},
            {'edge': 50.0, 'realized': {'pnl_bp_t5': 800.0}},
            {'edge': -20.0, 'realized': {'pnl_bp_t5': 300.0}},
            {'edge': 150.0, 'realized': {'pnl_bp_t5': 1500.0}},
        ]
        
        runner = CounterfactualRunner(Mock(), CounterfactualConfig(
            start_date='2024-01-01',
            end_date='2024-12-31'
        ))
        
        metrics = runner._calculate_edge_metrics(results)
        
        assert metrics['mean_edge'] == 70.0
        assert metrics['median_edge'] == 75.0
        assert metrics['n_positive_edge'] == 3
        assert metrics['n_negative_edge'] == 1
    
    def test_calculate_edge_metrics_empty(self):
        """Test edge metrics calculation with empty data"""
        runner = CounterfactualRunner(Mock(), CounterfactualConfig(
            start_date='2024-01-01',
            end_date='2024-12-31'
        ))
        
        metrics = runner._calculate_edge_metrics([])
        
        assert metrics['mean_edge'] == 0.0
        assert metrics['median_edge'] == 0.0
        assert metrics['n_positive_edge'] == 0


class TestRiskMetrics:
    """Test risk-adjusted metrics calculation"""
    
    def test_calculate_risk_metrics_with_data(self):
        """Test risk metrics with valid data"""
        results = [
            {'realized': {'pnl_bp_t5': 100.0}, 'score': 85.0, 'dt_trade': datetime(2024, 1, 1)},
            {'realized': {'pnl_bp_t5': 200.0}, 'score': 90.0, 'dt_trade': datetime(2024, 2, 1)},
            {'realized': {'pnl_bp_t5': -50.0}, 'score': 70.0, 'dt_trade': datetime(2024, 3, 1)},
            {'realized': {'pnl_bp_t5': 150.0}, 'score': 88.0, 'dt_trade': datetime(2024, 4, 1)},
            {'realized': {'pnl_bp_t5': 300.0}, 'score': 95.0, 'dt_trade': datetime(2024, 5, 1)},
        ]
        
        runner = CounterfactualRunner(Mock(), CounterfactualConfig(
            start_date='2024-01-01',
            end_date='2024-12-31'
        ))
        
        metrics = runner._calculate_risk_metrics(results)
        
        assert metrics['n_trades'] == 5
        assert metrics['hit_rate'] == 0.8  # 4 out of 5 positive
        assert 'sharpe' in metrics
        assert 'sortino' in metrics
        assert 'max_dd_bp' in metrics
        assert 'var_95' in metrics
        assert 'cvar_95' in metrics
    
    def test_calculate_risk_metrics_empty(self):
        """Test risk metrics with empty data"""
        runner = CounterfactualRunner(Mock(), CounterfactualConfig(
            start_date='2024-01-01',
            end_date='2024-12-31'
        ))
        
        metrics = runner._calculate_risk_metrics([])
        
        assert metrics['sharpe'] == 0.0
        assert metrics['hit_rate'] == 0.0
        assert metrics['n_trades'] == 0


class TestDriftDetection:
    """Test drift detection logic"""
    
    def test_detect_drift_sufficient_data(self):
        """Test drift detection with sufficient data"""
        # Generate correlated data (no drift)
        np.random.seed(42)
        scores = np.linspace(60, 95, 50)
        edges = scores * 10 + np.random.normal(0, 50, 50)  # Linear relationship with noise
        
        results = [
            {
                'score': float(s),
                'edge': float(e),
                'dt_trade': datetime(2024, 1, 1) + timedelta(days=i)
            }
            for i, (s, e) in enumerate(zip(scores, edges))
        ]
        
        runner = CounterfactualRunner(Mock(), CounterfactualConfig(
            start_date='2024-01-01',
            end_date='2024-12-31'
        ))
        
        drift = runner._detect_drift(results)
        
        assert 'kendall_tau' in drift
        assert 'p_value' in drift
        assert drift['n_observations'] == 50
    
    def test_detect_drift_insufficient_data(self):
        """Test drift detection with insufficient data"""
        results = [
            {'score': 85.0, 'edge': 100.0, 'dt_trade': datetime(2024, 1, 1)},
            {'score': 90.0, 'edge': 150.0, 'dt_trade': datetime(2024, 2, 1)},
        ]
        
        runner = CounterfactualRunner(Mock(), CounterfactualConfig(
            start_date='2024-01-01',
            end_date='2024-12-31'
        ))
        
        drift = runner._detect_drift(results)
        
        assert drift['drift_detected'] is False
        assert drift['kendall_tau'] is None


class TestCounterfactualID:
    """Test counterfactual ID generation"""
    
    def test_create_counterfactual_id_skip(self):
        """Test ID generation for skip counterfactual"""
        cf_id = create_counterfactual_id('event_001', 'skip')
        
        assert isinstance(cf_id, str)
        assert len(cf_id) == 32  # MD5 hash length
    
    def test_create_counterfactual_id_alt_ticker(self):
        """Test ID generation for alternative ticker"""
        cf_id = create_counterfactual_id('event_001', 'alt_ticker', 'VRTX')
        
        assert isinstance(cf_id, str)
        assert len(cf_id) == 32
    
    def test_create_counterfactual_id_consistency(self):
        """Test ID generation is consistent"""
        cf_id1 = create_counterfactual_id('event_001', 'skip')
        cf_id2 = create_counterfactual_id('event_001', 'skip')
        
        assert cf_id1 == cf_id2


class TestReportGeneration:
    """Test validation report generation"""
    
    def test_generate_report(self, tmp_path):
        """Test report generation"""
        runner = CounterfactualRunner(Mock(), CounterfactualConfig(
            start_date='2024-01-01',
            end_date='2024-12-31'
        ))
        
        results = {
            'summary': {
                'n_events': 50,
                'date_range': ('2024-01-01', '2024-12-31'),
                'avg_edge': 125.5,
                'overall_sharpe': 1.85,
                'overall_hit_rate': 0.72,
            },
            'edge_metrics': {
                'mean_edge': 125.5,
                'median_edge': 110.0,
                'std_edge': 150.0,
                'percentile_25': 50.0,
                'percentile_75': 200.0,
            },
            'risk_metrics': {
                'sharpe': 1.85,
                'sortino': 2.10,
                'hit_rate': 0.72,
                'max_dd_bp': 350.0,
                'var_95': -200.0,
                'cvar_95': -280.0,
                'n_trades': 50,
            },
            'drift_metrics': {
                'drift_detected': False,
                'kendall_tau': 0.65,
                'p_value': 0.001,
            },
        }
        
        output_path = tmp_path / "test_report.md"
        runner.generate_report(results, str(output_path))
        
        assert output_path.exists()
        
        # Check report content
        content = output_path.read_text()
        assert 'MVM Alpha Counterfactual Validation Report' in content
        assert '50' in content  # n_events
        assert '125.5' in content  # avg_edge
        assert '1.85' in content  # sharpe
        assert '72.00%' in content  # hit_rate


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
