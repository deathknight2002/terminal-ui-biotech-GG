"""
Pipeline Scraper Manager
Orchestrates multiple company pipeline scrapers and aggregates results
"""

import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

from sqlalchemy.orm import Session

from .sites.pipeline_scraper import (
    get_pipeline_scraper,
    AVAILABLE_SCRAPERS,
    PipelineScraperBase
)
from ..core.database import SessionLocal, PipelineAsset, Company

logger = logging.getLogger(__name__)


class PipelineScraperManager:
    """
    Manager for coordinating pipeline scraping across multiple companies.
    Provides aggregated interface for scraping all or specific company pipelines.
    """
    
    def __init__(self, max_workers: int = 3):
        """
        Initialize pipeline scraper manager.
        
        Args:
            max_workers: Maximum number of concurrent scrapers (default: 3)
        """
        self.max_workers = max_workers
        self.scrapers: Dict[str, PipelineScraperBase] = {}
        self._initialize_scrapers()
    
    def _initialize_scrapers(self):
        """Initialize all available company scrapers."""
        for company in AVAILABLE_SCRAPERS:
            scraper = get_pipeline_scraper(company)
            if scraper:
                self.scrapers[company.lower()] = scraper
                logger.info(f"Initialized pipeline scraper for {company}")
    
    async def scrape_company(
        self,
        company_name: str,
        db: Session,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Scrape pipeline data for a specific company.
        
        Args:
            company_name: Name of the company
            db: Database session
            limit: Maximum number of assets to process
            
        Returns:
            Scraping result dictionary
        """
        scraper = self.scrapers.get(company_name.lower())
        
        if not scraper:
            logger.warning(f"No scraper available for {company_name}")
            return {
                'company': company_name,
                'status': 'error',
                'error': f'No scraper available for {company_name}'
            }
        
        try:
            result = await scraper.scrape(db, limit=limit)
            logger.info(f"Completed pipeline scraping for {company_name}: {result.get('assets_found', 0)} assets")
            return result
        except Exception as e:
            logger.error(f"Failed to scrape pipeline for {company_name}: {e}")
            return {
                'company': company_name,
                'status': 'error',
                'error': str(e)
            }
    
    async def scrape_all_companies(
        self,
        db: Session,
        companies: Optional[List[str]] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Scrape pipeline data for all or specified companies.
        
        Args:
            db: Database session
            companies: List of company names to scrape (None = all available)
            limit: Maximum number of assets per company
            
        Returns:
            Aggregated scraping results
        """
        start_time = datetime.utcnow()
        
        # Determine which companies to scrape
        if companies:
            companies_to_scrape = [c for c in companies if c.lower() in self.scrapers]
            missing = [c for c in companies if c.lower() not in self.scrapers]
            if missing:
                logger.warning(f"No scrapers available for: {', '.join(missing)}")
        else:
            companies_to_scrape = list(self.scrapers.keys())
        
        logger.info(f"Starting pipeline scraping for {len(companies_to_scrape)} companies")
        
        results = []
        errors = []
        
        # Scrape each company sequentially (to respect rate limits)
        for company in companies_to_scrape:
            try:
                result = await self.scrape_company(company, db, limit)
                results.append(result)
                
                if result.get('status') == 'error':
                    errors.append({
                        'company': company,
                        'error': result.get('error', 'Unknown error')
                    })
            except Exception as e:
                logger.error(f"Exception scraping {company}: {e}")
                errors.append({
                    'company': company,
                    'error': str(e)
                })
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # Aggregate statistics
        total_assets_found = sum(r.get('assets_found', 0) for r in results)
        total_inserted = sum(r.get('assets_inserted', 0) for r in results)
        total_updated = sum(r.get('assets_updated', 0) for r in results)
        total_skipped = sum(r.get('assets_skipped', 0) for r in results)
        
        return {
            'started_at': start_time.isoformat(),
            'completed_at': end_time.isoformat(),
            'duration_seconds': duration,
            'companies_scraped': len(companies_to_scrape),
            'companies_successful': len([r for r in results if r.get('status') == 'success']),
            'companies_failed': len(errors),
            'total_assets_found': total_assets_found,
            'total_assets_inserted': total_inserted,
            'total_assets_updated': total_updated,
            'total_assets_skipped': total_skipped,
            'results': results,
            'errors': errors
        }
    
    def get_available_companies(self) -> List[str]:
        """
        Get list of companies with available scrapers.
        
        Returns:
            List of company names
        """
        return list(self.scrapers.keys())
    
    def get_pipeline_stats(self, db: Session) -> Dict[str, Any]:
        """
        Get statistics about scraped pipeline data.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with pipeline statistics
        """
        try:
            # Total assets
            total_assets = db.query(PipelineAsset).count()
            
            # Assets by company
            company_counts = {}
            for company in AVAILABLE_SCRAPERS:
                count = db.query(PipelineAsset).filter(
                    PipelineAsset.company_name == company
                ).count()
                company_counts[company] = count
            
            # Assets by phase
            phase_counts = {}
            phases = ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Filed', 'Approved']
            for phase in phases:
                count = db.query(PipelineAsset).filter(
                    PipelineAsset.phase == phase
                ).count()
                phase_counts[phase] = count
            
            # Most recently scraped
            latest_scrape = db.query(PipelineAsset).order_by(
                PipelineAsset.scraped_at.desc()
            ).first()
            
            last_scrape_time = latest_scrape.scraped_at.isoformat() if latest_scrape else None
            
            return {
                'total_assets': total_assets,
                'assets_by_company': company_counts,
                'assets_by_phase': phase_counts,
                'last_scrape': last_scrape_time,
                'available_companies': self.get_available_companies()
            }
        
        except Exception as e:
            logger.error(f"Failed to get pipeline stats: {e}")
            return {
                'error': str(e)
            }
    
    async def close_all(self):
        """Close all scraper connections."""
        for scraper in self.scrapers.values():
            try:
                await scraper.close()
            except Exception as e:
                logger.error(f"Error closing scraper: {e}")


# Singleton instance
_pipeline_manager: Optional[PipelineScraperManager] = None


def get_pipeline_manager() -> PipelineScraperManager:
    """
    Get or create pipeline scraper manager singleton.
    
    Returns:
        PipelineScraperManager instance
    """
    global _pipeline_manager
    
    if _pipeline_manager is None:
        _pipeline_manager = PipelineScraperManager()
    
    return _pipeline_manager


def reset_pipeline_manager():
    """Reset pipeline manager singleton (useful for testing)."""
    global _pipeline_manager
    _pipeline_manager = None
