"""
Standalone Evidence Graph API Server

Simple FastAPI server for testing the evidence graph endpoints.
Run with: uvicorn standalone_evidence_api:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the evidence graph router
from bt_platform.core.endpoints.evidence_graph import router as evidence_graph_router

# Create FastAPI app
app = FastAPI(
    title="Evidence Graph API",
    description="Standalone API for evidence graph visualization",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "evidence-graph-standalone"}

# Include evidence graph router
app.include_router(evidence_graph_router, prefix="/api/v1/evidence-graph", tags=["evidence-graph"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
