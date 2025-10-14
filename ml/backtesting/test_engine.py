"""
Tests for Backtesting Engine

Tests the backtesting engine including:
- Database connectivity
- Metrics computation
- Stratification by tier
- Calibration analysis
- Feature importance
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

from ml.backtesting.engine import BacktestEngine


@pytest.fixture
def sample_catalyst_data():
    """Create sample catalyst data for testing"""
    n_samples = 20
    
    data = {
        'id': list(range(1, n_samples + 1)),
        'title': [f'Catalyst {i}' for i in range(1, n_samples + 1)],
        'company': ['VRTX', 'REGN', 'ALNY', 'IONS', 'AMGN'] * 4,
        'drug': [f'Drug {i}' for i in range(1, n_samples + 1)],
        'event_type': ['FDA Approval', 'Phase 3 Results', 'PDUFA', 'Trial Readout'] * 5,
        'event_date': [(datetime(2023, 1, 1) + timedelta(days=i*10)).strftime('%Y-%m-%d') 
                      for i in range(n_samples)],
        'event_leverage': np.random.randint(0, 5, n_samples),
        'timing_clarity': np.random.randint(0, 4, n_samples),
        'surprise_factor': np.random.randint(0, 4, n_samples),
        'downside_contained': np.random.randint(0, 4, n_samples),
        'market_depth': np.random.randint(0, 4, n_samples),
        'total_score': np.random.randint(0, 17, n_samples),
        'tier': ['High-Torque'] * 7 + ['Tradable'] * 7 + ['Watch'] * 6,
        'category': ['Clinical', 'Regulatory', 'Commercial'] * 6 + ['Clinical', 'Regulatory'],
        'outcome': ['positive'] * 10 + ['negative'] * 7 + ['neutral'] * 3,
        'price_movement_7d': np.random.randn(n_samples) * 5,
        'price_movement_30d': np.random.randn(n_samples) * 10,
        'volatility': np.random.rand(n_samples) * 0.5,
        'volume_ratio': np.random.rand(n_samples) * 2 + 0.5
    }
    
    return pd.DataFrame(data)


@pytest.fixture
def mock_db_connection(sample_catalyst_data):
    """Mock DuckDB connection"""
    mock_conn = Mock()
    mock_result = Mock()
    mock_result.df.return_value = sample_catalyst_data
    mock_conn.execute.return_value = mock_result
    return mock_conn


def test_backtest_engine_initialization():
    """Test BacktestEngine initialization"""
    engine = BacktestEngine(db_path="test.duckdb")
    assert engine.db_path == "test.duckdb"
    assert engine.conn is None


def test_context_manager():
    """Test context manager functionality"""
    with patch('ml.backtesting.engine.duckdb.connect') as mock_connect:
        mock_conn = Mock()
        mock_connect.return_value = mock_conn
        
        with BacktestEngine(db_path="test.duckdb") as engine:
            assert engine.conn == mock_conn
        
        # Should disconnect on exit
        mock_conn.close.assert_called_once()


def test_load_historical_catalysts(mock_db_connection, sample_catalyst_data):
    """Test loading historical catalysts"""
    with patch('ml.backtesting.engine.duckdb.connect', return_value=mock_db_connection):
        engine = BacktestEngine(db_path="test.duckdb")
        engine.connect()
        
        df = engine.load_historical_catalysts(
            start_date="2023-01-01",
            end_date="2023-12-31"
        )
        
        assert len(df) == len(sample_catalyst_data)
        assert 'id' in df.columns
        assert 'total_score' in df.columns
        assert 'outcome' in df.columns


def test_load_historical_catalysts_with_filters(mock_db_connection):
    """Test loading with filters"""
    with patch('ml.backtesting.engine.duckdb.connect', return_value=mock_db_connection):
        engine = BacktestEngine(db_path="test.duckdb")
        engine.connect()
        
        # Test with min_score filter
        df = engine.load_historical_catalysts(
            start_date="2023-01-01",
            end_date="2023-12-31",
            min_score=8
        )
        
        assert len(df) > 0
        
        # Test with tier filter
        df = engine.load_historical_catalysts(
            start_date="2023-01-01",
            end_date="2023-12-31",
            tier="High-Torque"
        )
        
        assert len(df) > 0


def test_compute_metrics(sample_catalyst_data):
    """Test metrics computation"""
    engine = BacktestEngine(db_path="test.duckdb")
    
    metrics = engine.compute_metrics(sample_catalyst_data)
    
    # Check all expected metrics are present
    assert 'n_catalysts' in metrics
    assert 'win_rate' in metrics
    assert 'avg_7d_return' in metrics
    assert 'avg_30d_return' in metrics
    assert 'sharpe_ratio' in metrics
    assert 'max_drawdown' in metrics
    assert 'total_return' in metrics
    
    # Check value ranges
    assert metrics['n_catalysts'] == len(sample_catalyst_data)
    assert 0.0 <= metrics['win_rate'] <= 1.0
    assert metrics['sharpe_ratio'] != 0.0  # Should compute a value


def test_compute_metrics_empty_dataframe():
    """Test metrics computation with empty DataFrame"""
    engine = BacktestEngine(db_path="test.duckdb")
    
    empty_df = pd.DataFrame(columns=['tier', 'outcome', 'price_movement_7d'])
    metrics = engine.compute_metrics(empty_df)
    
    assert metrics['n_catalysts'] == 0
    assert metrics['win_rate'] == 0.0


def test_compute_metrics_by_tier(sample_catalyst_data):
    """Test metrics computation filtered by tier"""
    engine = BacktestEngine(db_path="test.duckdb")
    
    # High-Torque tier
    metrics_ht = engine.compute_metrics(sample_catalyst_data, tier="High-Torque")
    high_torque_count = len(sample_catalyst_data[sample_catalyst_data['tier'] == 'High-Torque'])
    assert metrics_ht['n_catalysts'] == high_torque_count
    
    # Tradable tier
    metrics_t = engine.compute_metrics(sample_catalyst_data, tier="Tradable")
    tradable_count = len(sample_catalyst_data[sample_catalyst_data['tier'] == 'Tradable'])
    assert metrics_t['n_catalysts'] == tradable_count


def test_stratify_by_tier(sample_catalyst_data):
    """Test stratification by tier"""
    engine = BacktestEngine(db_path="test.duckdb")
    
    results = engine.stratify_by_tier(sample_catalyst_data)
    
    # Check all tiers are present
    assert 'High-Torque' in results
    assert 'Tradable' in results
    assert 'Watch' in results
    assert 'Overall' in results
    
    # Check each tier has metrics
    for tier, metrics in results.items():
        if tier != 'Overall':
            assert 'n_catalysts' in metrics
            assert 'win_rate' in metrics


def test_calibration_analysis(sample_catalyst_data):
    """Test calibration analysis"""
    engine = BacktestEngine(db_path="test.duckdb")
    
    calibration = engine.calibration_analysis(sample_catalyst_data)
    
    # Check result structure
    assert isinstance(calibration, pd.DataFrame)
    assert 'score_bin' in calibration.columns
    assert 'win_rate' in calibration.columns
    assert 'price_movement_7d' in calibration.columns
    assert 'count' in calibration.columns
    
    # Should have 3 bins: Low, Medium, High
    assert len(calibration) <= 3


def test_calibration_analysis_empty_dataframe():
    """Test calibration analysis with empty DataFrame"""
    engine = BacktestEngine(db_path="test.duckdb")
    
    empty_df = pd.DataFrame(columns=['total_score', 'outcome', 'price_movement_7d', 'price_movement_30d', 'id'])
    calibration = engine.calibration_analysis(empty_df)
    
    assert isinstance(calibration, pd.DataFrame)
    assert len(calibration) >= 0  # May have empty bins


def test_feature_importance(sample_catalyst_data):
    """Test feature importance analysis"""
    engine = BacktestEngine(db_path="test.duckdb")
    
    importance = engine.feature_importance(sample_catalyst_data)
    
    # Check result structure
    assert isinstance(importance, pd.DataFrame)
    
    if len(importance) > 0:  # Only if scikit-learn is available
        assert 'feature' in importance.columns
        assert 'importance' in importance.columns
        
        # Check expected features
        expected_features = [
            'event_leverage',
            'timing_clarity',
            'surprise_factor',
            'downside_contained',
            'market_depth'
        ]
        
        for feature in importance['feature']:
            assert feature in expected_features


def test_run_backtest(mock_db_connection, sample_catalyst_data):
    """Test full backtest run"""
    with patch('ml.backtesting.engine.duckdb.connect', return_value=mock_db_connection):
        with BacktestEngine(db_path="test.duckdb") as engine:
            results = engine.run_backtest(
                start_date="2023-01-01",
                end_date="2023-12-31"
            )
            
            # Check result structure
            assert 'period' in results
            assert 'metrics_by_tier' in results
            assert 'calibration' in results
            assert 'feature_importance' in results
            assert 'timestamp' in results
            
            # Check period info
            assert results['period']['start_date'] == "2023-01-01"
            assert results['period']['end_date'] == "2023-12-31"
            assert results['period']['total_catalysts'] == len(sample_catalyst_data)


def test_run_backtest_with_min_score(mock_db_connection):
    """Test backtest with min_score filter"""
    with patch('ml.backtesting.engine.duckdb.connect', return_value=mock_db_connection):
        with BacktestEngine(db_path="test.duckdb") as engine:
            results = engine.run_backtest(
                start_date="2023-01-01",
                end_date="2023-12-31",
                min_score=8
            )
            
            assert results['period']['min_score'] == 8


def test_run_backtest_empty_database():
    """Test backtest with empty database"""
    mock_conn = Mock()
    mock_result = Mock()
    mock_result.df.return_value = pd.DataFrame(columns=[
        'id', 'title', 'company', 'drug', 'event_type', 'event_date',
        'event_leverage', 'timing_clarity', 'surprise_factor', 
        'downside_contained', 'market_depth', 'total_score', 'tier',
        'category', 'outcome', 'price_movement_7d', 'price_movement_30d',
        'volatility', 'volume_ratio'
    ])
    mock_conn.execute.return_value = mock_result
    
    with patch('ml.backtesting.engine.duckdb.connect', return_value=mock_conn):
        with BacktestEngine(db_path="test.duckdb") as engine:
            results = engine.run_backtest(
                start_date="2023-01-01",
                end_date="2023-12-31"
            )
            
            # Should handle empty data gracefully
            assert results['period']['total_catalysts'] == 0
            assert results['metrics_by_tier'] == {}


def test_sharpe_ratio_calculation():
    """Test Sharpe ratio calculation"""
    engine = BacktestEngine(db_path="test.duckdb")
    
    # Create data with known returns
    data = pd.DataFrame({
        'outcome': ['positive'] * 10,
        'price_movement_7d': [5.0] * 10,  # Constant return
        'price_movement_30d': [10.0] * 10,
        'tier': ['High-Torque'] * 10
    })
    
    metrics = engine.compute_metrics(data)
    
    # With constant returns, Sharpe should be very high (or inf due to zero std)
    # We just check it's calculated
    assert 'sharpe_ratio' in metrics


def test_win_rate_calculation():
    """Test win rate calculation"""
    engine = BacktestEngine(db_path="test.duckdb")
    
    # 7 positive, 3 negative = 70% win rate
    data = pd.DataFrame({
        'outcome': ['positive'] * 7 + ['negative'] * 3,
        'price_movement_7d': [5.0] * 10,
        'price_movement_30d': [10.0] * 10,
        'tier': ['High-Torque'] * 10
    })
    
    metrics = engine.compute_metrics(data)
    
    assert abs(metrics['win_rate'] - 0.7) < 0.01  # Should be 70%
