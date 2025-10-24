"""
Evidence Graph API Endpoints

FastAPI endpoints for evidence graph operations:
- Node management (get, create/update)
- Edge management (get, create)
- Thesis timeline (with scrubber support)
- Edge screening/filtering
- Re-seeding data
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from ..evidence_graph.models import NodeBase, Edge
from ..evidence_graph.storage import EvidenceGraphStorage

router = APIRouter()

# Initialize storage
storage = EvidenceGraphStorage()


@router.get("/health")
async def health_check():
    """Health check for evidence graph API"""
    return {"status": "ok", "service": "evidence-graph"}


@router.get("/nodes", response_model=List[NodeBase])
async def get_nodes():
    """Get all nodes in the evidence graph"""
    try:
        return storage.get_nodes()
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
async def get_edges():
    """Get all edges in the evidence graph"""
    try:
        return storage.get_edges()
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
