"""
PubMed Data Provider

Provider for scientific literature from PubMed using NCBI E-utilities API.
Search publications, track research trends, and analyze citation patterns.
"""

import asyncio
import httpx
from datetime import datetime
from typing import Dict, List, Any, Optional
from urllib.parse import urlencode
import xml.etree.ElementTree as ET

from .base import Provider


class PubMedProvider(Provider):
    """Provider for PubMed scientific literature"""

    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(self, email: Optional[str] = None, api_key: Optional[str] = None):
        super().__init__("pubmed")
        self.email = email or "biotech_terminal@example.com"
        self.api_key = api_key  # Optional API key for higher rate limits
        self._cache = {}
        self._cache_ttl = 3600
        # With API key: 10 req/sec, without: 3 req/sec
        self._rate_limit_delay = 0.1 if api_key else 0.34
        self._last_request_time = 0.0

    async def _rate_limit(self):
        """Implement rate limiting"""
        now = asyncio.get_event_loop().time()
        time_since_last = now - self._last_request_time
        if time_since_last < self._rate_limit_delay:
            await asyncio.sleep(self._rate_limit_delay - time_since_last)
        self._last_request_time = asyncio.get_event_loop().time()

    async def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Any:
        """Make HTTP request to NCBI E-utilities API"""
        await self._rate_limit()

        # Add required parameters
        params["email"] = self.email
        if self.api_key:
            params["api_key"] = self.api_key

        url = f"{self.BASE_URL}/{endpoint}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.text
        except Exception as e:
            self.logger.error(f"PubMed API request failed: {e}")
            return None

    async def fetch_data(self, data_type: str = "search", **kwargs) -> Dict[str, Any]:
        """Fetch PubMed data by type"""

        if data_type == "search":
            return await self.search_publications(**kwargs)
        elif data_type == "details":
            return await self.get_publication_details(**kwargs)
        elif data_type == "trends":
            return await self.analyze_publication_trends(**kwargs)
        else:
            raise ValueError(f"Unknown data type: {data_type}")

    async def search_publications(
        self,
        query: str,
        limit: int = 100,
        sort: str = "relevance",
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Search PubMed publications

        Args:
            query: Search query (e.g., "pembrolizumab AND cancer")
            limit: Maximum results (default: 100, max: 10000)
            sort: Sort order (relevance, pub_date, author, journal)
            date_from: Start date (YYYY/MM/DD)
            date_to: End date (YYYY/MM/DD)
        """
        # Build search term with date filter
        search_term = query
        if date_from or date_to:
            date_from_str = date_from or "1900/01/01"
            date_to_str = date_to or datetime.now().strftime("%Y/%m/%d")
            search_term += f' AND ("{date_from_str}"[Date - Publication] : "{date_to_str}"[Date - Publication])'

        # Step 1: Search for PMIDs
        search_params = {
            "db": "pubmed",
            "term": search_term,
            "retmax": min(limit, 10000),
            "retmode": "json",
            "sort": sort
        }

        search_result = await self._make_request("esearch.fcgi", search_params)
        if not search_result:
            return {"data": [], "count": 0, "source": "pubmed"}

        # Parse JSON response
        import json
        try:
            search_data = json.loads(search_result)
            pmids = search_data.get("esearchresult", {}).get("idlist", [])
            total_count = int(search_data.get("esearchresult", {}).get("count", 0))
        except:
            return {"data": [], "count": 0, "source": "pubmed"}

        if not pmids:
            return {"data": [], "count": 0, "total": total_count, "source": "pubmed"}

        # Step 2: Fetch details for PMIDs
        fetch_params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "xml"
        }

        fetch_result = await self._make_request("efetch.fcgi", fetch_params)
        if not fetch_result:
            return {"data": [], "count": len(pmids), "total": total_count, "source": "pubmed"}

        # Parse XML response
        publications = self._parse_pubmed_xml(fetch_result)

        return {
            "data": publications,
            "count": len(publications),
            "total": total_count,
            "query": query,
            "source": "pubmed",
            "timestamp": datetime.now().isoformat()
        }

    def _parse_pubmed_xml(self, xml_text: str) -> List[Dict[str, Any]]:
        """Parse PubMed XML response"""
        publications = []

        try:
            root = ET.fromstring(xml_text)

            for article in root.findall(".//PubmedArticle"):
                medline = article.find("MedlineCitation")
                if medline is None:
                    continue

                pmid_elem = medline.find("PMID")
                pmid = pmid_elem.text if pmid_elem is not None else None

                article_elem = medline.find("Article")
                if article_elem is None:
                    continue

                # Extract title
                title_elem = article_elem.find(".//ArticleTitle")
                title = title_elem.text if title_elem is not None else "No title"

                # Extract abstract
                abstract_parts = []
                for abstract_text in article_elem.findall(".//AbstractText"):
                    label = abstract_text.get("Label", "")
                    text = abstract_text.text or ""
                    if label:
                        abstract_parts.append(f"{label}: {text}")
                    else:
                        abstract_parts.append(text)
                abstract = " ".join(abstract_parts) if abstract_parts else None

                # Extract authors
                authors = []
                for author in article_elem.findall(".//Author"):
                    last_name = author.find("LastName")
                    fore_name = author.find("ForeName")
                    if last_name is not None and fore_name is not None:
                        authors.append(f"{fore_name.text} {last_name.text}")

                # Extract journal info
                journal_elem = article_elem.find(".//Journal")
                journal_title = None
                pub_date = None
                if journal_elem is not None:
                    title_elem = journal_elem.find(".//Title")
                    journal_title = title_elem.text if title_elem is not None else None

                    date_elem = journal_elem.find(".//PubDate")
                    if date_elem is not None:
                        year = date_elem.find("Year")
                        month = date_elem.find("Month")
                        day = date_elem.find("Day")
                        date_parts = []
                        if year is not None:
                            date_parts.append(year.text)
                        if month is not None:
                            date_parts.append(month.text)
                        if day is not None:
                            date_parts.append(day.text)
                        pub_date = "-".join(date_parts) if date_parts else None

                # Extract MeSH terms (keywords)
                mesh_terms = []
                mesh_list = medline.find("MeshHeadingList")
                if mesh_list is not None:
                    for mesh in mesh_list.findall(".//DescriptorName"):
                        if mesh.text:
                            mesh_terms.append(mesh.text)

                # Extract DOI
                doi = None
                for article_id in article.findall(".//ArticleId"):
                    if article_id.get("IdType") == "doi":
                        doi = article_id.text

                publication = {
                    "pmid": pmid,
                    "title": title,
                    "abstract": abstract,
                    "authors": authors,
                    "journal": journal_title,
                    "publication_date": pub_date,
                    "mesh_terms": mesh_terms,
                    "doi": doi,
                    "pubmed_url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else None
                }

                publications.append(publication)

        except ET.ParseError as e:
            self.logger.error(f"XML parsing error: {e}")

        return publications

    async def get_publication_details(self, pmid: str) -> Dict[str, Any]:
        """Get detailed information for a specific publication"""
        result = await self.search_publications(query=pmid, limit=1)

        if result["data"]:
            return {
                "data": result["data"][0],
                "source": "pubmed",
                "timestamp": datetime.now().isoformat()
            }

        return {
            "error": f"Publication {pmid} not found",
            "data": None,
            "source": "pubmed"
        }

    async def analyze_publication_trends(
        self,
        query: str,
        years: int = 10
    ) -> Dict[str, Any]:
        """
        Analyze publication trends over time

        Args:
            query: Search query (e.g., "CAR-T therapy")
            years: Number of years to analyze
        """
        current_year = datetime.now().year
        year_counts = []

        for year in range(current_year - years, current_year + 1):
            result = await self.search_publications(
                query=query,
                date_from=f"{year}/01/01",
                date_to=f"{year}/12/31",
                limit=1  # We only need the count
            )

            year_counts.append({
                "year": year,
                "count": result.get("total", 0)
            })

        return {
            "data": year_counts,
            "query": query,
            "years_analyzed": years,
            "source": "pubmed",
            "timestamp": datetime.now().isoformat()
        }

    async def search_by_drug(
        self,
        drug_name: str,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Search publications about a specific drug"""
        query = f"{drug_name}[Title/Abstract] OR {drug_name}[MeSH Terms]"
        return await self.search_publications(query=query, limit=limit)

    async def search_by_disease(
        self,
        disease: str,
        limit: int = 100
    ) -> Dict[str, Any]:
        """Search publications about a specific disease"""
        query = f"{disease}[Title/Abstract] OR {disease}[MeSH Terms]"
        return await self.search_publications(query=query, limit=limit)

    def get_schema(self) -> Dict[str, Any]:
        """Get data schema for PubMed provider"""
        return {
            "publications": {
                "required": ["pmid", "title"],
                "optional": ["abstract", "authors", "journal", "publication_date", "mesh_terms", "doi"]
            },
            "trends": {
                "required": ["year", "count"],
                "optional": []
            }
        }
