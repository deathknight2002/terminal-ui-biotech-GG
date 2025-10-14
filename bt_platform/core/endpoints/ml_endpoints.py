"""
ML and Backtesting API Endpoints

Provides RESTful API for:
- Sentiment prediction
- Historical backtest results
- Model management
"""

from fastapi import APIRouter, HTTPException, Body, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime

router = APIRouter(prefix="/api/v1/ml", tags=["machine-learning"])

logger = logging.getLogger(__name__)


# ============================================================================
# Request/Response Models
# ============================================================================

class SentimentRequest(BaseModel):
    """Request model for sentiment prediction"""
    text: str = Field(..., description="Text to analyze (catalyst title + description)")
    model_version: str = Field(default="v1", description="ML model version to use")


class SentimentResponse(BaseModel):
    """Response model for sentiment prediction"""
    sentiment: str = Field(..., description="Predicted sentiment: positive, negative, or neutral")
    confidence: float = Field(..., description="Confidence score (0-1)")
    probabilities: Dict[str, float] = Field(..., description="Probability distribution")
    model_version: str = Field(..., description="Model version used")


class BatchSentimentRequest(BaseModel):
    """Request model for batch sentiment prediction"""
    texts: List[str] = Field(..., description="List of texts to analyze")
    model_version: str = Field(default="v1", description="ML model version to use")


class BacktestRequest(BaseModel):
    """Request model for running backtest"""
    start_date: str = Field(..., description="Start date (ISO format: YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (ISO format: YYYY-MM-DD)")
    min_score: Optional[int] = Field(default=None, description="Minimum catalyst score")
    tier: Optional[str] = Field(default=None, description="Filter by tier")


class BacktestMetricsResponse(BaseModel):
    """Response model for backtest metrics"""
    n_catalysts: int
    win_rate: float
    avg_7d_return: float
    avg_30d_return: float
    sharpe_ratio: float
    max_drawdown: float
    total_return: float


# ============================================================================
# Sentiment Endpoints
# ============================================================================

@router.post("/sentiment/predict", response_model=SentimentResponse)
async def predict_sentiment(request: SentimentRequest) -> SentimentResponse:
    """
    Predict sentiment for catalyst text using ML model.
    
    Uses trained sentiment classifier to predict:
    - Sentiment (positive/negative/neutral)
    - Confidence score
    - Probability distribution
    
    Example:
    ```
    POST /api/v1/ml/sentiment/predict
    {
        "text": "FDA approves breakthrough therapy designation",
        "model_version": "v1"
    }
    ```
    """
    try:
        from ml.sentiment.trainer import SentimentTrainer
        
        # Load model
        trainer = SentimentTrainer()
        trainer.load_model(version=request.model_version)
        
        # Predict
        result = trainer.predict(request.text)
        
        return SentimentResponse(
            sentiment=result['sentiment'],
            confidence=result['confidence'],
            probabilities=result['probabilities'],
            model_version=request.model_version
        )
    
    except FileNotFoundError:
        logger.error(f"Model version {request.model_version} not found")
        raise HTTPException(
            status_code=404, 
            detail=f"Model version '{request.model_version}' not found. "
                   f"Train a model first using: poetry run python -m ml.sentiment.trainer"
        )
    except Exception as e:
        logger.error(f"Sentiment prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sentiment/predict-batch")
async def predict_sentiment_batch(request: BatchSentimentRequest) -> List[SentimentResponse]:
    """
    Predict sentiment for multiple texts in batch.
    
    More efficient than multiple single predictions.
    
    Example:
    ```
    POST /api/v1/ml/sentiment/predict-batch
    {
        "texts": [
            "FDA approves new drug",
            "Clinical trial fails to meet endpoints",
            "Company announces partnership"
        ],
        "model_version": "v1"
    }
    ```
    """
    try:
        from ml.sentiment.trainer import SentimentTrainer
        
        # Load model
        trainer = SentimentTrainer()
        trainer.load_model(version=request.model_version)
        
        # Predict batch
        results = trainer.predict_batch(request.texts)
        
        return [
            SentimentResponse(
                sentiment=r['sentiment'],
                confidence=r['confidence'],
                probabilities=r['probabilities'],
                model_version=request.model_version
            )
            for r in results
        ]
    
    except FileNotFoundError:
        raise HTTPException(
            status_code=404, 
            detail=f"Model version '{request.model_version}' not found"
        )
    except Exception as e:
        logger.error(f"Batch sentiment prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Backtesting Endpoints
# ============================================================================

@router.get("/backtest/metrics", response_model=BacktestMetricsResponse)
async def get_backtest_metrics(
    tier: Optional[str] = Query(default=None, description="Filter by tier"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    days: int = Query(default=730, description="Number of days of historical data")
) -> BacktestMetricsResponse:
    """
    Get historical backtest metrics for a catalyst tier/category.
    
    Returns performance metrics from historical data:
    - Win rate (% positive outcomes)
    - Average returns
    - Risk metrics (Sharpe ratio, max drawdown)
    
    Example:
    ```
    GET /api/v1/ml/backtest/metrics?tier=High-Torque&days=365
    ```
    """
    try:
        from ml.backtesting.engine import BacktestEngine
        from datetime import timedelta
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Run backtest
        with BacktestEngine() as engine:
            df = engine.load_historical_catalysts(
                start_date.strftime('%Y-%m-%d'),
                end_date.strftime('%Y-%m-%d')
            )
            
            # Filter by tier if specified
            if tier:
                df = df[df['tier'] == tier]
            
            # Filter by category if specified
            if category:
                df = df[df['category'] == category]
            
            metrics = engine.compute_metrics(df)
        
        return BacktestMetricsResponse(**metrics)
    
    except Exception as e:
        logger.error(f"Backtest metrics error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backtest/run")
async def run_backtest(request: BacktestRequest) -> Dict[str, Any]:
    """
    Run full backtest for specified date range.
    
    Comprehensive backtest including:
    - Metrics by tier
    - Calibration analysis
    - Feature importance
    
    Example:
    ```
    POST /api/v1/ml/backtest/run
    {
        "start_date": "2020-01-01",
        "end_date": "2024-12-31",
        "min_score": 8
    }
    ```
    """
    try:
        from ml.backtesting.engine import BacktestEngine
        
        with BacktestEngine() as engine:
            results = engine.run_backtest(
                start_date=request.start_date,
                end_date=request.end_date,
                min_score=request.min_score
            )
        
        return {
            "status": "success",
            "data": results
        }
    
    except Exception as e:
        logger.error(f"Backtest run error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/backtest/calibration")
async def get_calibration_analysis(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
) -> Dict[str, Any]:
    """
    Get calibration analysis: do high-scored catalysts perform better?
    
    Returns win rates and returns by score bin.
    
    Example:
    ```
    GET /api/v1/ml/backtest/calibration?start_date=2020-01-01&end_date=2024-12-31
    ```
    """
    try:
        from ml.backtesting.engine import BacktestEngine
        
        with BacktestEngine() as engine:
            df = engine.load_historical_catalysts(start_date, end_date)
            calibration = engine.calibration_analysis(df)
        
        return {
            "status": "success",
            "data": calibration.to_dict('records')
        }
    
    except Exception as e:
        logger.error(f"Calibration analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/backtest/feature-importance")
async def get_feature_importance(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
) -> Dict[str, Any]:
    """
    Get feature importance: which scoring dimensions predict outcomes best?
    
    Uses Random Forest to measure importance of each scoring dimension.
    
    Example:
    ```
    GET /api/v1/ml/backtest/feature-importance?start_date=2020-01-01&end_date=2024-12-31
    ```
    """
    try:
        from ml.backtesting.engine import BacktestEngine
        
        with BacktestEngine() as engine:
            df = engine.load_historical_catalysts(start_date, end_date)
            importance = engine.feature_importance(df)
        
        return {
            "status": "success",
            "data": importance.to_dict('records')
        }
    
    except Exception as e:
        logger.error(f"Feature importance error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Health/Status Endpoints
# ============================================================================

@router.get("/health")
async def ml_health_check() -> Dict[str, Any]:
    """
    Health check for ML services.
    
    Returns status of ML models and backtesting database.
    """
    try:
        from ml.sentiment.trainer import SentimentTrainer
        from ml.backtesting.engine import BacktestEngine
        from pathlib import Path
        
        # Check sentiment model
        sentiment_status = "unavailable"
        try:
            trainer = SentimentTrainer()
            trainer.load_model(version="v1")
            sentiment_status = "available"
        except:
            pass
        
        # Check backtest database
        backtest_status = "unavailable"
        try:
            db_path = Path("data/historical.duckdb")
            if db_path.exists():
                backtest_status = "available"
        except:
            pass
        
        return {
            "status": "healthy",
            "services": {
                "sentiment_model": sentiment_status,
                "backtest_database": backtest_status
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
