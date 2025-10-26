"""
ONNX Export Module for Model Optimization
=========================================

Export PyTorch/Transformers models to ONNX format for:
- Cross-platform deployment
- Faster inference with ONNX Runtime
- Hardware acceleration (GPU, CPU optimizations)
- Reduced memory footprint
"""

import logging
from typing import Optional, Tuple, Dict, Any
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)


class ONNXExporter:
    """
    Export transformer models to ONNX format.

    Features:
    - Automatic input shape handling
    - Optimization passes
    - Validation against original model
    - Multiple opset version support
    """

    def __init__(
        self,
        opset_version: int = 14,
        optimize: bool = True,
        validate: bool = True
    ):
        """
        Initialize ONNX exporter.

        Args:
            opset_version: ONNX opset version (default: 14)
            optimize: Apply optimization passes (default: True)
            validate: Validate exported model (default: True)
        """
        self.opset_version = opset_version
        self.optimize = optimize
        self.validate = validate

    def export_model(
        self,
        model,
        tokenizer,
        output_path: str,
        sample_text: str = "This is a sample text for model export.",
        dynamic_axes: Optional[Dict[str, Dict[int, str]]] = None
    ) -> Dict[str, Any]:
        """
        Export a transformers model to ONNX format.

        Args:
            model: PyTorch model to export
            tokenizer: Tokenizer for the model
            output_path: Path to save ONNX model
            sample_text: Sample text for tracing (default provided)
            dynamic_axes: Dynamic axis configuration (optional)

        Returns:
            Export statistics and validation results
        """
        try:
            import torch
            import onnx
            from onnx import optimizer

            logger.info(f"Exporting model to ONNX: {output_path}")

            # Prepare sample input
            inputs = tokenizer(
                sample_text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512
            )

            # Default dynamic axes for batch and sequence dimensions
            if dynamic_axes is None:
                dynamic_axes = {
                    "input_ids": {0: "batch_size", 1: "sequence_length"},
                    "attention_mask": {0: "batch_size", 1: "sequence_length"},
                    "output": {0: "batch_size"}
                }

            # Set model to eval mode
            model.eval()

            # Export to ONNX
            with torch.no_grad():
                torch.onnx.export(
                    model,
                    args=(inputs["input_ids"], inputs["attention_mask"]),
                    f=output_path,
                    input_names=["input_ids", "attention_mask"],
                    output_names=["output"],
                    dynamic_axes=dynamic_axes,
                    opset_version=self.opset_version,
                    do_constant_folding=True,
                    verbose=False
                )

            logger.info("Model exported successfully")

            # Load and optimize ONNX model
            onnx_model = onnx.load(output_path)

            if self.optimize:
                logger.info("Applying optimization passes...")
                # Apply ONNX optimization passes
                passes = [
                    'eliminate_identity',
                    'eliminate_nop_transpose',
                    'fuse_consecutive_transposes',
                    'fuse_transpose_into_gemm',
                ]
                onnx_model = optimizer.optimize(onnx_model, passes=passes)
                onnx.save(onnx_model, output_path)
                logger.info("Optimization complete")

            # Validate model
            results = {
                "export_path": output_path,
                "opset_version": self.opset_version,
                "optimized": self.optimize,
                "input_names": ["input_ids", "attention_mask"],
                "output_names": ["output"]
            }

            if self.validate:
                logger.info("Validating exported model...")
                validation = self._validate_model(
                    onnx_model_path=output_path,
                    original_model=model,
                    tokenizer=tokenizer,
                    sample_texts=[sample_text, "Another validation text"]
                )
                results["validation"] = validation

                if validation["passed"]:
                    logger.info("✓ Validation passed")
                else:
                    logger.warning("✗ Validation failed")

            return results

        except ImportError as e:
            logger.error(f"Missing dependencies: {e}")
            raise ImportError(
                "ONNX export requires: pip install onnx onnxruntime torch transformers"
            )
        except Exception as e:
            logger.error(f"Export failed: {e}")
            raise

    def _validate_model(
        self,
        onnx_model_path: str,
        original_model,
        tokenizer,
        sample_texts: list,
        tolerance: float = 1e-4
    ) -> Dict[str, Any]:
        """
        Validate ONNX model against original PyTorch model.

        Args:
            onnx_model_path: Path to ONNX model
            original_model: Original PyTorch model
            tokenizer: Tokenizer
            sample_texts: Sample texts for validation
            tolerance: Numerical tolerance for comparison

        Returns:
            Validation results
        """
        try:
            import torch
            import onnxruntime as ort

            # Create ONNX Runtime session
            session = ort.InferenceSession(onnx_model_path)

            max_diff = 0.0
            all_passed = True

            for text in sample_texts:
                # Prepare inputs
                inputs = tokenizer(
                    text,
                    return_tensors="pt",
                    padding=True,
                    truncation=True,
                    max_length=512
                )

                # Get PyTorch predictions
                with torch.no_grad():
                    original_model.eval()
                    pytorch_output = original_model(
                        inputs["input_ids"],
                        inputs["attention_mask"]
                    )

                    if hasattr(pytorch_output, 'logits'):
                        pytorch_logits = pytorch_output.logits.numpy()
                    else:
                        pytorch_logits = pytorch_output[0].numpy()

                # Get ONNX predictions
                onnx_inputs = {
                    "input_ids": inputs["input_ids"].numpy(),
                    "attention_mask": inputs["attention_mask"].numpy()
                }
                onnx_output = session.run(None, onnx_inputs)[0]

                # Compare outputs
                diff = np.abs(pytorch_logits - onnx_output).max()
                max_diff = max(max_diff, diff)

                if diff > tolerance:
                    all_passed = False
                    logger.warning(f"Validation failed for text: {text[:50]}... (diff: {diff})")

            return {
                "passed": all_passed,
                "max_difference": float(max_diff),
                "tolerance": tolerance,
                "num_samples": len(sample_texts)
            }

        except Exception as e:
            logger.error(f"Validation error: {e}")
            return {
                "passed": False,
                "error": str(e)
            }

    def benchmark_model(
        self,
        onnx_model_path: str,
        tokenizer,
        sample_texts: list,
        num_runs: int = 100
    ) -> Dict[str, float]:
        """
        Benchmark ONNX model performance.

        Args:
            onnx_model_path: Path to ONNX model
            tokenizer: Tokenizer
            sample_texts: Sample texts for benchmarking
            num_runs: Number of benchmark runs

        Returns:
            Performance metrics
        """
        try:
            import onnxruntime as ort
            import time

            session = ort.InferenceSession(onnx_model_path)

            # Warmup
            for text in sample_texts[:5]:
                inputs = tokenizer(
                    text,
                    return_tensors="np",
                    padding=True,
                    truncation=True,
                    max_length=512
                )
                onnx_inputs = {
                    "input_ids": inputs["input_ids"],
                    "attention_mask": inputs["attention_mask"]
                }
                session.run(None, onnx_inputs)

            # Benchmark
            times = []
            for _ in range(num_runs):
                for text in sample_texts:
                    inputs = tokenizer(
                        text,
                        return_tensors="np",
                        padding=True,
                        truncation=True,
                        max_length=512
                    )
                    onnx_inputs = {
                        "input_ids": inputs["input_ids"],
                        "attention_mask": inputs["attention_mask"]
                    }

                    start = time.time()
                    session.run(None, onnx_inputs)
                    times.append(time.time() - start)

            times = np.array(times)

            return {
                "mean_latency_ms": float(times.mean() * 1000),
                "median_latency_ms": float(np.median(times) * 1000),
                "p95_latency_ms": float(np.percentile(times, 95) * 1000),
                "p99_latency_ms": float(np.percentile(times, 99) * 1000),
                "throughput_qps": float(1.0 / times.mean()),
                "num_runs": num_runs * len(sample_texts)
            }

        except Exception as e:
            logger.error(f"Benchmark error: {e}")
            return {}


def export_finbert_to_onnx(
    output_path: str = "./models/finbert.onnx",
    validate: bool = True
) -> Dict[str, Any]:
    """
    Convenience function to export FinBERT model to ONNX.

    Args:
        output_path: Path to save ONNX model
        validate: Validate exported model

    Returns:
        Export results
    """
    try:
        from ml.sentiment import FinBERTAnalyzer

        # Initialize FinBERT
        logger.info("Loading FinBERT model...")
        analyzer = FinBERTAnalyzer()
        analyzer._lazy_load()

        # Create exporter
        exporter = ONNXExporter(validate=validate)

        # Export
        results = exporter.export_model(
            model=analyzer.model,
            tokenizer=analyzer.tokenizer,
            output_path=output_path,
            sample_text="FDA approves breakthrough cancer therapy"
        )

        return results

    except Exception as e:
        logger.error(f"FinBERT export failed: {e}")
        raise


def export_biobert_to_onnx(
    output_path: str = "./models/biobert.onnx",
    validate: bool = True
) -> Dict[str, Any]:
    """
    Convenience function to export BioBERT model to ONNX.

    Args:
        output_path: Path to save ONNX model
        validate: Validate exported model

    Returns:
        Export results
    """
    try:
        from ml.sentiment import BioBERTAnalyzer

        # Initialize BioBERT
        logger.info("Loading BioBERT model...")
        analyzer = BioBERTAnalyzer()
        analyzer._lazy_load()

        # Create exporter
        exporter = ONNXExporter(validate=validate)

        # Export
        results = exporter.export_model(
            model=analyzer.model,
            tokenizer=analyzer.tokenizer,
            output_path=output_path,
            sample_text="Clinical trial shows promising efficacy results"
        )

        return results

    except Exception as e:
        logger.error(f"BioBERT export failed: {e}")
        raise


# Factory function
def create_onnx_exporter(**kwargs) -> ONNXExporter:
    """Create ONNX exporter with custom configuration."""
    return ONNXExporter(**kwargs)


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    print("ONNX Export Example")
    print("=" * 50)

    # Export FinBERT
    try:
        print("\n1. Exporting FinBERT to ONNX...")
        results = export_finbert_to_onnx(
            output_path="/tmp/finbert.onnx",
            validate=True
        )
        print(f"✓ Export successful: {results['export_path']}")
        if results.get('validation', {}).get('passed'):
            print(f"✓ Validation passed (max diff: {results['validation']['max_difference']:.2e})")
    except Exception as e:
        print(f"✗ FinBERT export failed: {e}")

    # Export BioBERT
    try:
        print("\n2. Exporting BioBERT to ONNX...")
        results = export_biobert_to_onnx(
            output_path="/tmp/biobert.onnx",
            validate=True
        )
        print(f"✓ Export successful: {results['export_path']}")
        if results.get('validation', {}).get('passed'):
            print(f"✓ Validation passed (max diff: {results['validation']['max_difference']:.2e})")
    except Exception as e:
        print(f"✗ BioBERT export failed: {e}")
