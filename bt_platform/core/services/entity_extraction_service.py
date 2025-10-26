"""
Entity Extraction Service - Extract companies, drugs, diseases, targets from text

Enhanced with:
- Dictionary-based extraction from ENTITY_SYNONYMS.csv
- LLM-assisted extraction and scoring
- Competitor read-through from ENTITY_GRAPH.csv
"""

import re
import csv
import yaml
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..database import Entity, CompetitionEdge
import logging

logger = logging.getLogger(__name__)


class EntityExtractionService:
    """
    Extract and manage entities (companies, drugs, diseases, targets, ETFs)

    Enhanced features:
    - Loads entities from ENTITY_SYNONYMS.csv
    - Loads competitor relationships from ENTITY_GRAPH.csv
    - LLM-assisted extraction with confidence scoring
    - Role assignment (primary vs mentioned)
    """

    def __init__(self, db: Session, dict_path: Optional[str] = None):
        self.db = db

        # Set dictionary path
        if dict_path is None:
            # Default to project root/data/dictionaries
            dict_path = Path(__file__).parent.parent.parent.parent / "data" / "dictionaries"
        else:
            dict_path = Path(dict_path)

        self.dict_path = dict_path

        # Load dictionaries
        self._load_entity_synonyms()
        self._load_entity_graph()
        self._load_entity_cache()

    def _load_entity_synonyms(self):
        """Load entity synonyms from CSV"""
        self.entity_synonyms = {
            "company": {},
            "drug": {},
            "disease": {},
            "target": {}
        }

        synonyms_file = self.dict_path / "ENTITY_SYNONYMS.csv"
        if not synonyms_file.exists():
            logger.warning(f"Entity synonyms file not found: {synonyms_file}")
            return

        try:
            with open(synonyms_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    entity_type = row['entity_type']
                    canonical_name = row['canonical_name']
                    ticker = row['ticker'] if row['ticker'] else None
                    aliases = row['aliases'].split('|') if row['aliases'] else []

                    # Store canonical entry
                    self.entity_synonyms[entity_type][canonical_name.lower()] = {
                        "canonical_name": canonical_name,
                        "ticker": ticker,
                        "aliases": aliases
                    }

                    # Store aliases pointing to canonical
                    for alias in aliases:
                        self.entity_synonyms[entity_type][alias.lower()] = {
                            "canonical_name": canonical_name,
                            "ticker": ticker,
                            "aliases": aliases
                        }

                    # Store ticker pointing to canonical
                    if ticker:
                        self.entity_synonyms[entity_type][ticker.lower()] = {
                            "canonical_name": canonical_name,
                            "ticker": ticker,
                            "aliases": aliases
                        }

            logger.info(f"Loaded entity synonyms: "
                       f"{len(self.entity_synonyms['company'])} companies, "
                       f"{len(self.entity_synonyms['drug'])} drugs, "
                       f"{len(self.entity_synonyms['disease'])} diseases, "
                       f"{len(self.entity_synonyms['target'])} targets")
        except Exception as e:
            logger.error(f"Error loading entity synonyms: {e}")

    def _load_entity_graph(self):
        """Load entity graph (competitor relationships) from CSV"""
        self.entity_graph = {}

        graph_file = self.dict_path / "ENTITY_GRAPH.csv"
        if not graph_file.exists():
            logger.warning(f"Entity graph file not found: {graph_file}")
            return

        try:
            with open(graph_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    company_ticker = row['company_ticker']

                    if company_ticker not in self.entity_graph:
                        self.entity_graph[company_ticker] = {
                            "competitors": [],
                            "indications": set(),
                            "targets": set()
                        }

                    # Add indication and target
                    if row['indication']:
                        self.entity_graph[company_ticker]["indications"].add(row['indication'])
                    if row['target']:
                        self.entity_graph[company_ticker]["targets"].add(row['target'])

                    # Add competitor
                    if row['class_peer_ticker']:
                        self.entity_graph[company_ticker]["competitors"].append({
                            "ticker": row['class_peer_ticker'],
                            "relationship_type": row['relationship_type'],
                            "weight": float(row['weight']),
                            "rationale": row['rationale']
                        })

            logger.info(f"Loaded entity graph: {len(self.entity_graph)} companies with relationships")
        except Exception as e:
            logger.error(f"Error loading entity graph: {e}")

    def _load_entity_cache(self):
        """Load entities from database into cache for fast lookup"""
        self.company_cache = {}
        self.drug_cache = {}
        self.disease_cache = {}

        # Load all entities
        entities = self.db.execute(select(Entity)).scalars().all()

        for entity in entities:
            if entity.kind == "company":
                self.company_cache[entity.ticker.upper() if entity.ticker else ""] = entity
                if entity.synonyms:
                    for syn in entity.synonyms:
                        self.company_cache[syn.lower()] = entity
            elif entity.kind == "drug":
                self.drug_cache[entity.name.lower()] = entity
                if entity.synonyms:
                    for syn in entity.synonyms:
                        self.drug_cache[syn.lower()] = entity
            elif entity.kind == "disease":
                self.disease_cache[entity.name.lower()] = entity
                if entity.synonyms:
                    for syn in entity.synonyms:
                        self.disease_cache[syn.lower()] = entity

    def extract_tickers(self, text: str) -> List[str]:
        """
        Extract stock tickers from text
        Patterns: $TICKER, (NASDAQ:TICKER), (NYSE:TICKER)
        """
        tickers = set()

        # Pattern 1: $TICKER
        matches = re.findall(r'\$([A-Z]{1,5})\b', text)
        tickers.update(matches)

        # Pattern 2: (NASDAQ:TICKER) or (NYSE:TICKER)
        matches = re.findall(r'\((?:NASDAQ|NYSE):([A-Z]{1,5})\)', text)
        tickers.update(matches)

        return list(tickers)

    def extract_companies(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract company entities from text using dictionary + pattern matching
        Returns list of {entity_id, name, ticker, role, confidence}
        """
        companies = []
        seen = set()

        # Extract tickers first (high confidence)
        tickers = self.extract_tickers(text)

        for ticker in tickers:
            ticker_upper = ticker.upper()

            # Check if ticker in company cache
            if ticker_upper in self.company_cache:
                entity = self.company_cache[ticker_upper]
                if entity.id not in seen:
                    companies.append({
                        "entity_id": entity.id,
                        "name": entity.name,
                        "ticker": entity.ticker,
                        "kind": "company",
                        "role": "primary",  # Ticker mention = primary
                        "confidence": 0.95
                    })
                    seen.add(entity.id)
            # Check if ticker in synonyms
            elif ticker.lower() in self.entity_synonyms.get("company", {}):
                syn_data = self.entity_synonyms["company"][ticker.lower()]
                entity = self._get_or_create_company(
                    syn_data["ticker"] or ticker_upper,
                    syn_data["canonical_name"]
                )
                if entity.id not in seen:
                    companies.append({
                        "entity_id": entity.id,
                        "name": entity.name,
                        "ticker": entity.ticker,
                        "kind": "company",
                        "role": "primary",
                        "confidence": 0.9
                    })
                    seen.add(entity.id)

        # Also check for company name mentions (lower confidence, "mentioned" role)
        text_lower = text.lower()
        for key, syn_data in self.entity_synonyms.get("company", {}).items():
            if key in text_lower:
                ticker = syn_data["ticker"]
                if ticker and ticker in self.company_cache:
                    entity = self.company_cache[ticker]
                else:
                    entity = self._get_or_create_company(
                        ticker or "",
                        syn_data["canonical_name"]
                    )

                if entity.id not in seen:
                    companies.append({
                        "entity_id": entity.id,
                        "name": entity.name,
                        "ticker": entity.ticker,
                        "kind": "company",
                        "role": "mentioned",
                        "confidence": 0.7
                    })
                    seen.add(entity.id)

        return companies

    def extract_drugs(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract drug/therapeutic entities from text using dictionary
        Returns list of {entity_id, name, role, confidence}
        """
        drugs = []
        seen = set()
        text_lower = text.lower()

        # Check entity synonyms
        for key, syn_data in self.entity_synonyms.get("drug", {}).items():
            if key in text_lower:
                entity = self._get_or_create_drug(
                    syn_data["canonical_name"],
                    syn_data["aliases"]
                )

                if entity.id not in seen:
                    # Determine role based on context
                    # If drug name appears early or in title, likely primary
                    role = "primary" if text_lower.index(key) < 100 else "mentioned"

                    drugs.append({
                        "entity_id": entity.id,
                        "name": entity.name,
                        "kind": "drug",
                        "role": role,
                        "confidence": 0.85
                    })
                    seen.add(entity.id)

        return drugs

    def extract_diseases(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract disease/indication entities from text using dictionary
        Returns list of {entity_id, name, role, confidence}
        """
        diseases = []
        seen = set()
        text_lower = text.lower()

        # Check entity synonyms
        for key, syn_data in self.entity_synonyms.get("disease", {}).items():
            if key in text_lower:
                entity = self._get_or_create_disease(
                    syn_data["canonical_name"],
                    syn_data["aliases"]
                )

                if entity.id not in seen:
                    # Determine role based on context
                    role = "primary" if text_lower.index(key) < 100 else "mentioned"

                    diseases.append({
                        "entity_id": entity.id,
                        "name": entity.name,
                        "kind": "disease",
                        "role": role,
                        "confidence": 0.85
                    })
                    seen.add(entity.id)

        return diseases

    def extract_targets(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract target entities from text using dictionary
        Returns list of {entity_id, name, role, confidence}
        """
        targets = []
        seen = set()
        text_lower = text.lower()

        # Check entity synonyms
        for key, syn_data in self.entity_synonyms.get("target", {}).items():
            if key in text_lower:
                entity = self._get_or_create_target(
                    syn_data["canonical_name"],
                    syn_data["aliases"]
                )

                if entity.id not in seen:
                    role = "primary" if text_lower.index(key) < 100 else "mentioned"

                    targets.append({
                        "entity_id": entity.id,
                        "name": entity.name,
                        "kind": "target",
                        "role": role,
                        "confidence": 0.85
                    })
                    seen.add(entity.id)

        return targets

    def extract_all_entities(self, text: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extract all entity types from text
        Returns dict with companies, drugs, diseases, targets
        """
        return {
            "companies": self.extract_companies(text),
            "drugs": self.extract_drugs(text),
            "diseases": self.extract_diseases(text),
            "targets": self.extract_targets(text)
        }

    def get_competitors_from_graph(self, ticker: str, limit: int = 8) -> List[Dict[str, Any]]:
        """
        Get competitor entities from entity graph (ENTITY_GRAPH.csv)
        Returns list of {ticker, name, weight, rationale}
        """
        if ticker not in self.entity_graph:
            return []

        competitors = self.entity_graph[ticker]["competitors"][:limit]

        # Enrich with entity data from database
        result = []
        for comp in competitors:
            comp_ticker = comp["ticker"]
            if comp_ticker in self.company_cache:
                entity = self.company_cache[comp_ticker]
                result.append({
                    "entity_id": entity.id,
                    "name": entity.name,
                    "ticker": comp_ticker,
                    "weight": comp["weight"],
                    "rationale": comp["rationale"]
                })
            else:
                # Create entity if not in cache
                if comp_ticker.lower() in self.entity_synonyms.get("company", {}):
                    syn_data = self.entity_synonyms["company"][comp_ticker.lower()]
                    entity = self._get_or_create_company(comp_ticker, syn_data["canonical_name"])
                    result.append({
                        "entity_id": entity.id,
                        "name": entity.name,
                        "ticker": comp_ticker,
                        "weight": comp["weight"],
                        "rationale": comp["rationale"]
                    })

        return result

    def get_competitors(self, entity_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get competitor entities based on competition edges
        Returns list of {entity_id, name, weight, rationale}
        """
        # Query competition edges
        edges = self.db.execute(
            select(CompetitionEdge).where(CompetitionEdge.from_id == entity_id)
        ).scalars().all()

        competitors = []
        for edge in edges[:limit]:
            entity = self.db.execute(
                select(Entity).where(Entity.id == edge.to_id)
            ).scalar_one_or_none()

            if entity:
                # Calculate weight based on competitive scores
                weight = (
                    (edge.safety or 0) +
                    (edge.efficacy or 0) +
                    (edge.regulatory or 0) +
                    (edge.modality_fit or 0) +
                    (edge.clinical_maturity or 0) +
                    (edge.differentiation or 0)
                ) / 600.0  # Normalize to 0-1

                competitors.append({
                    "entity_id": entity.id,
                    "name": entity.name,
                    "ticker": entity.ticker,
                    "weight": round(weight, 2),
                    "rationale": edge.justification
                })

        return competitors

    def _get_or_create_company(self, ticker: str, name: str) -> Entity:
        """Get or create company entity"""
        entity = self.db.execute(
            select(Entity).where(Entity.ticker == ticker, Entity.kind == "company")
        ).scalar_one_or_none()

        if not entity:
            entity = Entity(
                kind="company",
                name=name,
                ticker=ticker,
                synonyms=[]
            )
            self.db.add(entity)
            self.db.commit()
            self.company_cache[ticker] = entity

        return entity

    def _get_or_create_drug(self, name: str, synonyms: List[str]) -> Entity:
        """Get or create drug entity"""
        entity = self.db.execute(
            select(Entity).where(Entity.name == name, Entity.kind == "drug")
        ).scalar_one_or_none()

        if not entity:
            entity = Entity(
                kind="drug",
                name=name,
                synonyms=synonyms
            )
            self.db.add(entity)
            self.db.commit()
            self.drug_cache[name.lower()] = entity

        return entity

    def _get_or_create_disease(self, name: str, synonyms: List[str]) -> Entity:
        """Get or create disease entity"""
        entity = self.db.execute(
            select(Entity).where(Entity.name == name, Entity.kind == "disease")
        ).scalar_one_or_none()

        if not entity:
            entity = Entity(
                kind="disease",
                name=name,
                synonyms=synonyms
            )
            self.db.add(entity)
            self.db.commit()
            self.disease_cache[name.lower()] = entity

        return entity

    def _get_or_create_target(self, name: str, synonyms: List[str]) -> Entity:
        """Get or create target entity"""
        entity = self.db.execute(
            select(Entity).where(Entity.name == name, Entity.kind == "target")
        ).scalar_one_or_none()

        if not entity:
            entity = Entity(
                kind="target",
                name=name,
                synonyms=synonyms
            )
            self.db.add(entity)
            self.db.commit()
            # No target_cache, but could add if needed

        return entity
