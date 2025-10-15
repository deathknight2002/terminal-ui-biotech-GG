"""
Research Intelligence API Endpoints

Endpoints for scientific literature from PubMed, including publication search,
trend analysis, and research velocity tracking.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Path, Query

from ...providers.pubmed_provider import PubMedProvider

router = APIRouter()
pubmed_provider = PubMedProvider()


@router.get("/search")
async def search_publications(
    query: str = Query(..., description="Search query (supports PubMed syntax)"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results"),
    sort: str = Query("relevance", description="Sort by: relevance, pub_date, author, journal"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY/MM/DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY/MM/DD)")
):
    """
    Search PubMed scientific publications
    
    **Examples:**
    - `/research/search?query=CAR-T therapy&limit=50` - Search CAR-T publications
    - `/research/search?query=pembrolizumab AND cancer&sort=pub_date` - Recent pembrolizumab papers
    - `/research/search?query=CRISPR&date_from=2023/01/01` - CRISPR papers from 2023
    
    **Query Syntax:**
    - Use AND, OR, NOT for boolean logic
    - Use quotes for exact phrases: "immune checkpoint inhibitor"
    - Field-specific searches: author[AU], journal[TA], title[TI]
    """
    try:
        result = await pubmed_provider.search_publications(
            query=query,
            limit=limit,
            sort=sort,
            date_from=date_from,
            date_to=date_to
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/publication/{pmid}")
async def get_publication_details(
    pmid: str = Path(..., description="PubMed ID (PMID)")
):
    """
    Get detailed information for a specific publication
    
    **Example:**
    - `/research/publication/36543321` - Get details for PMID 36543321
    """
    try:
        result = await pubmed_provider.get_publication_details(pmid=pmid)

        if result.get("error"):
            raise HTTPException(status_code=404, detail=result["error"])

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
async def analyze_publication_trends(
    query: str = Query(..., description="Search query to analyze"),
    years: int = Query(10, ge=1, le=30, description="Number of years to analyze")
):
    """
    Analyze publication trends over time
    
    Returns year-over-year publication counts to identify emerging
    research areas and declining interest.
    
    **Examples:**
    - `/research/trends?query=mRNA vaccine&years=10` - mRNA vaccine publication trends
    - `/research/trends?query=Alzheimer disease&years=15` - Alzheimer's research velocity
    """
    try:
        result = await pubmed_provider.analyze_publication_trends(
            query=query,
            years=years
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drug/{drug_name}")
async def search_by_drug(
    drug_name: str = Path(..., description="Drug name (brand or generic)"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results")
):
    """
    Search publications about a specific drug
    
    Searches title, abstract, and MeSH terms for drug mentions.
    
    **Examples:**
    - `/research/drug/Keytruda` - Publications about Keytruda
    - `/research/drug/pembrolizumab` - Publications about pembrolizumab
    """
    try:
        result = await pubmed_provider.search_by_drug(
            drug_name=drug_name,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/disease/{disease}")
async def search_by_disease(
    disease: str = Path(..., description="Disease or condition name"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results")
):
    """
    Search publications about a specific disease
    
    Searches title, abstract, and MeSH terms for disease mentions.
    
    **Examples:**
    - `/research/disease/Multiple Myeloma` - Multiple myeloma publications
    - `/research/disease/Cystic Fibrosis` - Cystic fibrosis research
    """
    try:
        result = await pubmed_provider.search_by_disease(
            disease=disease,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard")
async def get_research_dashboard(
    therapeutic_area: Optional[str] = Query(None, description="Focus on therapeutic area")
):
    """
    Get comprehensive research intelligence dashboard
    
    Returns publication trends, hot topics, and research velocity metrics.
    """
    try:
        # Define key research areas to track
        research_areas = [
            "CAR-T therapy",
            "immune checkpoint inhibitor",
            "mRNA vaccine",
            "gene therapy",
            "CRISPR"
        ]

        if therapeutic_area:
            research_areas = [therapeutic_area]

        # Get trends for each area (last 5 years)
        area_trends = []
        for area in research_areas[:5]:  # Limit to 5 to avoid too many requests
            trends = await pubmed_provider.analyze_publication_trends(
                query=area,
                years=5
            )
            area_trends.append({
                "area": area,
                "trends": trends.get("data", []),
                "total_publications": sum(t.get("count", 0) for t in trends.get("data", []))
            })

        # Get recent publications in therapeutic area
        recent_publications = []
        if therapeutic_area:
            pubs = await pubmed_provider.search_publications(
                query=therapeutic_area,
                limit=10,
                sort="pub_date"
            )
            recent_publications = pubs.get("data", [])

        return {
            "research_trends": area_trends,
            "recent_publications": recent_publications,
            "therapeutic_area_filter": therapeutic_area,
            "timestamp": datetime.now().isoformat(),
            "source": "pubmed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hot-topics")
async def identify_hot_topics(
    therapeutic_area: str = Query(..., description="Therapeutic area to analyze"),
    years: int = Query(5, ge=2, le=10, description="Years to analyze")
):
    """
    Identify hot research topics with accelerating publication velocity
    
    Analyzes publication trends to find topics with increasing research activity,
    indicating emerging opportunities or threats.
    
    **Example:**
    - `/research/hot-topics?therapeutic_area=Oncology&years=5`
    """
    try:
        # Define related topics to analyze
        base_queries = [
            f"{therapeutic_area} AND biomarker",
            f"{therapeutic_area} AND immunotherapy",
            f"{therapeutic_area} AND targeted therapy",
            f"{therapeutic_area} AND precision medicine",
            f"{therapeutic_area} AND combination therapy"
        ]

        hot_topics = []

        for query in base_queries:
            trends = await pubmed_provider.analyze_publication_trends(
                query=query,
                years=years
            )

            trend_data = trends.get("data", [])
            if len(trend_data) >= 2:
                # Calculate growth rate
                recent_count = sum(t.get("count", 0) for t in trend_data[-2:])
                older_count = sum(t.get("count", 0) for t in trend_data[:2]) + 1  # Avoid division by zero
                growth_rate = ((recent_count - older_count) / older_count) * 100

                hot_topics.append({
                    "topic": query,
                    "growth_rate": round(growth_rate, 1),
                    "recent_publications": recent_count,
                    "total_publications": sum(t.get("count", 0) for t in trend_data),
                    "is_accelerating": growth_rate > 50,
                    "trends": trend_data
                })

        # Sort by growth rate
        hot_topics.sort(key=lambda x: x["growth_rate"], reverse=True)

        return {
            "hot_topics": hot_topics,
            "therapeutic_area": therapeutic_area,
            "analysis_period_years": years,
            "timestamp": datetime.now().isoformat(),
            "source": "pubmed_analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/competitive-research")
async def analyze_competitive_research(
    company: str = Query(..., description="Company name"),
    competitors: str = Query(..., description="Comma-separated list of competitor names"),
    years: int = Query(5, ge=1, le=10, description="Years to analyze")
):
    """
    Compare research publication activity across companies
    
    Analyzes publication velocity to understand R&D focus and investment.
    
    **Example:**
    - `/research/competitive-research?company=Pfizer&competitors=Moderna,BioNTech&years=5`
    """
    try:
        competitor_list = [c.strip() for c in competitors.split(",")]
        all_companies = [company] + competitor_list

        company_research = []

        for comp in all_companies[:6]:  # Limit to 6 companies to avoid rate limits
            trends = await pubmed_provider.analyze_publication_trends(
                query=f'"{comp}"[Affiliation]',
                years=years
            )

            company_research.append({
                "company": comp,
                "trends": trends.get("data", []),
                "total_publications": sum(t.get("count", 0) for t in trends.get("data", []))
            })

        return {
            "company_research": company_research,
            "focus_company": company,
            "competitors": competitor_list,
            "analysis_period_years": years,
            "timestamp": datetime.now().isoformat(),
            "source": "pubmed_analysis"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
