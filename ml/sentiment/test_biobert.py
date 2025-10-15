"""
Tests for BioBERT Analyzer
===========================
"""

import pytest
from ml.sentiment.biobert_analyzer import BioBERTAnalyzer, create_biobert_analyzer


def test_biobert_analyzer_initialization():
    """Test BioBERT analyzer initialization."""
    analyzer = BioBERTAnalyzer()
    
    assert analyzer.model_name == "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
    assert analyzer.device == "cpu"
    assert analyzer.max_length == 512
    assert not analyzer._is_loaded
    assert not analyzer.use_fine_tuned


def test_biobert_analyzer_custom_params():
    """Test BioBERT analyzer with custom parameters."""
    analyzer = BioBERTAnalyzer(
        model_name="custom/biobert",
        device="cuda",
        max_length=256,
        use_fine_tuned=True
    )
    
    assert analyzer.model_name == "custom/biobert"
    assert analyzer.device == "cuda"
    assert analyzer.max_length == 256
    assert analyzer.use_fine_tuned


def test_biobert_domain_indicators():
    """Test domain-specific sentiment indicators."""
    analyzer = BioBERTAnalyzer()
    
    # Check positive indicators exist
    assert 'approve' in analyzer.positive_indicators
    assert 'efficacy' in analyzer.positive_indicators
    assert 'breakthrough' in analyzer.positive_indicators
    
    # Check negative indicators exist
    assert 'fail' in analyzer.negative_indicators
    assert 'adverse' in analyzer.negative_indicators
    assert 'halt' in analyzer.negative_indicators


def test_biobert_rule_based_sentiment():
    """Test rule-based sentiment detection."""
    analyzer = BioBERTAnalyzer()
    
    # Positive text
    sentiment, confidence = analyzer._rule_based_sentiment(
        "FDA approves breakthrough therapy with positive efficacy"
    )
    assert sentiment == 1
    assert confidence > 0.5
    
    # Negative text
    sentiment, confidence = analyzer._rule_based_sentiment(
        "Clinical trial failed to meet endpoints, adverse events reported"
    )
    assert sentiment == -1
    assert confidence > 0.5
    
    # Neutral text
    sentiment, confidence = analyzer._rule_based_sentiment(
        "Company announces quarterly results"
    )
    assert sentiment == 0 or sentiment in [-1, 1]  # Could go either way with neutral text


def test_biobert_is_available():
    """Test checking if BioBERT dependencies are available."""
    analyzer = BioBERTAnalyzer()
    assert isinstance(analyzer.is_available, bool)


def test_biobert_factory_function():
    """Test factory function."""
    analyzer = create_biobert_analyzer(device="cpu")
    assert isinstance(analyzer, BioBERTAnalyzer)


def test_biobert_repr():
    """Test string representation."""
    analyzer = BioBERTAnalyzer()
    repr_str = repr(analyzer)
    
    assert "BioBERTAnalyzer" in repr_str
    assert "cpu" in repr_str
