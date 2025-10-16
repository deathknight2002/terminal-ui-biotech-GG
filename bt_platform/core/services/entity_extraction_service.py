"""
Entity Extraction Service - Extract companies, drugs, diseases, targets from text
"""

import re
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..database import Entity, CompetitionEdge
import logging

logger = logging.getLogger(__name__)


class EntityExtractionService:
    """
    Extract and manage entities (companies, drugs, diseases, targets, ETFs)
    """
    
    # Common biotech company ticker patterns
    KNOWN_TICKERS = {
        "SRRK": "Scholar Rock Holding Corporation",
        "IONS": "Ionis Pharmaceuticals",
        "BIIB": "Biogen Inc.",
        "GILD": "Gilead Sciences",
        "MRNA": "Moderna Inc.",
        "BNTX": "BioNTech SE",
        "REGN": "Regeneron Pharmaceuticals",
        "VRTX": "Vertex Pharmaceuticals",
        "XBI": "SPDR S&P Biotech ETF",
    }
    
    # Drug name patterns
    DRUG_SYNONYMS = {
        "apitegromab": ["apitegromab", "SRK-015"],
        "nusinersen": ["nusinersen", "spinraza"],
        "risdiplam": ["risdiplam", "evrysdi"],
    }
    
    # Disease name patterns
    DISEASE_SYNONYMS = {
        "spinal muscular atrophy": ["sma", "spinal muscular atrophy"],
        "type 2 diabetes": ["t2d", "type 2 diabetes", "diabetes mellitus type 2"],
        "obesity": ["obesity", "overweight"],
    }
    
    def __init__(self, db: Session):
        self.db = db
        self._load_entity_cache()
        
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
        Extract company entities from text
        Returns list of {entity_id, name, ticker, confidence}
        """
        companies = []
        seen = set()
        
        # Extract tickers
        tickers = self.extract_tickers(text)
        
        for ticker in tickers:
            if ticker in self.company_cache:
                entity = self.company_cache[ticker]
                if entity.id not in seen:
                    companies.append({
                        "entity_id": entity.id,
                        "name": entity.name,
                        "ticker": entity.ticker,
                        "confidence": 0.95
                    })
                    seen.add(entity.id)
            elif ticker in self.KNOWN_TICKERS:
                # Auto-create entity for known ticker
                entity = self._get_or_create_company(ticker, self.KNOWN_TICKERS[ticker])
                if entity.id not in seen:
                    companies.append({
                        "entity_id": entity.id,
                        "name": entity.name,
                        "ticker": entity.ticker,
                        "confidence": 0.9
                    })
                    seen.add(entity.id)
        
        # Also check for company name mentions (case-insensitive)
        text_lower = text.lower()
        for key, entity in self.company_cache.items():
            if key and key in text_lower and entity.id not in seen:
                companies.append({
                    "entity_id": entity.id,
                    "name": entity.name,
                    "ticker": entity.ticker,
                    "confidence": 0.7
                })
                seen.add(entity.id)
        
        return companies
    
    def extract_drugs(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract drug/therapeutic entities from text
        Returns list of {entity_id, name, confidence}
        """
        drugs = []
        seen = set()
        text_lower = text.lower()
        
        # Check known drug synonyms
        for canonical_name, synonyms in self.DRUG_SYNONYMS.items():
            for synonym in synonyms:
                if synonym.lower() in text_lower:
                    entity = self._get_or_create_drug(canonical_name, synonyms)
                    if entity.id not in seen:
                        drugs.append({
                            "entity_id": entity.id,
                            "name": entity.name,
                            "confidence": 0.85
                        })
                        seen.add(entity.id)
                        break
        
        # Check cached drugs
        for key, entity in self.drug_cache.items():
            if key in text_lower and entity.id not in seen:
                drugs.append({
                    "entity_id": entity.id,
                    "name": entity.name,
                    "confidence": 0.75
                })
                seen.add(entity.id)
        
        return drugs
    
    def extract_diseases(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract disease/indication entities from text
        Returns list of {entity_id, name, confidence}
        """
        diseases = []
        seen = set()
        text_lower = text.lower()
        
        # Check known disease synonyms
        for canonical_name, synonyms in self.DISEASE_SYNONYMS.items():
            for synonym in synonyms:
                if synonym.lower() in text_lower:
                    entity = self._get_or_create_disease(canonical_name, synonyms)
                    if entity.id not in seen:
                        diseases.append({
                            "entity_id": entity.id,
                            "name": entity.name,
                            "confidence": 0.85
                        })
                        seen.add(entity.id)
                        break
        
        # Check cached diseases
        for key, entity in self.disease_cache.items():
            if key in text_lower and entity.id not in seen:
                diseases.append({
                    "entity_id": entity.id,
                    "name": entity.name,
                    "confidence": 0.75
                })
                seen.add(entity.id)
        
        return diseases
    
    def extract_all_entities(self, text: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extract all entity types from text
        Returns dict with companies, drugs, diseases
        """
        return {
            "companies": self.extract_companies(text),
            "drugs": self.extract_drugs(text),
            "diseases": self.extract_diseases(text)
        }
    
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
