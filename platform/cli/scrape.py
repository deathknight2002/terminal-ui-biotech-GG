"""
Scraper CLI Harness

Command-line interface for running scrapers with --source, --since, --limit, --dry-run, --save-fixture flags.
"""

import asyncio
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import sys

# Add platform to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from platform.scrapers.base.registry import ScraperRegistry
from platform.scrapers.sites.fierce_scraper import FierceScraper
from platform.scrapers.sites.press_release_scraper import (
    BusinessWireScraper,
    GlobeNewswireScraper,
    PRNewswireScraper,
)
from platform.scrapers.sites.regulator_scraper import (
    FDAScraper,
    EMAScraper,
    MHRAScraper,
)
from platform.scrapers.sites.clinical_trials_scraper import ClinicalTrialsScraper
from platform.scrapers.sites.edgar_scraper import EDGARScraper


# Scraper mapping
SCRAPER_MAP = {
    'fierce': FierceScraper,
    'fiercebiotech': FierceScraper,
    'fiercepharma': FierceScraper,
    'businesswire': BusinessWireScraper,
    'globenewswire': GlobeNewswireScraper,
    'prnewswire': PRNewswireScraper,
    'fda': FDAScraper,
    'ema': EMAScraper,
    'mhra': MHRAScraper,
    'clinicaltrials': ClinicalTrialsScraper,
    'edgar': EDGARScraper,
}


async def run_scraper(
    source: str,
    since: Optional[datetime] = None,
    limit: Optional[int] = None,
    dry_run: bool = False,
    save_fixture: bool = False,
    url: Optional[str] = None,
):
    """
    Run a scraper with the given parameters.
    
    Args:
        source: Source key (e.g., 'fierce', 'fda')
        since: Only scrape content after this date
        limit: Maximum number of items to scrape
        dry_run: Don't write to database
        save_fixture: Save raw HTML and parsed JSON
        url: Specific URL to scrape (optional)
    """
    # Load registry
    registry = ScraperRegistry()
    
    # Handle company: prefix
    if source.startswith('company:'):
        company_slug = source.split(':', 1)[1]
        print(f"Company-specific scraper not yet implemented: {company_slug}")
        return
    
    # Get scraper class
    scraper_class = SCRAPER_MAP.get(source.lower())
    if not scraper_class:
        print(f"Unknown source: {source}")
        print(f"Available sources: {', '.join(SCRAPER_MAP.keys())}")
        return
    
    # Get config from registry
    config = registry.get_scraper(source.lower())
    if not config:
        # Use defaults
        config_dict = {'source_key': source.lower()}
    else:
        config_dict = {
            'source_key': config.source_key,
            'name': config.name,
            'base_url': config.base_url,
            'max_rps': config.max_requests_per_second,
            'max_concurrent': config.max_concurrent,
            'user_agent': config.user_agent,
        }
    
    # Create scraper instance
    scraper = scraper_class(config_dict)
    
    print(f"🔍 Running {config_dict.get('name', source)} scraper...")
    print(f"   Since: {since or 'all time'}")
    print(f"   Limit: {limit or 'no limit'}")
    print(f"   Dry run: {dry_run}")
    print(f"   Save fixtures: {save_fixture}")
    
    if url:
        print(f"   URL: {url}")
        # Scrape specific URL
        results = await scraper.run(
            method='url',
            urls=[url],
            dry_run=dry_run,
            save_fixture=save_fixture,
        )
    else:
        # Scrape from discovery
        results = await scraper.run(
            since=since,
            limit=limit,
            dry_run=dry_run,
            save_fixture=save_fixture,
        )
    
    print(f"\n✅ Completed: {len(results)} items processed")
    
    # Print summary
    if results:
        print("\nSummary:")
        for i, result in enumerate(results[:5], 1):  # Show first 5
            print(f"  {i}. {result.data.get('title', 'No title')}")
            if result.fixture_path:
                print(f"     Fixture: {result.fixture_path}")
        
        if len(results) > 5:
            print(f"  ... and {len(results) - 5} more")


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Biotech Terminal Scraper CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape FierceBiotech (last 7 days, max 20 articles)
  python -m platform.cli.scrape --source fierce --since 7d --limit 20
  
  # Scrape FDA with fixtures for testing
  python -m platform.cli.scrape --source fda --save-fixture --limit 10
  
  # Dry run BusinessWire
  python -m platform.cli.scrape --source businesswire --dry-run
  
  # Scrape specific URL
  python -m platform.cli.scrape --source fierce --url https://www.fiercebiotech.com/...
  
Available sources:
  fierce, fiercebiotech, fiercepharma
  businesswire, globenewswire, prnewswire
  fda, ema, mhra
  clinicaltrials, edgar
  company:<slug> (company IR pages)
        """
    )
    
    parser.add_argument(
        '--source',
        required=True,
        help='Source to scrape (fierce, fda, businesswire, etc.)'
    )
    
    parser.add_argument(
        '--since',
        help='Only scrape content after this date (e.g., "7d", "2024-01-01", "2 weeks ago")'
    )
    
    parser.add_argument(
        '--limit',
        type=int,
        help='Maximum number of items to scrape'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help="Don't write to database"
    )
    
    parser.add_argument(
        '--save-fixture',
        action='store_true',
        help='Save raw HTML and parsed JSON to tmp/fixtures/'
    )
    
    parser.add_argument(
        '--url',
        help='Scrape a specific URL'
    )
    
    args = parser.parse_args()
    
    # Parse since parameter
    since_date = None
    if args.since:
        if args.since.endswith('d'):
            # Days ago
            days = int(args.since[:-1])
            since_date = datetime.utcnow() - timedelta(days=days)
        elif args.since.endswith('w'):
            # Weeks ago
            weeks = int(args.since[:-1])
            since_date = datetime.utcnow() - timedelta(weeks=weeks)
        else:
            # Parse as date
            try:
                since_date = datetime.fromisoformat(args.since)
            except ValueError:
                print(f"Invalid date format: {args.since}")
                sys.exit(1)
    
    # Run scraper
    asyncio.run(run_scraper(
        source=args.source,
        since=since_date,
        limit=args.limit,
        dry_run=args.dry_run,
        save_fixture=args.save_fixture,
        url=args.url,
    ))


if __name__ == '__main__':
    main()
