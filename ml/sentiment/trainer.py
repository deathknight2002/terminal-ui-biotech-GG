"""
ML Sentiment Trainer for Biotech News and Filings
==================================================

Trains a sentiment classifier using scikit-learn to analyze:
- News articles
- Press releases  
- SEC filings
- Clinical trial results
- FDA announcements

Uses TF-IDF vectorization with logistic regression and can be extended
with more sophisticated models (BERT, FinBERT, etc.).
"""

import logging
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.pipeline import Pipeline
import joblib
from pathlib import Path

logger = logging.getLogger(__name__)


class SentimentTrainer:
    """
    ML-based sentiment classifier for biotech content.
    
    Sentiment categories:
    - Bullish (1): Positive developments, approvals, successful trials
    - Neutral (0): Factual information, company updates
    - Bearish (-1): Failures, rejections, safety concerns
    """
    
    def __init__(
        self,
        max_features: int = 5000,
        ngram_range: Tuple[int, int] = (1, 2),
        min_df: int = 2,
        max_df: float = 0.8,
        random_state: int = 42
    ):
        """
        Initialize sentiment trainer.
        
        Args:
            max_features: Maximum number of TF-IDF features
            ngram_range: N-gram range for text vectorization
            min_df: Minimum document frequency for features
            max_df: Maximum document frequency for features
            random_state: Random seed for reproducibility
        """
        self.max_features = max_features
        self.ngram_range = ngram_range
        self.min_df = min_df
        self.max_df = max_df
        self.random_state = random_state
        
        # Build pipeline
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                max_features=self.max_features,
                ngram_range=self.ngram_range,
                min_df=self.min_df,
                max_df=self.max_df,
                stop_words='english',
                sublinear_tf=True
            )),
            ('classifier', LogisticRegression(
                max_iter=1000,
                class_weight='balanced',
                random_state=self.random_state,
                solver='saga',
                penalty='l2',
                C=1.0
            ))
        ])
        
        self.is_fitted = False
        self.feature_names: Optional[List[str]] = None
        self.classes: Optional[np.ndarray] = None
        self.metrics: Dict[str, Any] = {}
        
    def fit(
        self,
        texts: List[str],
        labels: List[int],
        validation_split: float = 0.2
    ) -> Dict[str, Any]:
        """
        Train the sentiment classifier.
        
        Args:
            texts: List of text documents
            labels: List of sentiment labels (-1, 0, 1)
            validation_split: Fraction of data for validation
            
        Returns:
            Dictionary with training metrics
        """
        logger.info(f"Training sentiment classifier on {len(texts)} documents")
        
        # Convert to numpy arrays
        X = np.array(texts)
        y = np.array(labels)
        
        # Validate labels
        unique_labels = np.unique(y)
        if not set(unique_labels).issubset({-1, 0, 1}):
            raise ValueError("Labels must be -1 (bearish), 0 (neutral), or 1 (bullish)")
        
        # Train/validation split
        X_train, X_val, y_train, y_val = train_test_split(
            X, y,
            test_size=validation_split,
            random_state=self.random_state,
            stratify=y
        )
        
        logger.info(f"Training on {len(X_train)} samples, validating on {len(X_val)} samples")
        
        # Train pipeline
        self.pipeline.fit(X_train, y_train)
        self.is_fitted = True
        self.classes = self.pipeline.classes_
        
        # Get feature names
        self.feature_names = self.pipeline.named_steps['tfidf'].get_feature_names_out().tolist()
        
        # Evaluate on validation set
        y_pred = self.pipeline.predict(X_val)
        y_proba = self.pipeline.predict_proba(X_val)
        
        # Calculate metrics
        accuracy = (y_pred == y_val).mean()
        
        # Calculate AUC (one-vs-rest for multiclass)
        try:
            auc = roc_auc_score(y_val, y_proba, multi_class='ovr', average='weighted')
        except Exception as e:
            logger.warning(f"Could not calculate AUC: {e}")
            auc = None
        
        # Cross-validation score
        cv_scores = cross_val_score(
            self.pipeline, X_train, y_train, cv=5, scoring='accuracy'
        )
        
        self.metrics = {
            'accuracy': float(accuracy),
            'auc': float(auc) if auc is not None else None,
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'n_train': len(X_train),
            'n_val': len(X_val),
            'n_features': len(self.feature_names),
            'class_distribution': {
                int(k): int(v) for k, v in zip(*np.unique(y_train, return_counts=True))
            }
        }
        
        # Generate classification report
        report = classification_report(y_val, y_pred, output_dict=True, zero_division=0)
        conf_matrix = confusion_matrix(y_val, y_pred)
        
        logger.info(f"Training completed - Accuracy: {accuracy:.3f}, CV: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        logger.info(f"\n{classification_report(y_val, y_pred, zero_division=0)}")
        
        self.metrics['classification_report'] = report
        self.metrics['confusion_matrix'] = conf_matrix.tolist()
        
        return self.metrics
    
    def predict(self, texts: List[str]) -> np.ndarray:
        """
        Predict sentiment labels for texts.
        
        Args:
            texts: List of text documents
            
        Returns:
            Array of predicted labels (-1, 0, 1)
        """
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before prediction")
        
        return self.pipeline.predict(texts)
    
    def predict_proba(self, texts: List[str]) -> np.ndarray:
        """
        Predict sentiment probabilities for texts.
        
        Args:
            texts: List of text documents
            
        Returns:
            Array of shape (n_samples, n_classes) with probabilities
        """
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before prediction")
        
        return self.pipeline.predict_proba(texts)
    
    def get_sentiment_scores(self, texts: List[str]) -> List[Dict[str, float]]:
        """
        Get detailed sentiment scores for texts.
        
        Args:
            texts: List of text documents
            
        Returns:
            List of dictionaries with sentiment scores and predictions
        """
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before prediction")
        
        predictions = self.predict(texts)
        probabilities = self.predict_proba(texts)
        
        results = []
        for i, text in enumerate(texts):
            # Map class indices to labels
            class_probs = {
                int(cls): float(prob)
                for cls, prob in zip(self.classes, probabilities[i])
            }
            
            # Calculate confidence (max probability)
            confidence = float(np.max(probabilities[i]))
            
            results.append({
                'text': text[:100] + '...' if len(text) > 100 else text,
                'prediction': int(predictions[i]),
                'confidence': confidence,
                'probabilities': class_probs
            })
        
        return results
    
    def get_top_features(self, n: int = 20) -> Dict[int, List[Tuple[str, float]]]:
        """
        Get top features (words/ngrams) for each sentiment class.
        
        Args:
            n: Number of top features to return per class
            
        Returns:
            Dictionary mapping class labels to top features with coefficients
        """
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before getting features")
        
        classifier = self.pipeline.named_steps['classifier']
        
        # Get coefficients for each class
        top_features = {}
        
        for i, class_label in enumerate(self.classes):
            # Get coefficients for this class
            if len(self.classes) == 2:
                # Binary classification
                coef = classifier.coef_[0] if i == 1 else -classifier.coef_[0]
            else:
                # Multiclass classification
                coef = classifier.coef_[i]
            
            # Get top features
            top_indices = np.argsort(np.abs(coef))[-n:][::-1]
            top_features[int(class_label)] = [
                (self.feature_names[idx], float(coef[idx]))
                for idx in top_indices
            ]
        
        return top_features
    
    def save(self, path: str) -> None:
        """
        Save trained model to disk.
        
        Args:
            path: Path to save the model
        """
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before saving")
        
        model_path = Path(path)
        model_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Save model and metadata
        model_data = {
            'pipeline': self.pipeline,
            'feature_names': self.feature_names,
            'classes': self.classes,
            'metrics': self.metrics,
            'config': {
                'max_features': self.max_features,
                'ngram_range': self.ngram_range,
                'min_df': self.min_df,
                'max_df': self.max_df,
                'random_state': self.random_state
            }
        }
        
        joblib.dump(model_data, model_path)
        logger.info(f"Model saved to {model_path}")
    
    @classmethod
    def load(cls, path: str) -> 'SentimentTrainer':
        """
        Load trained model from disk.
        
        Args:
            path: Path to the saved model
            
        Returns:
            Loaded SentimentTrainer instance
        """
        model_data = joblib.load(path)
        
        # Recreate instance
        config = model_data['config']
        trainer = cls(
            max_features=config['max_features'],
            ngram_range=tuple(config['ngram_range']),
            min_df=config['min_df'],
            max_df=config['max_df'],
            random_state=config['random_state']
        )
        
        # Restore state
        trainer.pipeline = model_data['pipeline']
        trainer.feature_names = model_data['feature_names']
        trainer.classes = model_data['classes']
        trainer.metrics = model_data['metrics']
        trainer.is_fitted = True
        
        logger.info(f"Model loaded from {path}")
        return trainer
    
    def evaluate(self, texts: List[str], labels: List[int]) -> Dict[str, Any]:
        """
        Evaluate model on test data.
        
        Args:
            texts: List of text documents
            labels: List of true sentiment labels
            
        Returns:
            Dictionary with evaluation metrics
        """
        if not self.is_fitted:
            raise RuntimeError("Model must be fitted before evaluation")
        
        y_pred = self.predict(texts)
        y_proba = self.predict_proba(texts)
        y_true = np.array(labels)
        
        accuracy = (y_pred == y_true).mean()
        
        try:
            auc = roc_auc_score(y_true, y_proba, multi_class='ovr', average='weighted')
        except Exception:
            auc = None
        
        report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
        conf_matrix = confusion_matrix(y_true, y_pred)
        
        return {
            'accuracy': float(accuracy),
            'auc': float(auc) if auc is not None else None,
            'classification_report': report,
            'confusion_matrix': conf_matrix.tolist(),
            'n_samples': len(texts)
        }


def create_sample_training_data() -> Tuple[List[str], List[int]]:
    """
    Create sample training data for demonstration purposes.
    
    Returns:
        Tuple of (texts, labels)
    """
    # Sample biotech news with sentiment labels
    texts = [
        # Bullish examples (1)
        "FDA approves breakthrough cancer therapy, stock surges 45% in premarket trading",
        "Phase III trial meets primary endpoint with statistical significance",
        "Company receives fast track designation from regulatory agency",
        "Positive topline data shows strong efficacy in target population",
        "Major pharmaceutical company acquires biotech firm at premium valuation",
        "Clinical trial demonstrates superior outcomes compared to standard of care",
        "FDA grants priority review for new drug application",
        "Successful completion of pivotal trial enrollment ahead of schedule",
        
        # Neutral examples (0)
        "Company announces quarterly earnings conference call date",
        "Management presents at healthcare conference in San Francisco",
        "Clinical trial continues to enroll patients as planned",
        "Company provides update on ongoing regulatory submission",
        "New chief medical officer joins executive leadership team",
        "Phase II trial progressing according to protocol timeline",
        "Company files annual report with securities commission",
        "Research collaboration agreement signed with university",
        
        # Bearish examples (-1)
        "FDA issues complete response letter citing manufacturing concerns",
        "Phase III trial fails to meet primary endpoint, shares plummet",
        "Safety concerns lead to clinical hold on ongoing trials",
        "Company announces layoffs and restructuring amid cash constraints",
        "Regulatory approval delayed pending additional clinical data",
        "Adverse events reported in patient population, trial paused",
        "Competitor's drug shows superior efficacy in head-to-head comparison",
        "Clinical trial stopped early for futility after interim analysis"
    ]
    
    labels = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -1, -1]
    
    return texts, labels


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Create sample data
    texts, labels = create_sample_training_data()
    
    # Train model
    trainer = SentimentTrainer()
    metrics = trainer.fit(texts, labels, validation_split=0.2)
    
    print("\nTraining Metrics:")
    print(f"Accuracy: {metrics['accuracy']:.3f}")
    print(f"Cross-validation: {metrics['cv_mean']:.3f} ± {metrics['cv_std']:.3f}")
    
    # Test prediction
    test_texts = [
        "FDA approves new cancer treatment",
        "Company reports quarterly results",
        "Clinical trial fails to meet endpoints"
    ]
    
    scores = trainer.get_sentiment_scores(test_texts)
    print("\nPredictions:")
    for score in scores:
        print(f"Text: {score['text']}")
        print(f"Sentiment: {score['prediction']} (confidence: {score['confidence']:.3f})")
        print()
