"""
Sentiment Analysis Module
=========================

ML-based sentiment classifier for biotech news, press releases, and SEC filings.
"""

from ml.sentiment.trainer import SentimentTrainer
from ml.sentiment.finbert_analyzer import FinBERTAnalyzer
from ml.sentiment.biobert_analyzer import BioBERTAnalyzer
from ml.sentiment.ensemble_analyzer import EnsembleSentimentAnalyzer, create_default_ensemble
from ml.sentiment.catalyst_integration import CatalystSentimentScorer, create_catalyst_sentiment_scorer

__all__ = [
    "SentimentTrainer",
    "FinBERTAnalyzer",
    "BioBERTAnalyzer",
    "EnsembleSentimentAnalyzer",
    "create_default_ensemble",
    "CatalystSentimentScorer",
    "create_catalyst_sentiment_scorer",
]
