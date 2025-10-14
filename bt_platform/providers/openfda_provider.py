"""
OpenFDA Data Provider

Provider for FDA drug approvals, adverse events, recalls, and enforcement data
using the public OpenFDA API (https://open.fda.gov/).
"""

import asyncio
import httpx
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from urllib.parse import urlencode

from .base import Provider


class OpenFDAProvider(Provider):
    """Provider for FDA data via OpenFDA API"""
    
    BASE_URL = "https://api.fda.gov"
    
    def __init__(self):
        super().__init__("openfda")
        self._cache = {}
        self._cache_ttl = 3600  # 1 hour cache
        self._rate_limit_delay = 0.25  # 250ms between requests (4 req/sec limit)
        self._last_request_time = 0.0
    
    async def _rate_limit(self):
        """Implement rate limiting to respect FDA API limits"""
        now = asyncio.get_event_loop().time()
        time_since_last = now - self._last_request_time
        if time_since_last < self._rate_limit_delay:
            await asyncio.sleep(self._rate_limit_delay - time_since_last)
        self._last_request_time = asyncio.get_event_loop().time()
    
    async def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Make HTTP request to OpenFDA API with rate limiting"""
        await self._rate_limit()
        
        url = f"{self.BASE_URL}{endpoint}"
        query_string = urlencode(params)
        full_url = f"{url}?{query_string}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(full_url)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            self.logger.error(f"OpenFDA API request failed: {e}")
            return {"error": str(e), "results": []}
        except Exception as e:
            self.logger.error(f"Unexpected error in OpenFDA request: {e}")
            return {"error": str(e), "results": []}
    
    async def fetch_data(self, data_type: str = "approvals", **kwargs) -> Dict[str, Any]:
        """Fetch FDA data by type"""
        
        if data_type == "approvals":
            return await self.fetch_drug_approvals(**kwargs)
        elif data_type == "adverse_events":
            return await self.fetch_adverse_events(**kwargs)
        elif data_type == "recalls":
            return await self.fetch_drug_recalls(**kwargs)
        elif data_type == "enforcement":
            return await self.fetch_enforcement_reports(**kwargs)
        elif data_type == "labels":
            return await self.fetch_drug_labels(**kwargs)
        else:
            raise ValueError(f"Unknown data type: {data_type}")
    
    async def fetch_drug_approvals(
        self, 
        limit: int = 100,
        search: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch FDA drug approval data
        
        Args:
            limit: Maximum number of results (default: 100, max: 1000)
            search: Search query (e.g., "openfda.brand_name:Keytruda")
            date_from: Start date (YYYY-MM-DD format)
            date_to: End date (YYYY-MM-DD format)
        """
        params = {
            "limit": min(limit, 1000),
        }
        
        # Build search query
        search_parts = []
        if search:
            search_parts.append(search)
        
        if date_from or date_to:
            date_from_str = date_from or "1900-01-01"
            date_to_str = date_to or datetime.now().strftime("%Y-%m-%d")
            search_parts.append(f"submissions.submission_status_date:[{date_from_str}+TO+{date_to_str}]")
        
        if search_parts:
            params["search"] = "+AND+".join(search_parts)
        
        result = await self._make_request("/drug/drugsfda.json", params)
        
        # Transform results to our schema
        approvals = []
        for item in result.get("results", []):
            products = item.get("products", [])
            submissions = item.get("submissions", [])
            openfda = item.get("openfda", {})
            
            for product in products:
                approval = {
                    "application_number": item.get("application_number"),
                    "sponsor_name": item.get("sponsor_name"),
                    "brand_name": product.get("brand_name"),
                    "generic_name": openfda.get("generic_name", [""])[0] if openfda.get("generic_name") else None,
                    "dosage_form": product.get("dosage_form"),
                    "route": product.get("route"),
                    "active_ingredients": product.get("active_ingredients", []),
                    "product_number": product.get("product_number"),
                    "reference_drug": product.get("reference_drug", False),
                    "therapeutic_equivalents": openfda.get("product_type", []),
                    "indications": openfda.get("indications_and_usage", [""])[0] if openfda.get("indications_and_usage") else None,
                    "manufacturer": openfda.get("manufacturer_name", [""])[0] if openfda.get("manufacturer_name") else None,
                }
                
                # Add submission dates if available
                if submissions:
                    latest_submission = max(submissions, key=lambda s: s.get("submission_status_date", ""))
                    approval["approval_date"] = latest_submission.get("submission_status_date")
                    approval["submission_type"] = latest_submission.get("submission_type")
                
                approvals.append(approval)
        
        return {
            "data": approvals,
            "count": len(approvals),
            "total": result.get("meta", {}).get("results", {}).get("total", 0),
            "source": "openfda",
            "endpoint": "drug/drugsfda",
            "timestamp": datetime.now().isoformat()
        }
    
    async def fetch_adverse_events(
        self,
        limit: int = 100,
        drug_name: Optional[str] = None,
        reaction: Optional[str] = None,
        serious: Optional[bool] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch FDA adverse event reports (FAERS data)
        
        Args:
            limit: Maximum number of results
            drug_name: Search by drug name
            reaction: Search by reaction/symptom
            serious: Filter for serious events only
            date_from: Start date (YYYYMMDD format)
            date_to: End date (YYYYMMDD format)
        """
        params = {
            "limit": min(limit, 1000),
        }
        
        search_parts = []
        if drug_name:
            search_parts.append(f'patient.drug.openfda.brand_name:"{drug_name}"')
        
        if reaction:
            search_parts.append(f'patient.reaction.reactionmeddrapt:"{reaction}"')
        
        if serious:
            search_parts.append("serious:1")
        
        if date_from or date_to:
            date_from_str = date_from or "19900101"
            date_to_str = date_to or datetime.now().strftime("%Y%m%d")
            search_parts.append(f"receivedate:[{date_from_str}+TO+{date_to_str}]")
        
        if search_parts:
            params["search"] = "+AND+".join(search_parts)
        
        result = await self._make_request("/drug/event.json", params)
        
        events = []
        for item in result.get("results", []):
            patient = item.get("patient", {})
            reactions = patient.get("reaction", [])
            drugs = patient.get("drug", [])
            
            event = {
                "safety_report_id": item.get("safetyreportid"),
                "receive_date": item.get("receivedate"),
                "serious": item.get("serious") == "1",
                "serious_reasons": {
                    "death": item.get("seriousnessdeath") == "1",
                    "life_threatening": item.get("seriousnesslifethreatening") == "1",
                    "hospitalization": item.get("seriousnesshospitalization") == "1",
                    "disability": item.get("seriousnessdisabling") == "1",
                },
                "patient_age": patient.get("patientonsetage"),
                "patient_sex": patient.get("patientsex"),
                "reactions": [r.get("reactionmeddrapt") for r in reactions],
                "drugs": [
                    {
                        "name": d.get("medicinalproduct"),
                        "role": d.get("drugcharacterization"),
                        "brand_names": d.get("openfda", {}).get("brand_name", []),
                        "generic_names": d.get("openfda", {}).get("generic_name", []),
                    }
                    for d in drugs
                ],
                "outcomes": item.get("patient", {}).get("patientdeath") or "Unknown",
            }
            events.append(event)
        
        return {
            "data": events,
            "count": len(events),
            "total": result.get("meta", {}).get("results", {}).get("total", 0),
            "source": "openfda",
            "endpoint": "drug/event",
            "timestamp": datetime.now().isoformat()
        }
    
    async def fetch_drug_recalls(
        self,
        limit: int = 100,
        classification: Optional[str] = None,
        status: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch FDA drug recall data
        
        Args:
            limit: Maximum number of results
            classification: Class I, Class II, or Class III
            status: Ongoing, Completed, Terminated
            date_from: Start date (YYYY-MM-DD)
            date_to: End date (YYYY-MM-DD)
        """
        params = {
            "limit": min(limit, 1000),
        }
        
        search_parts = []
        if classification:
            search_parts.append(f'classification:"{classification}"')
        
        if status:
            search_parts.append(f'status:"{status}"')
        
        if date_from or date_to:
            date_from_str = date_from or "1900-01-01"
            date_to_str = date_to or datetime.now().strftime("%Y-%m-%d")
            search_parts.append(f"report_date:[{date_from_str}+TO+{date_to_str}]")
        
        if search_parts:
            params["search"] = "+AND+".join(search_parts)
        
        result = await self._make_request("/drug/enforcement.json", params)
        
        recalls = []
        for item in result.get("results", []):
            recall = {
                "recall_number": item.get("recall_number"),
                "classification": item.get("classification"),
                "status": item.get("status"),
                "product_description": item.get("product_description"),
                "reason_for_recall": item.get("reason_for_recall"),
                "recalling_firm": item.get("recalling_firm"),
                "report_date": item.get("report_date"),
                "recall_initiation_date": item.get("recall_initiation_date"),
                "voluntary_mandated": item.get("voluntary_mandated"),
                "initial_firm_notification": item.get("initial_firm_notification"),
                "distribution_pattern": item.get("distribution_pattern"),
                "code_info": item.get("code_info"),
            }
            recalls.append(recall)
        
        return {
            "data": recalls,
            "count": len(recalls),
            "total": result.get("meta", {}).get("results", {}).get("total", 0),
            "source": "openfda",
            "endpoint": "drug/enforcement",
            "timestamp": datetime.now().isoformat()
        }
    
    async def fetch_enforcement_reports(
        self,
        limit: int = 100,
        state: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch FDA enforcement reports (broader than just recalls)
        """
        return await self.fetch_drug_recalls(
            limit=limit,
            date_from=date_from,
            date_to=date_to
        )
    
    async def fetch_drug_labels(
        self,
        limit: int = 100,
        brand_name: Optional[str] = None,
        generic_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch FDA drug label data (package inserts, prescribing information)
        
        Args:
            limit: Maximum number of results
            brand_name: Search by brand name
            generic_name: Search by generic name
        """
        params = {
            "limit": min(limit, 1000),
        }
        
        search_parts = []
        if brand_name:
            search_parts.append(f'openfda.brand_name:"{brand_name}"')
        
        if generic_name:
            search_parts.append(f'openfda.generic_name:"{generic_name}"')
        
        if search_parts:
            params["search"] = "+AND+".join(search_parts)
        
        result = await self._make_request("/drug/label.json", params)
        
        labels = []
        for item in result.get("results", []):
            openfda = item.get("openfda", {})
            label = {
                "brand_name": openfda.get("brand_name", [""])[0] if openfda.get("brand_name") else None,
                "generic_name": openfda.get("generic_name", [""])[0] if openfda.get("generic_name") else None,
                "manufacturer": openfda.get("manufacturer_name", [""])[0] if openfda.get("manufacturer_name") else None,
                "product_type": openfda.get("product_type", [""])[0] if openfda.get("product_type") else None,
                "route": openfda.get("route", []),
                "substance_name": openfda.get("substance_name", []),
                "indications_and_usage": item.get("indications_and_usage", [""])[0] if item.get("indications_and_usage") else None,
                "warnings": item.get("warnings", [""])[0] if item.get("warnings") else None,
                "adverse_reactions": item.get("adverse_reactions", [""])[0] if item.get("adverse_reactions") else None,
                "dosage_and_administration": item.get("dosage_and_administration", [""])[0] if item.get("dosage_and_administration") else None,
                "boxed_warning": item.get("boxed_warning", [""])[0] if item.get("boxed_warning") else None,
                "contraindications": item.get("contraindications", [""])[0] if item.get("contraindications") else None,
            }
            labels.append(label)
        
        return {
            "data": labels,
            "count": len(labels),
            "total": result.get("meta", {}).get("results", {}).get("total", 0),
            "source": "openfda",
            "endpoint": "drug/label",
            "timestamp": datetime.now().isoformat()
        }
    
    async def count_adverse_events_by_drug(
        self,
        limit: int = 20,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get aggregated counts of adverse events by drug
        """
        params = {
            "count": "patient.drug.openfda.brand_name.exact",
            "limit": limit
        }
        
        if date_from or date_to:
            date_from_str = date_from or "19900101"
            date_to_str = date_to or datetime.now().strftime("%Y%m%d")
            params["search"] = f"receivedate:[{date_from_str}+TO+{date_to_str}]"
        
        result = await self._make_request("/drug/event.json", params)
        
        counts = []
        for item in result.get("results", []):
            counts.append({
                "drug_name": item.get("term"),
                "event_count": item.get("count"),
            })
        
        return {
            "data": counts,
            "count": len(counts),
            "source": "openfda",
            "timestamp": datetime.now().isoformat()
        }
    
    def get_schema(self) -> Dict[str, Any]:
        """Get data schema for OpenFDA provider"""
        return {
            "approvals": {
                "required": ["application_number", "sponsor_name"],
                "optional": ["brand_name", "generic_name", "approval_date", "indications"]
            },
            "adverse_events": {
                "required": ["safety_report_id", "receive_date"],
                "optional": ["serious", "reactions", "drugs", "outcomes"]
            },
            "recalls": {
                "required": ["recall_number", "classification", "status"],
                "optional": ["reason_for_recall", "recalling_firm", "report_date"]
            },
            "labels": {
                "required": ["brand_name"],
                "optional": ["generic_name", "indications_and_usage", "warnings", "boxed_warning"]
            }
        }
