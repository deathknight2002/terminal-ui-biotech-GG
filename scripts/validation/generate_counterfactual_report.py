#!/usr/bin/env python3
"""
Generate MVM Counterfactual Validation Report

This is a convenience wrapper script for running counterfactual validation
and generating reports. It can be run from the scripts/validation/ directory.

Usage:
    python scripts/validation/generate_counterfactual_report.py
    
    # Or with custom parameters:
    python scripts/validation/generate_counterfactual_report.py \
        --start-date 2024-01-01 \
        --end-date 2024-12-31 \
        --output cf_validation_2024.md
"""

import argparse
import asyncio
import sys
from pathlib import Path
from datetime import datetime

# Add bt_platform to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from bt_platform.core.config import settings
from bt_platform.core.validation.counterfactual_runner import (
    CounterfactualRunner,
    CounterfactualConfig,
)


def parse_args():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(
        description="Generate MVM Alpha Counterfactual Validation Report"
    )

    parser.add_argument(
        "--start-date",
        type=str,
        default="2020-01-01",
        help="Start date for validation (YYYY-MM-DD)",
    )

    parser.add_argument(
        "--end-date",
        type=str,
        default=datetime.now().strftime("%Y-%m-%d"),
        help="End date for validation (YYYY-MM-DD), defaults to today",
    )

    parser.add_argument(
        "--horizons", type=str, default="1,3,5", help="Comma-separated horizons in days"
    )

    parser.add_argument(
        "--vix-buckets",
        type=str,
        default="0-20,20-30,30+",
        help="VIX buckets for regime analysis",
    )

    parser.add_argument(
        "--n-alts",
        type=int,
        default=3,
        help="Number of propensity-matched alternatives",
    )

    parser.add_argument(
        "--output",
        type=str,
        default="validation_report_{timestamp}.md",
        help="Output path for report (use {timestamp} for automatic timestamping)",
    )

    parser.add_argument(
        "--parquet", action="store_true", help="Also save results as parquet snapshot"
    )

    return parser.parse_args()


async def main():
    """Main execution"""
    args = parse_args()

    # Parse horizons
    horizons = [int(h.strip()) for h in args.horizons.split(",")]

    # Parse VIX buckets
    vix_buckets = []
    for bucket in args.vix_buckets.split(","):
        bucket = bucket.strip()
        if "+" in bucket:
            lower = float(bucket.replace("+", ""))
            vix_buckets.append((lower, 100.0))
        else:
            lower, upper = bucket.split("-")
            vix_buckets.append((float(lower), float(upper)))

    # Create output path with timestamp if needed
    output_path = args.output.replace(
        "{timestamp}", datetime.now().strftime("%Y%m%d_%H%M%S")
    )

    print("=" * 60)
    print("MVM ALPHA COUNTERFACTUAL VALIDATION")
    print("=" * 60)
    print(f"Date range: {args.start_date} to {args.end_date}")
    print(f"Horizons: {horizons}")
    print(f"VIX buckets: {vix_buckets}")
    print(f"Alternatives: {args.n_alts}")
    print(f"Output: {output_path}")
    print("=" * 60)
    print()

    # Create database session
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Create config
        config = CounterfactualConfig(
            start_date=args.start_date,
            end_date=args.end_date,
            horizons=horizons,
            vix_buckets=vix_buckets,
            n_alternatives=args.n_alts,
        )

        # Create runner
        runner = CounterfactualRunner(db, config)

        # Run validation
        print("Running counterfactual validation...")
        results = await runner.run_validation()

        # Generate report
        print(f"Generating report: {output_path}")
        runner.generate_report(results, output_path)

        # Save parquet if requested
        if args.parquet:
            parquet_path = output_path.replace(".md", ".parquet")
            print(f"Saving parquet snapshot: {parquet_path}")
            import pandas as pd

            rows = []
            for item in results["raw_results"]:
                row = {
                    "event_id": item["event_id"],
                    "ticker": item["ticker"],
                    "score": item["score"],
                    "dt_trade": item["dt_trade"],
                    "edge": item["edge"],
                    "cf_median_pnl": item["cf_median_pnl"],
                }
                rows.append(row)
            df = pd.DataFrame(rows)
            df.to_parquet(parquet_path, index=False)

        # Print summary
        summary = results["summary"]
        print("\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)
        print(f"Events analyzed: {summary['n_events']}")
        print(f"Average edge: {summary['avg_edge']:.2f} bp")
        print(f"Overall Sharpe: {summary['overall_sharpe']:.2f}")
        print(f"Hit rate: {summary['overall_hit_rate']:.2%}")
        print("=" * 60)
        print(f"\n✅ Report generated: {output_path}\n")

        return 0

    except Exception as e:
        print(f"\n❌ Validation failed: {e}\n")
        import traceback

        traceback.print_exc()
        return 1

    finally:
        db.close()


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
