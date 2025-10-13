#!/usr/bin/env python3
"""
XBI Companies Data Ingestion Script

Fetches and populates company profiles for all XBI constituents.
Uses yfinance for free financial data and caches results.

Usage:
    python -m bt_platform.core.ingest_xbi_companies
    python -m bt_platform.core.ingest_xbi_companies --force-refresh
    python -m bt_platform.core.ingest_xbi_companies --ticker VRTX
"""

import argparse
import logging
from datetime import datetime
from pathlib import Path

import yaml
from sqlalchemy.orm import Session

from bt_platform.core.database import Company, SessionLocal
from bt_platform.providers.company_profile_provider import CompanyProfileProvider

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def load_xbi_constituents() -> list[dict]:
    """Load XBI constituents list from YAML file"""
    yaml_path = Path(__file__).parent.parent.parent / "data" / "xbi_constituents.yaml"

    if not yaml_path.exists():
        logger.error(f"XBI constituents file not found: {yaml_path}")
        return []

    try:
        with open(yaml_path) as f:
            data = yaml.safe_load(f)

        constituents = data.get("constituents", [])
        logger.info(f"Loaded {len(constituents)} XBI constituents from {yaml_path}")
        return constituents
    except Exception as e:
        logger.error(f"Error loading XBI constituents: {e}")
        return []


def create_or_update_company(db: Session, profile: dict) -> bool:
    """
    Create or update a company record in the database.

    Args:
        db: Database session
        profile: Company profile data from provider

    Returns:
        True if successful, False otherwise
    """
    try:
        ticker = profile["ticker"]

        # Check if company already exists
        existing = db.query(Company).filter(Company.ticker == ticker).first()

        if existing:
            # Update existing company
            existing.name = profile.get("name", existing.name)
            existing.company_type = profile.get("company_type", existing.company_type)
            existing.description = profile.get("description", existing.description)
            existing.website = profile.get("website", existing.website)
            existing.headquarters = profile.get("headquarters", existing.headquarters)
            existing.founded = profile.get("founded_year", existing.founded)
            existing.employees = profile.get("employees", existing.employees)
            existing.market_cap = profile.get("market_cap", existing.market_cap)
            existing.therapeutic_areas = existing.therapeutic_areas  # Keep existing

            # Set investor relations URL (use website if not available)
            if not existing.investor_relations_url:
                website = profile.get("website", "")
                if website:
                    # Common patterns for IR URLs
                    if "www." in website:
                        ir_url = website.replace("www.", "investors.")
                    else:
                        ir_url = website.rstrip("/") + "/investors"
                    existing.investor_relations_url = ir_url

            logger.info(f"Updated company: {ticker}")
        else:
            # Create new company
            company = Company(
                ticker=ticker,
                name=profile.get("name", ticker),
                company_type=profile.get("company_type", "Biotech"),
                description=profile.get("description", ""),
                website=profile.get("website", ""),
                headquarters=profile.get("headquarters", ""),
                founded=profile.get("founded_year"),
                employees=profile.get("employees"),
                market_cap=profile.get("market_cap"),
                is_xbi_constituent=True,
                xbi_added_date=datetime.now(),
                therapeutic_areas=""  # Will be populated separately
            )

            # Set investor relations URL
            website = profile.get("website", "")
            if website:
                if "www." in website:
                    ir_url = website.replace("www.", "investors.")
                else:
                    ir_url = website.rstrip("/") + "/investors"
                company.investor_relations_url = ir_url

            db.add(company)
            logger.info(f"Created company: {ticker}")

        db.commit()
        return True

    except Exception as e:
        logger.error(f"Error creating/updating company {profile.get('ticker', 'UNKNOWN')}: {e}")
        db.rollback()
        return False


def ingest_xbi_companies(
    force_refresh: bool = False,
    specific_ticker: str = None,
    batch_size: int = 10
):
    """
    Main ingestion function for XBI companies.

    Args:
        force_refresh: If True, bypass cache and fetch fresh data
        specific_ticker: If provided, only ingest this ticker
        batch_size: Process companies in batches of this size
    """
    logger.info("Starting XBI companies data ingestion")
    logger.info(f"Force refresh: {force_refresh}")

    # Initialize provider
    provider = CompanyProfileProvider(cache_ttl_hours=24)

    # Load constituents
    if specific_ticker:
        constituents = [{"ticker": specific_ticker.upper(), "name": specific_ticker}]
    else:
        constituents = load_xbi_constituents()

    if not constituents:
        logger.error("No constituents to process")
        return

    # Get database session
    db = SessionLocal()

    try:
        total = len(constituents)
        success_count = 0
        fail_count = 0

        logger.info(f"Processing {total} companies...")

        for i, constituent in enumerate(constituents, 1):
            ticker = constituent["ticker"]
            logger.info(f"[{i}/{total}] Processing {ticker}...")

            # Fetch profile
            profile = provider.get_company_profile(ticker, force_refresh=force_refresh)

            if profile is None:
                logger.warning(f"Could not fetch profile for {ticker}")
                fail_count += 1
                continue

            # Validate profile has minimum required data
            if not profile.get("name"):
                logger.warning(f"Invalid profile for {ticker} - missing name")
                fail_count += 1
                continue

            # Create or update in database
            if create_or_update_company(db, profile):
                success_count += 1
            else:
                fail_count += 1

            # Log progress every batch
            if i % batch_size == 0:
                logger.info(f"Progress: {i}/{total} - Success: {success_count}, Failed: {fail_count}")

        # Final summary
        logger.info("=" * 60)
        logger.info("XBI Companies Ingestion Complete")
        logger.info(f"Total processed: {total}")
        logger.info(f"Successful: {success_count}")
        logger.info(f"Failed: {fail_count}")
        logger.info(f"Success rate: {success_count/total*100:.1f}%")
        logger.info("=" * 60)

    finally:
        db.close()


def main():
    """Main entry point with argument parsing"""
    parser = argparse.ArgumentParser(
        description="Ingest XBI company profiles into database"
    )
    parser.add_argument(
        "--force-refresh",
        action="store_true",
        help="Force refresh data from source, bypassing cache"
    )
    parser.add_argument(
        "--ticker",
        type=str,
        help="Process only this specific ticker"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Batch size for progress reporting (default: 10)"
    )

    args = parser.parse_args()

    ingest_xbi_companies(
        force_refresh=args.force_refresh,
        specific_ticker=args.ticker,
        batch_size=args.batch_size
    )


if __name__ == "__main__":
    main()
