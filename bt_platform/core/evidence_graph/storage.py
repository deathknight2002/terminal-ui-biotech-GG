"""
JSON File-backed Storage for Evidence Graph

Provides simple file-based persistence for nodes and edges.
Auto-seeds from seed_data.json on first run.
Enhanced with atomic writes, backups, and file locking for production use.
"""

import json
import os
import tempfile
import shutil
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import hashlib

from .models import NodeBase, Edge


class EvidenceGraphStorage:
    """File-based storage for evidence graph data with production-grade features"""
    
    def __init__(self, data_dir: Optional[str] = None, backup_count: int = 3):
        """
        Initialize storage with data directory.
        
        Args:
            data_dir: Directory to store data files. Defaults to bt_platform/core/evidence_graph/data/
            backup_count: Number of backup versions to keep (default: 3)
        """
        if data_dir is None:
            # Default to evidence_graph/data/ directory
            data_dir = Path(__file__).parent / "data"
        else:
            data_dir = Path(data_dir)
        
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        self.evidence_file = self.data_dir / "evidence.json"
        self.seed_file = self.data_dir / "seed_data.json"
        self.backup_count = backup_count
        
        # Initialize evidence.json from seed if it doesn't exist
        if not self.evidence_file.exists():
            self._initialize_from_seed()
    
    def _initialize_from_seed(self):
        """Initialize evidence.json from seed_data.json"""
        if self.seed_file.exists():
            print(f"📦 Initializing evidence graph from {self.seed_file}")
            with open(self.seed_file, 'r') as f:
                seed_data = json.load(f)
            self._atomic_write_json(self.evidence_file, seed_data)
        else:
            # Create empty structure
            print(f"⚠️  No seed file found, creating empty evidence graph")
            empty_data = {"nodes": [], "edges": []}
            self._atomic_write_json(self.evidence_file, empty_data)
    
    def _atomic_write_json(self, path: Path, data: Dict[str, Any]):
        """
        Atomically write JSON data to file using temp file + rename.
        This ensures data integrity even if the process crashes during write.
        
        Args:
            path: Target file path
            data: Data to write
        """
        # Serialize data with consistent formatting for stable ETags
        json_str = json.dumps(data, ensure_ascii=False, sort_keys=True, indent=2)
        
        # Create backup before writing (if file exists)
        if path.exists():
            self._create_backup(path)
        
        # Write to temporary file in same directory (ensures same filesystem for atomic rename)
        dir_path = path.parent
        fd, tmp_path = tempfile.mkstemp(dir=dir_path, prefix=".tmp.", suffix=".json", text=True)
        try:
            with os.fdopen(fd, "w") as f:
                f.write(json_str)
                f.flush()
                os.fsync(f.fileno())  # Ensure data is written to disk
            
            # Atomic rename (replaces target file)
            os.replace(tmp_path, path)
        except Exception:
            # Clean up temp file on error
            try:
                os.remove(tmp_path)
            except FileNotFoundError:
                pass
            raise
    
    def _create_backup(self, path: Path):
        """
        Create a timestamped backup of the file.
        Rotates old backups to keep only backup_count versions.
        
        Args:
            path: File to backup
        """
        if not path.exists():
            return
        
        # Create backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = path.parent / f"{path.stem}.backup.{timestamp}{path.suffix}"
        
        # Copy file to backup
        shutil.copy2(path, backup_path)
        
        # Rotate old backups
        self._rotate_backups(path)
    
    def _rotate_backups(self, path: Path):
        """
        Keep only the most recent backup_count backups.
        
        Args:
            path: Base file path
        """
        # Find all backup files
        backup_pattern = f"{path.stem}.backup.*{path.suffix}"
        backups = sorted(
            path.parent.glob(backup_pattern),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )
        
        # Remove old backups
        for backup in backups[self.backup_count:]:
            try:
                backup.unlink()
            except FileNotFoundError:
                pass
    
    def _compute_etag(self, data: bytes) -> str:
        """
        Compute ETag (SHA-256 hash) for data.
        
        Args:
            data: Data bytes
            
        Returns:
            ETag string (hex digest)
        """
        return hashlib.sha256(data).hexdigest()
    
    def _load_data(self) -> Dict[str, Any]:
        """Load data from evidence.json"""
        with open(self.evidence_file, 'r') as f:
            return json.load(f)
    
    def _load_data_with_etag(self) -> tuple[Dict[str, Any], str]:
        """
        Load data from evidence.json along with its ETag.
        
        Returns:
            Tuple of (data dict, etag string)
        """
        with open(self.evidence_file, 'rb') as f:
            raw_data = f.read()
        
        # Compute ETag from raw bytes
        etag = self._compute_etag(raw_data)
        
        # Parse JSON
        data = json.loads(raw_data.decode('utf-8'))
        
        return data, etag
    
    def _save_data(self, data: Dict[str, Any]):
        """Save data to evidence.json using atomic write"""
        self._atomic_write_json(self.evidence_file, data)
    
    # Node operations
    
    def get_nodes(self) -> List[NodeBase]:
        """Get all nodes"""
        data = self._load_data()
        return [NodeBase(**node) for node in data.get("nodes", [])]
    
    def get_nodes_with_etag(self) -> tuple[List[NodeBase], str]:
        """
        Get all nodes along with ETag for caching.
        
        Returns:
            Tuple of (nodes list, etag string)
        """
        data, etag = self._load_data_with_etag()
        nodes = [NodeBase(**node) for node in data.get("nodes", [])]
        return nodes, etag
    
    def get_node(self, node_id: str) -> Optional[NodeBase]:
        """Get a specific node by ID"""
        nodes = self.get_nodes()
        for node in nodes:
            if node.id == node_id:
                return node
        return None
    
    def upsert_node(self, node: NodeBase) -> NodeBase:
        """Insert or update a node"""
        data = self._load_data()
        nodes = data.get("nodes", [])
        
        # Find and update existing node
        for i, existing in enumerate(nodes):
            if existing.get("id") == node.id:
                nodes[i] = node.model_dump(mode='json', by_alias=False)
                data["nodes"] = nodes
                self._save_data(data)
                return node
        
        # Insert new node
        nodes.append(node.model_dump(mode='json', by_alias=False))
        data["nodes"] = nodes
        self._save_data(data)
        return node
    
    # Edge operations
    
    def get_edges(self) -> List[Edge]:
        """Get all edges"""
        data = self._load_data()
        return [Edge(**edge) for edge in data.get("edges", [])]
    
    def get_edges_with_etag(self) -> tuple[List[Edge], str]:
        """
        Get all edges along with ETag for caching.
        
        Returns:
            Tuple of (edges list, etag string)
        """
        data, etag = self._load_data_with_etag()
        edges = [Edge(**edge) for edge in data.get("edges", [])]
        return edges, etag
    
    def add_edge(self, edge: Edge) -> Edge:
        """Add a new edge"""
        data = self._load_data()
        edges = data.get("edges", [])
        edges.append(edge.model_dump(mode='json', by_alias=True))
        data["edges"] = edges
        self._save_data(data)
        return edge
    
    def get_edges_for_node(self, node_id: str, direction: str = "both") -> List[Edge]:
        """
        Get edges connected to a node.
        
        Args:
            node_id: Node ID
            direction: 'incoming', 'outgoing', or 'both'
        """
        edges = self.get_edges()
        result = []
        
        for edge in edges:
            if direction in ["outgoing", "both"] and edge.from_id == node_id:
                result.append(edge)
            elif direction in ["incoming", "both"] and edge.to_id == node_id:
                result.append(edge)
        
        return result
    
    def get_thesis_timeline(self, thesis_id: str) -> List[Dict[str, Any]]:
        """
        Get timeline of updates for a thesis.
        
        Returns edges that update the thesis, sorted by time.
        """
        edges = self.get_edges_for_node(thesis_id, direction="incoming")
        
        # Filter to only 'updates' and 'catalyst_for' relations
        timeline_edges = [
            e for e in edges 
            if e.relation in ["updates", "catalyst_for"]
        ]
        
        # Sort by created_at timestamp (ISO string)
        timeline_edges.sort(key=lambda e: e.created_at)
        
        # Build timeline with node details
        timeline = []
        for edge in timeline_edges:
            # Get the source node
            source_node = self.get_node(edge.from_id)
            
            timeline_entry = {
                "edge": edge.model_dump(mode='json', by_alias=True),
                "source_node": source_node.model_dump(mode='json') if source_node else None,
                "timestamp": edge.created_at
            }
            timeline.append(timeline_entry)
        
        return timeline
    
    def screen_edges(
        self, 
        pos_delta_abs_gt: Optional[float] = None,
        days: Optional[int] = None
    ) -> List[Edge]:
        """
        Screen/filter edges by criteria.
        
        Args:
            pos_delta_abs_gt: Filter by absolute PoS delta greater than this value
            days: Only include edges from last N days
        """
        edges = self.get_edges()
        
        # Filter by PoS delta
        if pos_delta_abs_gt is not None:
            edges = [
                e for e in edges
                if e.delta and e.delta.pos is not None 
                and abs(e.delta.pos) > pos_delta_abs_gt
            ]
        
        # Filter by date
        if days is not None:
            from datetime import datetime, timedelta
            cutoff = datetime.utcnow() - timedelta(days=days)
            cutoff_str = cutoff.isoformat()
            edges = [
                e for e in edges
                if e.created_at > cutoff_str
            ]
        
        return edges
    
    def reseed(self) -> Dict[str, int]:
        """Re-ingest seed_data.json"""
        if not self.seed_file.exists():
            raise FileNotFoundError(f"Seed file not found: {self.seed_file}")
        
        with open(self.seed_file, 'r') as f:
            seed_data = json.load(f)
        
        with open(self.evidence_file, 'w') as f:
            json.dump(seed_data, f, indent=2)
        
        return {
            "nodes": len(seed_data.get("nodes", [])),
            "edges": len(seed_data.get("edges", []))
        }
