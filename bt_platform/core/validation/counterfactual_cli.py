#!/usr/bin/env python3
"""
Counterfactual Validation CLI

Command-line interface for running counterfactual validation on MVM Alpha scoring.

Usage:
    python -m bt_platform.core.validation.counterfactual_cli \
        --window 2020-01-01:2025-10-31 \
        --horizons 1,3,5 \
        --vix-buckets 0-20,20-30,30+ \
        --alts 3 \
        --output validation_report.md

Examples:
    # Run validation for last year
    python -m bt_platform.core.validation.counterfactual_cli \
        --window 2024-01-01:2024-12-31 \
        --output cf_validation_2024.md

    # Run with custom VIX buckets
    python -m bt_platform.core.validation.counterfactual_cli \
        --window 2020-01-01:2025-10-31 \
        --vix-buckets 0-15,15-25,25+ \
        --output cf_validation_custom.md
"""

import argparse
import asyncio
import logging
import sys
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from bt_platform.core.config import settings
from bt_platform.core.validation.counterfactual_runner import (
    CounterfactualConfig,
    CounterfactualRunner,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_date_window(window_str: str) -> tuple[str, str]:
    """Parse date window string like '2020-01-01:2025-10-31'"""
    try:
        start, end = window_str.split(':')
        # Validate dates
        datetime.strptime(start, '%Y-%m-%d')
        datetime.strptime(end, '%Y-%m-%d')
        return start, end
    except ValueError as e:
        raise argparse.ArgumentTypeError(
            f"Invalid date window format. Expected 'YYYY-MM-DD:YYYY-MM-DD', got '{window_str}'"
        ) from e


def parse_horizons(horizons_str: str) -> list[int]:
    """Parse horizons string like '1,3,5'"""
    try:
        horizons = [int(h.strip()) for h in horizons_str.split(',')]
        if not all(h > 0 for h in horizons):
            raise ValueError("All horizons must be positive")
        return horizons
    except ValueError as e:
        raise argparse.ArgumentTypeError(
            f"Invalid horizons format. Expected comma-separated integers like '1,3,5', got '{horizons_str}'"
        ) from e


def parse_vix_buckets(buckets_str: str) -> list[tuple[float, float]]:
    """Parse VIX buckets string like '0-20,20-30,30+'"""
    buckets = []
    try:
        for bucket in buckets_str.split(','):
            bucket = bucket.strip()
            if '+' in bucket:
                # Handle open-ended bucket like '30+'
                lower = float(bucket.replace('+', '').strip())
                buckets.append((lower, 100.0))
            else:
                # Handle range like '20-30'
                lower, upper = bucket.split('-')
                buckets.append((float(lower.strip()), float(upper.strip())))
        return buckets
    except ValueError as e:
        raise argparse.ArgumentTypeError(
            f"Invalid VIX buckets format. Expected format like '0-20,20-30,30+', got '{buckets_str}'"
        ) from e


def parse_args():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(
        description='Run counterfactual validation for MVM Alpha scoring',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        '--window',
        type=parse_date_window,
        default='2020-01-01:2025-10-31',
        help='Date window for validation (format: YYYY-MM-DD:YYYY-MM-DD)'
    )

    parser.add_argument(
        '--horizons',
        type=parse_horizons,
        default='1,3,5',
        help='Horizons in days for outcome measurement (comma-separated)'
    )

    parser.add_argument(
        '--vix-buckets',
        type=parse_vix_buckets,
        default='0-20,20-30,30+',
        help='VIX buckets for regime analysis (format: 0-20,20-30,30+)'
    )

    parser.add_argument(
        '--alts',
        type=int,
        default=3,
        help='Number of propensity-matched alternatives per event'
    )

    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for reproducibility'
    )

    parser.add_argument(
        '--matching-window',
        type=int,
        default=3,
        help='Window in days for finding alternative catalysts'
    )

    parser.add_argument(
        '--output',
        type=str,
        default='counterfactual_validation_report.md',
        help='Output path for validation report'
    )

    parser.add_argument(
        '--persist',
        action='store_true',
        help='Persist results to database (in addition to report)'
    )

    parser.add_argument(
        '--parquet',
        type=str,
        help='Save results snapshot as parquet file'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )

    return parser.parse_args()


async def run_validation(args):
    """Run the counterfactual validation"""
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("Starting MVM Alpha Counterfactual Validation")
    logger.info(f"Date window: {args.window[0]} to {args.window[1]}")
    logger.info(f"Horizons: {args.horizons}")
    logger.info(f"VIX buckets: {args.vix_buckets}")
    logger.info(f"Alternatives: {args.alts}")

    # Create database session
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Create config
        config = CounterfactualConfig(
            start_date=args.window[0],
            end_date=args.window[1],
            horizons=args.horizons,
            vix_buckets=args.vix_buckets,
            n_alternatives=args.alts,
            propensity_seed=args.seed,
            matching_window_days=args.matching_window,
        )

        # Create runner
        runner = CounterfactualRunner(db, config)

        # Run validation
        logger.info("Running counterfactual validation...")
        results = await runner.run_validation()

        # Generate report
        logger.info(f"Generating report: {args.output}")
        runner.generate_report(results, args.output)

        # Persist to database if requested
        if args.persist:
            logger.info("Persisting results to database...")
            await persist_results(db, results)

        # Save parquet snapshot if requested
        if args.parquet:
            logger.info(f"Saving parquet snapshot: {args.parquet}")
            save_parquet_snapshot(results, args.parquet)

        logger.info("✅ Counterfactual validation completed successfully")
        logger.info(f"📊 Report saved to: {args.output}")

        # Print summary
        summary = results['summary']
        print("\n" + "="*60)
        print("VALIDATION SUMMARY")
        print("="*60)
        print(f"Events analyzed: {summary['n_events']}")
        print(f"Average edge: {summary['avg_edge']:.2f} bp")
        print(f"Overall Sharpe: {summary['overall_sharpe']:.2f}")
        print(f"Hit rate: {summary['overall_hit_rate']:.2%}")
        print("="*60 + "\n")

        return 0

    except Exception as e:
        logger.error(f"❌ Validation failed: {e}", exc_info=True)
        return 1

    finally:
        db.close()


async def persist_results(db, results):
    """Persist validation results to database"""
    # TODO: Implement database persistence
    # This would save CounterfactualOutcome records to the database
    logger.warning("Database persistence not yet implemented")


def save_parquet_snapshot(results, path):
    """Save results as parquet snapshot"""
    import pandas as pd

    # Convert results to DataFrame
    rows = []
    for item in results['raw_results']:
        row = {
            'event_id': item['event_id'],
            'ticker': item['ticker'],
            'score': item['score'],
            'dt_trade': item['dt_trade'],
            'edge': item['edge'],
            'cf_median_pnl': item['cf_median_pnl'],
            'realized_pnl_t5': item['realized']['pnl_bp_t5'],
            'n_counterfactuals': len(item['counterfactuals']),
        }
        rows.append(row)

    df = pd.DataFrame(rows)
    df.to_parquet(path, index=False)
    logger.info(f"Saved {len(df)} records to {path}")


def main():
    """Main entry point"""
    args = parse_args()

    # Run async validation
    exit_code = asyncio.run(run_validation(args))
    sys.exit(exit_code)


if __name__ == '__main__':
    main()
