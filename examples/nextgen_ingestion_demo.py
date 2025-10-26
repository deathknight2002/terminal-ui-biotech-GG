"""
Example: Using Next-Gen Ingestion Features

This script demonstrates the key features of the next-gen ingestion system.
Run with: python examples/nextgen_ingestion_demo.py
"""

import asyncio
from datetime import datetime, timedelta
from pathlib import Path


async def demo_priority_queue():
    """Demonstrate priority queue with rate limiting"""
    print("\n" + "="*60)
    print("DEMO 1: Priority Queue System")
    print("="*60 + "\n")

    from bt_platform.scrapers.utils import PriorityQueue, Priority

    # Create queue
    queue = PriorityQueue()

    # Add items with different priorities
    print("📥 Adding items to queue...")
    queue.add('https://www.fda.gov/news', 'fda', Priority.REGULATOR)
    queue.add('https://investor.company.com/press', 'company_ir', Priority.IR_PAGE)
    queue.add('https://www.fiercebiotech.com/latest', 'fierce', Priority.NEWS_TIER1)
    queue.add('https://www.biospace.com/news', 'biospace', Priority.NEWS_TIER2)

    print(f"✅ Added {queue.size()} items\n")

    # Show queue will process in priority order
    print("🔄 Items will be processed in this order:")
    for i, item in enumerate(sorted(queue.queue), 1):
        print(f"  {i}. [{Priority(item.priority).name}] {item.url}")

    # Show statistics
    print(f"\n📊 Queue statistics:")
    stats = queue.get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")


async def demo_renderless_discovery():
    """Demonstrate RSS/sitemap auto-discovery"""
    print("\n" + "="*60)
    print("DEMO 2: Renderless Discovery (RSS/Sitemap)")
    print("="*60 + "\n")

    from bt_platform.scrapers.utils import RenderlessDiscovery, AsyncHTTPClient

    # Note: This demo shows the API but won't actually make HTTP requests
    print("📡 Discovery strategy: RSS/Atom → Sitemap → HTML")
    print("\nExample usage:")
    print("""
    async with AsyncHTTPClient() as client:
        discovery = RenderlessDiscovery(client)

        # Discover URLs from a site
        urls, method = await discovery.discover_urls(
            'https://www.fiercebiotech.com',
            since=datetime.utcnow() - timedelta(days=7),
            limit=50
        )

        print(f"Discovered {len(urls)} URLs via {method}")
        # method will be: 'rss', 'sitemap', or 'none'
    """)


async def demo_dual_refresh():
    """Demonstrate dual refresh modes"""
    print("\n" + "="*60)
    print("DEMO 3: Dual Refresh Modes")
    print("="*60 + "\n")

    from bt_platform.scrapers.utils import RefreshManager, RefreshMode

    print("⚡ Quick Mode (≤10s):")
    print("  - High-priority sources only")
    print("  - Uses conditional requests (ETag/Last-Modified)")
    print("  - Limited to 20 sources")
    print("  - Ideal for routine checks\n")

    print("🔍 Deep Mode (≤60s):")
    print("  - All sources including archives")
    print("  - Full discovery (RSS, sitemap, HTML)")
    print("  - Complete metadata extraction")
    print("  - Ideal for comprehensive analysis\n")

    print("Example usage:")
    print("""
    manager = RefreshManager()

    sources = {
        'fda': 'https://www.fda.gov',
        'fierce': 'https://www.fiercebiotech.com',
    }

    # Quick refresh
    results = await manager.quick_refresh(sources, since=datetime.utcnow() - timedelta(days=7))

    # Deep refresh
    results = await manager.deep_refresh(sources, since=datetime.utcnow() - timedelta(days=30))

    # Check statistics
    stats = manager.get_stats()
    print(f"Quick avg: {stats['quick_avg_time']:.2f}s")
    print(f"Deep avg: {stats['deep_avg_time']:.2f}s")
    """)


def demo_pdf_intelligence():
    """Demonstrate PDF intelligence extraction"""
    print("\n" + "="*60)
    print("DEMO 4: PDF Intelligence")
    print("="*60 + "\n")

    from bt_platform.scrapers.utils import PDFIntelligence

    # Sample PDF text
    sample_text = """
    Clinical Trial NCT12345678: Phase II/III Study

    Primary Endpoint: Overall Survival (OS)
    Secondary Endpoints: Progression-Free Survival (PFS), Objective Response Rate (ORR)

    Indication: Advanced Melanoma, Non-Small Cell Lung Cancer
    Target: PD-1 inhibitor
    Modality: Monoclonal antibody

    FDA granted Breakthrough Therapy designation for this treatment.
    """

    intelligence = PDFIntelligence()
    data = intelligence.extract_from_text(sample_text)

    print("📄 Extracted trial data:")
    print(f"  Trial IDs: {data.trial_ids}")
    print(f"  Phases: {data.phases}")
    print(f"  Endpoints: {len(data.endpoints)} found")
    print(f"  Indications: {data.indications}")
    print(f"  Targets: {data.targets}")
    print(f"  Modalities: {data.modalities}")
    print(f"  Regulatory: {data.regulatory_tokens}")
    print(f"  Success rate: {data.success_rate:.1f}%")


def demo_csv_dropzone():
    """Demonstrate CSV price import"""
    print("\n" + "="*60)
    print("DEMO 5: CSV Drop-Zone")
    print("="*60 + "\n")

    from bt_platform.scrapers.utils import CSVDropZone, PriceDataValidator

    # Sample CSV
    csv_content = """date,ticker,open,high,low,close,volume
2024-01-15,BLUE,45.00,46.00,44.50,45.50,1000000
2024-01-16,BLUE,45.50,47.00,45.00,46.20,1200000
2024-01-17,BLUE,46.00,48.00,45.50,47.10,1500000"""

    drop_zone = CSVDropZone()
    records = drop_zone.parse_csv(csv_content)

    print(f"📊 Imported {len(records)} price records\n")

    # Show sample
    for record in records[:2]:
        print(f"  {record.ticker} @ {record.date.date()}:")
        print(f"    Open: ${record.open:.2f}, Close: ${record.close:.2f}")
        print(f"    Volume: {record.volume:,}")
    print(f"  ... and {len(records) - 2} more\n")

    # Validate
    validator = PriceDataValidator()
    validation = validator.validate_records(records)

    print(f"✅ Validation: {'Passed' if validation['valid'] else 'Failed'}")
    print(f"  Total records: {validation['total_records']}")

    if not validation['valid']:
        print(f"  Issues: {validation['issues']}")


async def demo_self_healing_parser():
    """Demonstrate self-healing parser"""
    print("\n" + "="*60)
    print("DEMO 6: Self-Healing Parser")
    print("="*60 + "\n")

    from bt_platform.scrapers.utils import SelfHealingParser

    print("🔧 4-Tier Fallback Strategy:")
    print("  1. Structured data (JSON-LD, OpenGraph)")
    print("  2. Custom CSS selectors per source")
    print("  3. Readability extraction algorithm")
    print("  4. Full-text fallback\n")

    parser = SelfHealingParser()

    # Register custom selectors
    parser.register_selectors('fierce', {
        'title': 'h1.article-title',
        'content': 'div.article-body',
    })

    print("Example HTML with structured data:")
    html = """
    <html>
    <head>
        <script type="application/ld+json">
        {
            "@type": "NewsArticle",
            "headline": "FDA Approves New Cancer Drug",
            "description": "Breakthrough therapy receives approval"
        }
        </script>
    </head>
    <body></body>
    </html>
    """

    result = await parser.parse(html, 'test')

    if result:
        print(f"\n✅ Parsed successfully!")
        print(f"  Method: {result.get('parse_method')}")
        print(f"  Title: {result.get('title')}")
        print(f"  Description: {result.get('description', 'N/A')}")

    # Show health tracking
    print("\n📊 Health Dashboard:")
    print("  Tracks success rate per source")
    print("  Identifies failing parsers")
    print("  Provides failure diagnostics")


def demo_cli_usage():
    """Show CLI usage examples"""
    print("\n" + "="*60)
    print("DEMO 7: CLI Usage")
    print("="*60 + "\n")

    print("🖥️  Command-Line Interface\n")

    print("Quick refresh (≤10s):")
    print("  python -m bt_platform.cli.nextgen_ingest quick --since 7d\n")

    print("Deep refresh (≤60s):")
    print("  python -m bt_platform.cli.nextgen_ingest deep --since 24h -v\n")

    print("Import price CSV:")
    print("  python -m bt_platform.cli.nextgen_ingest import prices.csv --ticker BLUE --save\n")

    print("Check parser health:")
    print("  python -m bt_platform.cli.nextgen_ingest health\n")


async def main():
    """Run all demos"""
    print("\n" + "="*60)
    print("🚀 NEXT-GEN INGESTION SYSTEM - DEMO")
    print("="*60)
    print("\nThis demo shows the key features implemented for personal use.")
    print("No team collaboration, no enterprise features - just efficient scraping.\n")

    # Run all demos
    await demo_priority_queue()
    await demo_renderless_discovery()
    await demo_dual_refresh()
    demo_pdf_intelligence()
    demo_csv_dropzone()
    await demo_self_healing_parser()
    demo_cli_usage()

    print("\n" + "="*60)
    print("✅ DEMO COMPLETE")
    print("="*60)
    print("\nFor more information, see:")
    print("  bt_platform/scrapers/NEXT_GEN_INGESTION.md")
    print("\n")


if __name__ == '__main__':
    asyncio.run(main())
