"""
Scraper Registry System

Loads and manages scraper configurations from registry.yaml
"""

import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class ScraperConfig:
    """Configuration for a single scraper"""
    source_key: str
    name: str
    category: str  # news_press, regulators, registries, exchanges, company_sites
    base_url: str
    enabled: bool = True
    
    # Rate limiting
    max_requests_per_second: float = 1.0
    max_concurrent: int = 4
    
    # Discovery methods
    has_rss: bool = False
    rss_url: Optional[str] = None
    has_sitemap: bool = False
    sitemap_url: Optional[str] = None
    has_archive: bool = False
    archive_url: Optional[str] = None
    
    # Robots policy
    respect_robots_txt: bool = True
    user_agent: str = "BiotechTerminal/1.0 (contact@bioterminal.dev)"
    
    # Additional config
    extra: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.extra is None:
            self.extra = {}


class ScraperRegistry:
    """
    Registry of all available scrapers.
    
    Loads from platform/scrapers/registry.yaml
    """
    
    def __init__(self, registry_path: Optional[str] = None):
        if registry_path is None:
            registry_path = Path(__file__).parent.parent / "registry.yaml"
        
        self.registry_path = Path(registry_path)
        self.scrapers: Dict[str, ScraperConfig] = {}
        self._load_registry()
    
    def _load_registry(self):
        """Load registry from YAML file"""
        if not self.registry_path.exists():
            # Create default registry if it doesn't exist
            self._create_default_registry()
        
        with open(self.registry_path, 'r') as f:
            data = yaml.safe_load(f)
        
        # Parse scrapers by category
        for category, scrapers in data.get('scrapers', {}).items():
            for scraper_data in scrapers:
                config = ScraperConfig(
                    source_key=scraper_data['source_key'],
                    name=scraper_data['name'],
                    category=category,
                    base_url=scraper_data['base_url'],
                    enabled=scraper_data.get('enabled', True),
                    max_requests_per_second=scraper_data.get('rate_limit', {}).get('max_rps', 1.0),
                    max_concurrent=scraper_data.get('rate_limit', {}).get('max_concurrent', 4),
                    has_rss=scraper_data.get('discovery', {}).get('has_rss', False),
                    rss_url=scraper_data.get('discovery', {}).get('rss_url'),
                    has_sitemap=scraper_data.get('discovery', {}).get('has_sitemap', False),
                    sitemap_url=scraper_data.get('discovery', {}).get('sitemap_url'),
                    has_archive=scraper_data.get('discovery', {}).get('has_archive', False),
                    archive_url=scraper_data.get('discovery', {}).get('archive_url'),
                    respect_robots_txt=scraper_data.get('robots', {}).get('respect', True),
                    user_agent=scraper_data.get('robots', {}).get('user_agent', 
                                                "BiotechTerminal/1.0 (contact@bioterminal.dev)"),
                    extra=scraper_data.get('extra', {}),
                )
                self.scrapers[config.source_key] = config
    
    def _create_default_registry(self):
        """Create default registry.yaml if it doesn't exist"""
        default_registry = {
            'version': '1.0',
            'scrapers': {
                'news_press': [],
                'regulators': [],
                'registries': [],
                'exchanges': [],
                'company_sites': [],
            }
        }
        
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.registry_path, 'w') as f:
            yaml.dump(default_registry, f, default_flow_style=False)
    
    def get_scraper(self, source_key: str) -> Optional[ScraperConfig]:
        """Get scraper config by source key"""
        return self.scrapers.get(source_key)
    
    def get_by_category(self, category: str) -> List[ScraperConfig]:
        """Get all scrapers in a category"""
        return [
            config for config in self.scrapers.values()
            if config.category == category
        ]
    
    def get_enabled(self) -> List[ScraperConfig]:
        """Get all enabled scrapers"""
        return [
            config for config in self.scrapers.values()
            if config.enabled
        ]
    
    def list_sources(self) -> List[str]:
        """List all source keys"""
        return list(self.scrapers.keys())
