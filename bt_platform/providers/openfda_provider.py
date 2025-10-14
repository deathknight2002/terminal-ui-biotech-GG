"""
OpenFDA Provider

Integration with FDA's OpenFDA API for drug approvals, adverse events, recalls, and enforcement data.
https://open.fda.gov/apis/
"""

import httpx
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from .base import Provider

logger = logging.getLogger(__name__)


class OpenFDAProvider(Provider):
    """Provider for OpenFDA API data"""
    
    BASE_URL = "https://api.fda.gov"
    
    def __init__(self, api_key: Optional[str] = None):
        super().__init__("OpenFDA")
        self.api_key = api_key
        self.session = None
        
    async def _get_session(self) -> httpx.AsyncClient:
        """Get or create HTTP session"""
        if self.session is None:
            self.session = httpx.AsyncClient(timeout=30.0)
        return self.session
    
    def _build_url(self, endpoint: str, params: Dict[str, Any]) -> str:
        """Build API URL with parameters"""
        if self.api_key:
            params["api_key"] = self.api_key
        return f"{self.BASE_URL}/{endpoint}"
    
    async def fetch_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch data from OpenFDA API"""
        endpoint = kwargs.get("endpoint", "drug/event.json")
        search = kwargs.get("search")
        limit = kwargs.get("limit", 100)
        
        params = {"limit": limit}
        if search:
            params["search"] = search
            
        try:
            session = await self._get_session()
            url = self._build_url(endpoint, params)
            response = await session.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            self.logger.error(f"Error fetching OpenFDA data: {e}")
            return {"error": str(e), "results": []}
    
    async def get_drug_approvals(self, days: int = 90) -> List[Dict[str, Any]]:
        """Get recent drug approvals"""
        end_date = datetime.now().strftime("%Y%m%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")
        
        search = f"approval_date:[{start_date}+TO+{end_date}]"
        data = await self.fetch_data(
            endpoint="drug/drugsfda.json",
            search=search,
            limit=100
        )
        
        return data.get("results", [])
    
    async def get_adverse_events(self, drug_name: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get adverse events for a specific drug"""
        search = f'patient.drug.medicinalproduct:"{drug_name}"'
        data = await self.fetch_data(
            endpoint="drug/event.json",
            search=search,
            limit=limit
        )
        
        return data.get("results", [])
    
    async def get_drug_recalls(self, classification: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get drug recalls, optionally filtered by classification (Class I, II, or III)"""
        search = None
        if classification:
            search = f'classification:"{classification}"'
            
        data = await self.fetch_data(
            endpoint="drug/enforcement.json",
            search=search,
            limit=100
        )
        
        return data.get("results", [])
    
    async def get_drug_labels(self, drug_name: str) -> List[Dict[str, Any]]:
        """Get drug labeling information"""
        search = f'openfda.brand_name:"{drug_name}" OR openfda.generic_name:"{drug_name}"'
        data = await self.fetch_data(
            endpoint="drug/label.json",
            search=search,
            limit=10
        )
        
        return data.get("results", [])
    
    async def analyze_safety_signals(self, drug_name: str) -> Dict[str, Any]:
        """Analyze safety signals for a drug across adverse events"""
        events = await self.get_adverse_events(drug_name, limit=500)
        
        if not events:
            return {"drug": drug_name, "signal_strength": "low", "total_events": 0, "serious_events": 0}
        
        total_events = len(events)
        serious_events = sum(1 for e in events if e.get("serious") == "1")
        
        # Calculate reaction frequency
        reactions = {}
        for event in events:
            for reaction in event.get("patient", {}).get("reaction", []):
                reaction_name = reaction.get("reactionmeddrapt", "Unknown")
                reactions[reaction_name] = reactions.get(reaction_name, 0) + 1
        
        # Get top reactions
        top_reactions = sorted(reactions.items(), key=lambda x: x[1], reverse=True)[:10]
        
        # Determine signal strength
        serious_ratio = serious_events / total_events if total_events > 0 else 0
        if serious_ratio > 0.3:
            signal_strength = "high"
        elif serious_ratio > 0.15:
            signal_strength = "medium"
        else:
            signal_strength = "low"
        
        return {
            "drug": drug_name,
            "total_events": total_events,
            "serious_events": serious_events,
            "serious_ratio": round(serious_ratio, 3),
            "signal_strength": signal_strength,
            "top_reactions": [{"reaction": r[0], "count": r[1]} for r in top_reactions],
            "analysis_date": datetime.now().isoformat()
        }
    
    def get_schema(self) -> Dict[str, Any]:
        """Get the data schema for OpenFDA"""
        return {
            "type": "object",
            "required": ["results"],
            "properties": {
                "results": {"type": "array"}
            }
        }
    
    async def close(self):
        """Close HTTP session"""
        if self.session:
            await self.session.aclose()
