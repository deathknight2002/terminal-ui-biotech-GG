"""
ML Endpoints for FastAPI
=========================

REST API endpoints for:
- Sentiment analysis predictions
- Backtesting results
- Model training and evaluation
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Create router
ml_router = APIRouter(prefix="/ml", tags=["ml"])


# ============================================================================
# Request/Response Models
# ============================================================================

class SentimentRequest(BaseModel):
    """Request model for sentiment analysis."""
    texts: List[str] = Field(..., description="List of texts to analyze", min_items=1, max_items=100)


class SentimentScore(BaseModel):
    """Sentiment score for a single text."""
    text: str = Field(..., description="Input text (truncated)")
    prediction: int = Field(..., description="Predicted sentiment: -1 (bearish), 0 (neutral), 1 (bullish)")
    confidence: float = Field(..., description="Confidence score (max probability)", ge=0.0, le=1.0)
    probabilities: Dict[int, float] = Field(..., description="Class probabilities")


class SentimentResponse(BaseModel):
    """Response model for sentiment analysis."""
    results: List[SentimentScore]
    model_version: str = "1.0.0"
    timestamp: str


class BacktestRequest(BaseModel):
    """Request model for backtesting."""
    start_date: str = Field("2020-01-01", description="Start date (YYYY-MM-DD)")
    end_date: str = Field("2024-12-31", description="End date (YYYY-MM-DD)")
    min_train_days: int = Field(365, description="Minimum training days", ge=30, le=1825)
    step_days: int = Field(90, description="Step size in days", ge=7, le=365)
    move_threshold: float = Field(0.10, description="Threshold for significant moves", ge=0.01, le=0.50)


class BacktestResponse(BaseModel):
    """Response model for backtesting results."""
    num_windows: int
    total_train_events: int
    total_test_events: int
    auc_pr: float = Field(..., description="Area under precision-recall curve")
    auc_pr_std: float
    brier_score: float = Field(..., description="Brier score (calibration)")
    brier_score_std: float
    spearman_ic: float = Field(..., description="Spearman information coefficient")
    spearman_ic_std: float
    top_decile_hit_rate: float
    long_short_ir: float = Field(..., description="Long/short information ratio")
    long_short_ir_std: float
    timestamp: str


class ModelInfo(BaseModel):
    """Model information."""
    model_type: str
    version: str
    is_trained: bool
    metrics: Optional[Dict[str, Any]] = None
    last_trained: Optional[str] = None


# ============================================================================
# Global model instances (lazy loading)
# ============================================================================

_sentiment_model = None
_backtest_engine = None


def get_sentiment_model():
    """Get or create sentiment model instance."""
    global _sentiment_model

    if _sentiment_model is None:
        try:
            from ml.sentiment.trainer import (
                SentimentTrainer,
                create_sample_training_data,
            )

            # Try to load pre-trained model
            try:
                _sentiment_model = SentimentTrainer.load('/tmp/sentiment_model.joblib')
                logger.info("Loaded pre-trained sentiment model")
            except FileNotFoundError:
                # Train on sample data if no model exists
                logger.info("No pre-trained model found, training on sample data...")
                _sentiment_model = SentimentTrainer()
                texts, labels = create_sample_training_data()
                _sentiment_model.fit(texts, labels)
                _sentiment_model.save('/tmp/sentiment_model.joblib')
                logger.info("Trained and saved new sentiment model")
        except Exception as e:
            logger.error(f"Failed to initialize sentiment model: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to initialize model: {str(e)}")

    return _sentiment_model


def get_backtest_engine():
    """Get or create backtest engine instance."""
    global _backtest_engine

    if _backtest_engine is None:
        try:
            from ml.backtesting.engine import BacktestEngine
            _backtest_engine = BacktestEngine()
            logger.info("Initialized backtest engine")
        except Exception as e:
            logger.error(f"Failed to initialize backtest engine: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to initialize engine: {str(e)}")

    return _backtest_engine


# ============================================================================
# Sentiment Analysis Endpoints
# ============================================================================

@ml_router.post("/sentiment/predict", response_model=SentimentResponse)
async def predict_sentiment(request: SentimentRequest):
    """
    Predict sentiment for input texts.
    
    Returns sentiment scores for each text:
    - Prediction: -1 (bearish), 0 (neutral), 1 (bullish)
    - Confidence: Model confidence (max probability)
    - Probabilities: Full probability distribution
    
    Example:
    ```
    POST /api/v1/ml/sentiment/predict
    {
        "texts": [
            "FDA approves breakthrough cancer therapy",
            "Company reports quarterly earnings",
            "Clinical trial fails primary endpoint"
        ]
    }
    ```
    """
    try:
        model = get_sentiment_model()

        # Get predictions
        scores = model.get_sentiment_scores(request.texts)

        return SentimentResponse(
            results=[SentimentScore(**score) for score in scores],
            model_version="1.0.0",
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        logger.error(f"Sentiment prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@ml_router.get("/sentiment/info", response_model=ModelInfo)
async def get_sentiment_model_info():
    """
    Get information about the sentiment model.
    
    Returns model type, version, training status, and metrics.
    """
    try:
        model = get_sentiment_model()

        return ModelInfo(
            model_type="sentiment_classifier",
            version="1.0.0",
            is_trained=model.is_fitted,
            metrics=model.metrics if model.is_fitted else None,
            last_trained=datetime.utcnow().isoformat() if model.is_fitted else None
        )

    except Exception as e:
        logger.error(f"Failed to get model info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get info: {str(e)}")


@ml_router.get("/sentiment/features")
async def get_top_features(n: int = Query(20, ge=5, le=100)):
    """
    Get top features (words/ngrams) for each sentiment class.
    
    Returns the most important features learned by the model
    for predicting each sentiment category.
    
    Query Parameters:
    - n: Number of top features per class (default: 20)
    """
    try:
        model = get_sentiment_model()

        if not model.is_fitted:
            raise HTTPException(status_code=400, detail="Model is not trained")

        features = model.get_top_features(n=n)

        return {
            "top_features": features,
            "n_features": n,
            "model_version": "1.0.0"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get features: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get features: {str(e)}")


# ============================================================================
# Backtesting Endpoints
# ============================================================================

@ml_router.post("/backtest/run", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest):
    """
    Run expanding-window backtest on catalyst predictions.
    
    Evaluates model performance on historical data using proper
    time-based train/test splits to avoid lookahead bias.
    
    Metrics:
    - AUC-PR: Precision-recall curve area (higher is better)
    - Brier Score: Probability calibration (lower is better)
    - Spearman IC: Rank correlation with actual moves
    - Top-Decile Hit Rate: Accuracy on highest-conviction predictions
    - Long/Short IR: Information ratio for portfolio strategy
    
    Example:
    ```
    POST /api/v1/ml/backtest/run
    {
        "start_date": "2020-01-01",
        "end_date": "2024-12-31",
        "min_train_days": 365,
        "step_days": 90,
        "move_threshold": 0.10
    }
    ```
    """
    try:
        engine = get_backtest_engine()

        # Update engine parameters
        engine.move_threshold = request.move_threshold

        # Run backtest
        results = engine.run_expanding_window_backtest(
            events_df=None,  # Uses synthetic data
            start_date=request.start_date,
            end_date=request.end_date,
            min_train_days=request.min_train_days,
            step_days=request.step_days
        )

        return BacktestResponse(
            num_windows=results['num_windows'],
            total_train_events=results['total_train_events'],
            total_test_events=results['total_test_events'],
            auc_pr=results['auc_pr'],
            auc_pr_std=results['auc_pr_std'],
            brier_score=results['brier_score'],
            brier_score_std=results['brier_score_std'],
            spearman_ic=results['spearman_ic'],
            spearman_ic_std=results['spearman_ic_std'],
            top_decile_hit_rate=results['top_decile_hit_rate'],
            long_short_ir=results['long_short_ir'],
            long_short_ir_std=results['long_short_ir_std'],
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        logger.error(f"Backtest failed: {e}")
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")


@ml_router.get("/backtest/summary")
async def get_backtest_summary():
    """
    Get summary of last backtest run.
    
    Returns formatted text report with performance metrics
    and validation results.
    """
    try:
        engine = get_backtest_engine()

        if not engine.results:
            raise HTTPException(status_code=404, detail="No backtest results available. Run backtest first.")

        summary = engine.get_summary_report()

        return {
            "summary": summary,
            "results": engine.results,
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")


# ============================================================================
# Health Check
# ============================================================================

@ml_router.get("/health")
async def ml_health_check():
    """
    Check health of ML services.
    
    Returns status of sentiment model and backtest engine.
    """
    status = {
        "status": "healthy",
        "services": {}
    }

    # Check sentiment model
    try:
        model = get_sentiment_model()
        status["services"]["sentiment"] = {
            "available": True,
            "trained": model.is_fitted
        }
    except Exception as e:
        status["services"]["sentiment"] = {
            "available": False,
            "error": str(e)
        }
        status["status"] = "degraded"

    # Check backtest engine
    try:
        engine = get_backtest_engine()
        status["services"]["backtest"] = {
            "available": True,
            "last_run": engine.results.get("timestamp") if engine.results else None
        }
    except Exception as e:
        status["services"]["backtest"] = {
            "available": False,
            "error": str(e)
        }
        status["status"] = "degraded"

    return status


# ============================================================================
# Export router for use in main app
# ============================================================================

__all__ = ["ml_router"]
