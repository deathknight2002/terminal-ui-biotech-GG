"""Site-specific scrapers"""

from .clinical_trials_scraper import ClinicalTrialsScraper
from .edgar_scraper import EDGARScraper
from .fierce_scraper import FierceScraper
from .press_release_scraper import (
    BusinessWireScraper,
    GlobeNewswireScraper,
    PRNewswireScraper,
)
from .regulator_scraper import EMAScraper, FDAScraper, MHRAScraper

__all__ = [
    "FierceScraper",
    "BusinessWireScraper",
    "GlobeNewswireScraper",
    "PRNewswireScraper",
    "FDAScraper",
    "EMAScraper",
    "MHRAScraper",
    "ClinicalTrialsScraper",
    "EDGARScraper",
]
