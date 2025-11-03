"""
Demo script for the Production Validation System

This demonstrates the full validation pipeline integrating all components.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import numpy as np
import pandas as pd
from datetime import datetime

from bt_platform.core.validation.production_validator import ProductionValidator

if __name__ == "__main__":
    print("=" * 80)
    print("Production Validation System Demo")
    print("=" * 80)
    
    # Generate synthetic historical data
    np.random.seed(42)
    n_events = 100
    
    dates = pd.date_range(start='2023-01-01', periods=n_events, freq='W')
    historical_data = pd.DataFrame({
        'date': dates,
        'ticker': [f'TICKER{i%10}' for i in range(n_events)],
        'mvm_score': np.random.uniform(50, 95, n_events),
        'actual_outcome': (np.random.random(n_events) > 0.3).astype(int),
        'realized_move_pct': np.random.normal(15, 25, n_events),
        'expected_gain_pct': np.random.uniform(0.20, 0.50, n_events),
        'expected_loss_pct': np.random.uniform(0.10, 0.25, n_events)
    })
    
    # Create current portfolio
    current_portfolio = pd.DataFrame([
        {
            'ticker': 'TEST1',
            'win_prob': 0.80,
            'expected_gain_pct': 0.35,
            'expected_loss_pct': 0.15,
            'current_price': 50.0,
            'avg_daily_volume': 500_000,
            'realized_volatility': 0.45,
            'position_pct': 0.08,
            'mvm_score': 85,
            'phase': 'Phase3',
            'market_cap': 800e6
        },
        {
            'ticker': 'TEST2',
            'win_prob': 0.75,
            'expected_gain_pct': 0.30,
            'expected_loss_pct': 0.18,
            'current_price': 30.0,
            'avg_daily_volume': 300_000,
            'realized_volatility': 0.40,
            'position_pct': 0.06,
            'mvm_score': 78,
            'phase': 'Phase2',
            'market_cap': 600e6
        }
    ])
    
    print(f"\n📊 Dataset Overview")
    print(f"Historical events: {len(historical_data)}")
    print(f"Date range: {historical_data['date'].min().date()} to {historical_data['date'].max().date()}")
    print(f"Current portfolio: {len(current_portfolio)} positions")
    print(f"Total exposure: {current_portfolio['position_pct'].sum():.0%}")
    
    # Initialize validator
    validator = ProductionValidator(
        n_cv_splits=3,
        embargo_pct=0.01,
        psi_threshold=0.2
    )
    
    # Run full validation
    result = validator.run_full_validation(
        historical_data=historical_data,
        current_portfolio=current_portfolio,
        baseline_features=historical_data.iloc[:50]  # First 50 events as baseline
    )
    
    # Generate report
    print("\n" + "=" * 80)
    print("VALIDATION REPORT")
    print("=" * 80)
    report = validator.generate_validation_report(result)
    print(report)
    
    # Save to file
    output_file = f"validation_report_{result.validation_id}.md"
    validator.generate_validation_report(result, output_file)
    
    print("\n" + "=" * 80)
    print("✅ Production validation demo complete!")
    print("=" * 80)
