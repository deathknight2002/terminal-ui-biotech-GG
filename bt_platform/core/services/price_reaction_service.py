"""
Price Reaction Service - Event study for price reactions
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select

from ..database import ArticleReaction, Entity, Article
import logging

logger = logging.getLogger(__name__)


class PriceReactionService:
    """
    Calculate price reactions for article events
    Event study methodology vs XBI or custom benchmark
    """
    
    def __init__(self, db: Session):
        self.db = db
        
    def calculate_reaction(
        self,
        article_id: int,
        entity_id: int,
        event_time: datetime,
        window: str,
        benchmark_ticker: str = "XBI"
    ) -> Optional[Dict[str, Any]]:
        """
        Calculate price reaction for an article/entity pair
        
        Args:
            article_id: Article ID
            entity_id: Entity (ticker) ID
            event_time: Event timestamp
            window: Time window, e.g., '[-1d,+1d]', '[0,+60m]'
            benchmark_ticker: Benchmark ticker (default XBI)
            
        Returns:
            Dict with raw_return, abnormal_return, p_value
        """
        # Parse window
        window_start, window_end = self._parse_window(event_time, window)
        
        # Get entity
        entity = self.db.execute(
            select(Entity).where(Entity.id == entity_id)
        ).scalar_one_or_none()
        
        if not entity or not entity.ticker:
            logger.warning(f"Entity {entity_id} not found or has no ticker")
            return None
        
        # Get benchmark entity
        benchmark_entity = self.db.execute(
            select(Entity).where(Entity.ticker == benchmark_ticker, Entity.kind == "etf")
        ).scalar_one_or_none()
        
        if not benchmark_entity:
            logger.warning(f"Benchmark {benchmark_ticker} not found, creating...")
            benchmark_entity = Entity(
                kind="etf",
                name=f"{benchmark_ticker} ETF",
                ticker=benchmark_ticker
            )
            self.db.add(benchmark_entity)
            self.db.commit()
        
        # Fetch price data (placeholder - actual implementation would call market data API)
        raw_return = self._fetch_price_return(entity.ticker, window_start, window_end)
        benchmark_return = self._fetch_price_return(benchmark_ticker, window_start, window_end)
        
        if raw_return is None or benchmark_return is None:
            logger.warning(f"Could not fetch price data for {entity.ticker} or {benchmark_ticker}")
            return None
        
        # Calculate abnormal return
        abnormal_return = raw_return - benchmark_return
        
        # Optional: Calculate p-value (simplified - would need historical volatility)
        p_value = self._calculate_p_value(abnormal_return, entity.ticker)
        
        # Save to database
        reaction = ArticleReaction(
            article_id=article_id,
            entity_id=entity_id,
            event_time=event_time,
            window=window,
            raw_return=raw_return,
            benchmark_entity_id=benchmark_entity.id,
            abnormal_return=abnormal_return,
            p_value=p_value
        )
        
        self.db.add(reaction)
        self.db.commit()
        
        return {
            "raw_return": raw_return,
            "benchmark_return": benchmark_return,
            "abnormal_return": abnormal_return,
            "p_value": p_value,
            "window": window,
            "entity_ticker": entity.ticker,
            "benchmark_ticker": benchmark_ticker
        }
    
    def calculate_multiple_reactions(
        self,
        article_id: int,
        entity_ids: List[int],
        event_time: datetime,
        windows: List[str] = ["[-1d,+1d]", "[0,+60m]"]
    ) -> List[Dict[str, Any]]:
        """
        Calculate reactions for multiple entities and windows
        """
        reactions = []
        
        for entity_id in entity_ids:
            for window in windows:
                reaction = self.calculate_reaction(
                    article_id,
                    entity_id,
                    event_time,
                    window
                )
                if reaction:
                    reactions.append(reaction)
        
        return reactions
    
    def get_reactions(self, article_id: int) -> List[Dict[str, Any]]:
        """
        Get all price reactions for an article
        """
        reactions = self.db.execute(
            select(ArticleReaction).where(ArticleReaction.article_id == article_id)
        ).scalars().all()
        
        result = []
        for reaction in reactions:
            entity = self.db.execute(
                select(Entity).where(Entity.id == reaction.entity_id)
            ).scalar_one_or_none()
            
            benchmark = None
            if reaction.benchmark_entity_id:
                benchmark = self.db.execute(
                    select(Entity).where(Entity.id == reaction.benchmark_entity_id)
                ).scalar_one_or_none()
            
            result.append({
                "id": reaction.id,
                "entity_ticker": entity.ticker if entity else None,
                "entity_name": entity.name if entity else None,
                "window": reaction.window,
                "raw_return": reaction.raw_return,
                "abnormal_return": reaction.abnormal_return,
                "benchmark_ticker": benchmark.ticker if benchmark else None,
                "p_value": reaction.p_value,
                "event_time": reaction.event_time.isoformat() if reaction.event_time else None
            })
        
        return result
    
    def _parse_window(self, event_time: datetime, window: str) -> tuple:
        """
        Parse window string to start/end timestamps
        Examples: '[-1d,+1d]', '[0,+60m]', '[-5d,+5d]'
        """
        # Remove brackets
        window = window.strip('[]')
        parts = window.split(',')
        
        if len(parts) != 2:
            raise ValueError(f"Invalid window format: {window}")
        
        start_offset = self._parse_offset(parts[0].strip())
        end_offset = self._parse_offset(parts[1].strip())
        
        window_start = event_time + start_offset
        window_end = event_time + end_offset
        
        return window_start, window_end
    
    def _parse_offset(self, offset_str: str) -> timedelta:
        """
        Parse offset string like '-1d', '+60m', '+5d'
        """
        # Remove leading +
        offset_str = offset_str.lstrip('+')
        
        # Extract number and unit
        import re
        match = re.match(r'(-?\d+)([dhm])', offset_str)
        if not match:
            raise ValueError(f"Invalid offset format: {offset_str}")
        
        value = int(match.group(1))
        unit = match.group(2)
        
        if unit == 'd':
            return timedelta(days=value)
        elif unit == 'h':
            return timedelta(hours=value)
        elif unit == 'm':
            return timedelta(minutes=value)
        else:
            raise ValueError(f"Unknown time unit: {unit}")
    
    def _fetch_price_return(self, ticker: str, start: datetime, end: datetime) -> Optional[float]:
        """
        Fetch price return for ticker over time period
        
        This is a placeholder - actual implementation would:
        1. Call market data API (OpenBB, Yahoo Finance, etc.)
        2. Get price at start and end
        3. Calculate return: (end_price - start_price) / start_price
        
        For now, returns mock data
        """
        # Mock implementation - returns random-ish data based on ticker
        # In production, replace with actual market data API call
        import hashlib
        hash_val = int(hashlib.md5(f"{ticker}{start}{end}".encode()).hexdigest(), 16)
        mock_return = ((hash_val % 2000) - 1000) / 10000.0  # -10% to +10%
        
        logger.debug(f"Mock price return for {ticker}: {mock_return:.4f}")
        return mock_return
    
    def _calculate_p_value(self, abnormal_return: float, ticker: str) -> Optional[float]:
        """
        Calculate p-value for abnormal return
        
        This is a placeholder - actual implementation would:
        1. Fetch historical volatility
        2. Calculate t-statistic
        3. Compute p-value
        
        For now, returns mock data
        """
        # Mock implementation
        # In production, would calculate based on historical volatility
        if abs(abnormal_return) > 0.05:  # >5% move
            return 0.01  # Highly significant
        elif abs(abnormal_return) > 0.02:  # >2% move
            return 0.05  # Significant
        else:
            return 0.15  # Not significant
    
    def recompute_reaction(
        self,
        article_id: int,
        entity_id: int,
        window: str,
        benchmark_ticker: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Recompute existing reaction with different parameters
        """
        # Get article to get event time
        article = self.db.execute(
            select(Article).where(Article.id == article_id)
        ).scalar_one_or_none()
        
        if not article:
            return None
        
        event_time = article.published_at
        
        # Delete existing reaction if it exists
        existing = self.db.execute(
            select(ArticleReaction).where(
                ArticleReaction.article_id == article_id,
                ArticleReaction.entity_id == entity_id,
                ArticleReaction.window == window
            )
        ).scalar_one_or_none()
        
        if existing:
            self.db.delete(existing)
            self.db.commit()
        
        # Recalculate
        return self.calculate_reaction(
            article_id,
            entity_id,
            event_time,
            window,
            benchmark_ticker or "XBI"
        )
