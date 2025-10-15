"""
Catalyst Sentiment Integration
================================

Integrates sentiment analysis with catalyst scoring system.
Extracts sentiment from catalyst-related text and adds it as
a scoring dimension.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class CatalystSentimentScorer:
    """
    Integrates sentiment analysis with catalyst scoring.
    
    Adds sentiment dimension to existing catalyst scoring:
    - Extract sentiment from catalyst title, description, and related news
    - Weight sentiment by recency and source quality
    - Incorporate into overall catalyst score
    """
    
    def __init__(self, sentiment_model=None, sentiment_weight: float = 0.15):
        """
        Initialize catalyst sentiment scorer.
        
        Args:
            sentiment_model: Sentiment analyzer instance (default: uses TF-IDF)
            sentiment_weight: Weight of sentiment in overall score (0-1)
        """
        self.sentiment_model = sentiment_model
        self.sentiment_weight = sentiment_weight
        
        if self.sentiment_model is None:
            # Default to TF-IDF model
            from ml.sentiment.trainer import SentimentTrainer
            self.sentiment_model = SentimentTrainer()
            logger.info("Using default TF-IDF sentiment model")
    
    def extract_catalyst_text(self, catalyst: Dict[str, Any]) -> str:
        """
        Extract text from catalyst for sentiment analysis.
        
        Args:
            catalyst: Catalyst dictionary with title, description, etc.
            
        Returns:
            Combined text for sentiment analysis
        """
        text_parts = []
        
        # Add title (highest weight)
        if catalyst.get('title'):
            text_parts.append(catalyst['title'])
            text_parts.append(catalyst['title'])  # Double weight
        
        # Add description
        if catalyst.get('description'):
            text_parts.append(catalyst['description'])
        
        # Add event type context
        if catalyst.get('event_type'):
            text_parts.append(f"Event type: {catalyst['event_type']}")
        
        # Add drug/indication context
        if catalyst.get('drug'):
            text_parts.append(f"Drug: {catalyst['drug']}")
        if catalyst.get('indication'):
            text_parts.append(f"Indication: {catalyst['indication']}")
        
        return " ".join(text_parts)
    
    def score_catalyst_sentiment(self, catalyst: Dict[str, Any]) -> Dict[str, Any]:
        """
        Score sentiment for a single catalyst.
        
        Args:
            catalyst: Catalyst dictionary
            
        Returns:
            Dictionary with sentiment scores
        """
        text = self.extract_catalyst_text(catalyst)
        
        if not text.strip():
            return {
                'sentiment': 0,
                'sentiment_confidence': 0.0,
                'sentiment_probabilities': {-1: 0.33, 0: 0.34, 1: 0.33},
                'sentiment_label': 'neutral'
            }
        
        # Get sentiment prediction
        try:
            prediction = self.sentiment_model.predict([text])[0]
            probabilities = self.sentiment_model.predict_proba([text])[0]
            confidence = max(probabilities.values())
            
            sentiment_label = 'bullish' if prediction == 1 else ('bearish' if prediction == -1 else 'neutral')
            
            return {
                'sentiment': prediction,
                'sentiment_confidence': confidence,
                'sentiment_probabilities': probabilities,
                'sentiment_label': sentiment_label
            }
        except Exception as e:
            logger.error(f"Error scoring sentiment for catalyst: {e}")
            return {
                'sentiment': 0,
                'sentiment_confidence': 0.0,
                'sentiment_probabilities': {-1: 0.33, 0: 0.34, 1: 0.33},
                'sentiment_label': 'neutral',
                'error': str(e)
            }
    
    def enhance_catalyst_score(self, catalyst: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhance existing catalyst score with sentiment.
        
        Args:
            catalyst: Catalyst dictionary with existing scores
            
        Returns:
            Enhanced catalyst with sentiment scores
        """
        # Calculate sentiment scores
        sentiment_scores = self.score_catalyst_sentiment(catalyst)
        
        # Calculate existing total score (0-16 scale)
        existing_score = (
            catalyst.get('event_leverage', 0) +
            catalyst.get('timing_clarity', 0) +
            catalyst.get('surprise_factor', 0) +
            catalyst.get('downside_contained', 0) +
            catalyst.get('market_depth', 0)
        )
        
        # Convert sentiment to 0-3 scale for consistency
        sentiment = sentiment_scores['sentiment']
        confidence = sentiment_scores['sentiment_confidence']
        
        if sentiment == 1:  # Bullish
            sentiment_score = 1.5 + (confidence * 1.5)  # 1.5 to 3.0
        elif sentiment == -1:  # Bearish
            sentiment_score = max(0, 1.5 - (confidence * 1.5))  # 0 to 1.5
        else:  # Neutral
            sentiment_score = 1.5  # Middle value
        
        # Calculate enhanced total score (0-19 scale now)
        enhanced_total = existing_score + sentiment_score
        
        # Update tier based on enhanced score
        if enhanced_total > 10:
            tier = 'High-Torque'
        elif enhanced_total >= 8:
            tier = 'Tradable'
        else:
            tier = 'Watch'
        
        # Add sentiment fields to catalyst
        enhanced_catalyst = catalyst.copy()
        enhanced_catalyst.update({
            'sentiment': sentiment_scores['sentiment'],
            'sentiment_confidence': sentiment_scores['sentiment_confidence'],
            'sentiment_probabilities': sentiment_scores['sentiment_probabilities'],
            'sentiment_label': sentiment_scores['sentiment_label'],
            'sentiment_score': round(sentiment_score, 2),
            'enhanced_total_score': round(enhanced_total, 2),
            'enhanced_tier': tier,
            'original_total_score': existing_score,
            'original_tier': catalyst.get('tier', 'Watch')
        })
        
        return enhanced_catalyst
    
    def batch_score_catalysts(self, catalysts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Score sentiment for multiple catalysts efficiently.
        
        Args:
            catalysts: List of catalyst dictionaries
            
        Returns:
            List of enhanced catalysts with sentiment scores
        """
        if not catalysts:
            return []
        
        # Extract all texts
        texts = [self.extract_catalyst_text(c) for c in catalysts]
        
        # Batch predict
        try:
            predictions = self.sentiment_model.predict(texts)
            probabilities = self.sentiment_model.predict_proba(texts)
            
            # Enhance each catalyst
            enhanced_catalysts = []
            for catalyst, pred, probs in zip(catalysts, predictions, probabilities):
                sentiment_label = 'bullish' if pred == 1 else ('bearish' if pred == -1 else 'neutral')
                confidence = max(probs.values())
                
                # Add sentiment to catalyst
                temp_catalyst = catalyst.copy()
                temp_catalyst.update({
                    'sentiment': pred,
                    'sentiment_confidence': confidence,
                    'sentiment_probabilities': probs,
                    'sentiment_label': sentiment_label
                })
                
                # Enhance score
                enhanced = self.enhance_catalyst_score(temp_catalyst)
                enhanced_catalysts.append(enhanced)
            
            return enhanced_catalysts
            
        except Exception as e:
            logger.error(f"Error in batch scoring: {e}")
            # Fallback to individual scoring
            return [self.enhance_catalyst_score(c) for c in catalysts]
    
    def filter_by_sentiment(
        self,
        catalysts: List[Dict[str, Any]],
        sentiment: Optional[int] = None,
        min_confidence: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Filter catalysts by sentiment criteria.
        
        Args:
            catalysts: List of catalysts with sentiment scores
            sentiment: Filter by sentiment (-1, 0, 1) or None for all
            min_confidence: Minimum sentiment confidence (0-1)
            
        Returns:
            Filtered list of catalysts
        """
        filtered = catalysts
        
        if sentiment is not None:
            filtered = [c for c in filtered if c.get('sentiment') == sentiment]
        
        if min_confidence > 0:
            filtered = [c for c in filtered if c.get('sentiment_confidence', 0) >= min_confidence]
        
        return filtered
    
    def get_sentiment_statistics(self, catalysts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get sentiment statistics for a list of catalysts.
        
        Args:
            catalysts: List of catalysts with sentiment scores
            
        Returns:
            Dictionary with sentiment statistics
        """
        if not catalysts:
            return {
                'total': 0,
                'bullish': 0,
                'bearish': 0,
                'neutral': 0,
                'avg_confidence': 0.0,
                'avg_sentiment_score': 0.0
            }
        
        sentiments = [c.get('sentiment', 0) for c in catalysts]
        confidences = [c.get('sentiment_confidence', 0) for c in catalysts]
        sentiment_scores = [c.get('sentiment_score', 0) for c in catalysts]
        
        return {
            'total': len(catalysts),
            'bullish': sum(1 for s in sentiments if s == 1),
            'bearish': sum(1 for s in sentiments if s == -1),
            'neutral': sum(1 for s in sentiments if s == 0),
            'bullish_pct': sum(1 for s in sentiments if s == 1) / len(catalysts) * 100,
            'bearish_pct': sum(1 for s in sentiments if s == -1) / len(catalysts) * 100,
            'neutral_pct': sum(1 for s in sentiments if s == 0) / len(catalysts) * 100,
            'avg_confidence': sum(confidences) / len(confidences) if confidences else 0,
            'avg_sentiment_score': sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0,
            'min_confidence': min(confidences) if confidences else 0,
            'max_confidence': max(confidences) if confidences else 0
        }


def create_catalyst_sentiment_scorer(model_type: str = "tfidf", **kwargs) -> CatalystSentimentScorer:
    """
    Factory function to create catalyst sentiment scorer.
    
    Args:
        model_type: 'tfidf', 'finbert', 'biobert', or 'ensemble'
        **kwargs: Additional arguments for the sentiment model
        
    Returns:
        CatalystSentimentScorer instance
    """
    if model_type == "tfidf":
        from ml.sentiment.trainer import SentimentTrainer
        model = SentimentTrainer(**kwargs)
    elif model_type == "finbert":
        from ml.sentiment.finbert_analyzer import FinBERTAnalyzer
        model = FinBERTAnalyzer(**kwargs)
    elif model_type == "biobert":
        from ml.sentiment.biobert_analyzer import BioBERTAnalyzer
        model = BioBERTAnalyzer(**kwargs)
    elif model_type == "ensemble":
        from ml.sentiment.ensemble_analyzer import create_default_ensemble
        model = create_default_ensemble()
    else:
        raise ValueError(f"Unknown model type: {model_type}")
    
    return CatalystSentimentScorer(sentiment_model=model)


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Sample catalyst
    catalyst = {
        'id': 1,
        'title': 'FDA PDUFA date for breakthrough oncology therapy',
        'description': 'Positive phase 3 data with statistically significant improvement in overall survival',
        'company': 'BioTech Inc',
        'drug': 'BIO-123',
        'indication': 'Advanced melanoma',
        'event_type': 'FDA Decision',
        'event_leverage': 4,
        'timing_clarity': 3,
        'surprise_factor': 2,
        'downside_contained': 3,
        'market_depth': 3
    }
    
    print("Testing Catalyst Sentiment Integration...")
    scorer = create_catalyst_sentiment_scorer(model_type="tfidf")
    
    enhanced = scorer.enhance_catalyst_score(catalyst)
    
    print(f"\nOriginal Score: {enhanced['original_total_score']} ({enhanced['original_tier']})")
    print(f"Sentiment: {enhanced['sentiment_label']} (confidence: {enhanced['sentiment_confidence']:.3f})")
    print(f"Sentiment Score: {enhanced['sentiment_score']}")
    print(f"Enhanced Score: {enhanced['enhanced_total_score']} ({enhanced['enhanced_tier']})")
