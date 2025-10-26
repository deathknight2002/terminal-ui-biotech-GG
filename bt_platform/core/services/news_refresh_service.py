"""
News Refresh Service - Manual refresh pipeline for news aggregation
No background daemons - manual trigger only
"""

import hashlib
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..database import Article, Entity, ArticleEntity
import logging

logger = logging.getLogger(__name__)


class NewsRefreshService:
    """
    Manual news refresh pipeline with deduplication and entity tagging
    """

    # Therapeutic area keyword mapping
    TA_KEYWORDS = {
        "SMA": ["spinal muscular atrophy", "sma", "nusinersen", "risdiplam"],
        "GLP-1": ["glp-1", "glp1", "glucagon-like peptide", "semaglutide", "tirzepatide", "obesity", "diabetes"],
        "Oncology": ["cancer", "oncology", "tumor", "carcinoma", "lymphoma", "leukemia", "melanoma"],
        "Rare Disease": ["rare disease", "orphan drug", "ultra-rare"],
        "Immunology": ["immunology", "immune", "autoimmune", "rheumatoid", "psoriasis"],
        "Neurology": ["neurology", "neurological", "alzheimer", "parkinson", "multiple sclerosis"],
        "Cardiology": ["cardiovascular", "cardiology", "heart", "hypertension"],
        "Respiratory": ["respiratory", "asthma", "copd", "lung"],
    }

    # Catalyst keywords for importance scoring
    CATALYST_KEYWORDS = {
        "Critical": ["fda approval", "pdufa", "adcom", "breakthrough", "fast track", "orphan designation"],
        "High": ["phase 3", "phase iii", "clinical trial", "readout", "data", "merger", "acquisition"],
        "Medium": ["phase 2", "phase ii", "phase 1", "phase i", "partnership", "collaboration"],
        "Low": ["preclinical", "research", "discovery"],
    }

    def __init__(self, db: Session):
        self.db = db

    def canonical_key(self, title: str, url: str) -> str:
        """
        Generate canonical key for deduplication
        Format: domain::normalized_title
        """
        # Extract domain
        parsed = urlparse(url)
        host = parsed.hostname or ""
        host = host.replace("www.", "")

        # Normalize title
        norm = title.lower()
        # Remove special characters except spaces
        norm = re.sub(r'[^a-z0-9 ]', ' ', norm)
        # Collapse multiple spaces
        norm = re.sub(r'\s+', ' ', norm)
        norm = norm.strip()

        return f"{host}::{norm}"

    def detect_therapeutic_areas(self, text: str) -> List[str]:
        """
        Detect therapeutic areas from text using keyword matching
        """
        text_lower = text.lower()
        detected = []

        for ta, keywords in self.TA_KEYWORDS.items():
            if any(keyword in text_lower for keyword in keywords):
                detected.append(ta)

        return detected

    def score_importance(self, text: str) -> str:
        """
        Score article importance based on catalyst keywords
        Returns: Critical, High, Medium, or Low
        """
        text_lower = text.lower()

        for importance, keywords in self.CATALYST_KEYWORDS.items():
            if any(keyword in text_lower for keyword in keywords):
                return importance

        return "Low"

    def deduplicate_articles(self, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Deduplicate articles based on canonical key
        Cluster near-identical items and set cross_source_count
        """
        canonical_map = {}

        for article in articles:
            key = self.canonical_key(article["title"], article["url"])
            article["canonical_key"] = key

            if key not in canonical_map:
                canonical_map[key] = []
            canonical_map[key].append(article)

        # For each cluster, keep first and update cross_source_count
        deduped = []
        for key, cluster in canonical_map.items():
            primary = cluster[0]
            primary["cross_source_count"] = len(cluster)
            deduped.append(primary)

        logger.info(f"Deduplicated {len(articles)} articles to {len(deduped)} unique items")
        return deduped

    def extract_and_tag_entities(self, article: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract entities from article text
        Returns list of entity links with roles
        """
        # This is a simplified implementation
        # In production, you would use NER, ticker dictionaries, etc.
        entities = []

        text = f"{article['title']} {article.get('summary', '')}"
        text_lower = text.lower()

        # Simple ticker extraction (should be replaced with proper NER)
        # Look for patterns like $TICKER or (NASDAQ:TICKER)
        ticker_pattern = r'\$([A-Z]{1,5})\b|\((?:NASDAQ|NYSE):([A-Z]{1,5})\)'
        matches = re.findall(ticker_pattern, text)

        for match in matches:
            ticker = match[0] or match[1]
            if ticker:
                # Check if entity exists
                entity = self.db.execute(
                    select(Entity).where(Entity.ticker == ticker, Entity.kind == 'company')
                ).scalar_one_or_none()

                if entity:
                    entities.append({
                        "entity_id": entity.id,
                        "role": "primary",
                        "confidence": 0.9,
                        "weight": 1.0
                    })

        return entities

    def refresh_from_sources(self, sources: List[Any], max_articles: int = 50) -> Dict[str, Any]:
        """
        Main refresh pipeline:
        1. Fetch from sources
        2. Normalize and dedupe
        3. Tag TAs
        4. Extract entities
        5. Save to database

        Returns statistics about the refresh
        """
        logger.info(f"Starting news refresh from {len(sources)} sources")

        all_articles = []

        # Fetch from all sources (should be implemented with actual scrapers)
        for source in sources:
            try:
                # This is a placeholder - actual implementation would call scraper
                # articles = source.get_latest_news(max_articles)
                # all_articles.extend(articles)
                pass
            except Exception as e:
                logger.error(f"Failed to fetch from source: {e}")

        # For now, work with empty list or provided articles
        if not all_articles:
            logger.warning("No articles fetched from sources")
            return {
                "success": True,
                "total_fetched": 0,
                "unique_articles": 0,
                "new_articles": 0,
                "updated_articles": 0
            }

        # Deduplicate
        unique_articles = self.deduplicate_articles(all_articles)

        new_count = 0
        updated_count = 0

        # Process each article
        for article_data in unique_articles[:max_articles]:
            try:
                # Tag therapeutic areas
                combined_text = f"{article_data['title']} {article_data.get('summary', '')}"
                ta_tags = self.detect_therapeutic_areas(combined_text)
                importance = self.score_importance(combined_text)

                # Check if article exists
                canonical_key = article_data["canonical_key"]
                existing = self.db.execute(
                    select(Article).where(Article.canonical_key == canonical_key)
                ).scalar_one_or_none()

                if existing:
                    # Update existing
                    existing.cross_source_count = article_data["cross_source_count"]
                    existing.ta_tags = ta_tags
                    existing.importance = importance
                    updated_count += 1
                else:
                    # Create new article
                    article = Article(
                        title=article_data["title"],
                        url=article_data["url"],
                        source=article_data.get("source", "unknown"),
                        summary=article_data.get("summary"),
                        fulltext=article_data.get("fulltext"),
                        published_at=article_data.get("published_at", datetime.utcnow()),
                        fetched_at=datetime.utcnow(),
                        canonical_key=canonical_key,
                        ta_tags=ta_tags,
                        importance=importance,
                        relevance_score=article_data.get("relevance_score", 50),
                        cross_source_count=article_data["cross_source_count"],
                        hash=hashlib.sha256(article_data["title"].encode()).hexdigest()
                    )
                    self.db.add(article)
                    self.db.flush()  # Get the ID

                    # Extract and link entities
                    entity_links = self.extract_and_tag_entities(article_data)
                    for link in entity_links:
                        article_entity = ArticleEntity(
                            article_id=article.id,
                            entity_id=link["entity_id"],
                            role=link["role"],
                            confidence=link["confidence"],
                            weight=link["weight"]
                        )
                        self.db.add(article_entity)

                    new_count += 1

            except Exception as e:
                logger.error(f"Failed to process article: {e}")
                continue

        self.db.commit()

        return {
            "success": True,
            "total_fetched": len(all_articles),
            "unique_articles": len(unique_articles),
            "new_articles": new_count,
            "updated_articles": updated_count,
            "timestamp": datetime.utcnow().isoformat()
        }
