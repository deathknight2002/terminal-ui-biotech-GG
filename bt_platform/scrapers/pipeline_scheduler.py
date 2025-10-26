"""
Pipeline Scraper Scheduler

Automated scheduling for pipeline data refresh.
Provides configurable periodic updates to maintain fresh pipeline data.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from .pipeline_manager import get_pipeline_manager
from ..core.database import SessionLocal

logger = logging.getLogger(__name__)


class PipelineScheduler:
    """
    Scheduler for automated pipeline data refresh.

    Supports various scheduling patterns:
    - Cron-based (e.g., daily at 2 AM)
    - Interval-based (e.g., every 24 hours)
    - Manual trigger
    """

    def __init__(self):
        """Initialize pipeline scheduler."""
        self.scheduler = AsyncIOScheduler()
        self.manager = get_pipeline_manager()
        self._last_run: Optional[datetime] = None
        self._is_running = False

    def schedule_daily(self, hour: int = 2, minute: int = 0):
        """
        Schedule daily pipeline refresh.

        Args:
            hour: Hour of day to run (0-23, default: 2 AM)
            minute: Minute of hour to run (0-59, default: 0)
        """
        trigger = CronTrigger(hour=hour, minute=minute)

        self.scheduler.add_job(
            self._run_scraping,
            trigger=trigger,
            id='pipeline_daily',
            name='Daily Pipeline Refresh',
            replace_existing=True
        )

        logger.info(f"Scheduled daily pipeline refresh at {hour:02d}:{minute:02d}")

    def schedule_interval(self, hours: int = 24):
        """
        Schedule interval-based pipeline refresh.

        Args:
            hours: Interval in hours between refreshes (default: 24)
        """
        trigger = IntervalTrigger(hours=hours)

        self.scheduler.add_job(
            self._run_scraping,
            trigger=trigger,
            id='pipeline_interval',
            name=f'Pipeline Refresh Every {hours}h',
            replace_existing=True
        )

        logger.info(f"Scheduled pipeline refresh every {hours} hours")

    def schedule_weekly(self, day_of_week: str = 'mon', hour: int = 2, minute: int = 0):
        """
        Schedule weekly pipeline refresh.

        Args:
            day_of_week: Day of week (mon, tue, wed, thu, fri, sat, sun)
            hour: Hour of day to run (0-23, default: 2 AM)
            minute: Minute of hour to run (0-59, default: 0)
        """
        trigger = CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute)

        self.scheduler.add_job(
            self._run_scraping,
            trigger=trigger,
            id='pipeline_weekly',
            name=f'Weekly Pipeline Refresh ({day_of_week.upper()})',
            replace_existing=True
        )

        logger.info(f"Scheduled weekly pipeline refresh on {day_of_week.upper()} at {hour:02d}:{minute:02d}")

    async def _run_scraping(self, companies: Optional[List[str]] = None):
        """
        Execute pipeline scraping task.

        Args:
            companies: Optional list of companies to scrape (None = all)
        """
        if self._is_running:
            logger.warning("Pipeline scraping already in progress, skipping...")
            return

        self._is_running = True
        start_time = datetime.utcnow()

        db = SessionLocal()

        try:
            logger.info("Starting scheduled pipeline scraping...")

            result = await self.manager.scrape_all_companies(
                db=db,
                companies=companies,
                limit=100
            )

            self._last_run = datetime.utcnow()

            logger.info(
                f"Scheduled pipeline scraping completed: "
                f"{result['companies_successful']}/{result['companies_scraped']} successful, "
                f"{result['total_assets_inserted']} inserted, "
                f"{result['total_assets_updated']} updated"
            )

            if result.get('errors'):
                logger.warning(f"Scraping had {len(result['errors'])} errors")
                for error in result['errors']:
                    logger.error(f"  - {error['company']}: {error['error']}")

        except Exception as e:
            logger.error(f"Scheduled pipeline scraping failed: {e}", exc_info=True)

        finally:
            self._is_running = False
            db.close()

    async def run_now(self, companies: Optional[List[str]] = None):
        """
        Manually trigger pipeline scraping.

        Args:
            companies: Optional list of companies to scrape (None = all)
        """
        logger.info("Manually triggered pipeline scraping")
        await self._run_scraping(companies=companies)

    def start(self):
        """Start the scheduler."""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Pipeline scheduler started")

    def stop(self):
        """Stop the scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Pipeline scheduler stopped")

    def get_status(self) -> dict:
        """
        Get scheduler status.

        Returns:
            Dictionary with scheduler status information
        """
        jobs = self.scheduler.get_jobs()

        return {
            'running': self.scheduler.running,
            'is_scraping': self._is_running,
            'last_run': self._last_run.isoformat() if self._last_run else None,
            'scheduled_jobs': [
                {
                    'id': job.id,
                    'name': job.name,
                    'next_run': job.next_run_time.isoformat() if job.next_run_time else None,
                    'trigger': str(job.trigger)
                }
                for job in jobs
            ]
        }


# Singleton instance
_scheduler: Optional[PipelineScheduler] = None


def get_pipeline_scheduler() -> PipelineScheduler:
    """
    Get or create pipeline scheduler singleton.

    Returns:
        PipelineScheduler instance
    """
    global _scheduler

    if _scheduler is None:
        _scheduler = PipelineScheduler()

    return _scheduler


def setup_default_schedule():
    """
    Setup default scheduling configuration.

    Default: Daily refresh at 2 AM
    """
    scheduler = get_pipeline_scheduler()
    scheduler.schedule_daily(hour=2, minute=0)
    scheduler.start()

    logger.info("Default pipeline schedule configured: Daily at 2:00 AM")
