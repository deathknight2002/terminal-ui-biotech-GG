"""
Evidence Graph API Endpoints

FastAPI endpoints for evidence graph operations:
- Node management (get, create/update) with ETag support
- Edge management (get, create) with ETag support
- HEAD method support for cache validation
- Thesis timeline (with scrubber support)
- Edge screening/filtering
- Re-seeding data

Supports both JSON and SQLite storage backends via configuration.
"""

from fastapi import APIRouter, HTTPException, Query, Request, Response
from typing import List, Optional
from datetime import datetime
import os

from ..evidence_graph.models import NodeBase, Edge
from ..evidence_graph.storage import EvidenceGraphStorage as JSONStorage
from ..evidence_graph.storage_sqlite import SQLiteEvidenceGraphStorage
from ..config import settings

router = APIRouter()

# Initialize storage based on configuration
if settings.EVIDENCE_GRAPH_STORAGE == "sqlite":
    storage = SQLiteEvidenceGraphStorage(database_url=settings.EVIDENCE_GRAPH_DB_URL)
    print(f"✓ Evidence Graph using SQLite storage")
else:
    storage = JSONStorage()
    print(f"✓ Evidence Graph using JSON file storage")


@router.get("/health")
async def health_check():
    """Health check for evidence graph API"""
    return {"status": "ok", "service": "evidence-graph"}


@router.get("/nodes", response_model=List[NodeBase])
@router.head("/nodes")
async def get_nodes(
    request: Request,
    type: Optional[str] = Query(None, description="Filter by node type (e.g., thesis, trial, catalyst)"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    limit: Optional[int] = Query(None, description="Limit number of results", ge=1, le=1000),
    offset: Optional[int] = Query(0, description="Offset for pagination", ge=0)
):
    """
    Get all nodes in the evidence graph.
    Supports ETag caching, HEAD requests, and filtering.
    
    Query Parameters:
    - type: Filter by node type (thesis, trial, catalyst, kol, doc)
    - company: Filter by company name (case-insensitive partial match)
    - limit: Maximum number of nodes to return (1-1000)
    - offset: Number of nodes to skip for pagination
    """
    try:
        nodes, etag = storage.get_nodes_with_etag()
        
        # Apply filters
        if type:
            nodes = [n for n in nodes if n.type == type]
        
        if company:
            company_lower = company.lower()
            nodes = [n for n in nodes if n.company and company_lower in n.company.lower()]
        
        # Apply pagination
        total_count = len(nodes)
        if offset:
            nodes = nodes[offset:]
        if limit:
            nodes = nodes[:limit]
        
        # Check If-None-Match header for cache validation
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match == etag:
            # Cache hit - return 304 Not Modified
            return Response(
                status_code=304,
                headers={"ETag": etag}
            )
        
        # For HEAD requests, return headers only
        if request.method == "HEAD":
            return Response(
                status_code=200,
                headers={
                    "ETag": etag,
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store",
                    "X-Total-Count": str(total_count)
                }
            )
        
        # Return nodes with ETag header
        return Response(
            content=f'[{",".join(node.model_dump_json() for node in nodes)}]',
            media_type="application/json",
            headers={
                "ETag": etag,
                "Cache-Control": "no-store",
                "X-Total-Count": str(total_count)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get nodes: {str(e)}")


@router.get("/nodes/{node_id}", response_model=NodeBase)
async def get_node(node_id: str):
    """Get a specific node by ID"""
    node = storage.get_node(node_id)
    if node is None:
        raise HTTPException(status_code=404, detail=f"Node not found: {node_id}")
    return node


@router.post("/node", response_model=NodeBase)
async def upsert_node(node: NodeBase):
    """Create or update a node"""
    try:
        return storage.upsert_node(node)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upsert node: {str(e)}")


@router.get("/edges", response_model=List[Edge])
@router.head("/edges")
async def get_edges(request: Request):
    """
    Get all edges in the evidence graph.
    Supports ETag caching and HEAD requests.
    """
    try:
        edges, etag = storage.get_edges_with_etag()
        
        # Check If-None-Match header for cache validation
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match == etag:
            # Cache hit - return 304 Not Modified
            return Response(
                status_code=304,
                headers={"ETag": etag}
            )
        
        # For HEAD requests, return headers only
        if request.method == "HEAD":
            return Response(
                status_code=200,
                headers={
                    "ETag": etag,
                    "Content-Type": "application/json",
                    "Cache-Control": "no-store"
                }
            )
        
        # Return edges with ETag header
        return Response(
            content=f'[{",".join(edge.model_dump_json() for edge in edges)}]',
            media_type="application/json",
            headers={
                "ETag": etag,
                "Cache-Control": "no-store"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get edges: {str(e)}")


@router.post("/edge", response_model=Edge)
async def add_edge(edge: Edge):
    """Add a new edge to the evidence graph"""
    try:
        return storage.add_edge(edge)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add edge: {str(e)}")


@router.get("/thesis/{thesis_id}/timeline")
async def get_thesis_timeline(thesis_id: str):
    """
    Get timeline of updates for a thesis.
    
    Returns edges that update the thesis, sorted by time.
    This endpoint supports the timeline scrubber feature.
    """
    try:
        # Verify thesis exists
        thesis_node = storage.get_node(thesis_id)
        if thesis_node is None:
            raise HTTPException(status_code=404, detail=f"Thesis not found: {thesis_id}")
        
        if thesis_node.type != "thesis":
            raise HTTPException(status_code=400, detail=f"Node {thesis_id} is not a thesis")
        
        timeline = storage.get_thesis_timeline(thesis_id)
        
        # Calculate cumulative changes
        cumulative_pos = thesis_node.pos_estimate or 0.0
        cumulative_sentiment = thesis_node.sentiment or 0.0
        
        for i, entry in enumerate(timeline):
            edge_data = entry["edge"]
            delta = edge_data.get("delta", {})
            
            # Add cumulative values
            if delta:
                if delta.get("pos") is not None:
                    cumulative_pos += delta["pos"]
                if delta.get("sentiment") is not None:
                    cumulative_sentiment += delta["sentiment"]
            
            entry["cumulative"] = {
                "pos": cumulative_pos,
                "sentiment": cumulative_sentiment
            }
        
        return {
            "thesis_id": thesis_id,
            "thesis": thesis_node.model_dump(mode='json'),
            "timeline": timeline,
            "summary": {
                "total_updates": len(timeline),
                "final_pos": cumulative_pos,
                "final_sentiment": cumulative_sentiment
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get thesis timeline: {str(e)}")


@router.get("/screen", response_model=List[Edge])
async def screen_edges(
    pos_delta_abs_gt: Optional[float] = Query(None, description="Filter by absolute PoS delta greater than this"),
    days: Optional[int] = Query(None, description="Only include edges from last N days")
):
    """
    Screen/filter edges by criteria.
    
    Examples:
    - /screen?pos_delta_abs_gt=0.02 - Get edges with |ΔPoS| > 0.02
    - /screen?days=30 - Get edges from last 30 days
    - /screen?pos_delta_abs_gt=0.02&days=30 - Combined filters
    """
    try:
        return storage.screen_edges(pos_delta_abs_gt=pos_delta_abs_gt, days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to screen edges: {str(e)}")


@router.post("/seed")
async def reseed_data():
    """Re-ingest data from seed_data.json"""
    try:
        result = storage.reseed()
        return {
            "status": "success",
            "message": "Data re-seeded successfully",
            "nodes_loaded": result["nodes"],
            "edges_loaded": result["edges"]
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reseed data: {str(e)}")
