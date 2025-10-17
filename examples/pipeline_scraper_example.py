"""
Pipeline Scraper Usage Examples

Demonstrates how to use the pipeline scraper in different scenarios.
"""

import asyncio
from datetime import datetime

# Note: This is a demonstration script showing usage patterns.
# Actual execution requires database setup and dependencies installed.

# ============================================================================
# Example 1: Basic CLI Usage
# ============================================================================

def example_cli_usage():
    """
    Show CLI commands for pipeline scraping.
    """
    print("=" * 60)
    print("Example 1: CLI Usage")
    print("=" * 60)
    print()
    
    commands = [
        ("Scrape all companies", 
         "python -m bt_platform.cli.scrape_pipeline --all"),
        
        ("Scrape specific companies",
         "python -m bt_platform.cli.scrape_pipeline --company Biogen --company Amgen"),
        
        ("View statistics",
         "python -m bt_platform.cli.scrape_pipeline --stats"),
        
        ("List available companies",
         "python -m bt_platform.cli.scrape_pipeline --list"),
        
        ("Verbose output",
         "python -m bt_platform.cli.scrape_pipeline --all --verbose"),
    ]
    
    for description, command in commands:
        print(f"# {description}")
        print(f"$ {command}")
        print()


# ============================================================================
# Example 2: Python API Usage
# ============================================================================

async def example_python_api():
    """
    Demonstrate Python API usage.
    """
    print("=" * 60)
    print("Example 2: Python API Usage")
    print("=" * 60)
    print()
    
    # This is示例代码 - requires actual database connection
    code_example = '''
from bt_platform.scrapers.pipeline_manager import get_pipeline_manager
from bt_platform.core.database import SessionLocal

# Initialize manager and database
manager = get_pipeline_manager()
db = SessionLocal()

try:
    # Scrape all companies
    result = await manager.scrape_all_companies(db=db, limit=100)
    
    print(f"Companies scraped: {result['companies_scraped']}")
    print(f"Assets found: {result['total_assets_found']}")
    print(f"Assets inserted: {result['total_assets_inserted']}")
    print(f"Assets updated: {result['total_assets_updated']}")
    
    # Get statistics
    stats = manager.get_pipeline_stats(db)
    print(f"Total assets in database: {stats['total_assets']}")
    
    # Get available companies
    companies = manager.get_available_companies()
    print(f"Available scrapers: {', '.join(companies)}")
    
finally:
    await manager.close_all()
    db.close()
'''
    
    print("Python Code:")
    print(code_example)


# ============================================================================
# Example 3: REST API Usage
# ============================================================================

def example_rest_api():
    """
    Show REST API endpoint examples.
    """
    print("=" * 60)
    print("Example 3: REST API Usage")
    print("=" * 60)
    print()
    
    examples = [
        ("Trigger pipeline scraping",
         "POST /api/v1/pipeline/scrape",
         '''
{
  "companies": ["Biogen", "Amgen"],
  "limit": 100
}
'''),
        
        ("Get all pipeline assets",
         "GET /api/v1/pipeline/assets?limit=100",
         None),
        
        ("Filter by company",
         "GET /api/v1/pipeline/assets?company=Biogen&phase=Phase%20II",
         None),
        
        ("Get specific asset",
         "GET /api/v1/pipeline/assets/123",
         None),
        
        ("Get statistics",
         "GET /api/v1/pipeline/stats",
         None),
        
        ("Get company pipeline",
         "GET /api/v1/pipeline/company/Biogen",
         None),
        
        ("Health check",
         "GET /api/v1/pipeline/health",
         None),
    ]
    
    for title, endpoint, body in examples:
        print(f"# {title}")
        print(f"{endpoint}")
        if body:
            print(body)
        print()


# ============================================================================
# Example 4: Scheduled Scraping
# ============================================================================

async def example_scheduled_scraping():
    """
    Demonstrate automated scheduling.
    """
    print("=" * 60)
    print("Example 4: Automated Scheduling")
    print("=" * 60)
    print()
    
    code_example = '''
from bt_platform.scrapers.pipeline_scheduler import get_pipeline_scheduler

# Get scheduler instance
scheduler = get_pipeline_scheduler()

# Option 1: Daily refresh at 2 AM
scheduler.schedule_daily(hour=2, minute=0)

# Option 2: Weekly refresh (Monday at 2 AM)
scheduler.schedule_weekly(day_of_week='mon', hour=2, minute=0)

# Option 3: Interval-based (every 24 hours)
scheduler.schedule_interval(hours=24)

# Start the scheduler
scheduler.start()

# Check status
status = scheduler.get_status()
print(f"Scheduler running: {status['running']}")
print(f"Last run: {status['last_run']}")
print(f"Scheduled jobs: {len(status['scheduled_jobs'])}")

# Manual trigger (doesn't affect schedule)
await scheduler.run_now()

# Stop scheduler
scheduler.stop()
'''
    
    print("Scheduling Code:")
    print(code_example)


# ============================================================================
# Example 5: Adding a New Company Scraper
# ============================================================================

def example_new_company_scraper():
    """
    Show how to add a new company scraper.
    """
    print("=" * 60)
    print("Example 5: Adding a New Company Scraper")
    print("=" * 60)
    print()
    
    code_example = '''
from bt_platform.scrapers.sites.pipeline_scraper import PipelineScraperBase
from typing import List, Dict, Any
from bs4 import BeautifulSoup

class PfizerPipelineScraper(PipelineScraperBase):
    """Scraper for Pfizer's pipeline page."""
    
    def __init__(self):
        super().__init__(
            company_name="Pfizer",
            pipeline_url="https://www.pfizer.com/science/drug-product-pipeline"
        )
    
    async def parse(self, html: str, url: str) -> List[Dict[str, Any]]:
        """Parse Pfizer pipeline page."""
        soup = BeautifulSoup(html, 'html.parser')
        assets = []
        
        # Find pipeline data (adjust selectors based on actual site)
        pipeline_rows = soup.find_all('div', class_='pipeline-asset')
        
        for row in pipeline_rows:
            asset = {
                'asset_name': row.find('h3').get_text(strip=True),
                'phase': row.find('span', class_='phase').get_text(strip=True),
                'indication': row.find('div', class_='indication').get_text(strip=True),
                'therapeutic_area': row.find('div', class_='ta').get_text(strip=True),
                'mechanism_of_action': '',
                'modality': '',
                'logo_url': '',
                'metadata': {}
            }
            
            if asset['asset_name']:
                assets.append(asset)
        
        return assets

# Register in factory function (pipeline_scraper.py)
def get_pipeline_scraper(company_name: str):
    scrapers = {
        'biogen': BiogenPipelineScraper,
        'amgen': AmgenPipelineScraper,
        'pfizer': PfizerPipelineScraper,  # Add here
        # ... other scrapers
    }
    
    scraper_class = scrapers.get(company_name.lower())
    if scraper_class:
        return scraper_class()
    return None

# Add to AVAILABLE_SCRAPERS list
AVAILABLE_SCRAPERS = [
    'Biogen',
    'Amgen',
    'Pfizer',  # Add here
    # ... other companies
]
'''
    
    print("New Scraper Template:")
    print(code_example)


# ============================================================================
# Example 6: Data Query Examples
# ============================================================================

def example_data_queries():
    """
    Show how to query pipeline data.
    """
    print("=" * 60)
    print("Example 6: Querying Pipeline Data")
    print("=" * 60)
    print()
    
    code_example = '''
from bt_platform.core.database import SessionLocal, PipelineAsset

db = SessionLocal()

# Query 1: Get all Phase III assets
phase3_assets = db.query(PipelineAsset).filter(
    PipelineAsset.phase == 'Phase III'
).all()

# Query 2: Get Biogen's oncology pipeline
biogen_onc = db.query(PipelineAsset).filter(
    PipelineAsset.company_name == 'Biogen',
    PipelineAsset.therapeutic_area.ilike('%oncology%')
).all()

# Query 3: Count assets by phase
from sqlalchemy import func

phase_counts = db.query(
    PipelineAsset.phase,
    func.count(PipelineAsset.id)
).group_by(PipelineAsset.phase).all()

# Query 4: Most recent scrape
latest = db.query(PipelineAsset).order_by(
    PipelineAsset.scraped_at.desc()
).first()

# Query 5: Find duplicates (same asset name, different sources)
duplicates = db.query(
    PipelineAsset.asset_name,
    func.count(PipelineAsset.id)
).group_by(
    PipelineAsset.asset_name
).having(
    func.count(PipelineAsset.id) > 1
).all()

db.close()
'''
    
    print("Query Examples:")
    print(code_example)


# ============================================================================
# Example 7: Integration with Frontend
# ============================================================================

def example_frontend_integration():
    """
    Show how to integrate with React frontend.
    """
    print("=" * 60)
    print("Example 7: Frontend Integration")
    print("=" * 60)
    print()
    
    code_example = '''
// React component for displaying pipeline data

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PipelineDashboard() {
  const [pipelines, setPipelines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch pipeline data
    async function fetchData() {
      try {
        const [pipelinesRes, statsRes] = await Promise.all([
          axios.get('/api/v1/pipeline/assets?limit=100'),
          axios.get('/api/v1/pipeline/stats')
        ]);
        
        setPipelines(pipelinesRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const handleScrape = async (company) => {
    try {
      const response = await axios.post('/api/v1/pipeline/scrape', {
        companies: [company],
        limit: 100
      });
      
      alert(`Scraped ${response.data.total_assets_found} assets for ${company}`);
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      alert('Scraping failed: ' + error.message);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="pipeline-dashboard">
      <h1>Drug Pipeline Dashboard</h1>
      
      <div className="stats">
        <div className="stat-card">
          <h3>Total Assets</h3>
          <p>{stats?.total_assets || 0}</p>
        </div>
        
        <div className="stat-card">
          <h3>Companies</h3>
          <p>{stats?.available_companies?.length || 0}</p>
        </div>
      </div>
      
      <div className="pipeline-table">
        <table>
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Company</th>
              <th>Phase</th>
              <th>Indication</th>
              <th>Therapeutic Area</th>
            </tr>
          </thead>
          <tbody>
            {pipelines.map(asset => (
              <tr key={asset.id}>
                <td>{asset.asset_name}</td>
                <td>{asset.company_name}</td>
                <td>{asset.phase}</td>
                <td>{asset.indication}</td>
                <td>{asset.therapeutic_area}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PipelineDashboard;
'''
    
    print("React Component Example:")
    print(code_example)


# ============================================================================
# Main
# ============================================================================

def main():
    """Run all examples."""
    print("\n" + "=" * 60)
    print("PIPELINE SCRAPER - USAGE EXAMPLES")
    print("=" * 60 + "\n")
    
    example_cli_usage()
    asyncio.run(example_python_api())
    example_rest_api()
    asyncio.run(example_scheduled_scraping())
    example_new_company_scraper()
    example_data_queries()
    example_frontend_integration()
    
    print("\n" + "=" * 60)
    print("For more information, see PIPELINE_SCRAPER_README.md")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    main()
