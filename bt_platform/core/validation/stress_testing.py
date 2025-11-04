"""
Biotech-Native Stress Testing Framework

Implements biotech-specific stress test scenarios including binary readout shocks,
CRL cascades, AdCom volatility, and sector drawdowns. Tests model resilience
under extreme but realistic biotech market conditions.

Key Scenarios:
- Binary Readout Shocks: ±40% moves on Phase 3 trial results
- CRL Cascades: Multiple Complete Response Letters causing sector sell-off
- AdCom Volatility: FDA Advisory Committee meeting uncertainty
- Sector Drawdowns: XBI ETF drawdowns affecting all biotech stocks

References:
- Biotech market behavior patterns (2020-2025)
- FDA regulatory event impacts
- Clinical trial outcome statistics
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Callable
from datetime import datetime
import warnings


@dataclass
class StressScenario:
    """Definition of a stress test scenario"""
    
    name: str
    description: str
    shock_type: str  # "binary_readout", "crl_cascade", "adcom", "sector_drawdown"
    shock_magnitude: float  # Primary shock magnitude (e.g., -0.40 for -40%)
    affected_tickers: List[str]
    correlation_increase: float = 0.3  # How much correlations increase during stress
    volatility_multiplier: float = 2.0  # Volatility increase factor
    duration_days: int = 5  # Duration of stress event
    
    # Scenario-specific parameters
    params: Dict = field(default_factory=dict)


@dataclass
class StressTestResult:
    """Results of a stress test scenario"""
    
    scenario_name: str
    portfolio_return: float
    max_drawdown: float
    sharpe_ratio: float
    value_at_risk_95: float
    conditional_var_95: float
    
    # Position-level results
    position_returns: Dict[str, float]
    position_drawdowns: Dict[str, float]
    
    # Model performance
    prediction_accuracy: float
    calibration_drift: float
    
    # Risk metrics
    num_positions_stopped: int
    kill_switch_activated: bool
    
    timestamp: datetime = field(default_factory=datetime.now)


class BiotechStressTester:
    """
    Biotech-specific stress testing framework
    
    Tests portfolio and model performance under extreme biotech market scenarios.
    """
    
    def __init__(self):
        self.scenarios: List[StressScenario] = []
        self.results: List[StressTestResult] = []
        self._initialize_scenarios()
    
    def _initialize_scenarios(self) -> None:
        """Initialize standard biotech stress scenarios"""
        
        # Scenario 1: Binary Readout Shock (Phase 3 failure)
        self.scenarios.append(StressScenario(
            name="Binary Readout Shock - Negative",
            description="Phase 3 trial misses primary endpoint, -40% stock move",
            shock_type="binary_readout",
            shock_magnitude=-0.40,
            affected_tickers=["PRIMARY"],
            correlation_increase=0.1,  # Limited correlation on binary events
            volatility_multiplier=3.0,
            duration_days=1,
            params={
                "event_type": "Phase3_readout",
                "outcome": "miss",
                "sector_sympathy": -0.05  # -5% sympathy move in similar biotechs
            }
        ))
        
        self.scenarios.append(StressScenario(
            name="Binary Readout Shock - Positive",
            description="Phase 3 trial beats expectations, +40% stock move",
            shock_type="binary_readout",
            shock_magnitude=0.40,
            affected_tickers=["PRIMARY"],
            correlation_increase=0.1,
            volatility_multiplier=2.5,
            duration_days=1,
            params={
                "event_type": "Phase3_readout",
                "outcome": "beat",
                "sector_sympathy": 0.03  # +3% sympathy move
            }
        ))
        
        # Scenario 2: CRL Cascade
        self.scenarios.append(StressScenario(
            name="CRL Cascade",
            description="Multiple CRLs trigger broad biotech sell-off",
            shock_type="crl_cascade",
            shock_magnitude=-0.25,
            affected_tickers=["MULTI"],  # Multiple tickers affected
            correlation_increase=0.5,  # High correlation during cascade
            volatility_multiplier=2.5,
            duration_days=10,
            params={
                "num_crls": 3,
                "crl_severity": "manufacturing",  # Manufacturing vs efficacy
                "sector_rotation": True,  # Money flows out of sector
                "investor_panic": 0.8  # High panic level
            }
        ))
        
        # Scenario 3: AdCom Volatility
        self.scenarios.append(StressScenario(
            name="AdCom Uncertainty",
            description="FDA Advisory Committee split vote causing volatility",
            shock_type="adcom",
            shock_magnitude=-0.15,  # Initial uncertainty discount
            affected_tickers=["PRIMARY"],
            correlation_increase=0.2,
            volatility_multiplier=2.0,
            duration_days=3,
            params={
                "vote_split": "6-6",  # Split vote
                "eventual_outcome": "approval",  # Final FDA decision
                "volatility_pattern": "whipsaw"  # Back and forth moves
            }
        ))
        
        # Scenario 4: Sector Drawdown (XBI crash)
        self.scenarios.append(StressScenario(
            name="Sector Drawdown - XBI -20%",
            description="Biotech sector selloff with XBI ETF down 20%",
            shock_type="sector_drawdown",
            shock_magnitude=-0.20,
            affected_tickers=["ALL"],  # All biotech positions
            correlation_increase=0.7,  # Very high correlation
            volatility_multiplier=2.0,
            duration_days=15,
            params={
                "xbi_drawdown": -0.20,
                "cause": "interest_rate_spike",  # Or "risk_off", "recession_fear"
                "flight_to_quality": True,
                "large_cap_relative": 0.5  # Large caps outperform by 50%
            }
        ))
        
        # Scenario 5: Extreme Sector Drawdown
        self.scenarios.append(StressScenario(
            name="Sector Drawdown - XBI -35%",
            description="Severe biotech bear market (2022-style)",
            shock_type="sector_drawdown",
            shock_magnitude=-0.35,
            affected_tickers=["ALL"],
            correlation_increase=0.85,
            volatility_multiplier=2.5,
            duration_days=60,
            params={
                "xbi_drawdown": -0.35,
                "cause": "risk_off",
                "liquidity_crisis": True,
                "bid_ask_widening": 3.0  # Spreads triple
            }
        ))
        
        # Scenario 6: Regulatory Shock
        self.scenarios.append(StressScenario(
            name="Regulatory Shock",
            description="FDA announces stricter approval standards",
            shock_type="sector_drawdown",
            shock_magnitude=-0.18,
            affected_tickers=["ALL"],
            correlation_increase=0.6,
            volatility_multiplier=2.0,
            duration_days=5,
            params={
                "policy_change": "stricter_endpoints",
                "affects_pipeline": True,
                "early_stage_hit": -0.25,  # Preclinical hit harder
                "late_stage_hit": -0.12  # Phase 3 less affected
            }
        ))
    
    def run_stress_test(
        self,
        portfolio: pd.DataFrame,
        scenario: StressScenario,
        position_sizer: Optional[Callable] = None
    ) -> StressTestResult:
        """
        Run single stress test scenario
        
        Args:
            portfolio: DataFrame with columns:
                - ticker
                - position_pct (e.g., 0.05 for 5%)
                - mvm_score
                - win_prob
                - phase (Preclinical, Phase1, Phase2, Phase3, Approved)
                - market_cap
            scenario: StressScenario to test
            position_sizer: Optional function to recalculate positions under stress
            
        Returns:
            StressTestResult object
        """
        print(f"\n{'=' * 60}")
        print(f"Running: {scenario.name}")
        print(f"{'=' * 60}")
        
        # Apply scenario-specific shocks
        stressed_returns = self._apply_scenario_shock(portfolio, scenario)
        
        # Calculate portfolio metrics
        portfolio_return = np.sum(
            portfolio['position_pct'].values * stressed_returns
        )
        
        # Calculate position-level results
        position_returns = dict(zip(portfolio['ticker'], stressed_returns))
        position_drawdowns = {
            ticker: min(0, ret) 
            for ticker, ret in position_returns.items()
        }
        
        # Calculate max drawdown
        cumulative_returns = np.cumprod(1 + stressed_returns * portfolio['position_pct'].values)
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdowns = (cumulative_returns - running_max) / running_max
        max_drawdown = np.min(drawdowns)
        
        # Calculate risk metrics
        var_95 = np.percentile(stressed_returns, 5)
        cvar_95 = stressed_returns[stressed_returns <= var_95].mean()
        
        # Simulate Sharpe ratio under stress
        # Assume risk-free rate of 2% annually, scaled to scenario duration
        risk_free = 0.02 * (scenario.duration_days / 252)
        excess_return = portfolio_return - risk_free
        volatility = np.std(stressed_returns) * np.sqrt(252 / scenario.duration_days)
        sharpe = excess_return / volatility if volatility > 0 else 0
        
        # Test model performance under stress
        prediction_accuracy = self._test_prediction_accuracy(portfolio, stressed_returns, scenario)
        calibration_drift = self._test_calibration_drift(portfolio, stressed_returns, scenario)
        
        # Count positions that would be stopped out
        num_stopped = np.sum(stressed_returns <= -0.40)  # -40% stop loss
        
        # Check if kill switch would be activated
        kill_switch = max_drawdown <= -0.20  # -20% drawdown threshold
        
        result = StressTestResult(
            scenario_name=scenario.name,
            portfolio_return=portfolio_return,
            max_drawdown=max_drawdown,
            sharpe_ratio=sharpe,
            value_at_risk_95=var_95,
            conditional_var_95=cvar_95,
            position_returns=position_returns,
            position_drawdowns=position_drawdowns,
            prediction_accuracy=prediction_accuracy,
            calibration_drift=calibration_drift,
            num_positions_stopped=int(num_stopped),
            kill_switch_activated=kill_switch
        )
        
        self.results.append(result)
        
        # Print summary
        print(f"\nResults:")
        print(f"  Portfolio Return: {result.portfolio_return:+.1%}")
        print(f"  Max Drawdown: {result.max_drawdown:.1%}")
        print(f"  Sharpe Ratio: {result.sharpe_ratio:.2f}")
        print(f"  VaR (95%): {result.value_at_risk_95:.1%}")
        print(f"  Kill Switch: {'🔴 YES' if result.kill_switch_activated else '✅ NO'}")
        print(f"  Positions Stopped: {result.num_positions_stopped}/{len(portfolio)}")
        
        return result
    
    def _apply_scenario_shock(
        self,
        portfolio: pd.DataFrame,
        scenario: StressScenario
    ) -> np.ndarray:
        """
        Apply scenario-specific shocks to portfolio
        
        Args:
            portfolio: Portfolio DataFrame
            scenario: Stress scenario
            
        Returns:
            Array of stressed returns for each position
        """
        n = len(portfolio)
        stressed_returns = np.zeros(n)
        
        if scenario.shock_type == "binary_readout":
            # Primary position takes full shock
            primary_idx = 0  # Assume first position is event target
            stressed_returns[primary_idx] = scenario.shock_magnitude
            
            # Other positions get sympathy move
            sympathy = scenario.params.get("sector_sympathy", 0)
            stressed_returns[1:] = np.random.normal(
                sympathy, 
                abs(sympathy) * 0.5, 
                n - 1
            )
        
        elif scenario.shock_type == "crl_cascade":
            # Multiple positions affected
            num_crls = scenario.params.get("num_crls", 2)
            
            # Primary CRLs
            crl_indices = np.random.choice(n, min(num_crls, n), replace=False)
            stressed_returns[crl_indices] = scenario.shock_magnitude
            
            # Sector contagion
            sector_impact = scenario.shock_magnitude * 0.3  # 30% of CRL impact
            stressed_returns += np.random.normal(
                sector_impact,
                abs(sector_impact) * 0.5,
                n
            )
        
        elif scenario.shock_type == "adcom":
            # Uncertainty creates volatility
            primary_idx = 0
            
            if scenario.params.get("volatility_pattern") == "whipsaw":
                # Simulate whipsaw moves
                moves = [
                    scenario.shock_magnitude,  # Initial drop
                    -scenario.shock_magnitude * 0.5,  # Partial recovery
                    scenario.shock_magnitude * 0.7,  # Another drop
                ]
                stressed_returns[primary_idx] = sum(moves)
            else:
                stressed_returns[primary_idx] = scenario.shock_magnitude
        
        elif scenario.shock_type == "sector_drawdown":
            # All positions affected by sector move
            base_return = scenario.shock_magnitude
            
            # Differentiate by market cap and stage
            for i, row in portfolio.iterrows():
                if 'market_cap' in row:
                    # Large caps outperform in drawdowns
                    if row.get('market_cap', 0) > 5e9:  # >$5B
                        factor = 0.6  # 60% of sector move
                    elif row.get('market_cap', 0) > 1e9:  # >$1B
                        factor = 0.8
                    else:
                        factor = 1.2  # Small caps hit harder
                else:
                    factor = 1.0
                
                # Add idiosyncratic noise
                noise = np.random.normal(0, abs(base_return) * 0.2)
                stressed_returns[i] = base_return * factor + noise
        
        else:
            # Generic shock
            stressed_returns[:] = scenario.shock_magnitude
        
        return stressed_returns
    
    def _test_prediction_accuracy(
        self,
        portfolio: pd.DataFrame,
        stressed_returns: np.ndarray,
        scenario: StressScenario
    ) -> float:
        """
        Test how well predictions hold up under stress
        
        Returns accuracy as fraction of correct predictions
        """
        # Simulate that predictions become less accurate under stress
        # In real implementation, this would compare actual vs predicted outcomes
        
        base_accuracy = 0.75  # Assume 75% base accuracy
        
        # Accuracy degrades with stress severity
        stress_factor = abs(scenario.shock_magnitude)
        accuracy_loss = stress_factor * 0.3  # Lose up to 30% accuracy
        
        return max(0.5, base_accuracy - accuracy_loss)
    
    def _test_calibration_drift(
        self,
        portfolio: pd.DataFrame,
        stressed_returns: np.ndarray,
        scenario: StressScenario
    ) -> float:
        """
        Test calibration drift under stress
        
        Returns PSI-like metric for calibration shift
        """
        # Simulate calibration drift increasing with correlation
        base_drift = 0.05
        correlation_impact = scenario.correlation_increase * 0.3
        
        return base_drift + correlation_impact
    
    def run_all_scenarios(
        self,
        portfolio: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Run all stress test scenarios
        
        Args:
            portfolio: Portfolio DataFrame
            
        Returns:
            DataFrame with all stress test results
        """
        print("\n" + "=" * 80)
        print("BIOTECH STRESS TEST BATTERY")
        print("=" * 80)
        
        results = []
        
        for scenario in self.scenarios:
            result = self.run_stress_test(portfolio, scenario)
            
            results.append({
                'scenario': result.scenario_name,
                'return': result.portfolio_return,
                'max_dd': result.max_drawdown,
                'sharpe': result.sharpe_ratio,
                'var_95': result.value_at_risk_95,
                'cvar_95': result.conditional_var_95,
                'stopped': result.num_positions_stopped,
                'kill_switch': result.kill_switch_activated,
                'pred_acc': result.prediction_accuracy,
                'calib_drift': result.calibration_drift
            })
        
        return pd.DataFrame(results)
    
    def generate_stress_report(self) -> str:
        """
        Generate comprehensive stress test report
        
        Returns:
            Markdown-formatted report
        """
        if not self.results:
            return "No stress test results available"
        
        report = f"""# Biotech Stress Test Report
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary Statistics

| Metric | Min | Mean | Max |
|--------|-----|------|-----|
| Portfolio Return | {min(r.portfolio_return for r in self.results):.1%} | {np.mean([r.portfolio_return for r in self.results]):.1%} | {max(r.portfolio_return for r in self.results):.1%} |
| Max Drawdown | {min(r.max_drawdown for r in self.results):.1%} | {np.mean([r.max_drawdown for r in self.results]):.1%} | {max(r.max_drawdown for r in self.results):.1%} |
| Sharpe Ratio | {min(r.sharpe_ratio for r in self.results):.2f} | {np.mean([r.sharpe_ratio for r in self.results]):.2f} | {max(r.sharpe_ratio for r in self.results):.2f} |

## Scenario Results

"""
        
        for result in self.results:
            report += f"""
### {result.scenario_name}

- **Portfolio Return**: {result.portfolio_return:+.1%}
- **Max Drawdown**: {result.max_drawdown:.1%}
- **Value at Risk (95%)**: {result.value_at_risk_95:.1%}
- **Positions Stopped**: {result.num_positions_stopped}
- **Kill Switch**: {'🔴 ACTIVATED' if result.kill_switch_activated else '✅ Not Triggered'}
- **Prediction Accuracy**: {result.prediction_accuracy:.1%}
- **Calibration Drift**: {result.calibration_drift:.3f}
"""
        
        # Add risk assessment
        kill_switches = sum(r.kill_switch_activated for r in self.results)
        report += f"""
## Risk Assessment

- **Kill Switch Activations**: {kill_switches}/{len(self.results)} scenarios
- **Average Stressed Return**: {np.mean([r.portfolio_return for r in self.results]):.1%}
- **Worst Case Return**: {min(r.portfolio_return for r in self.results):.1%}
- **Worst Drawdown**: {min(r.max_drawdown for r in self.results):.1%}

"""
        
        if kill_switches > 0:
            report += "⚠️  **WARNING**: Kill switch would be activated in some scenarios. Review risk management protocols.\n"
        
        return report


# Example usage and testing
if __name__ == "__main__":
    print("=" * 80)
    print("Biotech Stress Testing Demo")
    print("=" * 80)
    
    # Create sample portfolio
    portfolio = pd.DataFrame([
        {'ticker': 'CELC', 'position_pct': 0.08, 'mvm_score': 88, 'win_prob': 0.85, 
         'phase': 'Phase3', 'market_cap': 800e6},
        {'ticker': 'SPRB', 'position_pct': 0.06, 'mvm_score': 92, 'win_prob': 0.90,
         'phase': 'Phase2', 'market_cap': 150e6},
        {'ticker': 'INBX', 'position_pct': 0.07, 'mvm_score': 82, 'win_prob': 0.75,
         'phase': 'Phase2', 'market_cap': 600e6},
        {'ticker': 'ARWR', 'position_pct': 0.05, 'mvm_score': 78, 'win_prob': 0.70,
         'phase': 'Approval', 'market_cap': 3e9},
        {'ticker': 'SRRK', 'position_pct': 0.04, 'mvm_score': 65, 'win_prob': 0.60,
         'phase': 'Approved', 'market_cap': 1.5e9},
    ])
    
    print(f"\n📊 Portfolio ({len(portfolio)} positions)")
    print(f"Total exposure: {portfolio['position_pct'].sum():.0%}")
    print(portfolio[['ticker', 'position_pct', 'mvm_score', 'phase']].to_string(index=False))
    
    # Run stress tests
    tester = BiotechStressTester()
    results_df = tester.run_all_scenarios(portfolio)
    
    # Display summary
    print("\n" + "=" * 80)
    print("STRESS TEST SUMMARY")
    print("=" * 80)
    print(results_df.to_string(index=False))
    
    # Generate report
    print("\n" + "=" * 80)
    print("DETAILED REPORT")
    print("=" * 80)
    report = tester.generate_stress_report()
    print(report)
    
    print("\n" + "=" * 80)
    print("✅ Stress testing demo complete!")
    print("=" * 80)
