#!/usr/bin/env python3
"""
CLI Script to sync XBI constituents from Yahoo Finance

Usage:
    python -m bt_platform.cli.sync_xbi [--force]
    
Options:
    --force     Force refresh, bypass cache
"""

import sys
import argparse
import logging
from bt_platform.core.database import SessionLocal
from bt_platform.core.services import sync_xbi_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Sync XBI constituents from Yahoo Finance'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Force refresh, bypass cache'
    )
    
    args = parser.parse_args()
    
    logger.info("Starting XBI sync...")
    logger.info(f"Force refresh: {args.force}")
    
    db = SessionLocal()
    try:
        stats = sync_xbi_data(db, force_refresh=args.force)
        
        logger.info("=" * 60)
        logger.info("XBI Sync Complete!")
        logger.info("=" * 60)
        logger.info(f"Total constituents: {stats['total_constituents']}")
        logger.info(f"New companies: {stats['new_companies']}")
        logger.info(f"Updated companies: {stats['updated_companies']}")
        logger.info(f"Failed companies: {stats['failed_companies']}")
        
        if stats['errors']:
            logger.warning(f"Errors encountered: {len(stats['errors'])}")
            for error in stats['errors'][:10]:  # Show first 10 errors
                logger.warning(f"  - {error}")
        
        logger.info("=" * 60)
        
        return 0
        
    except Exception as e:
        logger.error(f"Sync failed: {e}", exc_info=True)
        return 1
    finally:
        db.close()


if __name__ == '__main__':
    sys.exit(main())
