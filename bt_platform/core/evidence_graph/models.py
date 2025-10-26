"""
Pydantic v2 Models for Evidence Graph

Data models for nodes (trials, catalysts, theses) and edges (relationships).
Uses Pydantic v2 with .model_dump() and alias support.
"""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class EdgeDelta(BaseModel):
    """Changes in metrics due to an edge/relationship"""
    pos: Optional[float] = Field(None, description="Change in Probability of Success")
    sentiment: Optional[float] = Field(None, description="Change in sentiment")
    tam: Optional[float] = Field(None, description="Change in Total Addressable Market")


class NodeBase(BaseModel):
    """
    Base node in the evidence graph.

    Can represent:
    - trial: Clinical trial with readout data
    - catalyst: Regulatory or market event (PDUFA, AdComm, etc.)
    - kol: Key Opinion Leader
    - doc: Document or publication
    - thesis: Investment thesis for a company/asset
    """
    id: str = Field(..., description="Unique identifier for the node")
    type: Literal['trial', 'catalyst', 'kol', 'doc', 'thesis'] = Field(..., description="Node type")
    date: Optional[str] = Field(None, description="Event date (ISO format, if applicable)")
    company: Optional[str] = Field(None, description="Company name")
    asset: Optional[str] = Field(None, description="Drug/asset name")
    indication: Optional[str] = Field(None, description="Disease indication")
    phase: Optional[str] = Field(None, description="Clinical phase")
    catalyst_type: Optional[str] = Field(None, description="Type of catalyst (PDUFA, AdComm, etc.)")
    pos_estimate: Optional[float] = Field(None, ge=0, le=1, description="Probability of Success (0-1)")
    sentiment: Optional[float] = Field(None, ge=-1, le=1, description="Sentiment score (-1 to 1)")
    source_url: Optional[str] = Field(None, description="Source URL for provenance")
    notes: Optional[str] = Field(None, description="Additional notes")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "trial:SRRK-301-P3-RESILIENT",
                "type": "trial",
                "date": "2025-05-12",
                "company": "Scholar Rock",
                "asset": "Apitegromab",
                "indication": "SMA",
                "phase": "Phase III",
                "pos_estimate": 0.62,
                "sentiment": 0.15,
                "notes": "RESILIENT trial for SMA Type 2/3"
            }
        }


class Edge(BaseModel):
    """
    Edge connecting nodes in the evidence graph.

    Represents relationships like:
    - supports: Evidence supports a thesis
    - contradicts: Evidence contradicts a thesis
    - updates: New data updates a thesis
    - catalyst_for: Event is a catalyst for a thesis
    - related_to: General relationship
    """
    from_id: str = Field(..., alias='from', description="Source node ID")
    to_id: str = Field(..., alias='to', description="Target node ID")
    relation: Literal['supports', 'contradicts', 'updates', 'catalyst_for', 'related_to'] = Field(
        ..., description="Type of relationship"
    )
    delta: Optional[EdgeDelta] = Field(None, description="Changes in metrics")
    confidence: Optional[float] = Field(1.0, ge=0, le=1, description="Confidence in relationship (0-1)")
    reason: Optional[str] = Field(None, description="Explanation for the relationship")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="When edge was created (ISO format)")

    class Config:
        populate_by_name = True  # Allow both 'from' and 'from_id'
        json_schema_extra = {
            "example": {
                "from": "trial:SRRK-301-P3-RESILIENT",
                "to": "thesis:SRRK-core",
                "relation": "updates",
                "delta": {
                    "pos": -0.03,
                    "sentiment": -0.05
                },
                "confidence": 0.85,
                "reason": "Trial missed primary endpoint",
                "created_at": "2025-10-01T12:00:00Z"
            }
        }
