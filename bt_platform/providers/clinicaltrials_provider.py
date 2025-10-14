"""
ClinicalTrials.gov Provider

Integration with ClinicalTrials.gov API v2 for real-time clinical trial data.
https://clinicaltrials.gov/data-api/api
"""

import httpx
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from .base import Provider

logger = logging.getLogger(__name__)


class ClinicalTrialsProvider(Provider):
    """Provider for ClinicalTrials.gov API v2 data"""
    
    BASE_URL = "https://clinicaltrials.gov/api/v2"
    
    def __init__(self):
        super().__init__("ClinicalTrials")
        self.session = None
        
    async def _get_session(self) -> httpx.AsyncClient:
        """Get or create HTTP session"""
        if self.session is None:
            self.session = httpx.AsyncClient(timeout=30.0)
        return self.session
    
    async def fetch_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch data from ClinicalTrials.gov API"""
        endpoint = kwargs.get("endpoint", "studies")
        params = kwargs.get("params", {})
        
        try:
            session = await self._get_session()
            url = f"{self.BASE_URL}/{endpoint}"
            response = await session.get(url, params=params)
            response.raise_for_status()
            
            return response.json()
        except Exception as e:
            self.logger.error(f"Error fetching ClinicalTrials data: {e}")
            return {"error": str(e), "studies": []}
    
    async def search_trials(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search clinical trials with filters"""
        params = {
            "format": "json",
            "pageSize": query.get("limit", 100),
        }
        
        # Add search filters
        if query.get("condition"):
            params["query.cond"] = query["condition"]
        if query.get("intervention"):
            params["query.intr"] = query["intervention"]
        if query.get("sponsor"):
            params["query.spons"] = query["sponsor"]
        if query.get("status"):
            params["filter.overallStatus"] = query["status"]
        if query.get("phase"):
            params["filter.phase"] = query["phase"]
        
        data = await self.fetch_data(endpoint="studies", params=params)
        return data.get("studies", [])
    
    async def get_trial_by_nct(self, nct_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed trial information by NCT ID"""
        try:
            session = await self._get_session()
            url = f"{self.BASE_URL}/studies/{nct_id}"
            response = await session.get(url, params={"format": "json"})
            response.raise_for_status()
            
            data = response.json()
            return data.get("protocolSection", {})
        except Exception as e:
            self.logger.error(f"Error fetching trial {nct_id}: {e}")
            return None
    
    async def get_trials_by_drug(self, drug_name: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get trials for a specific drug/intervention"""
        params = {
            "query.intr": drug_name,
            "format": "json",
            "pageSize": limit
        }
        
        data = await self.fetch_data(endpoint="studies", params=params)
        studies = data.get("studies", [])
        
        # Extract relevant information
        simplified_trials = []
        for study in studies:
            protocol = study.get("protocolSection", {})
            identification = protocol.get("identificationModule", {})
            status_module = protocol.get("statusModule", {})
            design_module = protocol.get("designModule", {})
            sponsor_module = protocol.get("sponsorCollaboratorsModule", {})
            
            simplified_trials.append({
                "nct_id": identification.get("nctId"),
                "title": identification.get("briefTitle"),
                "status": status_module.get("overallStatus"),
                "phase": design_module.get("phases", []),
                "start_date": status_module.get("startDateStruct", {}).get("date"),
                "completion_date": status_module.get("completionDateStruct", {}).get("date"),
                "enrollment": design_module.get("enrollmentInfo", {}).get("count"),
                "sponsor": sponsor_module.get("leadSponsor", {}).get("name"),
                "conditions": protocol.get("conditionsModule", {}).get("conditions", [])
            })
        
        return simplified_trials
    
    async def analyze_trial_success_rate(self, condition: str) -> Dict[str, Any]:
        """Analyze trial success rates for a condition"""
        # Get completed trials
        completed_trials = await self.search_trials({
            "condition": condition,
            "status": "COMPLETED",
            "limit": 100
        })
        
        # Get active trials
        active_trials = await self.search_trials({
            "condition": condition,
            "status": "RECRUITING,ACTIVE_NOT_RECRUITING",
            "limit": 100
        })
        
        # Analyze by phase
        phase_distribution = {}
        for trial in completed_trials + active_trials:
            protocol = trial.get("protocolSection", {})
            phases = protocol.get("designModule", {}).get("phases", ["UNKNOWN"])
            for phase in phases:
                phase_distribution[phase] = phase_distribution.get(phase, 0) + 1
        
        return {
            "condition": condition,
            "total_completed": len(completed_trials),
            "total_active": len(active_trials),
            "phase_distribution": phase_distribution,
            "analysis_date": datetime.now().isoformat()
        }
    
    async def predict_trial_timeline(self, nct_id: str) -> Dict[str, Any]:
        """Predict trial timeline based on historical data"""
        trial = await self.get_trial_by_nct(nct_id)
        
        if not trial:
            return {"error": "Trial not found"}
        
        status_module = trial.get("statusModule", {})
        design_module = trial.get("designModule", {})
        
        start_date_str = status_module.get("startDateStruct", {}).get("date")
        phases = design_module.get("phases", [])
        enrollment = design_module.get("enrollmentInfo", {}).get("count", 0)
        
        # Simple timeline prediction (could be enhanced with ML)
        phase_durations = {
            "PHASE1": 12,  # months
            "PHASE2": 24,
            "PHASE3": 36,
            "PHASE4": 24
        }
        
        predicted_duration = max([phase_durations.get(phase, 24) for phase in phases]) if phases else 24
        
        # Adjust for enrollment size
        if enrollment > 500:
            predicted_duration *= 1.5
        elif enrollment > 1000:
            predicted_duration *= 2.0
        
        predicted_completion = None
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
                predicted_completion = (start_date + timedelta(days=predicted_duration*30)).strftime("%Y-%m-%d")
            except:
                pass
        
        return {
            "nct_id": nct_id,
            "current_status": status_module.get("overallStatus"),
            "phases": phases,
            "enrollment": enrollment,
            "predicted_duration_months": round(predicted_duration),
            "predicted_completion_date": predicted_completion,
            "confidence": "low"  # This is a simplified prediction
        }
    
    async def get_competitive_trials(self, condition: str, sponsor: Optional[str] = None) -> Dict[str, Any]:
        """Get competitive landscape for trials in a specific condition"""
        all_trials = await self.search_trials({
            "condition": condition,
            "limit": 100
        })
        
        # Group by sponsor
        sponsor_counts = {}
        sponsor_phases = {}
        
        for trial in all_trials:
            protocol = trial.get("protocolSection", {})
            trial_sponsor = protocol.get("sponsorCollaboratorsModule", {}).get("leadSponsor", {}).get("name", "Unknown")
            phases = protocol.get("designModule", {}).get("phases", [])
            
            sponsor_counts[trial_sponsor] = sponsor_counts.get(trial_sponsor, 0) + 1
            
            if trial_sponsor not in sponsor_phases:
                sponsor_phases[trial_sponsor] = []
            sponsor_phases[trial_sponsor].extend(phases)
        
        # Sort by number of trials
        top_sponsors = sorted(sponsor_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "condition": condition,
            "total_trials": len(all_trials),
            "unique_sponsors": len(sponsor_counts),
            "top_sponsors": [{"name": s[0], "trial_count": s[1]} for s in top_sponsors],
            "focus_sponsor": sponsor,
            "focus_sponsor_trials": sponsor_counts.get(sponsor, 0) if sponsor else None
        }
    
    def get_schema(self) -> Dict[str, Any]:
        """Get the data schema for ClinicalTrials"""
        return {
            "type": "object",
            "required": ["studies"],
            "properties": {
                "studies": {"type": "array"}
            }
        }
    
    async def close(self):
        """Close HTTP session"""
        if self.session:
            await self.session.aclose()
