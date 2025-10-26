"""
SQLite Storage Adapter for Evidence Graph

Replaces JSON file storage with SQLite database while maintaining the same API interface.
Provides better performance, ACID compliance, and concurrent access support.
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, Integer, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import hashlib
import json

from .models import NodeBase, Edge, EdgeDelta

Base = declarative_base()


class NodeModel(Base):
    """SQLAlchemy model for evidence graph nodes"""
    __tablename__ = "evidence_nodes"

    id = Column(String, primary_key=True)
    type = Column(String, nullable=False, index=True)
    date = Column(String)  # ISO format
    company = Column(String, index=True)
    asset = Column(String, index=True)
    indication = Column(String, index=True)
    phase = Column(String, index=True)
    catalyst_type = Column(String)
    pos_estimate = Column(Float)
    sentiment = Column(Float)
    source_url = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes for common queries
    __table_args__ = (
        Index('idx_company_asset', 'company', 'asset'),
        Index('idx_type_phase', 'type', 'phase'),
    )


class EdgeModel(Base):
    """SQLAlchemy model for evidence graph edges"""
    __tablename__ = "evidence_edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_id = Column(String, nullable=False, index=True)
    to_id = Column(String, nullable=False, index=True)
    relation = Column(String, nullable=False, index=True)
    confidence = Column(Float, default=1.0)
    reason = Column(Text)

    # Delta fields (denormalized for performance)
    delta_pos = Column(Float)
    delta_sentiment = Column(Float)
    delta_tam = Column(Float)

    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

    # Indexes for common queries
    __table_args__ = (
        Index('idx_from_to', 'from_id', 'to_id'),
        Index('idx_relation_from', 'relation', 'from_id'),
    )


class SQLiteEvidenceGraphStorage:
    """SQLite-based storage for evidence graph data"""

    def __init__(self, database_url: Optional[str] = None):
        """
        Initialize storage with database URL.

        Args:
            database_url: SQLite database URL (defaults to in-memory for testing)
        """
        if database_url is None:
            database_url = "sqlite:///./data/evidence_graph.db"

        # Create engine with appropriate settings
        if database_url == "sqlite:///:memory:":
            # In-memory database for testing
            self.engine = create_engine(
                database_url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool
            )
        else:
            # File-based database
            self.engine = create_engine(
                database_url,
                connect_args={"check_same_thread": False}
            )

        # Create tables
        Base.metadata.create_all(self.engine)

        # Create session factory
        self.SessionLocal = sessionmaker(bind=self.engine)

        # Cache for ETag computation
        self._etag_cache: Optional[Tuple[str, datetime]] = None
        self._etag_ttl = timedelta(seconds=5)  # Cache ETag for 5 seconds

    def _get_session(self) -> Session:
        """Get a database session"""
        return self.SessionLocal()

    def _compute_etag(self, data: Dict[str, Any]) -> str:
        """
        Compute ETag for data consistency.

        Args:
            data: Dictionary to compute hash from

        Returns:
            ETag string (SHA-256 hash)
        """
        # Serialize with consistent ordering
        json_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(json_str.encode()).hexdigest()

    def _get_cached_etag(self, session: Session) -> str:
        """Get or compute ETag with caching"""
        now = datetime.utcnow()

        # Check cache
        if self._etag_cache:
            cached_etag, cached_time = self._etag_cache
            if now - cached_time < self._etag_ttl:
                return cached_etag

        # Compute fresh ETag
        nodes = session.query(NodeModel).all()
        edges = session.query(EdgeModel).all()

        data = {
            "nodes": [self._node_model_to_dict(n) for n in nodes],
            "edges": [self._edge_model_to_dict(e) for e in edges]
        }

        etag = self._compute_etag(data)
        self._etag_cache = (etag, now)

        return etag

    def _node_model_to_dict(self, node: NodeModel) -> Dict[str, Any]:
        """Convert NodeModel to dictionary"""
        return {
            "id": node.id,
            "type": node.type,
            "date": node.date,
            "company": node.company,
            "asset": node.asset,
            "indication": node.indication,
            "phase": node.phase,
            "catalyst_type": node.catalyst_type,
            "pos_estimate": node.pos_estimate,
            "sentiment": node.sentiment,
            "source_url": node.source_url,
            "notes": node.notes
        }

    def _edge_model_to_dict(self, edge: EdgeModel) -> Dict[str, Any]:
        """Convert EdgeModel to dictionary"""
        delta = None
        if edge.delta_pos is not None or edge.delta_sentiment is not None or edge.delta_tam is not None:
            delta = {
                "pos": edge.delta_pos,
                "sentiment": edge.delta_sentiment,
                "tam": edge.delta_tam
            }

        return {
            "from": edge.from_id,
            "to": edge.to_id,
            "relation": edge.relation,
            "delta": delta,
            "confidence": edge.confidence,
            "reason": edge.reason,
            "created_at": edge.created_at
        }

    # Node operations

    def get_nodes(self) -> List[NodeBase]:
        """Get all nodes"""
        session = self._get_session()
        try:
            nodes = session.query(NodeModel).all()
            return [NodeBase(**self._node_model_to_dict(n)) for n in nodes]
        finally:
            session.close()

    def get_nodes_with_etag(self) -> Tuple[List[NodeBase], str]:
        """Get all nodes along with ETag for caching"""
        session = self._get_session()
        try:
            nodes = session.query(NodeModel).all()
            etag = self._get_cached_etag(session)
            return (
                [NodeBase(**self._node_model_to_dict(n)) for n in nodes],
                etag
            )
        finally:
            session.close()

    def get_node(self, node_id: str) -> Optional[NodeBase]:
        """Get a specific node by ID"""
        session = self._get_session()
        try:
            node = session.query(NodeModel).filter(NodeModel.id == node_id).first()
            if node:
                return NodeBase(**self._node_model_to_dict(node))
            return None
        finally:
            session.close()

    def upsert_node(self, node: NodeBase) -> NodeBase:
        """Insert or update a node"""
        session = self._get_session()
        try:
            # Check if node exists
            existing = session.query(NodeModel).filter(NodeModel.id == node.id).first()

            if existing:
                # Update existing node
                for key, value in node.model_dump(exclude={'created_at'}).items():
                    setattr(existing, key, value)
                existing.updated_at = datetime.utcnow()
            else:
                # Create new node
                new_node = NodeModel(
                    **node.model_dump(exclude={'created_at', 'updated_at'})
                )
                session.add(new_node)

            session.commit()

            # Invalidate ETag cache
            self._etag_cache = None

            return node
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    # Edge operations

    def get_edges(self) -> List[Edge]:
        """Get all edges"""
        session = self._get_session()
        try:
            edges = session.query(EdgeModel).all()
            return [Edge(**self._edge_model_to_dict(e)) for e in edges]
        finally:
            session.close()

    def get_edges_with_etag(self) -> Tuple[List[Edge], str]:
        """Get all edges along with ETag for caching"""
        session = self._get_session()
        try:
            edges = session.query(EdgeModel).all()
            etag = self._get_cached_etag(session)
            return (
                [Edge(**self._edge_model_to_dict(e)) for e in edges],
                etag
            )
        finally:
            session.close()

    def add_edge(self, edge: Edge) -> Edge:
        """Add a new edge"""
        session = self._get_session()
        try:
            edge_dict = edge.model_dump(by_alias=True)

            # Extract delta fields
            delta = edge_dict.pop('delta', None)
            delta_pos = delta.get('pos') if delta else None
            delta_sentiment = delta.get('sentiment') if delta else None
            delta_tam = delta.get('tam') if delta else None

            new_edge = EdgeModel(
                from_id=edge_dict['from'],
                to_id=edge_dict['to'],
                relation=edge_dict['relation'],
                confidence=edge_dict.get('confidence', 1.0),
                reason=edge_dict.get('reason'),
                delta_pos=delta_pos,
                delta_sentiment=delta_sentiment,
                delta_tam=delta_tam,
                created_at=edge_dict.get('created_at', datetime.utcnow().isoformat())
            )

            session.add(new_edge)
            session.commit()

            # Invalidate ETag cache
            self._etag_cache = None

            return edge
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def get_edges_for_node(self, node_id: str, direction: str = "both") -> List[Edge]:
        """Get edges connected to a node"""
        session = self._get_session()
        try:
            query = session.query(EdgeModel)

            if direction == "outgoing":
                edges = query.filter(EdgeModel.from_id == node_id).all()
            elif direction == "incoming":
                edges = query.filter(EdgeModel.to_id == node_id).all()
            else:  # both
                edges = query.filter(
                    (EdgeModel.from_id == node_id) | (EdgeModel.to_id == node_id)
                ).all()

            return [Edge(**self._edge_model_to_dict(e)) for e in edges]
        finally:
            session.close()

    def get_thesis_timeline(self, thesis_id: str) -> List[Dict[str, Any]]:
        """Get timeline of updates for a thesis"""
        session = self._get_session()
        try:
            # Get edges that update the thesis
            edges = session.query(EdgeModel).filter(
                EdgeModel.to_id == thesis_id,
                EdgeModel.relation.in_(['updates', 'catalyst_for'])
            ).order_by(EdgeModel.created_at).all()

            timeline = []
            for edge in edges:
                # Get source node
                source_node = session.query(NodeModel).filter(
                    NodeModel.id == edge.from_id
                ).first()

                timeline_entry = {
                    "edge": self._edge_model_to_dict(edge),
                    "source_node": self._node_model_to_dict(source_node) if source_node else None,
                    "timestamp": edge.created_at
                }
                timeline.append(timeline_entry)

            return timeline
        finally:
            session.close()

    def screen_edges(
        self,
        pos_delta_abs_gt: Optional[float] = None,
        days: Optional[int] = None
    ) -> List[Edge]:
        """Screen/filter edges by criteria"""
        session = self._get_session()
        try:
            query = session.query(EdgeModel)

            # Filter by PoS delta
            if pos_delta_abs_gt is not None:
                from sqlalchemy import func
                query = query.filter(
                    func.abs(EdgeModel.delta_pos) > pos_delta_abs_gt
                )

            # Filter by date
            if days is not None:
                cutoff = datetime.utcnow() - timedelta(days=days)
                cutoff_str = cutoff.isoformat()
                query = query.filter(EdgeModel.created_at > cutoff_str)

            edges = query.all()
            return [Edge(**self._edge_model_to_dict(e)) for e in edges]
        finally:
            session.close()

    def reseed(self, seed_data: Dict[str, Any]) -> Dict[str, int]:
        """Re-seed the database from data"""
        session = self._get_session()
        try:
            # Clear existing data
            session.query(EdgeModel).delete()
            session.query(NodeModel).delete()

            # Insert nodes
            nodes_data = seed_data.get("nodes", [])
            for node_dict in nodes_data:
                node = NodeModel(**node_dict)
                session.add(node)

            # Insert edges
            edges_data = seed_data.get("edges", [])
            for edge_dict in edges_data:
                delta = edge_dict.pop('delta', None)
                edge = EdgeModel(
                    from_id=edge_dict['from'],
                    to_id=edge_dict['to'],
                    relation=edge_dict['relation'],
                    confidence=edge_dict.get('confidence', 1.0),
                    reason=edge_dict.get('reason'),
                    delta_pos=delta.get('pos') if delta else None,
                    delta_sentiment=delta.get('sentiment') if delta else None,
                    delta_tam=delta.get('tam') if delta else None,
                    created_at=edge_dict.get('created_at', datetime.utcnow().isoformat())
                )
                session.add(edge)

            session.commit()

            # Invalidate ETag cache
            self._etag_cache = None

            return {
                "nodes": len(nodes_data),
                "edges": len(edges_data)
            }
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
