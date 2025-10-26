"""
Tests for GPU Optimization Module
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from ml.optimization.gpu_optimizer import GPUOptimizer, create_gpu_optimizer


class TestGPUOptimizer:
    """Test GPU optimizer functionality."""

    def test_initialization(self):
        """Test GPU optimizer initialization."""
        optimizer = GPUOptimizer(use_fp16=True, max_batch_size=16)

        assert optimizer.use_fp16 is True
        assert optimizer.max_batch_size == 16
        assert optimizer.device is not None

    def test_initialization_without_torch(self):
        """Test initialization when PyTorch is not available."""
        with patch('ml.optimization.gpu_optimizer.torch', None):
            optimizer = GPUOptimizer()
            assert optimizer.device == "cpu"
            assert optimizer.is_gpu_available is False

    @patch('ml.optimization.gpu_optimizer.torch')
    def test_gpu_detection_with_cuda(self, mock_torch):
        """Test GPU detection when CUDA is available."""
        mock_torch.cuda.is_available.return_value = True
        mock_torch.cuda.get_device_name.return_value = "NVIDIA RTX 3090"
        mock_torch.version.cuda = "11.7"
        mock_torch.cuda.get_device_capability.return_value = (8, 6)

        optimizer = GPUOptimizer()

        assert optimizer.device == "cuda"
        assert optimizer.is_gpu_available is True

    @patch('ml.optimization.gpu_optimizer.torch')
    def test_gpu_detection_without_cuda(self, mock_torch):
        """Test GPU detection when CUDA is not available."""
        mock_torch.cuda.is_available.return_value = False

        optimizer = GPUOptimizer()

        assert optimizer.device == "cpu"
        assert optimizer.is_gpu_available is False

    def test_optimize_model_without_gpu(self):
        """Test model optimization without GPU."""
        optimizer = GPUOptimizer()
        optimizer.is_gpu_available = False

        mock_model = Mock()
        result = optimizer.optimize_model(mock_model)

        assert result == mock_model

    @patch('ml.optimization.gpu_optimizer.torch')
    def test_optimize_model_with_gpu(self, mock_torch):
        """Test model optimization with GPU."""
        optimizer = GPUOptimizer(use_fp16=True)
        optimizer.is_gpu_available = True
        optimizer.device = "cuda"

        mock_model = Mock()
        mock_model.to.return_value = mock_model
        mock_model.half.return_value = mock_model
        mock_model.eval.return_value = None

        mock_torch.backends.cudnn = Mock()

        result = optimizer.optimize_model(mock_model)

        mock_model.to.assert_called_with("cuda")
        mock_model.half.assert_called_once()
        mock_model.eval.assert_called_once()

    @patch('ml.optimization.gpu_optimizer.torch')
    def test_batch_process(self, mock_torch):
        """Test batch processing."""
        optimizer = GPUOptimizer(max_batch_size=2)
        optimizer.device = "cpu"
        optimizer.is_gpu_available = False

        # Mock model and tokenizer
        mock_model = Mock()
        mock_tokenizer = Mock()

        # Mock tokenizer output
        mock_inputs = {
            'input_ids': Mock(),
            'attention_mask': Mock()
        }
        mock_tokenizer.return_value.to.return_value = mock_inputs

        # Mock model output
        mock_logits = Mock()
        mock_torch.argmax.return_value.cpu.return_value.numpy.return_value.tolist.return_value = [0, 1]
        mock_output = Mock()
        mock_output.logits = mock_logits
        mock_model.return_value = mock_output

        # Mock softmax
        mock_probs = Mock()
        mock_probs.cpu.return_value.float.return_value.numpy.return_value = [[0.8, 0.1, 0.1], [0.1, 0.8, 0.1]]
        mock_torch.nn.functional.softmax.return_value = mock_probs

        texts = ["text1", "text2", "text3"]

        predictions, probabilities = optimizer.batch_process(
            mock_model, mock_tokenizer, texts, max_length=128
        )

        assert len(predictions) > 0
        assert len(probabilities) > 0

    @patch('ml.optimization.gpu_optimizer.torch')
    def test_get_memory_stats_with_gpu(self, mock_torch):
        """Test getting memory stats with GPU."""
        optimizer = GPUOptimizer()
        optimizer.is_gpu_available = True

        mock_torch.cuda.memory_allocated.return_value = 1024**3  # 1 GB
        mock_torch.cuda.memory_reserved.return_value = 2 * 1024**3  # 2 GB
        mock_torch.cuda.max_memory_allocated.return_value = 1.5 * 1024**3  # 1.5 GB
        mock_torch.cuda.get_device_name.return_value = "NVIDIA RTX 3090"

        stats = optimizer.get_memory_stats()

        assert 'allocated_gb' in stats
        assert 'reserved_gb' in stats
        assert 'max_allocated_gb' in stats
        assert 'device' in stats
        assert stats['device'] == "NVIDIA RTX 3090"

    def test_get_memory_stats_without_gpu(self):
        """Test getting memory stats without GPU."""
        optimizer = GPUOptimizer()
        optimizer.is_gpu_available = False

        stats = optimizer.get_memory_stats()

        assert stats == {"status": "No GPU available"}

    @patch('ml.optimization.gpu_optimizer.torch')
    def test_clear_cache(self, mock_torch):
        """Test clearing GPU cache."""
        optimizer = GPUOptimizer()
        optimizer.is_gpu_available = True

        optimizer.clear_cache()

        mock_torch.cuda.empty_cache.assert_called_once()

    def test_clear_cache_without_gpu(self):
        """Test clearing cache without GPU."""
        optimizer = GPUOptimizer()
        optimizer.is_gpu_available = False

        # Should not raise an error
        optimizer.clear_cache()

    def test_factory_function(self):
        """Test factory function."""
        optimizer = create_gpu_optimizer(use_fp16=False, max_batch_size=16)

        assert isinstance(optimizer, GPUOptimizer)
        assert optimizer.use_fp16 is False
        assert optimizer.max_batch_size == 16


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
