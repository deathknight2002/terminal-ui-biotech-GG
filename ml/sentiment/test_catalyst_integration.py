"""
Tests for Catalyst Sentiment Integration
=========================================
"""

import pytest
from ml.sentiment.catalyst_integration import (
    CatalystSentimentScorer,
    create_catalyst_sentiment_scorer
)


class MockSentimentModel:
    """Mock sentiment model for testing."""
    
    def predict(self, texts):
        # Simple rule: if "positive" or "approve" in text -> 1, if "fail" or "negative" -> -1, else 0
        results = []
        for text in texts:
            text_lower = text.lower()
            if "positive" in text_lower or "approve" in text_lower:
                results.append(1)
            elif "fail" in text_lower or "negative" in text_lower:
                results.append(-1)
            else:
                results.append(0)
        return results
    
    def predict_proba(self, texts):
        results = []
        for text in texts:
            pred = self.predict([text])[0]
            if pred == 1:
                results.append({1: 0.8, 0: 0.15, -1: 0.05})
            elif pred == -1:
                results.append({-1: 0.8, 0: 0.15, 1: 0.05})
            else:
                results.append({0: 0.7, 1: 0.15, -1: 0.15})
        return results


def test_catalyst_sentiment_scorer_initialization():
    """Test scorer initialization."""
    model = MockSentimentModel()
    scorer = CatalystSentimentScorer(sentiment_model=model)
    
    assert scorer.sentiment_model == model
    assert scorer.sentiment_weight == 0.15


def test_extract_catalyst_text():
    """Test extracting text from catalyst."""
    model = MockSentimentModel()
    scorer = CatalystSentimentScorer(sentiment_model=model)
    
    catalyst = {
        'title': 'FDA Approval Decision',
        'description': 'Positive phase 3 results',
        'event_type': 'Regulatory',
        'drug': 'Drug-X',
        'indication': 'Oncology'
    }
    
    text = scorer.extract_catalyst_text(catalyst)
    
    assert 'FDA Approval Decision' in text
    assert 'Positive phase 3 results' in text
    assert 'Drug-X' in text


def test_score_catalyst_sentiment_positive():
    """Test scoring positive catalyst sentiment."""
    model = MockSentimentModel()
    scorer = CatalystSentimentScorer(sentiment_model=model)
    
    catalyst = {
        'title': 'FDA approves breakthrough therapy',
        'description': 'Positive clinical results'
    }
    
    result = scorer.score_catalyst_sentiment(catalyst)
    
    assert result['sentiment'] == 1
    assert result['sentiment_label'] == 'bullish'
    assert result['sentiment_confidence'] > 0


def test_score_catalyst_sentiment_negative():
    """Test scoring negative catalyst sentiment."""
    model = MockSentimentModel()
    scorer = CatalystSentimentScorer(sentiment_model=model)
    
    catalyst = {
        'title': 'Clinical trial fails endpoint',
        'description': 'Negative results reported'
    }
    
    result = scorer.score_catalyst_sentiment(catalyst)
    
    assert result['sentiment'] == -1
    assert result['sentiment_label'] == 'bearish'
    assert result['sentiment_confidence'] > 0


def test_enhance_catalyst_score():
    """Test enhancing catalyst with sentiment."""
    model = MockSentimentModel()
    scorer = CatalystSentimentScorer(sentiment_model=model)
    
    catalyst = {
        'title': 'FDA approves new drug',
        'event_leverage': 4,
        'timing_clarity': 3,
        'surprise_factor': 2,
        'downside_contained': 3,
        'market_depth': 3,
        'tier': 'High-Torque'
    }
    
    enhanced = scorer.enhance_catalyst_score(catalyst)
    
    assert 'sentiment' in enhanced
    assert 'sentiment_score' in enhanced
    assert 'enhanced_total_score' in enhanced
    assert 'enhanced_tier' in enhanced
    assert enhanced['original_total_score'] == 15  # Sum of scores
    assert enhanced['enhanced_total_score'] > enhanced['original_total_score']


def test_batch_score_catalysts():
    """Test batch scoring multiple catalysts."""
    model = MockSentimentModel()
    scorer = CatalystSentimentScorer(sentiment_model=model)
    
    catalysts = [
        {
            'title': 'FDA approves drug',
            'event_leverage': 4,
            'timing_clarity': 3,
            'surprise_factor': 2,
            'downside_contained': 2,
            'market_depth': 2
        },
        {
            'title': 'Trial fails endpoint',
            'event_leverage': 3,
            'timing_clarity': 2,
            'surprise_factor': 1,
            'downside_contained': 1,
            'market_depth': 2
        },
        {
            'title': 'Company reports earnings',
            'event_leverage': 2,
            'timing_clarity': 3,
            'surprise_factor': 1,
            'downside_contained': 2,
            'market_depth': 2
        }
    ]
    
    enhanced = scorer.batch_score_catalysts(catalysts)
    
    assert len(enhanced) == 3
    assert all('sentiment' in c for c in enhanced)
    assert enhanced[0]['sentiment'] == 1  # Positive
    assert enhanced[1]['sentiment'] == -1  # Negative
    assert enhanced[2]['sentiment'] == 0  # Neutral


def test_filter_by_sentiment():
    """Test filtering catalysts by sentiment."""
    model = MockSentimentModel()
    scorer = CatalystSentimentScorer(sentiment_model=model)
    
    catalysts = [
        {'title': 'FDA approves', 'sentiment': 1, 'sentiment_confidence': 0.8},
        {'title': 'Trial fails', 'sentiment': -1, 'sentiment_confidence': 0.9},
        {'title': 'Earnings', 'sentiment': 0, 'sentiment_confidence': 0.5}
    ]
    
    # Filter for bullish
    bullish = scorer.filter_by_sentiment(catalysts, sentiment=1)
    assert len(bullish) == 1
    assert bullish[0]['sentiment'] == 1
    
    # Filter for bearish
    bearish = scorer.filter_by_sentiment(catalysts, sentiment=-1)
    assert len(bearish) == 1
    assert bearish[0]['sentiment'] == -1
    
    # Filter by confidence
    high_conf = scorer.filter_by_sentiment(catalysts, min_confidence=0.8)
    assert len(high_conf) == 2


def test_get_sentiment_statistics():
    """Test getting sentiment statistics."""
    model = MockSentimentModel()
    scorer = CatalystSentimentScorer(sentiment_model=model)
    
    catalysts = [
        {'sentiment': 1, 'sentiment_confidence': 0.8, 'sentiment_score': 2.5},
        {'sentiment': 1, 'sentiment_confidence': 0.9, 'sentiment_score': 2.8},
        {'sentiment': -1, 'sentiment_confidence': 0.85, 'sentiment_score': 0.5},
        {'sentiment': 0, 'sentiment_confidence': 0.6, 'sentiment_score': 1.5}
    ]
    
    stats = scorer.get_sentiment_statistics(catalysts)
    
    assert stats['total'] == 4
    assert stats['bullish'] == 2
    assert stats['bearish'] == 1
    assert stats['neutral'] == 1
    assert stats['bullish_pct'] == 50.0
    assert 'avg_confidence' in stats
    assert 'avg_sentiment_score' in stats


def test_factory_function_tfidf():
    """Test factory function with TF-IDF model."""
    scorer = create_catalyst_sentiment_scorer(model_type="tfidf")
    assert isinstance(scorer, CatalystSentimentScorer)


def test_factory_function_invalid_type():
    """Test factory function with invalid model type."""
    with pytest.raises(ValueError, match="Unknown model type"):
        create_catalyst_sentiment_scorer(model_type="invalid")
