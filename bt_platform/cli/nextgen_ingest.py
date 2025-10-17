"""
Next-Gen Ingestion CLI

Demonstrates dual refresh modes, priority queues, and CSV import.
"""

import asyncio
import argparse
from datetime import datetime, timedelta
from pathlib import Path
import json

from bt_platform.scrapers.utils import (
    RefreshManager,
    RefreshMode,
    CSVDropZone,
    PriceDataValidator,
    SelfHealingParser,
)


# Default sources for biotech news
DEFAULT_SOURCES = {
    'fda': 'https://www.fda.gov',
    'fierce': 'https://www.fiercebiotech.com',
    'endpoints': 'https://endpts.com',
    'biospace': 'https://www.biospace.com',
    'businesswire': 'https://www.businesswire.com',
}


async def quick_refresh_command(args):
    """Execute quick refresh"""
    print("🚀 Starting QUICK refresh (≤10s)...")
    print(f"Sources: {', '.join(DEFAULT_SOURCES.keys())}")
    print()
    
    manager = RefreshManager()
    
    # Calculate since date
    since = None
    if args.since:
        if args.since.endswith('d'):
            days = int(args.since[:-1])
            since = datetime.utcnow() - timedelta(days=days)
        elif args.since.endswith('h'):
            hours = int(args.since[:-1])
            since = datetime.utcnow() - timedelta(hours=hours)
    
    # Perform refresh
    start_time = datetime.utcnow()
    results = await manager.quick_refresh(DEFAULT_SOURCES, since=since)
    elapsed = (datetime.utcnow() - start_time).total_seconds()
    
    # Print results
    print(f"✅ Completed in {elapsed:.2f}s")
    print()
    
    total_items = 0
    for source_key, items in results.items():
        count = len(items)
        total_items += count
        print(f"  {source_key}: {count} items")
        
        # Show first item as example
        if items and args.verbose:
            item = items[0]
            print(f"    └─ {item.get('title', item.get('url', 'N/A'))}")
    
    print()
    print(f"Total: {total_items} items")
    
    # Show stats
    stats = manager.get_stats()
    print()
    print("📊 Statistics:")
    print(f"  Cache efficiency: {stats['cache_efficiency']:.1f}%")
    print(f"  Cached hits: {stats['cached_hits']}")
    
    await manager.close()


async def deep_refresh_command(args):
    """Execute deep refresh"""
    print("🔍 Starting DEEP refresh (≤60s)...")
    print(f"Sources: {', '.join(DEFAULT_SOURCES.keys())}")
    print()
    
    manager = RefreshManager()
    
    # Calculate since date
    since = None
    if args.since:
        if args.since.endswith('d'):
            days = int(args.since[:-1])
            since = datetime.utcnow() - timedelta(days=days)
        elif args.since.endswith('h'):
            hours = int(args.since[:-1])
            since = datetime.utcnow() - timedelta(hours=hours)
    
    # Perform refresh
    start_time = datetime.utcnow()
    results = await manager.deep_refresh(DEFAULT_SOURCES, since=since)
    elapsed = (datetime.utcnow() - start_time).total_seconds()
    
    # Print results
    print(f"✅ Completed in {elapsed:.2f}s")
    print()
    
    total_items = 0
    for source_key, items in results.items():
        count = len(items)
        total_items += count
        
        # Count discovery methods
        methods = {}
        for item in items:
            method = item.get('discovery_method', 'unknown')
            methods[method] = methods.get(method, 0) + 1
        
        method_str = ', '.join(f"{k}: {v}" for k, v in methods.items())
        print(f"  {source_key}: {count} items ({method_str})")
        
        # Show first few items as example
        if items and args.verbose:
            for i, item in enumerate(items[:3]):
                print(f"    └─ {item.get('title', item.get('url', 'N/A'))}")
                if i == 2 and len(items) > 3:
                    print(f"    └─ ... and {len(items) - 3} more")
                    break
    
    print()
    print(f"Total: {total_items} items")
    
    # Show stats
    stats = manager.get_stats()
    print()
    print("📊 Statistics:")
    print(f"  Average quick time: {stats['quick_avg_time']:.2f}s")
    print(f"  Average deep time: {stats['deep_avg_time']:.2f}s")
    
    await manager.close()


def csv_import_command(args):
    """Import price data from CSV"""
    print(f"📂 Importing CSV: {args.file}")
    
    drop_zone = CSVDropZone()
    
    # Parse CSV
    file_path = Path(args.file)
    if not file_path.exists():
        print(f"❌ File not found: {args.file}")
        return
    
    records = drop_zone.parse_csv_file(file_path, ticker=args.ticker)
    
    print(f"✅ Imported {len(records)} records")
    print()
    
    # Validate
    validator = PriceDataValidator()
    validation = validator.validate_records(records)
    
    print("📊 Validation:")
    print(f"  Total records: {validation['total_records']}")
    print(f"  Valid: {'✅' if validation['valid'] else '❌'}")
    
    if not validation['valid']:
        print()
        print("  Issues:")
        for issue, count in validation['issues'].items():
            if count > 0:
                print(f"    - {issue}: {count}")
    
    # Show sample
    if records and args.verbose:
        print()
        print("Sample records:")
        for record in records[:5]:
            print(f"  {record.ticker} @ {record.date.date()}: ${record.close:.2f}")
    
    # Save snapshot if requested
    if args.save:
        snapshot_path = drop_zone.save_snapshot(records)
        print()
        print(f"💾 Saved snapshot: {snapshot_path}")


async def health_dashboard_command(args):
    """Show parser health dashboard"""
    print("🏥 Parser Health Dashboard")
    print()
    
    parser = SelfHealingParser()
    
    # Simulate some parsing to populate health
    # In production, this would show actual health from database
    print("Note: Run refreshes to populate health data")
    print()
    
    dashboard = parser.get_health_dashboard()
    
    if not dashboard:
        print("No health data available yet.")
        return
    
    for source_key, health in dashboard.items():
        status = "✅" if health['is_healthy'] else "⚠️"
        print(f"{status} {source_key}")
        print(f"  Success rate: {health['success_rate']:.1f}%")
        print(f"  Success: {health['success_count']}, Failures: {health['failure_count']}")
        
        if health['recent_failures']:
            print(f"  Recent failures:")
            for failure in health['recent_failures']:
                print(f"    - {failure}")
        print()


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Next-Gen Ingestion CLI - Biotech Terminal",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Quick refresh (≤10s)
  python -m bt_platform.cli.nextgen_ingest quick --since 7d
  
  # Deep refresh (≤60s)
  python -m bt_platform.cli.nextgen_ingest deep --since 24h -v
  
  # Import price CSV
  python -m bt_platform.cli.nextgen_ingest import prices.csv --ticker BLUE --save
  
  # Check parser health
  python -m bt_platform.cli.nextgen_ingest health
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Quick refresh command
    quick_parser = subparsers.add_parser('quick', help='Quick refresh (≤10s)')
    quick_parser.add_argument(
        '--since',
        help='Fetch content since (e.g., 7d, 24h)',
        default='7d'
    )
    quick_parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )
    
    # Deep refresh command
    deep_parser = subparsers.add_parser('deep', help='Deep refresh (≤60s)')
    deep_parser.add_argument(
        '--since',
        help='Fetch content since (e.g., 7d, 24h)',
        default='7d'
    )
    deep_parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )
    
    # CSV import command
    import_parser = subparsers.add_parser('import', help='Import price CSV')
    import_parser.add_argument(
        'file',
        help='CSV file path'
    )
    import_parser.add_argument(
        '--ticker',
        help='Ticker symbol (if not in CSV)',
        default=None
    )
    import_parser.add_argument(
        '--save',
        action='store_true',
        help='Save as snapshot'
    )
    import_parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Show sample records'
    )
    
    # Health dashboard command
    health_parser = subparsers.add_parser('health', help='Show parser health')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Execute command
    if args.command == 'quick':
        asyncio.run(quick_refresh_command(args))
    elif args.command == 'deep':
        asyncio.run(deep_refresh_command(args))
    elif args.command == 'import':
        csv_import_command(args)
    elif args.command == 'health':
        asyncio.run(health_dashboard_command(args))


if __name__ == '__main__':
    main()
