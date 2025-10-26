"""
Protein Data Bank (PDB) Provider

Integration with RCSB PDB API for molecular structure data and analysis.
https://data.rcsb.org/
"""

import httpx
import logging
from typing import Dict, List, Any, Optional
from .base import Provider

logger = logging.getLogger(__name__)


class ProteinDataBankProvider(Provider):
    """Provider for RCSB Protein Data Bank API"""

    BASE_URL = "https://data.rcsb.org/rest/v1/core"
    SEARCH_URL = "https://search.rcsb.org/rcsbsearch/v2/query"

    def __init__(self):
        super().__init__("ProteinDataBank")
        self.session = None

    async def _get_session(self) -> httpx.AsyncClient:
        """Get or create HTTP session"""
        if self.session is None:
            self.session = httpx.AsyncClient(timeout=30.0)
        return self.session

    async def fetch_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch data from PDB API"""
        pdb_id = kwargs.get("pdb_id")

        try:
            session = await self._get_session()
            url = f"{self.BASE_URL}/entry/{pdb_id}"
            response = await session.get(url)
            response.raise_for_status()

            return response.json()
        except Exception as e:
            self.logger.error(f"Error fetching PDB data: {e}")
            return {"error": str(e)}

    async def search_structures(self, query: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Search PDB structures"""
        search_query = {
            "query": {
                "type": "terminal",
                "service": "text",
                "parameters": {
                    "value": query
                }
            },
            "return_type": "entry",
            "request_options": {
                "results_content_type": ["experimental"],
                "return_all_hits": False,
                "pager": {
                    "start": 0,
                    "rows": limit
                }
            }
        }

        try:
            session = await self._get_session()
            response = await session.post(
                self.SEARCH_URL,
                json=search_query,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()

            data = response.json()
            return data.get("result_set", [])
        except Exception as e:
            self.logger.error(f"Error searching PDB: {e}")
            return []

    async def get_structure_details(self, pdb_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed structure information"""
        data = await self.fetch_data(pdb_id=pdb_id)

        if "error" in data:
            return None

        # Extract key information
        struct_info = data.get("struct", {})
        exptl_info = data.get("exptl", [{}])[0] if data.get("exptl") else {}

        return {
            "pdb_id": pdb_id,
            "title": struct_info.get("title"),
            "experimental_method": exptl_info.get("method"),
            "resolution": data.get("refine", [{}])[0].get("ls_d_res_high") if data.get("refine") else None,
            "release_date": data.get("rcsb_accession_info", {}).get("initial_release_date"),
            "citation": data.get("citation", [{}])[0] if data.get("citation") else {}
        }

    async def analyze_drug_targets(self, drug_name: str) -> Dict[str, Any]:
        """Analyze protein targets for a drug"""
        # Search for structures related to the drug
        results = await self.search_structures(drug_name, limit=50)

        pdb_ids = [r.get("identifier") for r in results if r.get("identifier")]

        structures = []
        for pdb_id in pdb_ids[:10]:  # Get details for top 10
            details = await self.get_structure_details(pdb_id)
            if details:
                structures.append(details)

        return {
            "drug": drug_name,
            "total_structures": len(results),
            "analyzed_structures": len(structures),
            "structures": structures,
            "has_structural_data": len(structures) > 0
        }

    def get_schema(self) -> Dict[str, Any]:
        """Get the data schema for PDB"""
        return {
            "type": "object",
            "properties": {
                "pdb_id": {"type": "string"}
            }
        }

    async def close(self):
        """Close HTTP session"""
        if self.session:
            await self.session.aclose()
