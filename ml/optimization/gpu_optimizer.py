"""
GPU Optimization for BERT Models
=================================

Provides GPU acceleration, mixed precision training, and batch optimization
for FinBERT and BioBERT models to improve inference speed.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import warnings

logger = logging.getLogger(__name__)


class GPUOptimizer:
    """
    GPU optimizer for BERT-based sentiment analysis models.
    
    Features:
    - Automatic GPU detection and fallback
    - Mixed precision inference (FP16)
    - Optimized batch processing
    - Memory management
    """
    
    def __init__(
        self,
        use_fp16: bool = True,
        max_batch_size: int = 32,
        auto_device: bool = True
    ):
        """
        Initialize GPU optimizer.
        
        Args:
            use_fp16: Use mixed precision (FP16) for faster inference
            max_batch_size: Maximum batch size for GPU processing
            auto_device: Automatically select best device
        """
        self.use_fp16 = use_fp16
        self.max_batch_size = max_batch_size
        self.auto_device = auto_device
        self.device = None
        self.is_gpu_available = False
        
        self._detect_device()
    
    def _detect_device(self):
        """Detect available compute devices."""
        try:
            import torch
            
            if torch.cuda.is_available():
                self.device = "cuda"
                self.is_gpu_available = True
                gpu_name = torch.cuda.get_device_name(0)
                logger.info(f"GPU detected: {gpu_name}")
                logger.info(f"CUDA version: {torch.version.cuda}")
                
                # Check FP16 support
                if self.use_fp16:
                    compute_capability = torch.cuda.get_device_capability()
                    if compute_capability[0] >= 7:  # Volta or newer
                        logger.info("FP16 support enabled (Tensor Cores available)")
                    else:
                        logger.warning(
                            f"GPU compute capability {compute_capability} may not "
                            "fully support FP16. Consider using FP32."
                        )
            else:
                self.device = "cpu"
                logger.info("No GPU detected, using CPU")
                
        except ImportError:
            self.device = "cpu"
            logger.warning("PyTorch not installed, GPU optimization disabled")
    
    def optimize_model(self, model):
        """
        Optimize model for GPU inference.
        
        Args:
            model: PyTorch model to optimize
            
        Returns:
            Optimized model
        """
        if not self.is_gpu_available:
            logger.info("Skipping GPU optimization (no GPU available)")
            return model
        
        try:
            import torch
            
            # Move to GPU
            model = model.to(self.device)
            
            # Enable mixed precision if supported
            if self.use_fp16:
                try:
                    model = model.half()
                    logger.info("Model converted to FP16")
                except Exception as e:
                    logger.warning(f"Failed to convert to FP16: {e}. Using FP32")
            
            # Set to eval mode
            model.eval()
            
            # Enable CUDA optimizations
            if hasattr(torch.backends, 'cudnn'):
                torch.backends.cudnn.benchmark = True
                torch.backends.cudnn.deterministic = False
                logger.info("cuDNN optimizations enabled")
            
            return model
            
        except Exception as e:
            logger.error(f"Model optimization failed: {e}")
            return model
    
    def batch_process(
        self,
        model,
        tokenizer,
        texts: List[str],
        max_length: int = 512
    ) -> Tuple[List[int], List[Dict[int, float]]]:
        """
        Optimized batch processing with GPU acceleration.
        
        Args:
            model: PyTorch model
            tokenizer: HuggingFace tokenizer
            texts: List of texts to process
            max_length: Maximum sequence length
            
        Returns:
            Tuple of (predictions, probabilities)
        """
        import torch
        import torch.nn.functional as F
        
        predictions = []
        probabilities = []
        
        # Process in optimized batches
        for i in range(0, len(texts), self.max_batch_size):
            batch_texts = texts[i:i + self.max_batch_size]
            
            # Tokenize batch
            inputs = tokenizer(
                batch_texts,
                return_tensors="pt",
                max_length=max_length,
                truncation=True,
                padding=True
            ).to(self.device)
            
            # Convert to FP16 if enabled
            if self.use_fp16 and self.is_gpu_available:
                inputs = {k: v.half() if v.dtype == torch.float32 else v 
                         for k, v in inputs.items()}
            
            # Inference
            with torch.no_grad():
                with torch.cuda.amp.autocast(enabled=self.use_fp16 and self.is_gpu_available):
                    outputs = model(**inputs)
                    logits = outputs.logits
                    probs = F.softmax(logits, dim=1)
            
            # Extract results
            batch_preds = torch.argmax(logits, dim=1).cpu().numpy().tolist()
            batch_probs = probs.cpu().float().numpy()
            
            predictions.extend(batch_preds)
            probabilities.extend([
                {idx: float(prob) for idx, prob in enumerate(row)}
                for row in batch_probs
            ])
        
        return predictions, probabilities
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """
        Get GPU memory statistics.
        
        Returns:
            Dictionary with memory usage information
        """
        if not self.is_gpu_available:
            return {"status": "No GPU available"}
        
        try:
            import torch
            
            allocated = torch.cuda.memory_allocated() / 1024**3  # GB
            reserved = torch.cuda.memory_reserved() / 1024**3  # GB
            max_allocated = torch.cuda.max_memory_allocated() / 1024**3  # GB
            
            return {
                "allocated_gb": round(allocated, 2),
                "reserved_gb": round(reserved, 2),
                "max_allocated_gb": round(max_allocated, 2),
                "device": torch.cuda.get_device_name(0)
            }
        except Exception as e:
            logger.error(f"Failed to get memory stats: {e}")
            return {"error": str(e)}
    
    def clear_cache(self):
        """Clear GPU memory cache."""
        if self.is_gpu_available:
            try:
                import torch
                torch.cuda.empty_cache()
                logger.info("GPU cache cleared")
            except Exception as e:
                logger.error(f"Failed to clear cache: {e}")


def create_gpu_optimizer(
    use_fp16: bool = True,
    max_batch_size: int = 32
) -> GPUOptimizer:
    """
    Factory function to create GPU optimizer.
    
    Args:
        use_fp16: Use mixed precision
        max_batch_size: Maximum batch size
        
    Returns:
        GPUOptimizer instance
    """
    return GPUOptimizer(use_fp16=use_fp16, max_batch_size=max_batch_size)
