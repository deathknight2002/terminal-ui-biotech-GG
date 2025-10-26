#!/usr/bin/env python3
"""
Pipeline Scraper CLI

Command-line interface for scraping company pipeline data.

Usage:
    python -m bt_platform.cli.scrape_pipeline --all
    python -m bt_platform.cli.scrape_pipeline --company Biogen
    python -m bt_platform.cli.scrape_pipeline --company Amgen --company Gilead
    python -m bt_platform.cli.scrape_pipeline --stats
"""

import argparse
import asyncio
import logging
import sys
from datetime import datetime
from typing import List, Optional

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

# Setup paths
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from bt_platform.core.database import SessionLocal
from bt_platform.scrapers.pipeline_manager import get_pipeline_manager

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

console = Console()


async def scrape_all_companies(limit: int = 100):
    """Scrape all available company pipelines."""
    db = SessionLocal()

    try:
        manager = get_pipeline_manager()

        console.print("\n[bold cyan]🔬 Pipeline Scraper - Scraping All Companies[/bold cyan]\n")

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Scraping pipelines...", total=None)

            result = await manager.scrape_all_companies(db=db, limit=limit)

            progress.update(task, completed=True)

        # Display results
        console.print("\n[bold green]✓ Scraping Complete[/bold green]\n")

        # Summary table
        summary = Table(title="Scraping Summary")
        summary.add_column("Metric", style="cyan")
        summary.add_column("Value", style="green")

        summary.add_row("Duration", f"{result['duration_seconds']:.2f}s")
        summary.add_row("Companies Scraped", str(result['companies_scraped']))
        summary.add_row("Successful", str(result['companies_successful']))
        summary.add_row("Failed", str(result['companies_failed']))
        summary.add_row("Total Assets Found", str(result['total_assets_found']))
        summary.add_row("Assets Inserted", str(result['total_assets_inserted']))
        summary.add_row("Assets Updated", str(result['total_assets_updated']))

        console.print(summary)

        # Detailed results
        if result['results']:
            console.print("\n[bold]Detailed Results:[/bold]\n")

            details = Table()
            details.add_column("Company", style="cyan")
            details.add_column("Status", style="green")
            details.add_column("Assets Found", justify="right")
            details.add_column("Inserted", justify="right")
            details.add_column("Updated", justify="right")

            for r in result['results']:
                status = "✓" if r.get('status') == 'success' else "✗"
                details.add_row(
                    r['company'],
                    status,
                    str(r.get('assets_found', 0)),
                    str(r.get('assets_inserted', 0)),
                    str(r.get('assets_updated', 0))
                )

            console.print(details)

        # Errors
        if result['errors']:
            console.print("\n[bold red]Errors:[/bold red]\n")
            for error in result['errors']:
                console.print(f"  • {error['company']}: {error['error']}")

        return result

    except Exception as e:
        console.print(f"\n[bold red]Error: {e}[/bold red]")
        logger.exception("Scraping failed")
        return None

    finally:
        db.close()


async def scrape_specific_companies(companies: List[str], limit: int = 100):
    """Scrape specific company pipelines."""
    db = SessionLocal()

    try:
        manager = get_pipeline_manager()

        console.print(f"\n[bold cyan]🔬 Pipeline Scraper - Scraping {len(companies)} Companies[/bold cyan]\n")
        console.print(f"Companies: {', '.join(companies)}\n")

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task("Scraping pipelines...", total=None)

            result = await manager.scrape_all_companies(
                db=db,
                companies=companies,
                limit=limit
            )

            progress.update(task, completed=True)

        # Display results (same as scrape_all_companies)
        console.print("\n[bold green]✓ Scraping Complete[/bold green]\n")

        summary = Table(title="Scraping Summary")
        summary.add_column("Metric", style="cyan")
        summary.add_column("Value", style="green")

        summary.add_row("Duration", f"{result['duration_seconds']:.2f}s")
        summary.add_row("Companies Scraped", str(result['companies_scraped']))
        summary.add_row("Successful", str(result['companies_successful']))
        summary.add_row("Failed", str(result['companies_failed']))
        summary.add_row("Total Assets Found", str(result['total_assets_found']))
        summary.add_row("Assets Inserted", str(result['total_assets_inserted']))
        summary.add_row("Assets Updated", str(result['total_assets_updated']))

        console.print(summary)

        if result['results']:
            console.print("\n[bold]Detailed Results:[/bold]\n")

            details = Table()
            details.add_column("Company", style="cyan")
            details.add_column("Status", style="green")
            details.add_column("Assets Found", justify="right")
            details.add_column("Inserted", justify="right")
            details.add_column("Updated", justify="right")

            for r in result['results']:
                status = "✓" if r.get('status') == 'success' else "✗"
                details.add_row(
                    r['company'],
                    status,
                    str(r.get('assets_found', 0)),
                    str(r.get('assets_inserted', 0)),
                    str(r.get('assets_updated', 0))
                )

            console.print(details)

        if result['errors']:
            console.print("\n[bold red]Errors:[/bold red]\n")
            for error in result['errors']:
                console.print(f"  • {error['company']}: {error['error']}")

        return result

    except Exception as e:
        console.print(f"\n[bold red]Error: {e}[/bold red]")
        logger.exception("Scraping failed")
        return None

    finally:
        db.close()


def show_stats():
    """Show pipeline statistics."""
    db = SessionLocal()

    try:
        manager = get_pipeline_manager()
        stats = manager.get_pipeline_stats(db)

        console.print("\n[bold cyan]📊 Pipeline Statistics[/bold cyan]\n")

        # Overall stats
        overview = Table(title="Overview")
        overview.add_column("Metric", style="cyan")
        overview.add_column("Value", style="green")

        overview.add_row("Total Assets", str(stats.get('total_assets', 0)))
        overview.add_row("Last Scrape", stats.get('last_scrape', 'Never'))
        overview.add_row("Available Companies", str(len(stats.get('available_companies', []))))

        console.print(overview)

        # Assets by company
        if stats.get('assets_by_company'):
            console.print("\n[bold]Assets by Company:[/bold]\n")

            company_table = Table()
            company_table.add_column("Company", style="cyan")
            company_table.add_column("Assets", justify="right", style="green")

            for company, count in sorted(
                stats['assets_by_company'].items(),
                key=lambda x: x[1],
                reverse=True
            ):
                company_table.add_row(company, str(count))

            console.print(company_table)

        # Assets by phase
        if stats.get('assets_by_phase'):
            console.print("\n[bold]Assets by Phase:[/bold]\n")

            phase_table = Table()
            phase_table.add_column("Phase", style="cyan")
            phase_table.add_column("Assets", justify="right", style="green")

            phases_order = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved']
            for phase in phases_order:
                count = stats['assets_by_phase'].get(phase, 0)
                if count > 0:
                    phase_table.add_row(phase, str(count))

            console.print(phase_table)

        # Available companies
        if stats.get('available_companies'):
            console.print("\n[bold]Available Companies for Scraping:[/bold]")
            console.print(f"  {', '.join(stats['available_companies'])}\n")

    except Exception as e:
        console.print(f"\n[bold red]Error: {e}[/bold red]")
        logger.exception("Failed to retrieve stats")

    finally:
        db.close()


def list_companies():
    """List available companies."""
    try:
        manager = get_pipeline_manager()
        companies = manager.get_available_companies()

        console.print("\n[bold cyan]🏢 Available Companies for Pipeline Scraping[/bold cyan]\n")

        table = Table()
        table.add_column("#", style="cyan", justify="right")
        table.add_column("Company", style="green")

        for i, company in enumerate(sorted(companies), 1):
            table.add_row(str(i), company)

        console.print(table)
        console.print(f"\n[dim]Total: {len(companies)} companies[/dim]\n")

    except Exception as e:
        console.print(f"\n[bold red]Error: {e}[/bold red]")
        logger.exception("Failed to list companies")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Pipeline Scraper CLI - Extract drug pipeline data from company websites",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape all available companies
  python -m bt_platform.cli.scrape_pipeline --all

  # Scrape specific companies
  python -m bt_platform.cli.scrape_pipeline --company Biogen
  python -m bt_platform.cli.scrape_pipeline --company Amgen --company Gilead

  # Show statistics
  python -m bt_platform.cli.scrape_pipeline --stats

  # List available companies
  python -m bt_platform.cli.scrape_pipeline --list
        """
    )

    parser.add_argument(
        '--all',
        action='store_true',
        help='Scrape all available companies'
    )

    parser.add_argument(
        '--company',
        action='append',
        help='Scrape specific company (can be used multiple times)'
    )

    parser.add_argument(
        '--limit',
        type=int,
        default=100,
        help='Maximum number of assets to process per company (default: 100)'
    )

    parser.add_argument(
        '--stats',
        action='store_true',
        help='Show pipeline statistics'
    )

    parser.add_argument(
        '--list',
        action='store_true',
        help='List available companies'
    )

    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Enable verbose logging'
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Execute command
    if args.stats:
        show_stats()
    elif args.list:
        list_companies()
    elif args.all:
        asyncio.run(scrape_all_companies(limit=args.limit))
    elif args.company:
        asyncio.run(scrape_specific_companies(args.company, limit=args.limit))
    else:
        parser.print_help()
        console.print("\n[yellow]⚠ Please specify an action: --all, --company, --stats, or --list[/yellow]\n")


if __name__ == '__main__':
    main()
