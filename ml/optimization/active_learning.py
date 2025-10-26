"""
Active Learning Integration
============================

Active learning strategies for prioritizing uncertain predictions
for labeling to improve model performance efficiently.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SamplePriority:
    """Container for sample priority information."""
    text: str
    index: int
    uncertainty_score: float
    prediction: int
    confidence: float
    strategy: str


class ActiveLearner:
    """
    Active learning for efficient model training.

    Strategies:
    - Uncertainty sampling: Select samples with lowest confidence
    - Margin sampling: Select samples with smallest margin between top 2 classes
    - Entropy sampling: Select samples with highest prediction entropy
    - Committee disagreement: Use ensemble disagreement
    """

    def __init__(
        self,
        strategy: str = "uncertainty",
        batch_size: int = 10
    ):
        """
        Initialize active learner.

        Args:
            strategy: Sampling strategy ('uncertainty', 'margin', 'entropy', 'committee')
            batch_size: Number of samples to select per iteration
        """
        self.strategy = strategy
        self.batch_size = batch_size

        # Labeled data pool
        self.labeled_texts: List[str] = []
        self.labeled_labels: List[int] = []

        # Unlabeled data pool
        self.unlabeled_texts: List[str] = []

        # History
        self.iteration_history: List[Dict[str, Any]] = []

    def add_unlabeled_data(self, texts: List[str]):
        """
        Add unlabeled texts to the pool.

        Args:
            texts: List of unlabeled texts
        """
        self.unlabeled_texts.extend(texts)
        logger.info(f"Added {len(texts)} unlabeled samples. Total: {len(self.unlabeled_texts)}")

    def add_labeled_data(self, texts: List[str], labels: List[int]):
        """
        Add labeled texts to the training pool.

        Args:
            texts: List of texts
            labels: List of labels
        """
        self.labeled_texts.extend(texts)
        self.labeled_labels.extend(labels)
        logger.info(f"Added {len(texts)} labeled samples. Total: {len(self.labeled_texts)}")

    def select_samples(
        self,
        model,
        predictions: Optional[List[int]] = None,
        probabilities: Optional[List[Dict[int, float]]] = None
    ) -> List[SamplePriority]:
        """
        Select most informative samples for labeling.

        Args:
            model: Trained model
            predictions: Model predictions (if available)
            probabilities: Prediction probabilities (if available)

        Returns:
            List of SamplePriority objects
        """
        if not self.unlabeled_texts:
            logger.warning("No unlabeled data available")
            return []

        # Get predictions if not provided
        if predictions is None or probabilities is None:
            logger.info("Computing predictions for unlabeled data...")
            predictions = model.predict(self.unlabeled_texts)
            probabilities = model.predict_proba(self.unlabeled_texts)

        # Compute uncertainty scores based on strategy
        if self.strategy == "uncertainty":
            priorities = self._uncertainty_sampling(predictions, probabilities)
        elif self.strategy == "margin":
            priorities = self._margin_sampling(probabilities)
        elif self.strategy == "entropy":
            priorities = self._entropy_sampling(probabilities)
        else:
            raise ValueError(f"Unknown strategy: {self.strategy}")

        # Sort by uncertainty and select top N
        priorities.sort(key=lambda x: x.uncertainty_score, reverse=True)
        selected = priorities[:self.batch_size]

        logger.info(
            f"Selected {len(selected)} samples using {self.strategy} strategy. "
            f"Avg uncertainty: {np.mean([s.uncertainty_score for s in selected]):.3f}"
        )

        return selected

    def _uncertainty_sampling(
        self,
        predictions: List[int],
        probabilities: List[Dict[int, float]]
    ) -> List[SamplePriority]:
        """Select samples with lowest confidence."""
        priorities = []

        for i, (text, pred, probs) in enumerate(zip(self.unlabeled_texts, predictions, probabilities)):
            confidence = max(probs.values())
            uncertainty = 1.0 - confidence

            priorities.append(SamplePriority(
                text=text,
                index=i,
                uncertainty_score=uncertainty,
                prediction=pred,
                confidence=confidence,
                strategy="uncertainty"
            ))

        return priorities

    def _margin_sampling(
        self,
        probabilities: List[Dict[int, float]]
    ) -> List[SamplePriority]:
        """Select samples with smallest margin between top 2 classes."""
        priorities = []

        for i, (text, probs) in enumerate(zip(self.unlabeled_texts, probabilities)):
            sorted_probs = sorted(probs.values(), reverse=True)
            margin = sorted_probs[0] - sorted_probs[1] if len(sorted_probs) > 1 else sorted_probs[0]
            uncertainty = 1.0 - margin

            pred = max(probs, key=probs.get)

            priorities.append(SamplePriority(
                text=text,
                index=i,
                uncertainty_score=uncertainty,
                prediction=pred,
                confidence=sorted_probs[0],
                strategy="margin"
            ))

        return priorities

    def _entropy_sampling(
        self,
        probabilities: List[Dict[int, float]]
    ) -> List[SamplePriority]:
        """Select samples with highest prediction entropy."""
        priorities = []

        for i, (text, probs) in enumerate(zip(self.unlabeled_texts, probabilities)):
            # Compute entropy
            entropy = -sum(p * np.log(p + 1e-10) for p in probs.values() if p > 0)

            pred = max(probs, key=probs.get)
            confidence = max(probs.values())

            priorities.append(SamplePriority(
                text=text,
                index=i,
                uncertainty_score=entropy,
                prediction=pred,
                confidence=confidence,
                strategy="entropy"
            ))

        return priorities

    def update_pools(self, selected_indices: List[int], labels: List[int]):
        """
        Move selected samples from unlabeled to labeled pool.

        Args:
            selected_indices: Indices of samples to label
            labels: Labels for selected samples
        """
        # Sort indices in descending order to avoid index shifts
        sorted_indices = sorted(selected_indices, reverse=True)

        selected_texts = []
        for idx in sorted_indices:
            selected_texts.append(self.unlabeled_texts.pop(idx))

        # Reverse to maintain original order
        selected_texts.reverse()

        # Add to labeled pool
        self.add_labeled_data(selected_texts, labels)

        logger.info(
            f"Moved {len(selected_texts)} samples to labeled pool. "
            f"Remaining unlabeled: {len(self.unlabeled_texts)}"
        )

    def get_training_data(self) -> Tuple[List[str], List[int]]:
        """
        Get current training data.

        Returns:
            Tuple of (texts, labels)
        """
        return self.labeled_texts, self.labeled_labels

    def get_stats(self) -> Dict[str, Any]:
        """
        Get active learning statistics.

        Returns:
            Statistics dictionary
        """
        return {
            'labeled_samples': len(self.labeled_texts),
            'unlabeled_samples': len(self.unlabeled_texts),
            'strategy': self.strategy,
            'batch_size': self.batch_size,
            'iterations': len(self.iteration_history)
        }

    def log_iteration(
        self,
        model_accuracy: float,
        samples_added: int,
        avg_uncertainty: float
    ):
        """
        Log active learning iteration.

        Args:
            model_accuracy: Current model accuracy
            samples_added: Number of samples added this iteration
            avg_uncertainty: Average uncertainty of selected samples
        """
        self.iteration_history.append({
            'iteration': len(self.iteration_history) + 1,
            'labeled_samples': len(self.labeled_texts),
            'model_accuracy': model_accuracy,
            'samples_added': samples_added,
            'avg_uncertainty': avg_uncertainty
        })


class EnsembleActiveLearner(ActiveLearner):
    """
    Active learner using ensemble disagreement.

    Uses multiple models to identify samples where models disagree,
    indicating uncertainty and potential value for labeling.
    """

    def __init__(self, models: List[Any], batch_size: int = 10):
        """
        Initialize ensemble active learner.

        Args:
            models: List of trained models
            batch_size: Samples to select per iteration
        """
        super().__init__(strategy="committee", batch_size=batch_size)
        self.models = models

    def select_samples(
        self,
        model=None,
        predictions=None,
        probabilities=None
    ) -> List[SamplePriority]:
        """
        Select samples using ensemble disagreement.

        Args:
            model: Ignored (uses ensemble models)
            predictions: Ignored
            probabilities: Ignored

        Returns:
            List of SamplePriority objects
        """
        if not self.unlabeled_texts:
            return []

        logger.info("Computing ensemble predictions...")

        # Get predictions from all models
        all_predictions = []
        all_probabilities = []

        for model in self.models:
            preds = model.predict(self.unlabeled_texts)
            probs = model.predict_proba(self.unlabeled_texts)
            all_predictions.append(preds)
            all_probabilities.append(probs)

        # Compute disagreement scores
        priorities = []

        for i, text in enumerate(self.unlabeled_texts):
            # Get predictions for this sample from all models
            sample_preds = [preds[i] for preds in all_predictions]
            sample_probs = [probs[i] for probs in all_probabilities]

            # Compute disagreement (variance of predictions)
            disagreement = np.var(sample_preds)

            # Average probability
            avg_probs = {}
            for label in sample_probs[0].keys():
                avg_probs[label] = np.mean([p[label] for p in sample_probs])

            pred = max(avg_probs, key=avg_probs.get)
            confidence = max(avg_probs.values())

            priorities.append(SamplePriority(
                text=text,
                index=i,
                uncertainty_score=disagreement,
                prediction=pred,
                confidence=confidence,
                strategy="committee"
            ))

        # Sort and select
        priorities.sort(key=lambda x: x.uncertainty_score, reverse=True)
        selected = priorities[:self.batch_size]

        logger.info(
            f"Selected {len(selected)} samples using committee disagreement. "
            f"Avg disagreement: {np.mean([s.uncertainty_score for s in selected]):.3f}"
        )

        return selected


def create_active_learner(
    strategy: str = "uncertainty",
    batch_size: int = 10,
    models: Optional[List[Any]] = None
) -> ActiveLearner:
    """
    Factory function to create active learner.

    Args:
        strategy: Sampling strategy
        batch_size: Batch size for sampling
        models: Models for ensemble (if using committee strategy)

    Returns:
        ActiveLearner instance
    """
    if strategy == "committee" and models:
        return EnsembleActiveLearner(models=models, batch_size=batch_size)
    else:
        return ActiveLearner(strategy=strategy, batch_size=batch_size)
