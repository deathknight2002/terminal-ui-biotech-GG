"""
Importance Scoring Service - Score article importance for tradability

Uses:
- Catalyst keywords and weights from CATALYST_KEYWORDS.yaml
- Therapeutic area classification from TA_KEYWORDS.yaml
- Portfolio relevance
- Cross-source count (multiple sources = higher importance)
- Market cap bucket (SMID > Large > Mega)
"""

import yaml
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ImportanceScoringService:
    """
    Score article importance for tradability
    
    Output:
    - importance: "Critical" | "High" | "Medium" | "Low"
    - relevance_score: 0-100
    - catalyst_detected: str (if any)
    - ta_detected: List[str]
    """
    
    def __init__(self, dict_path: Optional[str] = None):
        # Set dictionary path
        if dict_path is None:
            dict_path = Path(__file__).parent.parent.parent.parent / "data" / "dictionaries"
        else:
            dict_path = Path(dict_path)
        
        self.dict_path = dict_path
        
        # Load dictionaries
        self._load_catalyst_keywords()
        self._load_ta_keywords()
    
    def _load_catalyst_keywords(self):
        """Load catalyst keywords and weights from YAML"""
        self.catalyst_keywords = {}
        self.catalyst_weights = {}
        
        catalyst_file = self.dict_path / "CATALYST_KEYWORDS.yaml"
        if not catalyst_file.exists():
            logger.warning(f"Catalyst keywords file not found: {catalyst_file}")
            return
        
        try:
            with open(catalyst_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            # Extract catalysts
            catalysts = data.get('catalysts', {})
            for catalyst_key, catalyst_data in catalysts.items():
                name = catalyst_data['name']
                weight = catalyst_data['weight']
                keywords = [kw.lower() for kw in catalyst_data['keywords']]
                
                self.catalyst_keywords[catalyst_key] = {
                    "name": name,
                    "weight": weight,
                    "keywords": keywords,
                    "negative": catalyst_data.get('negative', False)
                }
                self.catalyst_weights[catalyst_key] = weight
            
            # Extract scoring rules
            self.scoring_rules = data.get('scoring_rules', {})
            
            logger.info(f"Loaded {len(self.catalyst_keywords)} catalyst types")
        except Exception as e:
            logger.error(f"Error loading catalyst keywords: {e}")
    
    def _load_ta_keywords(self):
        """Load therapeutic area keywords from YAML"""
        self.ta_keywords = {}
        
        ta_file = self.dict_path / "TA_KEYWORDS.yaml"
        if not ta_file.exists():
            logger.warning(f"TA keywords file not found: {ta_file}")
            return
        
        try:
            with open(ta_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            # Extract therapeutic areas
            tas = data.get('therapeutic_areas', {})
            for ta_key, ta_data in tas.items():
                keywords = [kw.lower() for kw in ta_data['keywords']]
                aliases = [a.lower() for a in ta_data.get('aliases', [])]
                
                self.ta_keywords[ta_key] = {
                    "name": ta_data['name'],
                    "keywords": keywords + aliases
                }
            
            logger.info(f"Loaded {len(self.ta_keywords)} therapeutic areas")
        except Exception as e:
            logger.error(f"Error loading TA keywords: {e}")
    
    def detect_catalysts(self, text: str) -> List[str]:
        """
        Detect catalysts in text
        Returns list of catalyst keys (e.g., ["FDA_Approval", "Phase_3"])
        """
        text_lower = text.lower()
        detected = []
        
        for catalyst_key, catalyst_data in self.catalyst_keywords.items():
            for keyword in catalyst_data["keywords"]:
                if keyword in text_lower:
                    detected.append(catalyst_key)
                    break  # Only count once per catalyst type
        
        return detected
    
    def detect_therapeutic_areas(self, text: str) -> List[str]:
        """
        Detect therapeutic areas in text
        Returns list of TA keys (e.g., ["Oncology", "GLP-1"])
        """
        text_lower = text.lower()
        detected = []
        
        for ta_key, ta_data in self.ta_keywords.items():
            for keyword in ta_data["keywords"]:
                if keyword in text_lower:
                    detected.append(ta_key)
                    break  # Only count once per TA
        
        return detected
    
    def score_article(
        self,
        title: str,
        summary: Optional[str] = None,
        catalyst_tags: Optional[List[str]] = None,
        ta_tags: Optional[List[str]] = None,
        cross_source_count: int = 1,
        portfolio_relevance: bool = False,
        market_cap_bucket: Optional[str] = None,  # "smid", "large", "mega"
        entities: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Score article for importance and relevance
        
        Returns:
        {
            "importance": "Critical" | "High" | "Medium" | "Low",
            "relevance_score": 0-100,
            "catalyst_detected": str or None,
            "ta_detected": List[str],
            "scoring_breakdown": {...}
        }
        """
        # Combine title + summary for detection
        text = title
        if summary:
            text += " " + summary
        
        # Detect catalysts if not provided
        if not catalyst_tags:
            catalyst_tags = self.detect_catalysts(text)
        
        # Detect TAs if not provided
        if not ta_tags:
            ta_tags = self.detect_therapeutic_areas(text)
        
        # Start with base score from highest-weight catalyst
        base_score = 0
        primary_catalyst = None
        
        if catalyst_tags:
            # Find highest-weight catalyst
            max_weight = 0
            for catalyst_key in catalyst_tags:
                weight = self.catalyst_weights.get(catalyst_key, 0)
                if weight > max_weight:
                    max_weight = weight
                    primary_catalyst = catalyst_key
            
            # Base score is normalized catalyst weight (0-100)
            base_score = max_weight
        
        # Apply modifiers
        modifiers = self.scoring_rules.get('modifiers', {})
        
        relevance_score = base_score
        breakdown = {
            "base_catalyst_score": base_score,
            "modifiers": {}
        }
        
        # Portfolio relevance modifier
        if portfolio_relevance:
            boost = modifiers.get('portfolio_relevance', 15)
            relevance_score += boost
            breakdown["modifiers"]["portfolio_relevance"] = boost
        
        # Cross-source count modifier
        if cross_source_count >= 2:
            boost = modifiers.get('cross_source_count_2plus', 10)
            relevance_score += boost
            breakdown["modifiers"]["cross_source_count"] = boost
        
        # Market cap bucket modifier
        if market_cap_bucket:
            if market_cap_bucket.lower() == "smid":
                boost = modifiers.get('smid_cap', 10)
                relevance_score += boost
                breakdown["modifiers"]["smid_cap"] = boost
            elif market_cap_bucket.lower() == "large":
                penalty = modifiers.get('large_cap_discount', -15)
                relevance_score += penalty
                breakdown["modifiers"]["large_cap_discount"] = penalty
            elif market_cap_bucket.lower() == "mega":
                penalty = modifiers.get('mega_cap_discount', -20)
                # Exception: megadeals don't get full penalty
                if primary_catalyst == "M_A":
                    penalty = penalty / 2
                relevance_score += penalty
                breakdown["modifiers"]["mega_cap_discount"] = penalty
        
        # Infer market cap from entities if not provided
        if not market_cap_bucket and entities:
            # Simple heuristic: if any company entity has a known ticker, 
            # assume SMID unless it's a well-known large cap
            large_cap_tickers = {
                "PFE", "JNJ", "MRK", "ABBV", "BMY", "GILD", "AMGN",
                "LLY", "NVO", "RHHBY", "AZN", "NVS", "SNY", "GSK", "TAK"
            }
            
            for entity in entities:
                if entity.get('kind') == 'company' and entity.get('ticker'):
                    ticker = entity['ticker'].upper()
                    if ticker not in large_cap_tickers:
                        # Assume SMID
                        boost = modifiers.get('smid_cap', 10)
                        relevance_score += boost
                        breakdown["modifiers"]["assumed_smid"] = boost
                        break
        
        # Cap at 100
        relevance_score = min(100, relevance_score)
        
        # Map to importance bands
        bands = self.scoring_rules.get('importance_bands', {
            'critical': 85,
            'high': 70,
            'medium': 40,
            'low': 0
        })
        
        if relevance_score >= bands['critical']:
            importance = "Critical"
        elif relevance_score >= bands['high']:
            importance = "High"
        elif relevance_score >= bands['medium']:
            importance = "Medium"
        else:
            importance = "Low"
        
        return {
            "importance": importance,
            "relevance_score": int(relevance_score),
            "catalyst_detected": primary_catalyst,
            "catalyst_tags": catalyst_tags,
            "ta_tags": ta_tags,
            "scoring_breakdown": breakdown
        }
    
    def get_catalyst_name(self, catalyst_key: str) -> Optional[str]:
        """Get human-readable catalyst name"""
        catalyst = self.catalyst_keywords.get(catalyst_key)
        return catalyst["name"] if catalyst else None
    
    def get_ta_name(self, ta_key: str) -> Optional[str]:
        """Get human-readable TA name"""
        ta = self.ta_keywords.get(ta_key)
        return ta["name"] if ta else None
