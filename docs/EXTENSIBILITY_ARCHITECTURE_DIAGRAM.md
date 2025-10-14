# Extensibility Framework - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCE LAYER                                │
│  External APIs, RSS Feeds, HTML Scraping, WebSocket Streams             │
├─────────────────────────────────────────────────────────────────────────┤
│  LinkedIn  │ PubMed │ FDA │ SEC │ Twitter │ Conferences │ Clinical      │
│   Jobs     │  Pubs  │PDUFA│ 8-K │   API   │  Calendar   │  Trials      │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     SCRAPER EXTENSIBILITY LAYER                          │
│  bt_platform/scrapers/                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Base Interface (ScraperInterface)                                       │
│    ┌─────────────────────────────────────────────────────────────┐     │
│    │ discover() → fetch() → parse() → normalize() → upsert()     │     │
│    └─────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  Registry (registry.yaml)        Rate Limiting         Error Handling    │
│  ├─ news_press                   ├─ Token bucket      ├─ Retry logic    │
│  ├─ regulators                   ├─ Per-host limits   ├─ Circuit breaker│
│  ├─ registries                   └─ Jitter            └─ Graceful fail  │
│  ├─ exchanges                                                            │
│  └─ professional_networks (NEW)                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      ML PROCESSING LAYER                                 │
│  ml/sentiment/                                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  Sentiment Classifier (SentimentTrainer)                                 │
│    ┌──────────────────────────────────────────────────────────────┐    │
│    │ Text Input → TF-IDF → Logistic Regression → Sentiment        │    │
│    │                     (or BERT/Transformers)                    │    │
│    └──────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  Training Pipeline                Inference                Model Storage │
│  ├─ prepare_data()                ├─ predict()            ├─ joblib      │
│  ├─ train()                       ├─ predict_batch()      ├─ versioning  │
│  ├─ evaluate()                    └─ confidence scores    └─ metadata    │
│  └─ save_model()                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                   CATALYST SCORING & STORAGE                             │
│  src/utils/catalystScoring.ts + bt_platform/core/database.py            │
├─────────────────────────────────────────────────────────────────────────┤
│  Base Scoring (Existing)         Enhanced Scoring (NEW)                  │
│  ├─ event_leverage (0-4)         ├─ Base score                          │
│  ├─ timing_clarity (0-3)         ├─ + ML sentiment                      │
│  ├─ surprise_factor (0-3)        ├─ + Confidence                        │
│  ├─ downside_contained (0-3)     └─ + Historical metrics                │
│  └─ market_depth (0-3)                                                   │
│                                                                           │
│  Storage                                                                  │
│  ├─ PostgreSQL (structured data, catalysts, outcomes)                    │
│  ├─ Redis (caching, real-time scores)                                    │
│  └─ DuckDB (analytics, backtesting queries)                              │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  BACKTESTING & VALIDATION LAYER                          │
│  ml/backtesting/                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Backtest Engine (BacktestEngine)                                        │
│    ┌──────────────────────────────────────────────────────────────┐    │
│    │ Historical Data → Point-in-Time Scoring → Outcome Analysis   │    │
│    └──────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  Metrics Computation          Analysis Tools           Validation        │
│  ├─ Win rate                  ├─ Stratify by tier     ├─ No lookahead   │
│  ├─ Sharpe ratio              ├─ Calibration          ├─ Statistical    │
│  ├─ Max drawdown              └─ Feature importance   └─ Cross-val      │
│  └─ Cumulative returns                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         API LAYER (FastAPI)                              │
│  bt_platform/core/endpoints/                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ML Endpoints (/api/v1/ml/*)                                             │
│  ├─ POST /sentiment/predict           → Single prediction               │
│  ├─ POST /sentiment/predict-batch     → Batch predictions               │
│  ├─ GET  /backtest/metrics            → Historical metrics              │
│  ├─ POST /backtest/run                → Run full backtest               │
│  ├─ GET  /backtest/calibration        → Calibration analysis            │
│  ├─ GET  /backtest/feature-importance → Feature importance              │
│  └─ GET  /health                      → ML services health              │
│                                                                           │
│  Existing Endpoints                                                       │
│  ├─ /api/v1/catalysts/*               → Catalyst CRUD                   │
│  ├─ /api/v1/biotech/*                 → Company data                    │
│  └─ /api/v1/admin/*                   → Scraping control                │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                  WEBSOCKET STREAMING LAYER (Socket.IO)                   │
│  backend/src/scraping/websocket-integration.ts                           │
├─────────────────────────────────────────────────────────────────────────┤
│  Event Broadcasting              Room-Based Subscriptions                │
│  ├─ scraping:completed           ├─ scraping:updates                    │
│  ├─ scraping:failed              ├─ scraping:health                     │
│  ├─ health:update                └─ scraping:metrics                    │
│  ├─ health:change                                                        │
│  └─ catalyst:detected (NEW)                                              │
│                                                                           │
│  Client Connection Management                                            │
│  ├─ subscribe/unsubscribe                                                │
│  ├─ get-health, get-stats                                                │
│  └─ pubmed-search, fda-search, trials-search                            │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                       CLIENT APPLICATIONS                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Terminal App (React)    Mobile App (PWA)    External Services          │
│  ├─ Real-time updates    ├─ Offline-first   ├─ API consumers           │
│  ├─ Dashboard            ├─ Manual refresh   └─ Integrations            │
│  └─ Analysis tools       └─ Push notifications                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: New Catalyst Detection

```
1. SCRAPING
   ┌─────────────────────────────────────────────────┐
   │ LinkedIn Jobs Scraper detects:                  │
   │ "Senior Oncology Scientist @ Vertex"            │
   │ → Signals R&D expansion in oncology             │
   └─────────────────────────────────────────────────┘
                         ↓
2. PARSING & NORMALIZATION
   ┌─────────────────────────────────────────────────┐
   │ ScraperResult:                                   │
   │ {                                                │
   │   content_type: "ARTICLE",                       │
   │   data: { title, company, therapeutic_area },    │
   │   companies: ["Vertex Pharmaceuticals"],         │
   │   metadata: { therapeutic_area: "Oncology" }     │
   │ }                                                │
   └─────────────────────────────────────────────────┘
                         ↓
3. ML SENTIMENT ANALYSIS
   ┌─────────────────────────────────────────────────┐
   │ POST /api/v1/ml/sentiment/predict               │
   │ Input: "Senior Oncology Scientist role..."      │
   │ Output: {                                        │
   │   sentiment: "positive",                         │
   │   confidence: 0.78,                              │
   │   probabilities: {                               │
   │     positive: 0.78, negative: 0.12, neutral: 0.10│
   │   }                                              │
   │ }                                                │
   └─────────────────────────────────────────────────┘
                         ↓
4. CATALYST SCORING
   ┌─────────────────────────────────────────────────┐
   │ computeEnhancedScore(catalyst):                  │
   │ Base Score:                                      │
   │   event_leverage: 2                              │
   │   timing_clarity: 1                              │
   │   surprise_factor: 2                             │
   │   downside_contained: 2                          │
   │   market_depth: 3                                │
   │   → Total: 10/16 (High-Torque)                   │
   │                                                  │
   │ Enhanced:                                        │
   │   + ML sentiment: positive (0.78 confidence)     │
   │   + Historical: 65% win rate for similar events  │
   └─────────────────────────────────────────────────┘
                         ↓
5. STORAGE & BACKTESTING
   ┌─────────────────────────────────────────────────┐
   │ PostgreSQL:                                      │
   │   INSERT INTO catalysts (...)                    │
   │                                                  │
   │ DuckDB (Analytics):                              │
   │   Historical comparison with similar catalysts   │
   │   Calibration: High-Torque tier → 65% win rate  │
   └─────────────────────────────────────────────────┘
                         ↓
6. WEBSOCKET BROADCAST
   ┌─────────────────────────────────────────────────┐
   │ Socket.IO Event:                                 │
   │ {                                                │
   │   type: "catalyst:detected",                     │
   │   data: {                                        │
   │     id: "12345",                                 │
   │     company: "Vertex Pharmaceuticals",           │
   │     tier: "High-Torque",                         │
   │     total_score: 10,                             │
   │     ml_sentiment: "positive",                    │
   │     confidence: 0.78                             │
   │   }                                              │
   │ }                                                │
   └─────────────────────────────────────────────────┘
                         ↓
7. CLIENT UPDATE
   ┌─────────────────────────────────────────────────┐
   │ Terminal App receives event:                     │
   │   → Updates catalyst dashboard                   │
   │   → Shows notification                           │
   │   → Updates heat map                             │
   │   → Triggers alert if high-priority             │
   └─────────────────────────────────────────────────┘
```

## ML Training & Backtesting Workflow

```
TRAINING PHASE
┌────────────────────────────────────────────────────────┐
│ 1. Historical Data Collection                          │
│    ├─ Export catalysts with outcomes to CSV            │
│    ├─ Include: text, outcome, price_movement, etc.     │
│    └─ Ensure balanced classes                          │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│ 2. Model Training                                       │
│    $ poetry run python -m ml.sentiment.trainer \       │
│        --data data/historical_catalysts.csv \           │
│        --version v1                                     │
│                                                         │
│    Pipeline:                                            │
│    ├─ Data preparation (text + numeric features)       │
│    ├─ TF-IDF vectorization                             │
│    ├─ Grid search (hyperparameter tuning)              │
│    ├─ Cross-validation (5-fold)                        │
│    └─ Model persistence (joblib)                       │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│ 3. Model Evaluation                                     │
│    Metrics:                                             │
│    ├─ Accuracy: 0.82                                   │
│    ├─ Precision: 0.79                                  │
│    ├─ Recall: 0.84                                     │
│    ├─ F1 Score: 0.81                                   │
│    └─ ROC AUC: 0.87                                    │
└────────────────────────────────────────────────────────┘
                        ↓
BACKTESTING PHASE
┌────────────────────────────────────────────────────────┐
│ 4. Historical Validation                                │
│    $ poetry run python -m ml.backtesting.engine \      │
│        --start-date 2020-01-01 \                        │
│        --end-date 2024-12-31                            │
│                                                         │
│    Analysis:                                            │
│    ├─ Load historical catalysts with outcomes          │
│    ├─ Compute point-in-time scores                     │
│    ├─ Measure actual outcomes                          │
│    └─ Calculate performance metrics                    │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│ 5. Results Analysis                                     │
│    Metrics by Tier:                                     │
│    ├─ High-Torque: 72% win rate, 1.8 Sharpe           │
│    ├─ Tradable: 58% win rate, 1.2 Sharpe              │
│    └─ Watch: 45% win rate, 0.7 Sharpe                 │
│                                                         │
│    Calibration:                                         │
│    ├─ High scores (8+): 70% positive outcomes          │
│    ├─ Medium scores (6-8): 55% positive outcomes       │
│    └─ Low scores (0-6): 40% positive outcomes          │
│                                                         │
│    Feature Importance:                                  │
│    ├─ event_leverage: 0.35                             │
│    ├─ surprise_factor: 0.28                            │
│    ├─ market_depth: 0.18                               │
│    ├─ timing_clarity: 0.12                             │
│    └─ downside_contained: 0.07                         │
└────────────────────────────────────────────────────────┘
                        ↓
DEPLOYMENT PHASE
┌────────────────────────────────────────────────────────┐
│ 6. Model Deployment                                     │
│    ├─ Model loaded in FastAPI app                      │
│    ├─ Available via REST API                           │
│    ├─ Integrated with catalyst scoring                 │
│    └─ Real-time predictions on new catalysts           │
└────────────────────────────────────────────────────────┘
```

## Key Design Principles

### 1. Modularity
Each component is independent and can be used standalone:
- Scrapers work without ML
- ML works without backtesting
- Backtesting works without scrapers

### 2. Extensibility
Easy to add new components:
- New scrapers: Implement `ScraperInterface`
- New models: Extend `SentimentTrainer`
- New metrics: Add to `BacktestEngine`

### 3. Testability
Comprehensive test coverage:
- Unit tests for each component
- Fixture-based testing for scrapers
- Mock-based testing for database

### 4. Observability
Full monitoring and logging:
- Structured logging throughout
- Health check endpoints
- Performance metrics
- WebSocket event tracking

### 5. Production-Ready
Enterprise-grade features:
- Error handling and retries
- Rate limiting and throttling
- Circuit breakers for resilience
- Graceful degradation
