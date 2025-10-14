"""
Backtesting Engine for Catalyst Scoring Validation

Validates scoring methodology against historical outcomes to measure predictive accuracy.
"""

import duckdb
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class BacktestEngine:
    """
    Backtesting engine for catalyst scoring validation.
    
    Measures:
    - Predictive accuracy of catalyst scoring
    - Risk-adjusted returns by tier
    - Calibration (do high scores predict better outcomes?)
    - Feature importance (which scoring dimensions matter most?)
    """
    
    def __init__(self, db_path: str = "data/historical.duckdb"):
        """
        Initialize backtest engine.
        
        Args:
            db_path: Path to DuckDB database with historical data
        """
        self.db_path = db_path
        self.conn = None
        
    def connect(self):
        """Establish database connection."""
        if self.conn is None:
            self.conn = duckdb.connect(self.db_path, read_only=True)
            logger.info(f"Connected to {self.db_path}")
    
    def disconnect(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
            logger.info("Disconnected from database")
    
    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.disconnect()
        
    def load_historical_catalysts(
        self,
        start_date: str,
        end_date: str,
        min_score: Optional[int] = None,
        tier: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Load historical catalysts with scoring fields and outcomes.
        
        Args:
            start_date: ISO format (e.g., '2020-01-01')
            end_date: ISO format (e.g., '2024-12-31')
            min_score: Filter by minimum total score
            tier: Filter by tier ('High-Torque', 'Tradable', 'Watch')
        
        Returns:
            DataFrame with catalyst data and outcomes
        """
        self.connect()
        
        query = f"""
        SELECT
            c.id,
            c.title,
            c.company,
            c.drug,
            c.event_type,
            c.event_date,
            c.event_leverage,
            c.timing_clarity,
            c.surprise_factor,
            c.downside_contained,
            c.market_depth,
            c.total_score,
            c.tier,
            c.category,
            o.outcome,
            o.price_movement_7d,
            o.price_movement_30d,
            o.volatility,
            o.volume_ratio
        FROM catalysts c
        LEFT JOIN catalyst_outcomes o ON c.id = o.catalyst_id
        WHERE c.event_date BETWEEN '{start_date}' AND '{end_date}'
        """
        
        if min_score is not None:
            query += f" AND c.total_score >= {min_score}"
        
        if tier:
            query += f" AND c.tier = '{tier}'"
        
        query += " AND o.outcome IS NOT NULL ORDER BY c.event_date"
        
        try:
            df = self.conn.execute(query).df()
            logger.info(f"Loaded {len(df)} historical catalysts from {start_date} to {end_date}")
            return df
        except Exception as e:
            logger.error(f"Failed to load historical catalysts: {e}")
            # Return empty DataFrame with expected columns
            return pd.DataFrame(columns=[
                'id', 'title', 'company', 'drug', 'event_type', 'event_date',
                'event_leverage', 'timing_clarity', 'surprise_factor', 
                'downside_contained', 'market_depth', 'total_score', 'tier',
                'category', 'outcome', 'price_movement_7d', 'price_movement_30d',
                'volatility', 'volume_ratio'
            ])
    
    def compute_metrics(
        self,
        df: pd.DataFrame,
        tier: Optional[str] = None
    ) -> Dict[str, float]:
        """
        Compute backtest performance metrics.
        
        Args:
            df: DataFrame with catalyst outcomes
            tier: Filter by tier ('High-Torque', 'Tradable', 'Watch')
        
        Returns:
            Dictionary of metrics
        """
        if tier:
            df = df[df['tier'] == tier].copy()
        
        if len(df) == 0:
            return {
                'n_catalysts': 0,
                'win_rate': 0.0,
                'avg_7d_return': 0.0,
                'avg_30d_return': 0.0,
                'sharpe_ratio': 0.0,
                'max_drawdown': 0.0,
                'total_return': 0.0
            }
        
        # Win rate: % of catalysts with positive outcome
        win_rate = (df['outcome'] == 'positive').sum() / len(df)
        
        # Average price movement
        avg_7d_return = df['price_movement_7d'].mean()
        avg_30d_return = df['price_movement_30d'].mean()
        
        # Sharpe ratio (annualized)
        returns = df['price_movement_7d'].values
        if returns.std() > 0:
            sharpe = (returns.mean() / returns.std()) * np.sqrt(52)  # Weekly to annual
        else:
            sharpe = 0.0
        
        # Maximum drawdown
        cumulative_returns = (1 + df['price_movement_7d'] / 100).cumprod()
        running_max = cumulative_returns.expanding().max()
        drawdown = (cumulative_returns - running_max) / running_max
        max_drawdown = drawdown.min()
        
        # Total return
        total_return = cumulative_returns.iloc[-1] - 1 if len(cumulative_returns) > 0 else 0
        
        return {
            'n_catalysts': len(df),
            'win_rate': float(win_rate),
            'avg_7d_return': float(avg_7d_return),
            'avg_30d_return': float(avg_30d_return),
            'sharpe_ratio': float(sharpe),
            'max_drawdown': float(max_drawdown),
            'total_return': float(total_return)
        }
    
    def stratify_by_tier(
        self,
        df: pd.DataFrame
    ) -> Dict[str, Dict[str, float]]:
        """
        Compute metrics stratified by tier.
        
        Validates hypothesis: Higher-scored catalysts should perform better.
        """
        results = {}
        
        for tier in ['High-Torque', 'Tradable', 'Watch']:
            results[tier] = self.compute_metrics(df, tier=tier)
        
        # Overall metrics
        results['Overall'] = self.compute_metrics(df)
        
        return results
    
    def calibration_analysis(
        self,
        df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Analyze calibration: do high-scored catalysts perform better?
        
        Returns:
            DataFrame with score bins and actual outcomes
        """
        if len(df) == 0:
            return pd.DataFrame(columns=['score_bin', 'win_rate', 'price_movement_7d', 
                                        'price_movement_30d', 'count'])
        
        # Bin by total_score
        df = df.copy()
        df['score_bin'] = pd.cut(
            df['total_score'],
            bins=[0, 6, 8, 16],
            labels=['Low (0-6)', 'Medium (6-8)', 'High (8+)'],
            include_lowest=True
        )
        
        calibration = df.groupby('score_bin', observed=False).agg({
            'outcome': lambda x: (x == 'positive').mean() if len(x) > 0 else 0,
            'price_movement_7d': lambda x: x.mean() if len(x) > 0 else 0,
            'price_movement_30d': lambda x: x.mean() if len(x) > 0 else 0,
            'id': 'count'
        }).rename(columns={'id': 'count', 'outcome': 'win_rate'})
        
        return calibration.reset_index()
    
    def feature_importance(
        self,
        df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Analyze which scoring dimensions predict outcomes best.
        
        Uses Random Forest to measure feature importance.
        """
        if len(df) == 0:
            return pd.DataFrame(columns=['feature', 'importance'])
        
        try:
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.preprocessing import LabelEncoder
            
            # Prepare features and labels
            features = [
                'event_leverage',
                'timing_clarity',
                'surprise_factor',
                'downside_contained',
                'market_depth'
            ]
            
            # Filter to rows with all features
            df_clean = df[features + ['outcome']].dropna()
            
            if len(df_clean) == 0:
                logger.warning("No clean data for feature importance analysis")
                return pd.DataFrame(columns=['feature', 'importance'])
            
            X = df_clean[features].values
            le = LabelEncoder()
            y = le.fit_transform(df_clean['outcome'].values)
            
            # Train random forest
            rf = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
            rf.fit(X, y)
            
            # Get feature importance
            importance_df = pd.DataFrame({
                'feature': features,
                'importance': rf.feature_importances_
            }).sort_values('importance', ascending=False)
            
            return importance_df
            
        except ImportError:
            logger.warning("scikit-learn not available, skipping feature importance")
            return pd.DataFrame(columns=['feature', 'importance'])
        except Exception as e:
            logger.error(f"Feature importance analysis failed: {e}")
            return pd.DataFrame(columns=['feature', 'importance'])
    
    def run_backtest(
        self,
        start_date: str = "2020-01-01",
        end_date: str = "2024-12-31",
        min_score: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Run full backtest and return comprehensive results.
        
        Args:
            start_date: Start date (ISO format)
            end_date: End date (ISO format)
            min_score: Minimum catalyst score to include
        
        Returns:
            Comprehensive backtest results
        """
        logger.info(f"Running backtest from {start_date} to {end_date}")
        
        # Load data
        df = self.load_historical_catalysts(start_date, end_date, min_score=min_score)
        logger.info(f"Loaded {len(df)} historical catalysts")
        
        if len(df) == 0:
            logger.warning("No data available for backtest")
            return {
                'period': {
                    'start_date': start_date,
                    'end_date': end_date,
                    'total_catalysts': 0
                },
                'metrics_by_tier': {},
                'calibration': {},
                'feature_importance': {},
                'timestamp': datetime.utcnow().isoformat()
            }
        
        # Compute metrics by tier
        tier_metrics = self.stratify_by_tier(df)
        
        # Calibration analysis
        calibration = self.calibration_analysis(df)
        
        # Feature importance
        importance = self.feature_importance(df)
        
        logger.info("✓ Backtest complete")
        logger.info(f"Overall win rate: {tier_metrics['Overall']['win_rate']:.2%}")
        logger.info(f"Overall Sharpe ratio: {tier_metrics['Overall']['sharpe_ratio']:.2f}")
        
        return {
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'total_catalysts': len(df),
                'min_score': min_score
            },
            'metrics_by_tier': tier_metrics,
            'calibration': calibration.to_dict('records'),
            'feature_importance': importance.to_dict('records'),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def close(self):
        """Alias for disconnect()."""
        self.disconnect()


def main():
    """Example usage"""
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description="Run catalyst scoring backtest")
    parser.add_argument('--db', type=str, default='data/historical.duckdb', 
                       help='Path to DuckDB database')
    parser.add_argument('--start-date', type=str, default='2020-01-01',
                       help='Start date (ISO format)')
    parser.add_argument('--end-date', type=str, default='2024-12-31',
                       help='End date (ISO format)')
    parser.add_argument('--min-score', type=int, default=None,
                       help='Minimum catalyst score')
    parser.add_argument('--output', type=str, default=None,
                       help='Output JSON file path')
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run backtest
    with BacktestEngine(db_path=args.db) as engine:
        results = engine.run_backtest(
            start_date=args.start_date,
            end_date=args.end_date,
            min_score=args.min_score
        )
    
    # Print summary
    print("\n" + "="*60)
    print("BACKTEST RESULTS")
    print("="*60)
    print(f"\nPeriod: {results['period']['start_date']} to {results['period']['end_date']}")
    print(f"Total Catalysts: {results['period']['total_catalysts']}")
    
    print("\nMetrics by Tier:")
    print("-"*60)
    for tier, metrics in results['metrics_by_tier'].items():
        if metrics['n_catalysts'] > 0:
            print(f"\n{tier}:")
            print(f"  N: {metrics['n_catalysts']}")
            print(f"  Win Rate: {metrics['win_rate']:.2%}")
            print(f"  Avg 7d Return: {metrics['avg_7d_return']:.2f}%")
            print(f"  Sharpe Ratio: {metrics['sharpe_ratio']:.2f}")
            print(f"  Max Drawdown: {metrics['max_drawdown']:.2%}")
    
    print("\nCalibration Analysis:")
    print("-"*60)
    for row in results['calibration']:
        print(f"{row['score_bin']}: Win Rate = {row['win_rate']:.2%}, "
              f"Avg Return = {row['price_movement_7d']:.2f}%, "
              f"Count = {row['count']}")
    
    print("\nFeature Importance:")
    print("-"*60)
    for row in results['feature_importance']:
        print(f"{row['feature']}: {row['importance']:.4f}")
    
    # Save to file if specified
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n✓ Results saved to {output_path}")


if __name__ == "__main__":
    main()
