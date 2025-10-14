"""
ML Sentiment Classifier Training Pipeline

Trains models on historical catalyst outcomes to predict sentiment and market reaction.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
from datetime import datetime
from typing import Tuple, Dict, Any, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class SentimentTrainer:
    """
    Sentiment classifier trainer for catalyst outcomes.
    
    Trains on historical catalysts to predict:
    - Sentiment (positive/negative/neutral)
    - Market reaction probability
    - Risk-adjusted return potential
    """
    
    def __init__(self, model_dir: str = "ml/sentiment/models"):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.model = None
        self.vectorizer = None
        
    def prepare_data(
        self,
        historical_catalysts_df: pd.DataFrame,
        text_col: str = 'text',
        label_col: str = 'outcome'
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Prepare training data from historical catalysts.
        
        Args:
            historical_catalysts_df: DataFrame with columns:
                - text: Combined title + description
                - outcome: 'positive', 'negative', 'neutral'
                - price_movement: % change in stock price ±30 days
                - event_leverage, timing_clarity, etc. (scoring fields)
            text_col: Name of text column
            label_col: Name of label column
        
        Returns:
            X_train, X_test, y_train, y_test
        """
        logger.info(f"Preparing data from {len(historical_catalysts_df)} historical catalysts")
        
        # Feature engineering: combine text with numerical features
        X_text = historical_catalysts_df[text_col].fillna('').values
        
        # Numerical features from catalyst scoring (if available)
        numeric_cols = [
            'event_leverage',
            'timing_clarity',
            'surprise_factor',
            'downside_contained',
            'market_depth'
        ]
        
        # Only use numeric features if they exist
        available_numeric_cols = [col for col in numeric_cols if col in historical_catalysts_df.columns]
        
        if available_numeric_cols:
            X_numeric = historical_catalysts_df[available_numeric_cols].fillna(0).values
            logger.info(f"Using {len(available_numeric_cols)} numeric features: {available_numeric_cols}")
        else:
            X_numeric = None
            logger.info("No numeric features available, using text only")
        
        # Labels: map outcome to sentiment
        label_map = {'positive': 1, 'negative': 0, 'neutral': 2}
        y = historical_catalysts_df[label_col].map(label_map).values
        
        # Check for any unmapped labels
        if np.any(np.isnan(y)):
            logger.warning(f"Found {np.isnan(y).sum()} unmapped labels")
            # Remove rows with unmapped labels
            valid_mask = ~np.isnan(y)
            X_text = X_text[valid_mask]
            if X_numeric is not None:
                X_numeric = X_numeric[valid_mask]
            y = y[valid_mask]
        
        logger.info(f"Label distribution: {pd.Series(y).value_counts().to_dict()}")
        
        # Split data
        if X_numeric is not None:
            X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = train_test_split(
                X_text, X_numeric, y, test_size=0.3, random_state=42, stratify=y
            )
        else:
            X_train_text, X_test_text, y_train, y_test = train_test_split(
                X_text, y, test_size=0.3, random_state=42, stratify=y
            )
            X_train_num = None
            X_test_num = None
        
        logger.info(f"Train set: {len(X_train_text)} samples")
        logger.info(f"Test set: {len(X_test_text)} samples")
        
        return X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test
    
    def train(
        self,
        X_train_text: np.ndarray,
        X_train_num: Optional[np.ndarray],
        y_train: np.ndarray,
        param_grid: Optional[Dict[str, list]] = None
    ) -> Dict[str, Any]:
        """
        Train sentiment classifier with hyperparameter tuning.
        
        Args:
            X_train_text: Training text data
            X_train_num: Training numeric features (optional)
            y_train: Training labels
            param_grid: Custom hyperparameter grid (optional)
        
        Returns:
            Training metrics and best parameters
        """
        logger.info("Starting sentiment model training...")
        
        # Build pipeline: TF-IDF + Logistic Regression
        # (Can be extended to use BERT or other transformers)
        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ('clf', LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42))
        ])
        
        # Default hyperparameter grid
        if param_grid is None:
            param_grid = {
                'tfidf__max_features': [3000, 5000, 10000],
                'tfidf__ngram_range': [(1, 1), (1, 2)],
                'clf__C': [0.1, 1.0, 10.0],
                'clf__penalty': ['l2']
            }
        
        # Grid search with cross-validation
        grid_search = GridSearchCV(
            pipeline,
            param_grid,
            cv=5,
            scoring='f1_weighted',
            n_jobs=-1,
            verbose=1
        )
        
        logger.info("Running grid search with 5-fold cross-validation...")
        grid_search.fit(X_train_text, y_train)
        
        self.model = grid_search.best_estimator_
        
        logger.info(f"✓ Training complete")
        logger.info(f"Best parameters: {grid_search.best_params_}")
        logger.info(f"Best CV F1 score: {grid_search.best_score_:.4f}")
        
        return {
            'best_params': grid_search.best_params_,
            'best_cv_score': float(grid_search.best_score_),
            'cv_results': {
                'mean_test_score': grid_search.cv_results_['mean_test_score'].tolist(),
                'std_test_score': grid_search.cv_results_['std_test_score'].tolist(),
                'params': [str(p) for p in grid_search.cv_results_['params']]
            },
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def evaluate(
        self,
        X_test_text: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, Any]:
        """
        Evaluate model on test set.
        
        Returns:
            Comprehensive evaluation metrics
        """
        if not self.model:
            raise ValueError("Model not trained or loaded")
        
        logger.info("Evaluating model on test set...")
        
        y_pred = self.model.predict(X_test_text)
        y_pred_proba = self.model.predict_proba(X_test_text)
        
        # Classification metrics
        report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        cm = confusion_matrix(y_test, y_pred)
        
        # ROC AUC (for multiclass, use ovr strategy)
        try:
            roc_auc = roc_auc_score(y_test, y_pred_proba, multi_class='ovr', average='weighted')
        except:
            roc_auc = None
            logger.warning("Could not compute ROC AUC score")
        
        logger.info("✓ Evaluation complete")
        logger.info(f"Accuracy: {report['accuracy']:.4f}")
        logger.info(f"Weighted F1: {report['weighted avg']['f1-score']:.4f}")
        if roc_auc:
            logger.info(f"ROC AUC: {roc_auc:.4f}")
        logger.info(f"\nConfusion Matrix:\n{cm}")
        
        return {
            'accuracy': float(report['accuracy']),
            'precision': float(report['weighted avg']['precision']),
            'recall': float(report['weighted avg']['recall']),
            'f1_score': float(report['weighted avg']['f1-score']),
            'roc_auc': float(roc_auc) if roc_auc else None,
            'confusion_matrix': cm.tolist(),
            'classification_report': report,
            'n_test_samples': len(y_test)
        }
    
    def save_model(self, version: str = "v1"):
        """
        Save trained model to disk.
        
        Args:
            version: Model version identifier
        """
        if not self.model:
            raise ValueError("No model to save")
        
        model_path = self.model_dir / f"sentiment_classifier_{version}.joblib"
        metadata_path = self.model_dir / f"sentiment_classifier_{version}_metadata.json"
        
        # Save model
        joblib.dump(self.model, model_path)
        
        # Save metadata
        import json
        metadata = {
            'version': version,
            'created_at': datetime.utcnow().isoformat(),
            'model_type': 'LogisticRegression + TF-IDF',
            'classes': ['negative', 'positive', 'neutral']
        }
        
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"✓ Model saved to {model_path}")
        logger.info(f"✓ Metadata saved to {metadata_path}")
    
    def load_model(self, version: str = "v1"):
        """
        Load trained model from disk.
        
        Args:
            version: Model version identifier
        """
        model_path = self.model_dir / f"sentiment_classifier_{version}.joblib"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        self.model = joblib.load(model_path)
        logger.info(f"✓ Model loaded from {model_path}")
    
    def predict(self, text: str) -> Dict[str, Any]:
        """
        Predict sentiment for a single text input.
        
        Args:
            text: Text to analyze (catalyst title + description)
        
        Returns:
            {
                'sentiment': 'positive' | 'negative' | 'neutral',
                'confidence': float,
                'probabilities': {
                    'positive': float,
                    'negative': float,
                    'neutral': float
                }
            }
        """
        if not self.model:
            raise ValueError("Model not trained or loaded")
        
        # Predict
        prediction = self.model.predict([text])[0]
        probabilities = self.model.predict_proba([text])[0]
        
        # Map prediction to sentiment
        sentiment_map = {0: 'negative', 1: 'positive', 2: 'neutral'}
        sentiment = sentiment_map[int(prediction)]
        
        return {
            'sentiment': sentiment,
            'confidence': float(np.max(probabilities)),
            'probabilities': {
                'negative': float(probabilities[0]),
                'positive': float(probabilities[1]),
                'neutral': float(probabilities[2])
            }
        }
    
    def predict_batch(self, texts: list) -> list:
        """
        Predict sentiment for multiple texts.
        
        Args:
            texts: List of texts to analyze
        
        Returns:
            List of prediction dictionaries
        """
        if not self.model:
            raise ValueError("Model not trained or loaded")
        
        predictions = self.model.predict(texts)
        probabilities = self.model.predict_proba(texts)
        
        sentiment_map = {0: 'negative', 1: 'positive', 2: 'neutral'}
        
        results = []
        for pred, proba in zip(predictions, probabilities):
            results.append({
                'sentiment': sentiment_map[int(pred)],
                'confidence': float(np.max(proba)),
                'probabilities': {
                    'negative': float(proba[0]),
                    'positive': float(proba[1]),
                    'neutral': float(proba[2])
                }
            })
        
        return results


def main():
    """Example usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Train sentiment classifier")
    parser.add_argument('--data', type=str, required=True, help='Path to historical catalysts CSV')
    parser.add_argument('--version', type=str, default='v1', help='Model version')
    parser.add_argument('--text-col', type=str, default='text', help='Text column name')
    parser.add_argument('--label-col', type=str, default='outcome', help='Label column name')
    
    args = parser.parse_args()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Load data
    logger.info(f"Loading data from {args.data}")
    df = pd.read_csv(args.data)
    logger.info(f"Loaded {len(df)} records")
    
    # Initialize trainer
    trainer = SentimentTrainer()
    
    # Prepare data
    X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = trainer.prepare_data(
        df, text_col=args.text_col, label_col=args.label_col
    )
    
    # Train
    train_metrics = trainer.train(X_train_text, X_train_num, y_train)
    logger.info(f"Training metrics: {train_metrics}")
    
    # Evaluate
    eval_metrics = trainer.evaluate(X_test_text, y_test)
    logger.info(f"Evaluation metrics: {eval_metrics}")
    
    # Save
    trainer.save_model(version=args.version)
    
    # Test inference
    test_text = "FDA approves breakthrough therapy designation for novel oncology drug"
    result = trainer.predict(test_text)
    logger.info(f"Test prediction for '{test_text}': {result}")


if __name__ == "__main__":
    main()
