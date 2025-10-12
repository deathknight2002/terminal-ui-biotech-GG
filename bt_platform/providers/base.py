"""
Base Provider Class

Abstract base class for all data providers in the biotech terminal platform.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)


class Provider(ABC):
    """Base class for all data providers"""
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"provider.{name}")
    
    @abstractmethod
    async def fetch_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch data from the provider"""
        pass
    
    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """Get the data schema for this provider"""
        pass
    
    def validate_data(self, data: Dict[str, Any]) -> bool:
        """Validate data against schema"""
        try:
            # Basic validation - can be enhanced with JSON schema
            schema = self.get_schema()
            required_fields = schema.get("required", [])
            
            for field in required_fields:
                if field not in data:
                    self.logger.warning(f"Missing required field: {field}")
                    return False
            
            return True
        except Exception as e:
            self.logger.error(f"Data validation error: {e}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get provider status"""
        return {
            "name": self.name,
            "status": "active",
            "last_update": None
        }