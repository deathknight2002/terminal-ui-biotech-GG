"""
Automated Model Retraining Pipeline
====================================

Automated pipeline for retraining sentiment models with new data.
Includes data validation, model training, evaluation, and deployment.
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from pathlib import Path
import joblib

logger = logging.getLogger(__name__)


class RetrainingPipeline:
    """
    Automated retraining pipeline for ML models.
    
    Features:
    - Data validation and quality checks
    - Automated model training
    - Performance evaluation and comparison
    - Model registry and versioning
    - Automated deployment decision
    """
    
    def __init__(
        self,
        model_dir: str = "/tmp/models",
        min_training_samples: int = 100,
        min_accuracy_threshold: float = 0.6,
        improvement_threshold: float = 0.02
    ):
        """
        Initialize retraining pipeline.
        
        Args:
            model_dir: Directory for storing models
            min_training_samples: Minimum samples required for training
            min_accuracy_threshold: Minimum acceptable accuracy
            improvement_threshold: Minimum improvement required for deployment
        """
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        self.min_training_samples = min_training_samples
        self.min_accuracy_threshold = min_accuracy_threshold
        self.improvement_threshold = improvement_threshold
        
        self.registry = ModelRegistry(self.model_dir)
    
    def validate_training_data(
        self,
        texts: List[str],
        labels: List[int]
    ) -> Dict[str, Any]:
        """
        Validate training data quality.
        
        Args:
            texts: Training texts
            labels: Training labels
            
        Returns:
            Validation results dictionary
        """
        issues = []
        warnings = []
        
        # Check sample count
        if len(texts) < self.min_training_samples:
            issues.append(
                f"Insufficient training samples: {len(texts)} < {self.min_training_samples}"
            )
        
        # Check for empty texts
        empty_count = sum(1 for text in texts if not text or not text.strip())
        if empty_count > 0:
            warnings.append(f"Found {empty_count} empty texts")
        
        # Check label distribution
        import numpy as np
        unique_labels, counts = np.unique(labels, return_counts=True)
        label_dist = dict(zip(unique_labels, counts))
        
        # Check for class imbalance
        if len(unique_labels) < 3:
            warnings.append(f"Only {len(unique_labels)} classes present in training data")
        
        min_class_count = min(counts) if len(counts) > 0 else 0
        max_class_count = max(counts) if len(counts) > 0 else 0
        if min_class_count > 0 and max_class_count / min_class_count > 10:
            warnings.append(
                f"Severe class imbalance detected: {max_class_count}/{min_class_count} ratio"
            )
        
        # Check text lengths
        text_lengths = [len(text) for text in texts if text]
        avg_length = np.mean(text_lengths) if text_lengths else 0
        if avg_length < 10:
            warnings.append(f"Very short texts: average length = {avg_length:.1f} characters")
        
        is_valid = len(issues) == 0
        
        return {
            'valid': is_valid,
            'n_samples': len(texts),
            'label_distribution': label_dist,
            'avg_text_length': avg_length,
            'issues': issues,
            'warnings': warnings
        }
    
    def train_model(
        self,
        texts: List[str],
        labels: List[int],
        model_type: str = "tfidf",
        **model_kwargs
    ) -> Tuple[Any, Dict[str, Any]]:
        """
        Train a new model.
        
        Args:
            texts: Training texts
            labels: Training labels
            model_type: Type of model to train
            **model_kwargs: Additional model parameters
            
        Returns:
            Tuple of (trained_model, training_metrics)
        """
        logger.info(f"Training {model_type} model with {len(texts)} samples...")
        
        if model_type == "tfidf":
            from ml.sentiment.trainer import SentimentTrainer
            model = SentimentTrainer(**model_kwargs)
            metrics = model.fit(texts, labels)
        elif model_type == "finbert":
            from ml.sentiment.finbert_analyzer import FinBERTAnalyzer
            # FinBERT is pre-trained, just instantiate
            model = FinBERTAnalyzer(**model_kwargs)
            metrics = {'note': 'FinBERT is pre-trained'}
        elif model_type == "biobert":
            from ml.sentiment.biobert_analyzer import BioBERTAnalyzer
            model = BioBERTAnalyzer(**model_kwargs)
            metrics = {'note': 'BioBERT uses rule-based or pre-trained'}
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        logger.info(f"Model trained successfully")
        return model, metrics
    
    def evaluate_model(
        self,
        model: Any,
        test_texts: List[str],
        test_labels: List[int]
    ) -> Dict[str, Any]:
        """
        Evaluate model performance.
        
        Args:
            model: Trained model
            test_texts: Test texts
            test_labels: Test labels
            
        Returns:
            Evaluation metrics
        """
        logger.info(f"Evaluating model on {len(test_texts)} test samples...")
        
        # Get predictions
        predictions = model.predict(test_texts)
        probabilities = model.predict_proba(test_texts)
        
        # Calculate metrics
        from sklearn.metrics import (
            accuracy_score,
            precision_recall_fscore_support,
            confusion_matrix,
            classification_report
        )
        
        accuracy = accuracy_score(test_labels, predictions)
        precision, recall, f1, support = precision_recall_fscore_support(
            test_labels, predictions, average='weighted', zero_division=0
        )
        conf_matrix = confusion_matrix(test_labels, predictions)
        
        # Calculate average confidence
        confidences = [max(p.values()) for p in probabilities]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'confusion_matrix': conf_matrix.tolist(),
            'avg_confidence': avg_confidence,
            'n_samples': len(test_labels)
        }
    
    def compare_models(
        self,
        new_model: Any,
        new_metrics: Dict[str, Any],
        current_model: Optional[Any] = None,
        test_texts: Optional[List[str]] = None,
        test_labels: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Compare new model with current production model.
        
        Args:
            new_model: Newly trained model
            new_metrics: Metrics for new model
            current_model: Current production model
            test_texts: Test texts for comparison
            test_labels: Test labels for comparison
            
        Returns:
            Comparison results
        """
        if current_model is None:
            return {
                'comparison_possible': False,
                'reason': 'No current model for comparison',
                'recommendation': 'deploy'
            }
        
        if test_texts is None or test_labels is None:
            return {
                'comparison_possible': False,
                'reason': 'No test data provided',
                'recommendation': 'manual_review'
            }
        
        # Evaluate current model
        current_metrics = self.evaluate_model(current_model, test_texts, test_labels)
        
        # Compare key metrics
        acc_improvement = new_metrics['accuracy'] - current_metrics['accuracy']
        f1_improvement = new_metrics['f1_score'] - current_metrics['f1_score']
        
        # Decision logic
        if acc_improvement >= self.improvement_threshold:
            recommendation = 'deploy'
            reason = f"Significant accuracy improvement: +{acc_improvement:.3f}"
        elif acc_improvement < -self.improvement_threshold:
            recommendation = 'reject'
            reason = f"Accuracy degradation: {acc_improvement:.3f}"
        else:
            # Check if at least meets minimum threshold
            if new_metrics['accuracy'] >= self.min_accuracy_threshold:
                if f1_improvement > 0:
                    recommendation = 'deploy'
                    reason = "Similar accuracy, better F1 score"
                else:
                    recommendation = 'keep_current'
                    reason = "No significant improvement"
            else:
                recommendation = 'reject'
                reason = f"Below minimum accuracy threshold: {new_metrics['accuracy']:.3f} < {self.min_accuracy_threshold}"
        
        return {
            'comparison_possible': True,
            'new_metrics': new_metrics,
            'current_metrics': current_metrics,
            'accuracy_improvement': acc_improvement,
            'f1_improvement': f1_improvement,
            'recommendation': recommendation,
            'reason': reason
        }
    
    def run_pipeline(
        self,
        train_texts: List[str],
        train_labels: List[int],
        test_texts: List[str],
        test_labels: List[int],
        model_type: str = "tfidf",
        model_name: str = "sentiment_model",
        auto_deploy: bool = False,
        **model_kwargs
    ) -> Dict[str, Any]:
        """
        Run complete retraining pipeline.
        
        Args:
            train_texts: Training texts
            train_labels: Training labels
            test_texts: Test texts
            test_labels: Test labels
            model_type: Type of model to train
            model_name: Name for the model
            auto_deploy: Whether to auto-deploy if model passes checks
            **model_kwargs: Additional model parameters
            
        Returns:
            Pipeline results
        """
        pipeline_start = datetime.utcnow()
        results = {
            'started_at': pipeline_start.isoformat(),
            'model_type': model_type,
            'model_name': model_name
        }
        
        # Step 1: Validate training data
        logger.info("Step 1: Validating training data...")
        validation = self.validate_training_data(train_texts, train_labels)
        results['validation'] = validation
        
        if not validation['valid']:
            results['status'] = 'failed'
            results['reason'] = 'Data validation failed'
            return results
        
        # Step 2: Train model
        logger.info("Step 2: Training model...")
        try:
            new_model, training_metrics = self.train_model(
                train_texts, train_labels, model_type, **model_kwargs
            )
            results['training_metrics'] = training_metrics
        except Exception as e:
            logger.error(f"Training failed: {e}")
            results['status'] = 'failed'
            results['reason'] = f'Training error: {str(e)}'
            return results
        
        # Step 3: Evaluate model
        logger.info("Step 3: Evaluating model...")
        try:
            eval_metrics = self.evaluate_model(new_model, test_texts, test_labels)
            results['evaluation_metrics'] = eval_metrics
        except Exception as e:
            logger.error(f"Evaluation failed: {e}")
            results['status'] = 'failed'
            results['reason'] = f'Evaluation error: {str(e)}'
            return results
        
        # Step 4: Compare with current model
        logger.info("Step 4: Comparing with current model...")
        current_model = self.registry.get_production_model(model_name)
        comparison = self.compare_models(
            new_model, eval_metrics, current_model, test_texts, test_labels
        )
        results['comparison'] = comparison
        
        # Step 5: Register new model
        logger.info("Step 5: Registering model...")
        version = self.registry.register_model(
            model=new_model,
            model_name=model_name,
            model_type=model_type,
            metrics=eval_metrics,
            metadata={
                'training_samples': len(train_texts),
                'test_samples': len(test_texts),
                'recommendation': comparison['recommendation']
            }
        )
        results['model_version'] = version
        
        # Step 6: Deploy if recommended and auto_deploy is enabled
        if auto_deploy and comparison['recommendation'] == 'deploy':
            logger.info("Step 6: Auto-deploying model...")
            self.registry.set_production_model(model_name, version)
            results['deployed'] = True
            results['status'] = 'deployed'
        else:
            results['deployed'] = False
            results['status'] = 'registered'
        
        pipeline_end = datetime.utcnow()
        results['completed_at'] = pipeline_end.isoformat()
        results['duration_seconds'] = (pipeline_end - pipeline_start).total_seconds()
        
        logger.info(f"Pipeline completed: {results['status']}")
        return results


class ModelRegistry:
    """
    Model registry for versioning and deployment management.
    """
    
    def __init__(self, registry_dir: Path):
        """
        Initialize model registry.
        
        Args:
            registry_dir: Directory for storing models
        """
        self.registry_dir = registry_dir
        self.registry_dir.mkdir(parents=True, exist_ok=True)
        
        self.metadata_file = self.registry_dir / "registry.json"
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load registry metadata."""
        if self.metadata_file.exists():
            import json
            with open(self.metadata_file, 'r') as f:
                return json.load(f)
        return {'models': {}, 'production': {}}
    
    def _save_metadata(self):
        """Save registry metadata."""
        import json
        with open(self.metadata_file, 'w') as f:
            json.dump(self.metadata, f, indent=2)
    
    def register_model(
        self,
        model: Any,
        model_name: str,
        model_type: str,
        metrics: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Register a new model version.
        
        Args:
            model: Model instance
            model_name: Name of the model
            model_type: Type of model
            metrics: Evaluation metrics
            metadata: Additional metadata
            
        Returns:
            Version string
        """
        # Generate version
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        version = f"{model_name}_v{timestamp}"
        
        # Save model
        model_path = self.registry_dir / f"{version}.joblib"
        joblib.dump(model, model_path)
        
        # Store metadata
        if model_name not in self.metadata['models']:
            self.metadata['models'][model_name] = {'versions': []}
        
        self.metadata['models'][model_name]['versions'].append({
            'version': version,
            'model_type': model_type,
            'metrics': metrics,
            'metadata': metadata or {},
            'registered_at': datetime.utcnow().isoformat(),
            'path': str(model_path)
        })
        
        self._save_metadata()
        logger.info(f"Registered model: {version}")
        return version
    
    def get_model(self, model_name: str, version: Optional[str] = None) -> Optional[Any]:
        """
        Get a model by name and version.
        
        Args:
            model_name: Name of the model
            version: Version string (if None, gets latest)
            
        Returns:
            Model instance or None
        """
        if model_name not in self.metadata['models']:
            return None
        
        versions = self.metadata['models'][model_name]['versions']
        if not versions:
            return None
        
        if version is None:
            # Get latest version
            model_info = versions[-1]
        else:
            # Get specific version
            model_info = next((v for v in versions if v['version'] == version), None)
            if model_info is None:
                return None
        
        model_path = Path(model_info['path'])
        if model_path.exists():
            return joblib.load(model_path)
        return None
    
    def get_production_model(self, model_name: str) -> Optional[Any]:
        """Get current production model."""
        if model_name not in self.metadata['production']:
            return None
        
        version = self.metadata['production'][model_name]
        return self.get_model(model_name, version)
    
    def set_production_model(self, model_name: str, version: str):
        """Set a model version as production."""
        self.metadata['production'][model_name] = version
        self._save_metadata()
        logger.info(f"Set production model: {model_name} -> {version}")
    
    def list_models(self) -> Dict[str, List[str]]:
        """List all registered models and versions."""
        result = {}
        for model_name, info in self.metadata['models'].items():
            result[model_name] = [v['version'] for v in info['versions']]
        return result


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    print("Testing Retraining Pipeline...")
    
    # Sample data
    train_texts = [
        "FDA approves new drug",
        "Clinical trial fails",
        "Company reports earnings",
        "Positive phase 3 results",
        "Safety concerns raised"
    ] * 25  # 125 samples
    
    train_labels = [1, -1, 0, 1, -1] * 25
    
    test_texts = [
        "Breakthrough therapy designation",
        "Trial halted due to adverse events",
        "Quarterly results announced"
    ] * 10  # 30 samples
    
    test_labels = [1, -1, 0] * 10
    
    # Run pipeline
    pipeline = RetrainingPipeline(model_dir="/tmp/test_models")
    
    results = pipeline.run_pipeline(
        train_texts=train_texts,
        train_labels=train_labels,
        test_texts=test_texts,
        test_labels=test_labels,
        model_type="tfidf",
        model_name="sentiment_classifier",
        auto_deploy=False
    )
    
    print(f"\nPipeline Status: {results['status']}")
    print(f"Model Version: {results['model_version']}")
    print(f"Recommendation: {results['comparison']['recommendation']}")
    if 'evaluation_metrics' in results:
        print(f"Accuracy: {results['evaluation_metrics']['accuracy']:.3f}")
