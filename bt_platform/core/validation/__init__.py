"""
MVM Alpha Production Validation Module

Comprehensive validation infrastructure for transforming MVM alpha scoring
into a robust production system with institutional-grade validation hygiene.

Components:
- mvm_backtest_enhanced: Extended historical backtesting (existing)
- purged_cv: López de Prado's purged cross-validation with embargo periods
- probability_calibration: Platt scaling and isotonic regression
- position_sizing: Quarter-Kelly with risk constraints
- drift_monitoring: PSI and KS tests for distribution drift
- stress_testing: Biotech-native stress scenarios
- production_validator: Integrated validation system with git lineage

Usage:
    from bt_platform.core.validation import ProductionValidator
    
    validator = ProductionValidator()
    result = validator.run_full_validation(historical_data, current_portfolio)
    validator.generate_validation_report(result, "validation_report.md")
"""

# Existing components
from .mvm_backtest_enhanced import (
    EnhancedBacktestConfig,
    MVMBacktestEnhancer,
)

# New production validation components
from .purged_cv import PurgedKFold, EmbargoValidator, PurgedCVConfig
from .probability_calibration import (
    PlattScaling,
    IsotonicCalibration,
    AutoCalibrator,
    CalibrationEvaluator,
    CalibrationMetrics
)
from .position_sizing import (
    PositionSizer,
    PositionSizingConfig,
    PositionRecommendation,
    KellyCriterion
)
from .drift_monitoring import (
    DriftMonitor,
    DriftMetrics,
    DriftAlert,
    PSICalculator,
    KSTestCalculator
)
from .stress_testing import (
    BiotechStressTester,
    StressScenario,
    StressTestResult
)
from .production_validator import (
    ProductionValidator,
    ProductionValidationResult,
    GitLineage
)

__all__ = [
    # Existing
    "EnhancedBacktestConfig",
    "MVMBacktestEnhancer",
    
    # Purged CV
    'PurgedKFold',
    'EmbargoValidator',
    'PurgedCVConfig',
    
    # Probability Calibration
    'PlattScaling',
    'IsotonicCalibration',
    'AutoCalibrator',
    'CalibrationEvaluator',
    'CalibrationMetrics',
    
    # Position Sizing
    'PositionSizer',
    'PositionSizingConfig',
    'PositionRecommendation',
    'KellyCriterion',
    
    # Drift Monitoring
    'DriftMonitor',
    'DriftMetrics',
    'DriftAlert',
    'PSICalculator',
    'KSTestCalculator',
    
    # Stress Testing
    'BiotechStressTester',
    'StressScenario',
    'StressTestResult',
    
    # Production Validation
    'ProductionValidator',
    'ProductionValidationResult',
    'GitLineage',
]

__version__ = '2.0.0'
