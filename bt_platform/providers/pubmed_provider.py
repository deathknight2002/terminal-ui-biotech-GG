"""
PubMed Provider

Integration with NCBI PubMed E-utilities API for biomedical literature search and analysis.
https://www.ncbi.nlm.nih.gov/books/NBK25501/
"""

import httpx
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from xml.etree import ElementTree as ET
from .base import Provider

logger = logging.getLogger(__name__)


class PubMedProvider(Provider):
    """Provider for PubMed API data"""
    
    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    
    def __init__(self, api_key: Optional[str] = None, email: Optional[str] = None):
        super().__init__("PubMed")
        self.api_key = api_key
        self.email = email or "biotech-terminal@example.com"
        self.session = None
        
    async def _get_session(self) -> httpx.AsyncClient:
        """Get or create HTTP session"""
        if self.session is None:
            self.session = httpx.AsyncClient(timeout=30.0)
        return self.session
    
    def _build_params(self, **kwargs) -> Dict[str, Any]:
        """Build API parameters"""
        params = {
            "tool": "biotech-terminal",
            "email": self.email,
            **kwargs
        }
        if self.api_key:
            params["api_key"] = self.api_key
        return params
    
    async def fetch_data(self, **kwargs) -> Dict[str, Any]:
        """Fetch data from PubMed API"""
        # This is a general fetch method
        endpoint = kwargs.get("endpoint", "esearch.fcgi")
        params = self._build_params(**kwargs.get("params", {}))
        
        try:
            session = await self._get_session()
            url = f"{self.BASE_URL}/{endpoint}"
            response = await session.get(url, params=params)
            response.raise_for_status()
            
            return {"raw": response.text, "status": "success"}
        except Exception as e:
            self.logger.error(f"Error fetching PubMed data: {e}")
            return {"error": str(e), "status": "error"}
    
    async def search_articles(self, query: str, max_results: int = 100, 
                             date_from: Optional[str] = None) -> List[str]:
        """Search PubMed and return PMIDs"""
        params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_results,
            "retmode": "json"
        }
        
        if date_from:
            params["mindate"] = date_from
            params["datetype"] = "pdat"
        
        try:
            session = await self._get_session()
            url = f"{self.BASE_URL}/esearch.fcgi"
            response = await session.get(url, params=self._build_params(**params))
            response.raise_for_status()
            
            data = response.json()
            return data.get("esearchresult", {}).get("idlist", [])
        except Exception as e:
            self.logger.error(f"Error searching PubMed: {e}")
            return []
    
    async def fetch_article_details(self, pmids: List[str]) -> List[Dict[str, Any]]:
        """Fetch detailed information for articles by PMID"""
        if not pmids:
            return []
        
        pmid_str = ",".join(pmids)
        params = {
            "db": "pubmed",
            "id": pmid_str,
            "retmode": "xml"
        }
        
        try:
            session = await self._get_session()
            url = f"{self.BASE_URL}/efetch.fcgi"
            response = await session.get(url, params=self._build_params(**params))
            response.raise_for_status()
            
            return self._parse_article_xml(response.text)
        except Exception as e:
            self.logger.error(f"Error fetching article details: {e}")
            return []
    
    def _parse_article_xml(self, xml_text: str) -> List[Dict[str, Any]]:
        """Parse XML response from PubMed"""
        articles = []
        
        try:
            root = ET.fromstring(xml_text)
            
            for article in root.findall(".//PubmedArticle"):
                pmid_elem = article.find(".//PMID")
                pmid = pmid_elem.text if pmid_elem is not None else None
                
                title_elem = article.find(".//ArticleTitle")
                title = title_elem.text if title_elem is not None else "No title"
                
                abstract_elem = article.find(".//AbstractText")
                abstract = abstract_elem.text if abstract_elem is not None else ""
                
                # Get publication date
                pub_date = article.find(".//PubDate")
                year = pub_date.find("Year").text if pub_date is not None and pub_date.find("Year") is not None else ""
                month = pub_date.find("Month").text if pub_date is not None and pub_date.find("Month") is not None else ""
                
                # Get authors
                authors = []
                for author in article.findall(".//Author"):
                    last_name = author.find("LastName")
                    first_name = author.find("ForeName")
                    if last_name is not None:
                        author_name = last_name.text
                        if first_name is not None:
                            author_name = f"{first_name.text} {author_name}"
                        authors.append(author_name)
                
                articles.append({
                    "pmid": pmid,
                    "title": title,
                    "abstract": abstract,
                    "authors": authors,
                    "publication_date": f"{year}-{month}" if year and month else year,
                    "year": year
                })
            
        except Exception as e:
            self.logger.error(f"Error parsing PubMed XML: {e}")
        
        return articles
    
    async def search_drug_publications(self, drug_name: str, 
                                      years_back: int = 5) -> Dict[str, Any]:
        """Search for publications about a specific drug"""
        date_from = (datetime.now() - timedelta(days=years_back*365)).strftime("%Y/%m/%d")
        
        # Search for the drug
        pmids = await self.search_articles(
            query=f'"{drug_name}"[Title/Abstract] AND (clinical trial OR efficacy OR safety)',
            max_results=100,
            date_from=date_from
        )
        
        if not pmids:
            return {
                "drug": drug_name,
                "total_publications": 0,
                "publications": [],
                "trends": {}
            }
        
        # Get article details
        articles = await self.fetch_article_details(pmids)
        
        # Analyze trends
        year_counts = {}
        for article in articles:
            year = article.get("year", "Unknown")
            year_counts[year] = year_counts.get(year, 0) + 1
        
        return {
            "drug": drug_name,
            "total_publications": len(articles),
            "publications": articles[:20],  # Return top 20
            "year_distribution": year_counts,
            "search_date": datetime.now().isoformat()
        }
    
    async def analyze_research_sentiment(self, drug_name: str) -> Dict[str, Any]:
        """Analyze sentiment of recent publications (simplified)"""
        pmids = await self.search_articles(
            query=f'"{drug_name}"[Title/Abstract]',
            max_results=50
        )
        
        articles = await self.fetch_article_details(pmids)
        
        # Simple keyword-based sentiment analysis
        positive_keywords = ["effective", "efficacy", "promising", "improved", "beneficial", "success"]
        negative_keywords = ["failure", "adverse", "toxicity", "ineffective", "discontinued", "risk"]
        
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        
        for article in articles:
            text = f"{article.get('title', '')} {article.get('abstract', '')}".lower()
            
            pos_score = sum(1 for kw in positive_keywords if kw in text)
            neg_score = sum(1 for kw in negative_keywords if kw in text)
            
            if pos_score > neg_score:
                positive_count += 1
            elif neg_score > pos_score:
                negative_count += 1
            else:
                neutral_count += 1
        
        total = len(articles)
        sentiment = "neutral"
        if total > 0:
            if positive_count / total > 0.5:
                sentiment = "positive"
            elif negative_count / total > 0.3:
                sentiment = "negative"
        
        return {
            "drug": drug_name,
            "total_analyzed": total,
            "sentiment": sentiment,
            "positive_articles": positive_count,
            "negative_articles": negative_count,
            "neutral_articles": neutral_count,
            "confidence": round(max(positive_count, negative_count, neutral_count) / total if total > 0 else 0, 2)
        }
    
    def get_schema(self) -> Dict[str, Any]:
        """Get the data schema for PubMed"""
        return {
            "type": "object",
            "required": ["status"],
            "properties": {
                "status": {"type": "string"}
            }
        }
    
    async def close(self):
        """Close HTTP session"""
        if self.session:
            await self.session.aclose()
