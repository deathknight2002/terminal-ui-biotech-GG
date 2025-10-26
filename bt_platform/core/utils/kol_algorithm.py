"""
KOL Ranking Algorithm
Proprietary algorithm to rank assets, programs, and companies based on KOL signals
"""

from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
import logging

from ..database import KOLSignal, KOLProfile, KOLScore, Catalyst, Company

logger = logging.getLogger(__name__)


class KOLRankingAlgorithm:
    """
    Proprietary KOL-based ranking system for biotech assets

    Algorithm combines:
    1. Signal sentiment (bullish/bearish)
    2. KOL credibility weighting
    3. Signal quality scores
    4. Recency decay
    5. Catalyst correlation
    """

    def __init__(self, db: Session):
        self.db = db

        # Algorithm parameters (tunable)
        self.RECENCY_DECAY_DAYS = 30  # Half-life for signal importance
        self.MIN_SIGNAL_COUNT = 3  # Minimum signals for confident score
        self.TOP_KOL_CREDIBILITY_THRESHOLD = 0.7
        self.CATALYST_BOOST_FACTOR = 1.5  # Boost for catalyst-linked signals

    def calculate_entity_scores(
        self,
        entity_type: str = "company",
        lookback_days: int = 30
    ) -> List[Dict]:
        """
        Calculate KOL scores for all entities (companies, drugs, or catalysts)

        Returns list of scored entities, sorted by weighted sentiment
        """
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)

        # Get all signals in time window
        signals = self.db.query(KOLSignal).filter(
            KOLSignal.signal_date >= cutoff_date
        ).all()

        # Group signals by entity
        entity_signals = {}

        for signal in signals:
            entity_id = self._get_entity_id(signal, entity_type)
            if not entity_id:
                continue

            if entity_id not in entity_signals:
                entity_signals[entity_id] = []

            entity_signals[entity_id].append(signal)

        # Calculate scores for each entity
        scored_entities = []

        for entity_id, entity_signal_list in entity_signals.items():
            if len(entity_signal_list) < self.MIN_SIGNAL_COUNT:
                continue  # Skip entities with too few signals

            score = self._calculate_entity_score(entity_id, entity_signal_list, entity_type)
            scored_entities.append(score)

        # Sort by weighted sentiment (most bullish first)
        scored_entities.sort(key=lambda x: x['weighted_sentiment'], reverse=True)

        return scored_entities

    def _get_entity_id(self, signal: KOLSignal, entity_type: str) -> str:
        """Extract entity ID from signal based on entity type"""
        if entity_type == "company":
            return signal.company_ticker
        elif entity_type == "drug":
            return signal.drug_name
        elif entity_type == "catalyst":
            return str(signal.catalyst_id) if signal.catalyst_id else None
        return None

    def _calculate_entity_score(
        self,
        entity_id: str,
        signals: List[KOLSignal],
        entity_type: str
    ) -> Dict:
        """
        Calculate comprehensive score for a single entity
        """

        # Initialize aggregators
        weighted_sentiment_sum = 0.0
        total_weight = 0.0

        bullish_count = 0
        bearish_count = 0
        neutral_count = 0

        top_kol_count = 0
        avg_quality = 0.0
        avg_impact = 0.0

        # Process each signal
        for signal in signals:
            # Get KOL credibility (if available)
            kol_credibility = 1.0
            if signal.kol_profile_id:
                kol_profile = self.db.query(KOLProfile).filter(
                    KOLProfile.id == signal.kol_profile_id
                ).first()
                if kol_profile:
                    kol_credibility = kol_profile.credibility_score
                    if kol_credibility >= self.TOP_KOL_CREDIBILITY_THRESHOLD:
                        top_kol_count += 1

            # Calculate signal weight
            weight = self._calculate_signal_weight(signal, kol_credibility)

            # Aggregate sentiment
            if signal.signal_sentiment:
                weighted_sentiment_sum += signal.signal_sentiment * weight
                total_weight += weight

                # Count signal types
                if signal.signal_sentiment > 0.2:
                    bullish_count += 1
                elif signal.signal_sentiment < -0.2:
                    bearish_count += 1
                else:
                    neutral_count += 1

            # Aggregate quality and impact
            if signal.quality_score:
                avg_quality += signal.quality_score
            if signal.impact_score:
                avg_impact += signal.impact_score

        # Calculate final scores
        signal_count = len(signals)
        weighted_sentiment = weighted_sentiment_sum / total_weight if total_weight > 0 else 0.0
        avg_quality = avg_quality / signal_count if signal_count > 0 else 0.0
        avg_impact = avg_impact / signal_count if signal_count > 0 else 0.0

        # Calculate confidence score (based on signal count, quality, and KOL diversity)
        confidence = self._calculate_confidence(
            signal_count,
            top_kol_count,
            avg_quality
        )

        # Check for catalyst correlation
        catalyst_boost = self._check_catalyst_correlation(entity_id, entity_type)
        if catalyst_boost:
            weighted_sentiment *= self.CATALYST_BOOST_FACTOR

        # Get entity name
        entity_name = self._get_entity_name(entity_id, entity_type)

        return {
            'entity_type': entity_type,
            'entity_id': entity_id,
            'entity_name': entity_name,
            'weighted_sentiment': weighted_sentiment,
            'aggregate_sentiment': weighted_sentiment,  # Alias
            'confidence_score': confidence,
            'signal_count': signal_count,
            'bullish_count': bullish_count,
            'bearish_count': bearish_count,
            'neutral_count': neutral_count,
            'top_kol_count': top_kol_count,
            'avg_quality_score': avg_quality,
            'avg_impact_score': avg_impact,
            'has_catalyst_correlation': catalyst_boost,
            'score_date': datetime.utcnow()
        }

    def _calculate_signal_weight(
        self,
        signal: KOLSignal,
        kol_credibility: float
    ) -> float:
        """
        Calculate weight for a signal based on:
        - KOL credibility
        - Signal quality
        - Recency
        - Impact score
        """

        # Base weight from credibility
        weight = kol_credibility

        # Adjust by signal quality
        if signal.quality_score:
            weight *= signal.quality_score

        # Adjust by impact score
        if signal.impact_score:
            weight *= (1.0 + signal.impact_score)

        # Apply recency decay (exponential)
        days_old = (datetime.utcnow() - signal.signal_date).days
        recency_factor = 0.5 ** (days_old / self.RECENCY_DECAY_DAYS)
        weight *= recency_factor

        return weight

    def _calculate_confidence(
        self,
        signal_count: int,
        top_kol_count: int,
        avg_quality: float
    ) -> float:
        """
        Calculate confidence score for the ranking (0-1)
        """

        # Signal count component (0-0.4)
        count_score = min(signal_count / 20.0, 1.0) * 0.4

        # Top KOL component (0-0.3)
        kol_score = min(top_kol_count / 5.0, 1.0) * 0.3

        # Quality component (0-0.3)
        quality_score = avg_quality * 0.3

        confidence = count_score + kol_score + quality_score
        return min(confidence, 1.0)

    def _check_catalyst_correlation(
        self,
        entity_id: str,
        entity_type: str
    ) -> bool:
        """
        Check if entity has upcoming catalysts (for boost)
        """
        if entity_type != "company":
            return False

        # Check for upcoming catalysts in next 90 days
        cutoff_date = datetime.utcnow() + timedelta(days=90)

        catalyst = self.db.query(Catalyst).filter(
            and_(
                Catalyst.company == entity_id,
                Catalyst.event_date <= cutoff_date,
                Catalyst.status == "Upcoming"
            )
        ).first()

        return catalyst is not None

    def _get_entity_name(self, entity_id: str, entity_type: str) -> str:
        """Get human-readable name for entity"""
        if entity_type == "company":
            company = self.db.query(Company).filter(
                Company.ticker == entity_id
            ).first()
            return company.name if company else entity_id

        return entity_id

    def persist_scores(self, scores: List[Dict]):
        """
        Save calculated scores to database
        """
        for score_data in scores:
            # Check if score already exists for today
            existing = self.db.query(KOLScore).filter(
                and_(
                    KOLScore.entity_type == score_data['entity_type'],
                    KOLScore.entity_id == score_data['entity_id'],
                    KOLScore.score_date >= datetime.utcnow().date()
                )
            ).first()

            if existing:
                # Update existing
                for key, value in score_data.items():
                    if hasattr(existing, key):
                        setattr(existing, key, value)
            else:
                # Create new
                kol_score = KOLScore(**score_data)
                self.db.add(kol_score)

        self.db.commit()
        logger.info(f"Persisted {len(scores)} KOL scores to database")
