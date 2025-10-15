"""
ClinicalTrials.gov Data Provider

Provider for clinical trial data from ClinicalTrials.gov API.
Access trial information, recruitment status, results, and study details.
"""

import asyncio
import httpx
from datetime import datetime
from typing import Dict, List, Any, Optional
from urllib.parse import urlencode

from .base import Provider


class ClinicalTrialsProvider(Provider):
    """Provider for ClinicalTrials.gov data"""
    
    BASE_URL = "https://clinicaltrials.gov/api/v2"
    
    def __init__(self):
        super().__init__("clinicaltrials")
        self._cache = {}
        self._cache_ttl = 3600  # 1 hour cache
        self._rate_limit_delay = 0.1  # 100ms between requests
        self._last_request_time = 0.0
    
    async def _rate_limit(self):
        """Implement rate limiting"""
        now = asyncio.get_event_loop().time()
        time_since_last = now - self._last_request_time
        if time_since_last < self._rate_limit_delay:
            await asyncio.sleep(self._rate_limit_delay - time_since_last)
        self._last_request_time = asyncio.get_event_loop().time()
    
    async def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make HTTP request to ClinicalTrials.gov API"""
        await self._rate_limit()
        
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            self.logger.error(f"ClinicalTrials.gov API request failed: {e}")
            return {"studies": []}
        except Exception as e:
            self.logger.error(f"Unexpected error in ClinicalTrials.gov request: {e}")
            return {"studies": []}
    
    async def fetch_data(self, data_type: str = "studies", **kwargs) -> Dict[str, Any]:
        """Fetch clinical trial data by type"""
        
        if data_type == "studies":
            return await self.search_studies(**kwargs)
        elif data_type == "study":
            return await self.get_study_details(**kwargs)
        elif data_type == "statistics":
            return await self.get_statistics(**kwargs)
        else:
            raise ValueError(f"Unknown data type: {data_type}")
    
    async def search_studies(
        self,
        query: Optional[str] = None,
        condition: Optional[str] = None,
        intervention: Optional[str] = None,
        sponsor: Optional[str] = None,
        phase: Optional[str] = None,
        status: Optional[str] = None,
        country: Optional[str] = None,
        limit: int = 100,
        page: int = 1
    ) -> Dict[str, Any]:
        """
        Search clinical trials
        
        Args:
            query: General search query
            condition: Condition/disease (e.g., "Cancer", "Diabetes")
            intervention: Intervention/treatment (e.g., "Pembrolizumab")
            sponsor: Sponsor organization
            phase: Study phase (EARLY_PHASE1, PHASE1, PHASE2, PHASE3, PHASE4)
            status: Recruitment status (RECRUITING, ACTIVE_NOT_RECRUITING, COMPLETED, etc.)
            country: Country code (e.g., "US", "GB")
            limit: Maximum number of results (max 1000)
            page: Page number for pagination
        """
        params = {
            "format": "json",
            "pageSize": min(limit, 1000),
            "pageToken": str(page)
        }
        
        # Build query string
        query_parts = []
        if query:
            query_parts.append(query)
        
        if condition:
            query_parts.append(f"AREA[Condition]{condition}")
        
        if intervention:
            query_parts.append(f"AREA[InterventionName]{intervention}")
        
        if sponsor:
            query_parts.append(f"AREA[LeadSponsorName]{sponsor}")
        
        if phase:
            query_parts.append(f"AREA[Phase]{phase}")
        
        if status:
            query_parts.append(f"AREA[OverallStatus]{status}")
        
        if country:
            query_parts.append(f"AREA[LocationCountry]{country}")
        
        if query_parts:
            params["query.term"] = " AND ".join(query_parts)
        
        result = await self._make_request("/studies", params)
        
        studies = []
        for study_data in result.get("studies", []):
            protocol = study_data.get("protocolSection", {})
            id_module = protocol.get("identificationModule", {})
            status_module = protocol.get("statusModule", {})
            design_module = protocol.get("designModule", {})
            eligibility_module = protocol.get("eligibilityModule", {})
            sponsor_module = protocol.get("sponsorCollaboratorsModule", {})
            
            study = {
                "nct_id": id_module.get("nctId"),
                "title": id_module.get("briefTitle"),
                "official_title": id_module.get("officialTitle"),
                "brief_summary": protocol.get("descriptionModule", {}).get("briefSummary"),
                "overall_status": status_module.get("overallStatus"),
                "start_date": status_module.get("startDateStruct", {}).get("date"),
                "completion_date": status_module.get("completionDateStruct", {}).get("date"),
                "primary_completion_date": status_module.get("primaryCompletionDateStruct", {}).get("date"),
                "last_update": status_module.get("lastUpdatePostDateStruct", {}).get("date"),
                "study_type": design_module.get("studyType"),
                "phases": design_module.get("phases", []),
                "enrollment": design_module.get("enrollmentInfo", {}).get("count"),
                "allocation": design_module.get("designInfo", {}).get("allocation"),
                "intervention_model": design_module.get("designInfo", {}).get("interventionModel"),
                "primary_purpose": design_module.get("designInfo", {}).get("primaryPurpose"),
                "masking": design_module.get("designInfo", {}).get("maskingInfo", {}).get("masking"),
                "lead_sponsor": sponsor_module.get("leadSponsor", {}).get("name"),
                "collaborators": [c.get("name") for c in sponsor_module.get("collaborators", [])],
                "conditions": protocol.get("conditionsModule", {}).get("conditions", []),
                "interventions": [
                    {
                        "type": i.get("type"),
                        "name": i.get("name"),
                        "description": i.get("description")
                    }
                    for i in protocol.get("armsInterventionsModule", {}).get("interventions", [])
                ],
                "outcomes": [
                    {
                        "type": "primary",
                        "measure": o.get("measure"),
                        "description": o.get("description"),
                        "time_frame": o.get("timeFrame")
                    }
                    for o in protocol.get("outcomesModule", {}).get("primaryOutcomes", [])
                ],
                "eligibility_criteria": eligibility_module.get("eligibilityCriteria"),
                "sex": eligibility_module.get("sex"),
                "minimum_age": eligibility_module.get("minimumAge"),
                "maximum_age": eligibility_module.get("maximumAge"),
                "healthy_volunteers": eligibility_module.get("healthyVolunteers"),
            }
            
            studies.append(study)
        
        return {
            "data": studies,
            "count": len(studies),
            "total": result.get("totalCount", 0),
            "page": page,
            "source": "clinicaltrials.gov",
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_study_details(self, nct_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific study
        
        Args:
            nct_id: NCT identifier (e.g., "NCT04280705")
        """
        params = {
            "format": "json",
            "query.id": nct_id
        }
        
        result = await self._make_request("/studies", params)
        
        if not result.get("studies"):
            return {
                "error": f"Study {nct_id} not found",
                "data": None,
                "source": "clinicaltrials.gov"
            }
        
        study_data = result["studies"][0]
        protocol = study_data.get("protocolSection", {})
        results_section = study_data.get("resultsSection", {})
        
        # Extract comprehensive details
        id_module = protocol.get("identificationModule", {})
        status_module = protocol.get("statusModule", {})
        design_module = protocol.get("designModule", {})
        arms_module = protocol.get("armsInterventionsModule", {})
        outcomes_module = protocol.get("outcomesModule", {})
        eligibility_module = protocol.get("eligibilityModule", {})
        contacts_module = protocol.get("contactsLocationsModule", {})
        references_module = protocol.get("referencesModule", {})
        
        study = {
            "nct_id": id_module.get("nctId"),
            "title": id_module.get("briefTitle"),
            "official_title": id_module.get("officialTitle"),
            "acronym": id_module.get("acronym"),
            "organization": id_module.get("organization", {}).get("fullName"),
            "brief_summary": protocol.get("descriptionModule", {}).get("briefSummary"),
            "detailed_description": protocol.get("descriptionModule", {}).get("detailedDescription"),
            
            # Status information
            "overall_status": status_module.get("overallStatus"),
            "why_stopped": status_module.get("whyStopped"),
            "start_date": status_module.get("startDateStruct", {}).get("date"),
            "completion_date": status_module.get("completionDateStruct", {}).get("date"),
            "primary_completion_date": status_module.get("primaryCompletionDateStruct", {}).get("date"),
            "study_first_post": status_module.get("studyFirstPostDateStruct", {}).get("date"),
            "results_first_post": status_module.get("resultsFirstPostDateStruct", {}).get("date"),
            "last_update": status_module.get("lastUpdatePostDateStruct", {}).get("date"),
            
            # Design information
            "study_type": design_module.get("studyType"),
            "phases": design_module.get("phases", []),
            "enrollment": design_module.get("enrollmentInfo", {}).get("count"),
            "allocation": design_module.get("designInfo", {}).get("allocation"),
            "intervention_model": design_module.get("designInfo", {}).get("interventionModel"),
            "primary_purpose": design_module.get("designInfo", {}).get("primaryPurpose"),
            "masking": design_module.get("designInfo", {}).get("maskingInfo", {}).get("masking"),
            
            # Study arms
            "arms": [
                {
                    "label": arm.get("label"),
                    "type": arm.get("type"),
                    "description": arm.get("description"),
                    "interventions": arm.get("interventionNames", [])
                }
                for arm in arms_module.get("armGroups", [])
            ],
            
            # Interventions
            "interventions": [
                {
                    "type": i.get("type"),
                    "name": i.get("name"),
                    "description": i.get("description"),
                    "arm_group_labels": i.get("armGroupLabels", []),
                    "other_names": i.get("otherNames", [])
                }
                for i in arms_module.get("interventions", [])
            ],
            
            # Outcomes
            "primary_outcomes": [
                {
                    "measure": o.get("measure"),
                    "description": o.get("description"),
                    "time_frame": o.get("timeFrame")
                }
                for o in outcomes_module.get("primaryOutcomes", [])
            ],
            "secondary_outcomes": [
                {
                    "measure": o.get("measure"),
                    "description": o.get("description"),
                    "time_frame": o.get("timeFrame")
                }
                for o in outcomes_module.get("secondaryOutcomes", [])
            ],
            
            # Eligibility
            "eligibility_criteria": eligibility_module.get("eligibilityCriteria"),
            "sex": eligibility_module.get("sex"),
            "minimum_age": eligibility_module.get("minimumAge"),
            "maximum_age": eligibility_module.get("maximumAge"),
            "healthy_volunteers": eligibility_module.get("healthyVolunteers"),
            
            # Locations
            "locations": [
                {
                    "facility": loc.get("facility"),
                    "city": loc.get("city"),
                    "state": loc.get("state"),
                    "country": loc.get("country"),
                    "status": loc.get("status")
                }
                for loc in contacts_module.get("locations", [])
            ],
            
            # References
            "references": [
                {
                    "pmid": ref.get("pmid"),
                    "citation": ref.get("citation"),
                    "type": ref.get("type")
                }
                for ref in references_module.get("references", [])
            ],
            
            # Results if available
            "has_results": results_section is not None and len(results_section) > 0,
        }
        
        return {
            "data": study,
            "source": "clinicaltrials.gov",
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_statistics(
        self,
        group_by: str = "phase",
        condition: Optional[str] = None,
        sponsor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get aggregated statistics about clinical trials
        
        Args:
            group_by: Field to group by (phase, status, sponsor, country)
            condition: Filter by condition
            sponsor: Filter by sponsor
        """
        # Note: ClinicalTrials.gov API v2 doesn't have direct aggregation
        # We'll need to fetch and aggregate client-side
        
        # Fetch studies with filters
        studies_result = await self.search_studies(
            condition=condition,
            sponsor=sponsor,
            limit=1000
        )
        
        studies = studies_result.get("data", [])
        
        # Aggregate by requested field
        aggregation = {}
        
        for study in studies:
            if group_by == "phase":
                phases = study.get("phases", [])
                for phase in phases:
                    aggregation[phase] = aggregation.get(phase, 0) + 1
            elif group_by == "status":
                status = study.get("overall_status", "Unknown")
                aggregation[status] = aggregation.get(status, 0) + 1
            elif group_by == "sponsor":
                sponsor_name = study.get("lead_sponsor", "Unknown")
                aggregation[sponsor_name] = aggregation.get(sponsor_name, 0) + 1
            elif group_by == "country":
                # Would need to aggregate from locations
                pass
        
        # Convert to list format
        stats = [
            {"category": key, "count": value}
            for key, value in sorted(aggregation.items(), key=lambda x: x[1], reverse=True)
        ]
        
        return {
            "data": stats,
            "group_by": group_by,
            "total_studies": len(studies),
            "source": "clinicaltrials.gov",
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_recruiting_trials(
        self,
        condition: Optional[str] = None,
        phase: Optional[str] = None,
        country: str = "US",
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get currently recruiting trials"""
        return await self.search_studies(
            condition=condition,
            phase=phase,
            country=country,
            status="RECRUITING",
            limit=limit
        )
    
    async def get_completed_trials_with_results(
        self,
        condition: Optional[str] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Get completed trials that have posted results"""
        return await self.search_studies(
            condition=condition,
            status="COMPLETED",
            limit=limit
        )
    
    def get_schema(self) -> Dict[str, Any]:
        """Get data schema for ClinicalTrials provider"""
        return {
            "studies": {
                "required": ["nct_id", "title", "overall_status"],
                "optional": [
                    "phases", "conditions", "interventions", "sponsor",
                    "enrollment", "start_date", "completion_date"
                ]
            },
            "study_details": {
                "required": ["nct_id", "title", "brief_summary"],
                "optional": [
                    "detailed_description", "arms", "outcomes", 
                    "eligibility_criteria", "locations", "references"
                ]
            }
        }
