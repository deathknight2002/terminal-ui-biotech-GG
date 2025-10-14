# Biotech Terminal Extensibility Framework

> **Comprehensive guide for extending the platform with new scrapers, ML models, backtesting, and real-time streaming**

## Table of Contents

1. [Overview](#overview)
2. [Scraper Extensibility](#scraper-extensibility)
3. [WebSocket Streaming](#websocket-streaming)
4. [ML Sentiment Classifier](#ml-sentiment-classifier)
5. [Backtesting Framework](#backtesting-framework)
6. [Catalyst Scoring Integration](#catalyst-scoring-integration)
7. [Quick Start Examples](#quick-start-examples)

---

## Overview

The Biotech Terminal is designed for extensibility across five key dimensions:

### Architecture Principles

1. **Plugin-Based Scrapers**: Standardized interface for adding new data sources
2. **Event-Driven Streaming**: Real-time catalyst signals via WebSocket
3. **ML Pipeline**: Modular sentiment analysis with historical training
4. **Backtesting Engine**: Validate scoring algorithms against historical outcomes
5. **Catalyst Integration**: Seamless connection to existing scoring system

### Technology Stack

- **Backend**: Python FastAPI (scrapers, ML, backtesting) + Node.js Express (WebSocket, real-time)
- **ML Framework**: scikit-learn, transformers (for NLP), pandas (data pipeline)
- **Data Storage**: PostgreSQL (structured), DuckDB (analytics), Redis (caching)
- **Streaming**: Socket.IO (WebSocket), EventEmitter (event bus)

---

## Scraper Extensibility

### 16+ Planned Scrapers

The framework supports adding scrapers for:

1. **Professional Networks**: LinkedIn biotech jobs, company updates
2. **Academic**: PubMed publications, bioRxiv preprints
3. **Regulatory**: FDA PDUFA dates, AdCom schedules, EMA decisions
4. **Conferences**: JPM Healthcare, ASCO, ASH calendars
5. **Clinical Trials**: Enhanced ClinicalTrials.gov Phase 3 tracker
6. **Insider Trading**: SEC Form 4 filings for biotech executives
7. **SEC Filings**: 8-K catalyst detection (trials, partnerships)
8. **Financial News**: Bloomberg, Reuters, STAT News
9. **Company Sites**: IR pages, press release feeds
10. **Twitter/Social**: Key opinion leaders, company accounts
11. **Patents**: USPTO biotech patent filings
12. **Analyst Reports**: Street consensus on endpoints
13. **Biotech Forums**: Reddit r/biotech, BioSpace discussions
14. **Industry Publications**: GEN, BioPharm International
15. **Investment Funds**: 13F filings (Redmile, Baker Bros, RA Capital)
16. **Clinical Data**: Phase 2/3 readout announcements

### Scraper Base Interface

All scrapers must implement `ScraperInterface` from `bt_platform/scrapers/base/interface.py`:

```python
from bt_platform.scrapers.base.interface import ScraperInterface, ScraperResult, ContentType
from typing import Dict, List, Optional, Any
from datetime import datetime

class MyCustomScraper(ScraperInterface):
    """
    Example: LinkedIn Biotech Jobs Scraper
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.api_key = config.get('api_key') if config else None
        
    async def discover(
        self,
        method: str = "api",
        since: Optional[datetime] = None,
        limit: Optional[int] = None,
        **kwargs
    ) -> List[str]:
        """
        Discover job posting URLs or API endpoints.
        
        Returns:
            List of URLs to scrape
        """
        # Implementation: query LinkedIn API or RSS feed
        urls = []
        # ... discovery logic
        return urls[:limit] if limit else urls
    
    async def fetch(
        self,
        urls: List[str],
        batch_size: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Fetch content with rate limiting.
        
        Returns:
            List of raw content dictionaries
        """
        # Implementation: HTTP requests with retry logic
        results = []
        for url in urls:
            # ... fetch logic with rate limiting
            results.append({
                'url': url,
                'html': html_content,
                'status_code': 200
            })
        return results
    
    async def parse(self, raw_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract structured data from HTML/JSON.
        
        Returns:
            Structured data dictionary
        """
        # Implementation: parse HTML or JSON
        return {
            'title': 'Senior Scientist - Oncology',
            'company': 'Vertex Pharmaceuticals',
            'location': 'Boston, MA',
            'posted_date': '2024-01-15',
            'description': '...',
            'therapeutic_area': 'Oncology'
        }
    
    async def normalize(self, parsed_data: Dict[str, Any]) -> ScraperResult:
        """
        Map to standard ScraperResult format.
        
        Returns:
            ScraperResult with standardized fields
        """
        return ScraperResult(
            content_type=ContentType.ARTICLE,
            data=parsed_data,
            url=parsed_data.get('url', ''),
            companies=[parsed_data.get('company', '')],
            published_at=datetime.fromisoformat(parsed_data.get('posted_date'))
        )
```

### Adding Scrapers to Registry

Register new scrapers in `bt_platform/scrapers/registry.yaml`:

```yaml
scrapers:
  professional_networks:
    - source_key: linkedin_jobs
      name: LinkedIn Biotech Jobs
      base_url: https://www.linkedin.com/jobs
      enabled: true
      rate_limit:
        max_rps: 0.5
        max_concurrent: 2
      discovery:
        has_api: true
        api_url: https://api.linkedin.com/v2/jobs
        has_rss: true
        rss_url: https://www.linkedin.com/jobs/search?keywords=biotech
      robots:
        respect: true
        user_agent: "BiotechTerminal/1.0 (contact@bioterminal.dev)"
      extra:
        requires_auth: true
        api_key_env: LINKEDIN_API_KEY
        
  academic:
    - source_key: pubmed
      name: PubMed
      base_url: https://pubmed.ncbi.nlm.nih.gov
      enabled: true
      rate_limit:
        max_rps: 3.0
        max_concurrent: 4
      discovery:
        has_api: true
        api_url: https://eutils.ncbi.nlm.nih.gov/entrez/eutils
        has_rss: true
        rss_url: https://pubmed.ncbi.nlm.nih.gov/rss
      robots:
        respect: true
        user_agent: "BiotechTerminal/1.0 (contact@bioterminal.dev)"
      extra:
        api_key_env: PUBMED_API_KEY
        search_terms: ["biotech", "clinical trial", "phase 3"]
```

### CLI Usage

```bash
# Scrape LinkedIn jobs (last 7 days, max 50 results)
poetry run python -m bt_platform.cli.scrape --source linkedin_jobs --since 7d --limit 50

# Scrape PubMed with API key
export PUBMED_API_KEY=your_key_here
poetry run python -m bt_platform.cli.scrape --source pubmed --since 30d --limit 100

# Dry run (no database writes)
poetry run python -m bt_platform.cli.scrape --source pubmed --dry-run

# Save fixtures for testing
poetry run python -m bt_platform.cli.scrape --source linkedin_jobs --save-fixture --limit 10
```

---

## WebSocket Streaming

### Real-Time Catalyst Signals

The Node.js backend provides WebSocket streaming for real-time catalyst detection and updates.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Client Applications                        │
│  (Terminal App, Mobile App, External Services)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ Socket.IO WebSocket
                       ↓
┌─────────────────────────────────────────────────────────────┐
│            Node.js WebSocket Server (port 3001)             │
│  • Connection management                                     │
│  • Room-based subscriptions (catalyst:updates, etc.)        │
│  • Event broadcasting                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ EventEmitter
                       ↓
┌─────────────────────────────────────────────────────────────┐
│               Scraping Manager (Node.js)                     │
│  • Health monitoring                                         │
│  • Scraper orchestration                                     │
│  • Event emission (scraping:success, health:change)         │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API / Message Queue
                       ↓
┌─────────────────────────────────────────────────────────────┐
│         Python Backend (FastAPI, port 8000)                  │
│  • Catalyst scoring                                          │
│  • Database updates                                          │
│  • ML sentiment analysis                                     │
└─────────────────────────────────────────────────────────────┘
```

### Client-Side Usage

```typescript
// Terminal app example: src/hooks/useCatalystStream.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useCatalystStream() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [catalysts, setCatalysts] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Subscribe to catalyst updates
    newSocket.emit('scraping:subscribe', {
      channels: ['updates', 'health', 'metrics']
    });

    // Listen for catalyst events
    newSocket.on('scraping:completed', (event: any) => {
      console.log('New catalyst detected:', event);
      if (event.data?.catalysts) {
        setCatalysts(prev => [...prev, ...event.data.catalysts]);
      }
    });

    // Listen for health updates
    newSocket.on('health:update', (event: any) => {
      setHealth(event.data);
    });

    // Handle connection events
    newSocket.on('connect', () => {
      console.log('Connected to catalyst stream');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from catalyst stream');
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('scraping:unsubscribe', {
        channels: ['updates', 'health', 'metrics']
      });
      newSocket.close();
    };
  }, []);

  return { socket, catalysts, health };
}
```

### Server-Side Event Publishing

```python
# Python backend: bt_platform/events/catalyst_events.py
import asyncio
from typing import Any, Dict
import httpx

async def publish_catalyst_event(catalyst_data: Dict[str, Any]):
    """
    Publish catalyst event to Node.js WebSocket server.
    
    This is called after a new catalyst is detected and scored.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'http://localhost:3001/api/events/catalyst',
                json={
                    'type': 'catalyst:detected',
                    'data': catalyst_data,
                    'timestamp': datetime.utcnow().isoformat()
                },
                timeout=5.0
            )
            
            if response.status_code == 200:
                logger.info(f"Published catalyst event: {catalyst_data.get('id')}")
            else:
                logger.warning(f"Failed to publish event: {response.status_code}")
                
    except Exception as e:
        logger.error(f"Error publishing catalyst event: {e}")
```

### WebSocket Events Reference

**Client → Server:**
- `scraping:subscribe` - Subscribe to channels (updates, health, metrics)
- `scraping:unsubscribe` - Unsubscribe from channels
- `scraping:get-health` - Request current health status
- `scraping:get-stats` - Request scraper statistics
- `scraping:pubmed-search` - Trigger PubMed search with real-time results

**Server → Client:**
- `scraping:completed` - Scraping job completed with results
- `scraping:failed` - Scraping job failed with error
- `scraping:started` - Scraping job started
- `health:update` - Health status update (all scrapers)
- `health:change` - Health status changed (specific scraper)
- `performance:snapshot` - Performance metrics snapshot

---

## ML Sentiment Classifier

### Overview

Train sentiment models on historical catalyst outcomes to predict market reaction and refine scoring.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Historical Data Sources                     │
│  • Past catalyst outcomes (FDA approvals, trial readouts)   │
│  • Stock price movements (±30 days around event)            │
│  • News sentiment (scraped articles)                         │
│  • Analyst reports (upgrades/downgrades)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Data Preparation Pipeline                       │
│  • Feature extraction (text embeddings, numerical features) │
│  • Labeling (positive/negative/neutral outcomes)            │
│  • Train/val/test split (70/15/15)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                ML Training Pipeline                          │
│  • Model selection (BERT, DistilBERT, Logistic Regression)  │
│  • Hyperparameter tuning (grid search)                      │
│  • Cross-validation                                          │
│  • Model persistence                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Inference & Integration                         │
│  • Real-time sentiment scoring                              │
│  • Integration with catalyst scoring                         │
│  • Confidence intervals                                      │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

**Location:** `ml/sentiment/`

```python
# ml/sentiment/trainer.py
"""
ML Sentiment Classifier Training Pipeline

Trains models on historical catalyst outcomes to predict sentiment.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
import joblib
from datetime import datetime
from typing import Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class SentimentTrainer:
    """
    Sentiment classifier trainer for catalyst outcomes.
    """
    
    def __init__(self, model_dir: str = "ml/sentiment/models"):
        self.model_dir = model_dir
        self.model = None
        self.vectorizer = None
        
    def prepare_data(
        self,
        historical_catalysts_df: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """
        Prepare training data from historical catalysts.
        
        Args:
            historical_catalysts_df: DataFrame with columns:
                - text: Combined title + description
                - outcome: 'positive', 'negative', 'neutral'
                - price_movement: % change in stock price ±30 days
                - event_leverage, timing_clarity, etc. (scoring fields)
        
        Returns:
            X_train, X_test, y_train, y_test
        """
        # Feature engineering: combine text with numerical features
        X_text = historical_catalysts_df['text'].values
        
        # Numerical features from catalyst scoring
        X_numeric = historical_catalysts_df[[
            'event_leverage',
            'timing_clarity',
            'surprise_factor',
            'downside_contained',
            'market_depth'
        ]].fillna(0).values
        
        # Labels: map outcome to sentiment
        label_map = {'positive': 1, 'negative': 0, 'neutral': 2}
        y = historical_catalysts_df['outcome'].map(label_map).values
        
        # Split data
        X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = train_test_split(
            X_text, X_numeric, y, test_size=0.3, random_state=42, stratify=y
        )
        
        return X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test
    
    def train(
        self,
        X_train_text: np.ndarray,
        X_train_num: np.ndarray,
        y_train: np.ndarray
    ) -> Dict[str, Any]:
        """
        Train sentiment classifier with hyperparameter tuning.
        
        Returns:
            Training metrics and best parameters
        """
        # Build pipeline: TF-IDF + Logistic Regression
        # (Can be extended to use BERT or other transformers)
        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=5000, ngram_range=(1, 2))),
            ('clf', LogisticRegression(max_iter=1000, class_weight='balanced'))
        ])
        
        # Hyperparameter grid
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
        
        logger.info("Starting grid search for sentiment model...")
        grid_search.fit(X_train_text, y_train)
        
        self.model = grid_search.best_estimator_
        
        logger.info(f"Best parameters: {grid_search.best_params_}")
        logger.info(f"Best CV score: {grid_search.best_score_:.4f}")
        
        return {
            'best_params': grid_search.best_params_,
            'best_cv_score': grid_search.best_score_,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def evaluate(
        self,
        X_test_text: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, Any]:
        """
        Evaluate model on test set.
        """
        y_pred = self.model.predict(X_test_text)
        
        report = classification_report(y_test, y_pred, output_dict=True)
        cm = confusion_matrix(y_test, y_pred)
        
        logger.info("Test set evaluation:")
        logger.info(f"Accuracy: {report['accuracy']:.4f}")
        logger.info(f"\nClassification Report:\n{classification_report(y_test, y_pred)}")
        logger.info(f"\nConfusion Matrix:\n{cm}")
        
        return {
            'accuracy': report['accuracy'],
            'precision': report['weighted avg']['precision'],
            'recall': report['weighted avg']['recall'],
            'f1_score': report['weighted avg']['f1-score'],
            'confusion_matrix': cm.tolist()
        }
    
    def save_model(self, version: str = "v1"):
        """
        Save trained model to disk.
        """
        model_path = f"{self.model_dir}/sentiment_classifier_{version}.joblib"
        joblib.dump(self.model, model_path)
        logger.info(f"Model saved to {model_path}")
    
    def load_model(self, version: str = "v1"):
        """
        Load trained model from disk.
        """
        model_path = f"{self.model_dir}/sentiment_classifier_{version}.joblib"
        self.model = joblib.load(model_path)
        logger.info(f"Model loaded from {model_path}")
    
    def predict(self, text: str) -> Dict[str, Any]:
        """
        Predict sentiment for a single text input.
        
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
        
        prediction = self.model.predict([text])[0]
        probabilities = self.model.predict_proba([text])[0]
        
        sentiment_map = {0: 'negative', 1: 'positive', 2: 'neutral'}
        sentiment = sentiment_map[prediction]
        
        return {
            'sentiment': sentiment,
            'confidence': float(np.max(probabilities)),
            'probabilities': {
                'negative': float(probabilities[0]),
                'positive': float(probabilities[1]),
                'neutral': float(probabilities[2])
            }
        }


# Usage example
if __name__ == "__main__":
    # Load historical data
    historical_data = pd.read_csv("data/historical_catalysts.csv")
    
    # Initialize trainer
    trainer = SentimentTrainer()
    
    # Prepare data
    X_train_text, X_test_text, X_train_num, X_test_num, y_train, y_test = trainer.prepare_data(
        historical_data
    )
    
    # Train
    train_metrics = trainer.train(X_train_text, X_train_num, y_train)
    
    # Evaluate
    eval_metrics = trainer.evaluate(X_test_text, y_test)
    
    # Save
    trainer.save_model(version="v1")
    
    # Test inference
    test_text = "Vertex announces positive Phase 3 results for cystic fibrosis drug"
    result = trainer.predict(test_text)
    print(f"Prediction: {result}")
```

### CLI Usage

```bash
# Train sentiment model on historical data
poetry run python -m ml.sentiment.trainer --data data/historical_catalysts.csv --version v1

# Evaluate existing model
poetry run python -m ml.sentiment.trainer --evaluate --model-version v1 --test-data data/test_catalysts.csv

# Predict sentiment for new text
poetry run python -m ml.sentiment.predict --text "FDA approves breakthrough therapy designation" --model-version v1
```

---

## Backtesting Framework

### Overview

Validate catalyst scoring methodology against historical data to measure predictive accuracy.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Historical Database (DuckDB)                 │
│  • Catalysts with outcomes (2015-2024)                      │
│  • Stock prices (daily OHLCV)                               │
│  • Scoring fields (event_leverage, timing_clarity, etc.)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                Backtesting Engine                            │
│  • Point-in-time scoring (no lookahead bias)                │
│  • Outcome measurement (stock price movements)              │
│  • Stratification (by tier, therapeutic area, market cap)   │
│  • Statistical validation (Sharpe ratio, win rate)          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│            Results & Visualization                           │
│  • Cumulative returns by tier                               │
│  • Confusion matrix (predicted vs actual outcome)           │
│  • Calibration curves                                        │
│  • Feature importance                                        │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

**Location:** `ml/backtesting/`

```python
# ml/backtesting/engine.py
"""
Backtesting Engine for Catalyst Scoring Validation

Validates scoring methodology against historical outcomes.
"""

import duckdb
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class BacktestEngine:
    """
    Backtesting engine for catalyst scoring validation.
    """
    
    def __init__(self, db_path: str = "data/historical.duckdb"):
        self.db_path = db_path
        self.conn = duckdb.connect(db_path, read_only=True)
        
    def load_historical_catalysts(
        self,
        start_date: str,
        end_date: str
    ) -> pd.DataFrame:
        """
        Load historical catalysts with scoring fields.
        
        Args:
            start_date: ISO format (e.g., '2020-01-01')
            end_date: ISO format (e.g., '2024-12-31')
        
        Returns:
            DataFrame with catalyst data
        """
        query = f"""
        SELECT
            c.id,
            c.title,
            c.company,
            c.drug,
            c.event_type,
            c.event_date,
            c.event_leverage,
            c.timing_clarity,
            c.surprise_factor,
            c.downside_contained,
            c.market_depth,
            c.total_score,
            c.tier,
            o.outcome,
            o.price_movement_7d,
            o.price_movement_30d,
            o.volatility
        FROM catalysts c
        LEFT JOIN catalyst_outcomes o ON c.id = o.catalyst_id
        WHERE c.event_date BETWEEN '{start_date}' AND '{end_date}'
        AND o.outcome IS NOT NULL
        ORDER BY c.event_date
        """
        
        return self.conn.execute(query).df()
    
    def compute_metrics(
        self,
        df: pd.DataFrame,
        tier: Optional[str] = None
    ) -> Dict[str, float]:
        """
        Compute backtest performance metrics.
        
        Args:
            df: DataFrame with catalyst outcomes
            tier: Filter by tier ('High-Torque', 'Tradable', 'Watch')
        
        Returns:
            Dictionary of metrics
        """
        if tier:
            df = df[df['tier'] == tier]
        
        if len(df) == 0:
            return {}
        
        # Win rate: % of catalysts with positive outcome
        win_rate = (df['outcome'] == 'positive').sum() / len(df)
        
        # Average price movement
        avg_7d_return = df['price_movement_7d'].mean()
        avg_30d_return = df['price_movement_30d'].mean()
        
        # Sharpe ratio (annualized)
        returns = df['price_movement_7d'].values
        sharpe = (returns.mean() / returns.std()) * np.sqrt(52) if returns.std() > 0 else 0
        
        # Maximum drawdown
        cumulative_returns = (1 + df['price_movement_7d'] / 100).cumprod()
        running_max = cumulative_returns.expanding().max()
        drawdown = (cumulative_returns - running_max) / running_max
        max_drawdown = drawdown.min()
        
        return {
            'n_catalysts': len(df),
            'win_rate': win_rate,
            'avg_7d_return': avg_7d_return,
            'avg_30d_return': avg_30d_return,
            'sharpe_ratio': sharpe,
            'max_drawdown': max_drawdown,
            'total_return': cumulative_returns.iloc[-1] - 1 if len(cumulative_returns) > 0 else 0
        }
    
    def stratify_by_tier(
        self,
        df: pd.DataFrame
    ) -> Dict[str, Dict[str, float]]:
        """
        Compute metrics stratified by tier.
        """
        results = {}
        
        for tier in ['High-Torque', 'Tradable', 'Watch']:
            results[tier] = self.compute_metrics(df, tier=tier)
        
        # Overall metrics
        results['Overall'] = self.compute_metrics(df)
        
        return results
    
    def calibration_analysis(
        self,
        df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Analyze calibration: do high-scored catalysts perform better?
        
        Returns:
            DataFrame with score bins and actual outcomes
        """
        # Bin by total_score
        df['score_bin'] = pd.cut(
            df['total_score'],
            bins=[0, 6, 8, 16],
            labels=['Low (0-6)', 'Medium (6-8)', 'High (8+)']
        )
        
        calibration = df.groupby('score_bin').agg({
            'outcome': lambda x: (x == 'positive').mean(),
            'price_movement_7d': 'mean',
            'price_movement_30d': 'mean',
            'id': 'count'
        }).rename(columns={'id': 'count', 'outcome': 'win_rate'})
        
        return calibration
    
    def feature_importance(
        self,
        df: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Analyze which scoring dimensions predict outcomes best.
        """
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import LabelEncoder
        
        # Prepare features and labels
        features = [
            'event_leverage',
            'timing_clarity',
            'surprise_factor',
            'downside_contained',
            'market_depth'
        ]
        
        X = df[features].fillna(0).values
        le = LabelEncoder()
        y = le.fit_transform(df['outcome'].values)
        
        # Train random forest
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X, y)
        
        # Get feature importance
        importance_df = pd.DataFrame({
            'feature': features,
            'importance': rf.feature_importances_
        }).sort_values('importance', ascending=False)
        
        return importance_df
    
    def run_backtest(
        self,
        start_date: str = "2020-01-01",
        end_date: str = "2024-12-31"
    ) -> Dict[str, any]:
        """
        Run full backtest and return comprehensive results.
        """
        logger.info(f"Running backtest from {start_date} to {end_date}")
        
        # Load data
        df = self.load_historical_catalysts(start_date, end_date)
        logger.info(f"Loaded {len(df)} historical catalysts")
        
        # Compute metrics by tier
        tier_metrics = self.stratify_by_tier(df)
        
        # Calibration analysis
        calibration = self.calibration_analysis(df)
        
        # Feature importance
        importance = self.feature_importance(df)
        
        return {
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'total_catalysts': len(df)
            },
            'metrics_by_tier': tier_metrics,
            'calibration': calibration.to_dict(),
            'feature_importance': importance.to_dict(),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def close(self):
        """Close database connection."""
        self.conn.close()


# Usage example
if __name__ == "__main__":
    engine = BacktestEngine(db_path="data/historical.duckdb")
    
    results = engine.run_backtest(
        start_date="2020-01-01",
        end_date="2024-12-31"
    )
    
    print("Backtest Results:")
    print(f"Period: {results['period']}")
    print(f"\nMetrics by Tier:")
    for tier, metrics in results['metrics_by_tier'].items():
        print(f"{tier}: Win Rate = {metrics.get('win_rate', 0):.2%}, "
              f"Sharpe = {metrics.get('sharpe_ratio', 0):.2f}")
    
    print(f"\nFeature Importance:")
    print(results['feature_importance'])
    
    engine.close()
```

### CLI Usage

```bash
# Run backtest for 2020-2024
poetry run python -m ml.backtesting.engine --start-date 2020-01-01 --end-date 2024-12-31

# Run backtest for specific tier
poetry run python -m ml.backtesting.engine --tier "High-Torque" --start-date 2022-01-01

# Generate report
poetry run python -m ml.backtesting.report --output reports/backtest_2024.html
```

---

## Catalyst Scoring Integration

### Overview

Integrate extensibility features with existing catalyst scoring system.

### Enhanced Scoring with ML Sentiment

```typescript
// src/utils/catalystScoring.ts - Enhanced with ML
import type { Catalyst } from '../types/biotech';

export interface EnhancedCatalystScore extends CatalystScore {
  mlSentiment?: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    probabilities: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  backtestMetrics?: {
    historicalWinRate: number;
    avgReturn: number;
    sharpeRatio: number;
  };
}

/**
 * Compute enhanced catalyst score with ML sentiment
 */
export async function computeEnhancedScore(
  catalyst: Catalyst
): Promise<EnhancedCatalystScore> {
  // Base scoring
  const baseScore = computeCatalystScore(catalyst);
  
  // Fetch ML sentiment (from Python backend)
  const sentimentResponse = await fetch(
    `http://localhost:8000/api/v1/ml/sentiment/predict`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${catalyst.label} ${catalyst.description || ''}`
      })
    }
  );
  
  const mlSentiment = await sentimentResponse.json();
  
  // Fetch historical backtest metrics
  const backtestResponse = await fetch(
    `http://localhost:8000/api/v1/ml/backtest/metrics?` +
    `tier=${baseScore.tier}&category=${catalyst.category}`
  );
  
  const backtestMetrics = await backtestResponse.json();
  
  return {
    ...baseScore,
    mlSentiment,
    backtestMetrics
  };
}
```

### Python Backend API Endpoints

```python
# bt_platform/core/endpoints/ml_endpoints.py
"""
ML and Backtesting API Endpoints
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

from ml.sentiment.trainer import SentimentTrainer
from ml.backtesting.engine import BacktestEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ml", tags=["machine-learning"])


class SentimentRequest(BaseModel):
    text: str
    model_version: str = "v1"


class BacktestRequest(BaseModel):
    start_date: str
    end_date: str
    tier: Optional[str] = None


@router.post("/sentiment/predict")
async def predict_sentiment(request: SentimentRequest) -> Dict[str, Any]:
    """
    Predict sentiment for catalyst text using ML model.
    """
    try:
        trainer = SentimentTrainer()
        trainer.load_model(version=request.model_version)
        
        result = trainer.predict(request.text)
        
        return {
            "status": "success",
            "data": result,
            "model_version": request.model_version
        }
    except Exception as e:
        logger.error(f"Sentiment prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/backtest/metrics")
async def get_backtest_metrics(
    tier: Optional[str] = None,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get historical backtest metrics for a catalyst tier/category.
    """
    try:
        engine = BacktestEngine()
        
        # Load last 2 years of data
        from datetime import datetime, timedelta
        end_date = datetime.now()
        start_date = end_date - timedelta(days=730)
        
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
        engine.close()
        
        return {
            "status": "success",
            "data": metrics,
            "filters": {
                "tier": tier,
                "category": category
            }
        }
    except Exception as e:
        logger.error(f"Backtest metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backtest/run")
async def run_backtest(request: BacktestRequest) -> Dict[str, Any]:
    """
    Run full backtest for specified date range.
    """
    try:
        engine = BacktestEngine()
        
        results = engine.run_backtest(
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        engine.close()
        
        return {
            "status": "success",
            "data": results
        }
    except Exception as e:
        logger.error(f"Backtest run error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Quick Start Examples

### 1. Add a LinkedIn Jobs Scraper

```bash
# Step 1: Create scraper file
touch bt_platform/scrapers/sites/linkedin_scraper.py

# Step 2: Implement ScraperInterface (see Scraper Extensibility section)

# Step 3: Register in registry.yaml
# Add entry under professional_networks group

# Step 4: Test scraper
poetry run python -m bt_platform.cli.scrape --source linkedin_jobs --dry-run --limit 10

# Step 5: Run with database writes
poetry run python -m bt_platform.cli.scrape --source linkedin_jobs --since 7d --limit 50
```

### 2. Enable WebSocket Streaming in Terminal App

```typescript
// terminal/src/hooks/useCatalystStream.ts
import { useCatalystStream } from '@/hooks/useCatalystStream';

export function CatalystDashboard() {
  const { catalysts, health } = useCatalystStream();
  
  return (
    <div>
      <h2>Real-Time Catalysts ({catalysts.length})</h2>
      {catalysts.map(catalyst => (
        <CatalystCard key={catalyst.id} catalyst={catalyst} />
      ))}
    </div>
  );
}
```

### 3. Train ML Sentiment Model

```bash
# Step 1: Prepare historical data
# Export catalysts with outcomes to CSV

# Step 2: Train model
poetry run python -m ml.sentiment.trainer \
  --data data/historical_catalysts.csv \
  --version v1

# Step 3: Test prediction
poetry run python -m ml.sentiment.predict \
  --text "FDA approves breakthrough therapy" \
  --model-version v1

# Step 4: Deploy to API (model loaded automatically)
```

### 4. Run Backtest Validation

```bash
# Run backtest for all tiers
poetry run python -m ml.backtesting.engine \
  --start-date 2020-01-01 \
  --end-date 2024-12-31

# Generate HTML report
poetry run python -m ml.backtesting.report \
  --output reports/backtest_2024.html \
  --start-date 2020-01-01
```

### 5. Integrate ML Sentiment with Catalyst Scoring

```typescript
// Use enhanced scoring in components
import { computeEnhancedScore } from '@/utils/catalystScoring';

const enhancedScore = await computeEnhancedScore(catalyst);

console.log('Base tier:', enhancedScore.tier);
console.log('ML sentiment:', enhancedScore.mlSentiment.sentiment);
console.log('Historical win rate:', enhancedScore.backtestMetrics.historicalWinRate);
```

---

## API Endpoints Summary

### Scraping

- `POST /api/admin/scrape` - Trigger manual scrape
- `GET /api/admin/scraping-stats` - Get scraper statistics
- `GET /api/admin/health` - Get scraper health status

### ML & Backtesting

- `POST /api/v1/ml/sentiment/predict` - Predict sentiment for text
- `GET /api/v1/ml/backtest/metrics` - Get historical metrics
- `POST /api/v1/ml/backtest/run` - Run backtest for date range

### WebSocket Events

- `scraping:subscribe` / `scraping:unsubscribe` - Manage subscriptions
- `scraping:completed` / `scraping:failed` - Scraping results
- `health:update` - Health status updates
- `catalyst:detected` - New catalyst event

---

## Next Steps

1. **Implement Additional Scrapers**: Start with PubMed, LinkedIn, conferences
2. **Enhance WebSocket**: Add filtering by company, therapeutic area
3. **Train Models**: Collect historical data and train sentiment classifiers
4. **Validate Scoring**: Run backtests and refine scoring algorithm
5. **Deploy**: Set up production infrastructure for real-time streaming

---

## Support

For questions or contributions:
- Check [Scraper README](../bt_platform/scrapers/README.md)
- Review [API Integration Guide](./API_INTEGRATION.md)
- See [Catalyst Scoring System](./CATALYST_SCORING_SYSTEM.md)
