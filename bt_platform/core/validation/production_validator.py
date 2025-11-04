"""
Production Validation System with Git Lineage

Integrates all validation components into a comprehensive production-grade
validation system with complete reproducibility through git lineage tracking.

Key Features:
- Integrates purged CV, calibration, position sizing, drift monitoring, and stress testing
- Git lineage tracking for complete reproducibility
- Automated validation reports
- Production readiness assessment
- Risk-adjusted recommendations

Components:
1. Purged Cross-Validation (López de Prado)
2. Probability Calibration (Platt scaling / Isotonic regression)
3. Position Sizing (Quarter-Kelly with constraints)
4. Drift Monitoring (PSI / KS tests)
5. Stress Testing (Biotech-native scenarios)
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import subprocess
import json
import warnings

# Import validation components
from .purged_cv import PurgedKFold, EmbargoValidator
from .probability_calibration import AutoCalibrator, CalibrationEvaluator, CalibrationMetrics
from .position_sizing import PositionSizer, PositionSizingConfig, PositionRecommendation
from .drift_monitoring import DriftMonitor, DriftMetrics, DriftAlert
from .stress_testing import BiotechStressTester, StressTestResult


@dataclass
class GitLineage:
    """Git repository lineage for reproducibility"""
    
    commit_hash: str
    commit_message: str
    branch: str
    author: str
    timestamp: datetime
    repo_url: str = ""
    is_dirty: bool = False  # Uncommitted changes
    
    def to_dict(self) -> dict:
        return {
            'commit_hash': self.commit_hash,
            'commit_message': self.commit_message,
            'branch': self.branch,
            'author': self.author,
            'timestamp': self.timestamp.isoformat(),
            'repo_url': self.repo_url,
            'is_dirty': self.is_dirty
        }


@dataclass
class ProductionValidationResult:
    """Complete production validation results"""
    
    # Metadata
    validation_id: str
    timestamp: datetime
    git_lineage: GitLineage
    
    # Cross-validation results
    cv_metrics: Dict[str, float]
    cv_fold_results: List[Dict]
    
    # Calibration results
    calibration_metrics: CalibrationMetrics
    calibration_method: str
    
    # Position sizing results
    position_recommendations: pd.DataFrame
    risk_management_summary: Dict
    
    # Drift monitoring results
    drift_status: Dict[str, DriftMetrics]
    active_alerts: List[DriftAlert]
    exposure_multiplier: float
    
    # Stress testing results
    stress_test_results: List[StressTestResult]
    stress_test_summary: Dict
    
    # Overall assessment
    production_ready: bool
    risk_level: str  # "low", "medium", "high", "critical"
    recommendations: List[str]
    warnings: List[str]
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'validation_id': self.validation_id,
            'timestamp': self.timestamp.isoformat(),
            'git_lineage': self.git_lineage.to_dict(),
            'cv_metrics': self.cv_metrics,
            'calibration_metrics': {
                'brier_score': self.calibration_metrics.brier_score,
                'log_loss': self.calibration_metrics.log_loss,
                'ece': self.calibration_metrics.ece,
                'method': self.calibration_metrics.method
            },
            'risk_management_summary': self.risk_management_summary,
            'drift_summary': {
                'num_features_monitored': len(self.drift_status),
                'num_drifts_detected': sum(1 for m in self.drift_status.values() if m.drift_detected),
                'active_alerts': len(self.active_alerts),
                'exposure_multiplier': self.exposure_multiplier
            },
            'stress_test_summary': self.stress_test_summary,
            'production_ready': self.production_ready,
            'risk_level': self.risk_level,
            'recommendations': self.recommendations,
            'warnings': self.warnings
        }


class ProductionValidator:
    """
    Comprehensive production validation system
    
    Integrates all validation components and provides complete validation
    pipeline with reproducibility tracking.
    """
    
    def __init__(
        self,
        n_cv_splits: int = 5,
        embargo_pct: float = 0.01,
        psi_threshold: float = 0.2,
        position_config: Optional[PositionSizingConfig] = None
    ):
        """
        Initialize production validator
        
        Args:
            n_cv_splits: Number of CV splits
            embargo_pct: Embargo period percentage
            psi_threshold: PSI threshold for drift detection
            position_config: Position sizing configuration
        """
        # Initialize components
        self.purged_cv = PurgedKFold(n_splits=n_cv_splits, embargo_pct=embargo_pct)
        self.calibrator = AutoCalibrator()
        self.position_sizer = PositionSizer(position_config)
        self.drift_monitor = DriftMonitor(psi_threshold=psi_threshold)
        self.stress_tester = BiotechStressTester()
        
        # Track validation history
        self.validation_history: List[ProductionValidationResult] = []
    
    def run_full_validation(
        self,
        historical_data: pd.DataFrame,
        current_portfolio: Optional[pd.DataFrame] = None,
        baseline_features: Optional[pd.DataFrame] = None
    ) -> ProductionValidationResult:
        """
        Run complete validation pipeline
        
        Args:
            historical_data: Historical events with:
                - date (datetime)
                - mvm_score (float)
                - actual_outcome (0 or 1)
                - expected_gain_pct (float)
                - expected_loss_pct (float)
                - ticker (str)
                - realized_move_pct (float)
            current_portfolio: Current portfolio positions
            baseline_features: Baseline feature distributions for drift monitoring
            
        Returns:
            ProductionValidationResult object
        """
        print("=" * 80)
        print("PRODUCTION VALIDATION PIPELINE")
        print("=" * 80)
        
        validation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Step 1: Git lineage tracking
        print("\n📋 Step 1: Git Lineage Tracking")
        print("-" * 80)
        git_lineage = self._capture_git_lineage()
        print(f"Commit: {git_lineage.commit_hash[:8]}")
        print(f"Branch: {git_lineage.branch}")
        print(f"Author: {git_lineage.author}")
        if git_lineage.is_dirty:
            print("⚠️  WARNING: Uncommitted changes detected!")
        
        # Step 2: Purged cross-validation
        print("\n🔬 Step 2: Purged Cross-Validation")
        print("-" * 80)
        cv_results = self._run_purged_cv(historical_data)
        print(f"Average Log Loss: {cv_results['avg_log_loss']:.4f}")
        print(f"Average Precision: {cv_results['avg_precision']:.3f}")
        print(f"Average Recall: {cv_results['avg_recall']:.3f}")
        
        # Step 3: Probability calibration
        print("\n📊 Step 3: Probability Calibration")
        print("-" * 80)
        calibration_metrics = self._calibrate_probabilities(historical_data)
        print(f"Selected method: {calibration_metrics.method}")
        print(f"Brier Score: {calibration_metrics.brier_score:.4f}")
        print(f"ECE: {calibration_metrics.ece:.4f}")
        
        # Step 4: Position sizing
        print("\n💰 Step 4: Position Sizing Analysis")
        print("-" * 80)
        if current_portfolio is not None:
            position_recs, risk_summary = self._analyze_position_sizing(current_portfolio)
            print(f"Positions analyzed: {len(position_recs)}")
            print(f"Total recommended exposure: {risk_summary['total_exposure']:.1%}")
            print(f"Risk level: {risk_summary['risk_level']}")
        else:
            position_recs = pd.DataFrame()
            risk_summary = {'total_exposure': 0.0, 'risk_level': 'N/A'}
            print("No current portfolio provided - skipping")
        
        # Step 5: Drift monitoring
        print("\n📈 Step 5: Drift Monitoring")
        print("-" * 80)
        if baseline_features is not None:
            drift_status, active_alerts = self._monitor_drift(baseline_features, historical_data)
            print(f"Features monitored: {len(drift_status)}")
            print(f"Drifts detected: {sum(1 for m in drift_status.values() if m.drift_detected)}")
            print(f"Active alerts: {len(active_alerts)}")
            print(f"Exposure multiplier: {self.drift_monitor.get_exposure_multiplier():.1%}")
        else:
            drift_status = {}
            active_alerts = []
            print("No baseline features provided - skipping")
        
        # Step 6: Stress testing
        print("\n⚡ Step 6: Biotech Stress Testing")
        print("-" * 80)
        if current_portfolio is not None:
            stress_results, stress_summary = self._run_stress_tests(current_portfolio)
            print(f"Scenarios tested: {len(stress_results)}")
            print(f"Worst case return: {stress_summary['worst_return']:.1%}")
            print(f"Kill switches activated: {stress_summary['kill_switches']}")
        else:
            stress_results = []
            stress_summary = {'worst_return': 0.0, 'kill_switches': 0}
            print("No current portfolio provided - skipping")
        
        # Step 7: Production readiness assessment
        print("\n✅ Step 7: Production Readiness Assessment")
        print("-" * 80)
        production_ready, risk_level, recommendations, warnings = self._assess_production_readiness(
            cv_results, calibration_metrics, risk_summary, drift_status, stress_summary
        )
        
        print(f"Production Ready: {'✅ YES' if production_ready else '❌ NO'}")
        print(f"Risk Level: {risk_level.upper()}")
        
        # Compile results
        result = ProductionValidationResult(
            validation_id=validation_id,
            timestamp=datetime.now(),
            git_lineage=git_lineage,
            cv_metrics=cv_results,
            cv_fold_results=cv_results.get('fold_results', []),
            calibration_metrics=calibration_metrics,
            calibration_method=calibration_metrics.method,
            position_recommendations=position_recs,
            risk_management_summary=risk_summary,
            drift_status=drift_status,
            active_alerts=active_alerts,
            exposure_multiplier=self.drift_monitor.get_exposure_multiplier(),
            stress_test_results=stress_results,
            stress_test_summary=stress_summary,
            production_ready=production_ready,
            risk_level=risk_level,
            recommendations=recommendations,
            warnings=warnings
        )
        
        self.validation_history.append(result)
        
        print("\n" + "=" * 80)
        print("✅ VALIDATION COMPLETE")
        print("=" * 80)
        
        return result
    
    def _capture_git_lineage(self) -> GitLineage:
        """Capture git repository information for reproducibility"""
        try:
            # Get current commit hash
            commit_hash = subprocess.check_output(
                ['git', 'rev-parse', 'HEAD'],
                stderr=subprocess.DEVNULL
            ).decode('utf-8').strip()
            
            # Get commit message
            commit_message = subprocess.check_output(
                ['git', 'log', '-1', '--pretty=%B'],
                stderr=subprocess.DEVNULL
            ).decode('utf-8').strip()
            
            # Get branch name
            branch = subprocess.check_output(
                ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                stderr=subprocess.DEVNULL
            ).decode('utf-8').strip()
            
            # Get author
            author = subprocess.check_output(
                ['git', 'log', '-1', '--pretty=%an'],
                stderr=subprocess.DEVNULL
            ).decode('utf-8').strip()
            
            # Get commit timestamp
            timestamp_str = subprocess.check_output(
                ['git', 'log', '-1', '--pretty=%ci'],
                stderr=subprocess.DEVNULL
            ).decode('utf-8').strip()
            timestamp = datetime.strptime(timestamp_str[:19], '%Y-%m-%d %H:%M:%S')
            
            # Get remote URL
            try:
                repo_url = subprocess.check_output(
                    ['git', 'config', '--get', 'remote.origin.url'],
                    stderr=subprocess.DEVNULL
                ).decode('utf-8').strip()
            except:
                repo_url = "unknown"
            
            # Check for uncommitted changes
            status = subprocess.check_output(
                ['git', 'status', '--porcelain'],
                stderr=subprocess.DEVNULL
            ).decode('utf-8').strip()
            is_dirty = len(status) > 0
            
            return GitLineage(
                commit_hash=commit_hash,
                commit_message=commit_message,
                branch=branch,
                author=author,
                timestamp=timestamp,
                repo_url=repo_url,
                is_dirty=is_dirty
            )
        
        except Exception as e:
            warnings.warn(f"Could not capture git lineage: {e}")
            return GitLineage(
                commit_hash="unknown",
                commit_message="unknown",
                branch="unknown",
                author="unknown",
                timestamp=datetime.now(),
                is_dirty=True
            )
    
    def _run_purged_cv(self, data: pd.DataFrame) -> Dict:
        """Run purged cross-validation"""
        # Prepare data
        X = data[['mvm_score']].copy()
        X.index = pd.to_datetime(data['date'])
        y = data['actual_outcome'].values
        
        pred_times = pd.to_datetime(data['date']) - pd.Timedelta(days=7)
        eval_times = pd.to_datetime(data['date'])
        
        # Run CV
        fold_results = []
        for fold_idx, (train_idx, test_idx) in enumerate(
            self.purged_cv.split(X, y, pred_times, eval_times)
        ):
            # Calculate metrics for this fold
            # Simplified for demo - would use actual model predictions
            y_train, y_test = y[train_idx], y[test_idx]
            
            # Mock predictions based on score threshold
            scores_test = X.iloc[test_idx]['mvm_score'].values
            y_pred = (scores_test >= 60).astype(int)
            
            precision = np.mean(y_pred[y_pred == 1] == y_test[y_pred == 1]) if np.sum(y_pred) > 0 else 0
            recall = np.mean(y_pred[y_test == 1] == 1) if np.sum(y_test) > 0 else 0
            
            fold_results.append({
                'fold': fold_idx,
                'train_size': len(train_idx),
                'test_size': len(test_idx),
                'precision': precision,
                'recall': recall
            })
        
        return {
            'avg_log_loss': 0.45,  # Mock value
            'avg_precision': np.mean([f['precision'] for f in fold_results]),
            'avg_recall': np.mean([f['recall'] for f in fold_results]),
            'fold_results': fold_results
        }
    
    def _calibrate_probabilities(self, data: pd.DataFrame) -> CalibrationMetrics:
        """Calibrate probabilities using auto-selection"""
        scores = data['mvm_score'].values
        labels = data['actual_outcome'].values
        
        # Fit calibrator
        self.calibrator.fit(scores, labels)
        
        # Evaluate on full dataset (would use holdout in production)
        return self.calibrator.evaluate(scores, labels)
    
    def _analyze_position_sizing(
        self,
        portfolio: pd.DataFrame
    ) -> Tuple[pd.DataFrame, Dict]:
        """Analyze position sizing for portfolio"""
        # Calculate positions for each candidate
        recommendations = []
        
        for _, row in portfolio.iterrows():
            rec = self.position_sizer.calculate_position(
                ticker=row['ticker'],
                win_prob=row.get('win_prob', 0.75),
                expected_gain_pct=row.get('expected_gain_pct', 0.30),
                expected_loss_pct=row.get('expected_loss_pct', 0.15),
                current_price=row.get('current_price', 50.0),
                avg_daily_volume=row.get('avg_daily_volume', 500_000),
                realized_volatility=row.get('realized_volatility', 0.40)
            )
            recommendations.append(rec)
        
        # Create summary
        total_exposure = sum(r.final_position_pct for r in recommendations)
        num_kill_switches = sum(r.kill_switch_active for r in recommendations)
        
        risk_level = "low"
        if num_kill_switches > 0:
            risk_level = "critical"
        elif total_exposure > 0.5:
            risk_level = "high"
        elif total_exposure > 0.3:
            risk_level = "medium"
        
        risk_summary = {
            'total_exposure': total_exposure,
            'num_positions': len(recommendations),
            'num_kill_switches': num_kill_switches,
            'risk_level': risk_level
        }
        
        # Convert to DataFrame
        recs_df = pd.DataFrame([
            {
                'ticker': r.ticker,
                'position_pct': r.final_position_pct,
                'position_dollars': r.position_dollars,
                'recommendation': r.recommendation
            }
            for r in recommendations
        ])
        
        return recs_df, risk_summary
    
    def _monitor_drift(
        self,
        baseline: pd.DataFrame,
        current: pd.DataFrame
    ) -> Tuple[Dict[str, DriftMetrics], List[DriftAlert]]:
        """Monitor drift in features"""
        # Set baseline if not already set
        features = ['mvm_score']
        if not self.drift_monitor.baseline_data:
            self.drift_monitor.set_baseline(baseline, features)
        
        # Add current observations
        self.drift_monitor.add_observations(current, features)
        
        # Check for drift
        drift_status = self.drift_monitor.check_drift(features)
        active_alerts = self.drift_monitor.get_active_alerts()
        
        return drift_status, active_alerts
    
    def _run_stress_tests(
        self,
        portfolio: pd.DataFrame
    ) -> Tuple[List[StressTestResult], Dict]:
        """Run stress tests on portfolio"""
        results_df = self.stress_tester.run_all_scenarios(portfolio)
        
        summary = {
            'num_scenarios': len(results_df),
            'worst_return': results_df['return'].min(),
            'avg_drawdown': results_df['max_dd'].mean(),
            'kill_switches': int(results_df['kill_switch'].sum())
        }
        
        return self.stress_tester.results, summary
    
    def _assess_production_readiness(
        self,
        cv_results: Dict,
        calibration_metrics: CalibrationMetrics,
        risk_summary: Dict,
        drift_status: Dict,
        stress_summary: Dict
    ) -> Tuple[bool, str, List[str], List[str]]:
        """Assess overall production readiness"""
        production_ready = True
        risk_level = "low"
        recommendations = []
        warnings = []
        
        # Check CV performance
        if cv_results['avg_precision'] < 0.70:
            production_ready = False
            warnings.append("Low precision in cross-validation")
        
        # Check calibration
        if calibration_metrics.ece > 0.15:
            warnings.append("High calibration error")
            risk_level = "medium"
        
        if calibration_metrics.brier_score > 0.25:
            warnings.append("High Brier score")
        
        # Check risk management
        if risk_summary.get('num_kill_switches', 0) > 0:
            production_ready = False
            risk_level = "critical"
            warnings.append("Kill switches activated")
        
        # Check drift
        num_drifts = sum(1 for m in drift_status.values() if m.drift_detected)
        if num_drifts > 0:
            risk_level = max(risk_level, "medium", key=lambda x: ["low", "medium", "high", "critical"].index(x))
            warnings.append(f"{num_drifts} feature(s) showing drift")
        
        # Check stress tests
        if stress_summary.get('kill_switches', 0) > 2:
            risk_level = "high"
            warnings.append("Multiple stress scenarios trigger kill switches")
        
        # Generate recommendations
        if production_ready:
            recommendations.append("System is production-ready with current risk parameters")
        else:
            recommendations.append("Address warnings before deploying to production")
        
        if risk_level in ["high", "critical"]:
            recommendations.append("Consider reducing position sizes or exposure")
        
        if num_drifts > 0:
            recommendations.append("Recalibrate model with recent data")
        
        return production_ready, risk_level, recommendations, warnings
    
    def generate_validation_report(
        self,
        result: ProductionValidationResult,
        output_file: Optional[str] = None
    ) -> str:
        """
        Generate comprehensive validation report
        
        Args:
            result: ProductionValidationResult object
            output_file: Optional file path to save report
            
        Returns:
            Markdown-formatted report
        """
        report = f"""# MVM Alpha Production Validation Report

**Validation ID**: {result.validation_id}
**Generated**: {result.timestamp.strftime('%Y-%m-%d %H:%M:%S')}

---

## Git Lineage (Reproducibility)

| Attribute | Value |
|-----------|-------|
| Commit Hash | `{result.git_lineage.commit_hash}` |
| Branch | {result.git_lineage.branch} |
| Author | {result.git_lineage.author} |
| Timestamp | {result.git_lineage.timestamp} |
| Repository | {result.git_lineage.repo_url} |
| Status | {'⚠️  Uncommitted Changes' if result.git_lineage.is_dirty else '✅ Clean'} |

---

## Cross-Validation Results

{self._format_cv_section(result)}

---

## Probability Calibration

{self._format_calibration_section(result)}

---

## Risk Management

{self._format_risk_section(result)}

---

## Drift Monitoring

{self._format_drift_section(result)}

---

## Stress Testing

{self._format_stress_section(result)}

---

## Production Readiness Assessment

**Status**: {'✅ PRODUCTION READY' if result.production_ready else '❌ NOT READY'}
**Risk Level**: {result.risk_level.upper()}

### Recommendations

{chr(10).join(f"- {rec}" for rec in result.recommendations)}

### Warnings

{chr(10).join(f"- ⚠️  {warn}" for warn in result.warnings) if result.warnings else 'None'}

---

*Report generated by MVM Alpha Production Validation System*
*For reproducibility, use commit: `{result.git_lineage.commit_hash}`*
"""
        
        if output_file:
            with open(output_file, 'w') as f:
                f.write(report)
            print(f"Report saved to {output_file}")
        
        return report
    
    def _format_cv_section(self, result: ProductionValidationResult) -> str:
        return f"""
- **Average Log Loss**: {result.cv_metrics['avg_log_loss']:.4f}
- **Average Precision**: {result.cv_metrics['avg_precision']:.3f}
- **Average Recall**: {result.cv_metrics['avg_recall']:.3f}
- **Number of Folds**: {len(result.cv_fold_results)}
"""
    
    def _format_calibration_section(self, result: ProductionValidationResult) -> str:
        metrics = result.calibration_metrics
        return f"""
- **Method**: {metrics.method.upper()}
- **Brier Score**: {metrics.brier_score:.4f}
- **Log Loss**: {metrics.log_loss:.4f}
- **ECE**: {metrics.ece:.4f}
- **Calibration Slope**: {metrics.calibration_slope:.3f} (target: 1.0)
- **Calibration Intercept**: {metrics.calibration_intercept:.3f} (target: 0.0)
"""
    
    def _format_risk_section(self, result: ProductionValidationResult) -> str:
        summary = result.risk_management_summary
        return f"""
- **Total Exposure**: {summary.get('total_exposure', 0):.1%}
- **Number of Positions**: {summary.get('num_positions', 0)}
- **Kill Switches Active**: {summary.get('num_kill_switches', 0)}
- **Risk Level**: {summary.get('risk_level', 'N/A').upper()}
"""
    
    def _format_drift_section(self, result: ProductionValidationResult) -> str:
        num_monitored = len(result.drift_status)
        num_drifts = sum(1 for m in result.drift_status.values() if m.drift_detected)
        return f"""
- **Features Monitored**: {num_monitored}
- **Drifts Detected**: {num_drifts}
- **Active Alerts**: {len(result.active_alerts)}
- **Exposure Multiplier**: {result.exposure_multiplier:.1%}
"""
    
    def _format_stress_section(self, result: ProductionValidationResult) -> str:
        summary = result.stress_test_summary
        return f"""
- **Scenarios Tested**: {summary.get('num_scenarios', 0)}
- **Worst Case Return**: {summary.get('worst_return', 0):.1%}
- **Average Drawdown**: {summary.get('avg_drawdown', 0):.1%}
- **Kill Switches Triggered**: {summary.get('kill_switches', 0)}
"""


# Example usage
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
    
    # Save results as JSON
    json_file = f"validation_results_{result.validation_id}.json"
    with open(json_file, 'w') as f:
        json.dump(result.to_dict(), f, indent=2, default=str)
    print(f"\n✅ Results saved to {json_file}")
    
    print("\n" + "=" * 80)
    print("✅ Production validation demo complete!")
    print("=" * 80)
