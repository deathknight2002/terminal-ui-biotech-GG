"""
Validation module for MVM Alpha Scoring system.

This module provides comprehensive backtesting, validation, and robustness testing
capabilities for the Market-Moving Alpha Scoring system.
"""

from .mvm_backtest_enhanced import (
    EnhancedBacktestConfig,
    MVMBacktestEnhancer,
)

__all__ = [
    "EnhancedBacktestConfig",
    "MVMBacktestEnhancer",
]
