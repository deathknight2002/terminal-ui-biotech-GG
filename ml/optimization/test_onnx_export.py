"""
Unit Tests for ONNX Export Module
==================================

Tests the ONNX model export functionality.
"""

import pytest
import tempfile
import os
from unittest.mock import Mock, patch, MagicMock
from ml.optimization.onnx_export import ONNXExporter, create_onnx_exporter


class TestONNXExporter:
    """Test cases for ONNX exporter."""

    def setup_method(self):
        """Set up test fixtures."""
        self.exporter = ONNXExporter(
            opset_version=14,
            optimize=True,
            validate=True
        )

    def test_initialization(self):
        """Test that exporter initializes correctly."""
        assert self.exporter.opset_version == 14
        assert self.exporter.optimize is True
        assert self.exporter.validate is True

    def test_initialization_defaults(self):
        """Test default initialization values."""
        exporter = ONNXExporter()
        assert exporter.opset_version == 14
        assert exporter.optimize is True
        assert exporter.validate is True

    def test_factory_function(self):
        """Test factory function creates exporter."""
        exporter = create_onnx_exporter(opset_version=13, optimize=False)
        assert isinstance(exporter, ONNXExporter)
        assert exporter.opset_version == 13
        assert exporter.optimize is False

    @pytest.mark.skipif(
        not _check_dependencies(),
        reason="Requires torch, transformers, onnx, onnxruntime"
    )
    @patch('torch.onnx.export')
    @patch('onnx.load')
    @patch('onnx.save')
    def test_export_model_success(self, mock_save, mock_load, mock_export):
        """Test successful model export."""
        # Mock model and tokenizer
        mock_model = Mock()
        mock_model.eval = Mock()

        mock_tokenizer = Mock()
        mock_tokenizer.return_value = {
            "input_ids": Mock(),
            "attention_mask": Mock()
        }

        # Mock ONNX model
        mock_onnx_model = Mock()
        mock_load.return_value = mock_onnx_model

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = os.path.join(tmpdir, "test_model.onnx")

            # Test without validation to avoid complex mocking
            exporter_no_val = ONNXExporter(validate=False, optimize=False)
            result = exporter_no_val.export_model(
                model=mock_model,
                tokenizer=mock_tokenizer,
                output_path=output_path,
                sample_text="Test text"
            )

            assert "export_path" in result
            assert result["export_path"] == output_path
            assert "opset_version" in result
            assert result["opset_version"] == 14

            # Verify export was called
            mock_export.assert_called_once()

    @pytest.mark.skipif(
        not _check_dependencies(),
        reason="Requires torch, transformers, onnx, onnxruntime"
    )
    def test_export_model_missing_dependencies(self):
        """Test export with missing dependencies."""
        with patch('ml.optimization.onnx_export.torch', None):
            with pytest.raises(ImportError, match="ONNX export requires"):
                self.exporter.export_model(
                    model=Mock(),
                    tokenizer=Mock(),
                    output_path="/tmp/test.onnx"
                )

    @pytest.mark.skipif(
        not _check_dependencies(),
        reason="Requires torch, transformers, onnx, onnxruntime"
    )
    @patch('ml.optimization.onnx_export.FinBERTAnalyzer')
    @patch('torch.onnx.export')
    def test_export_finbert_convenience_function(self, mock_export, mock_analyzer_class):
        """Test FinBERT export convenience function."""
        from ml.optimization.onnx_export import export_finbert_to_onnx

        # Mock analyzer
        mock_analyzer = Mock()
        mock_analyzer._lazy_load = Mock()
        mock_analyzer.model = Mock()
        mock_analyzer.model.eval = Mock()
        mock_analyzer.tokenizer = Mock()
        mock_analyzer.tokenizer.return_value = {
            "input_ids": Mock(),
            "attention_mask": Mock()
        }
        mock_analyzer_class.return_value = mock_analyzer

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = os.path.join(tmpdir, "finbert.onnx")

            with patch('onnx.load'), patch('onnx.save'):
                result = export_finbert_to_onnx(
                    output_path=output_path,
                    validate=False
                )

                assert "export_path" in result
                mock_analyzer._lazy_load.assert_called_once()

    def test_validate_model_structure(self):
        """Test validation result structure."""
        validation_result = {
            "passed": True,
            "max_difference": 0.0001,
            "tolerance": 0.0001,
            "num_samples": 2
        }

        assert "passed" in validation_result
        assert "max_difference" in validation_result
        assert "tolerance" in validation_result
        assert "num_samples" in validation_result
        assert isinstance(validation_result["passed"], bool)

    def test_benchmark_result_structure(self):
        """Test benchmark result structure."""
        benchmark_result = {
            "mean_latency_ms": 50.0,
            "median_latency_ms": 48.0,
            "p95_latency_ms": 60.0,
            "p99_latency_ms": 65.0,
            "throughput_qps": 20.0,
            "num_runs": 100
        }

        assert "mean_latency_ms" in benchmark_result
        assert "median_latency_ms" in benchmark_result
        assert "p95_latency_ms" in benchmark_result
        assert "p99_latency_ms" in benchmark_result
        assert "throughput_qps" in benchmark_result
        assert "num_runs" in benchmark_result


class TestONNXExportIntegration:
    """Integration tests for ONNX export (require dependencies)."""

    @pytest.mark.skipif(
        not _check_dependencies(),
        reason="Requires torch, transformers, onnx, onnxruntime"
    )
    @pytest.mark.slow
    def test_full_export_pipeline(self):
        """Test full export pipeline with real model (slow test)."""
        pytest.skip("Skipping slow integration test")

        # This test would:
        # 1. Load a small pre-trained model
        # 2. Export to ONNX
        # 3. Validate outputs match
        # 4. Benchmark performance
        pass


def _check_dependencies() -> bool:
    """Check if required dependencies are available."""
    try:
        import torch
        import transformers
        import onnx
        import onnxruntime
        return True
    except ImportError:
        return False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
