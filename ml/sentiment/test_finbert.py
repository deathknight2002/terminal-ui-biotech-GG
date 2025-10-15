"""
Tests for FinBERT Analyzer
===========================
"""

import pytest
from ml.sentiment.finbert_analyzer import FinBERTAnalyzer, create_finbert_analyzer


def test_finbert_analyzer_initialization():
    """Test FinBERT analyzer initialization."""
    analyzer = FinBERTAnalyzer()
    
    assert analyzer.model_name == "ProsusAI/finbert"
    assert analyzer.device == "cpu"
    assert analyzer.max_length == 512
    assert not analyzer._is_loaded


def test_finbert_analyzer_custom_params():
    """Test FinBERT analyzer with custom parameters."""
    analyzer = FinBERTAnalyzer(
        model_name="custom/finbert",
        device="cuda",
        max_length=256
    )
    
    assert analyzer.model_name == "custom/finbert"
    assert analyzer.device == "cuda"
    assert analyzer.max_length == 256


def test_finbert_is_available():
    """Test checking if FinBERT dependencies are available."""
    analyzer = FinBERTAnalyzer()
    # Should return True or False depending on whether transformers is installed
    assert isinstance(analyzer.is_available, bool)


def test_finbert_factory_function():
    """Test factory function."""
    analyzer = create_finbert_analyzer(device="cpu")
    assert isinstance(analyzer, FinBERTAnalyzer)


def test_finbert_predict_without_transformers(monkeypatch):
    """Test prediction fails gracefully without transformers."""
    analyzer = FinBERTAnalyzer()
    
    # Mock _lazy_load to raise ImportError
    def mock_lazy_load():
        raise ImportError("transformers not installed")
    
    monkeypatch.setattr(analyzer, "_lazy_load", mock_lazy_load)
    
    with pytest.raises(ImportError):
        analyzer.predict(["Test text"])


def test_finbert_repr():
    """Test string representation."""
    analyzer = FinBERTAnalyzer()
    repr_str = repr(analyzer)
    
    assert "FinBERTAnalyzer" in repr_str
    assert "ProsusAI/finbert" in repr_str
    assert "cpu" in repr_str
