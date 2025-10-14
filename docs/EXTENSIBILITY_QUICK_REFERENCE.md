# Extensibility Framework - Quick Reference

## Adding a New Scraper (5 Steps)

### 1. Create Scraper File
```bash
touch bt_platform/scrapers/sites/my_scraper.py
```

### 2. Implement ScraperInterface
```python
from bt_platform.scrapers.base.interface import ScraperInterface, ScraperResult, ContentType

class MyScraper(ScraperInterface):
    async def discover(self, method: str = "rss", **kwargs) -> List[str]:
        # Return list of URLs to scrape
        return []
    
    async def fetch(self, urls: List[str], batch_size: int = 10) -> List[Dict]:
        # Fetch content with rate limiting
        return []
    
    async def parse(self, raw_content: Dict) -> Dict:
        # Extract structured data
        return {}
    
    async def normalize(self, parsed_data: Dict) -> ScraperResult:
        # Map to standard format
        return ScraperResult(...)
```

### 3. Register in registry.yaml
```yaml
scrapers:
  your_category:
    - source_key: my_scraper
      name: My Scraper
      base_url: https://example.com
      enabled: true
```

### 4. Test
```bash
poetry run python -m bt_platform.cli.scrape --source my_scraper --dry-run --limit 10
```

### 5. Run in Production
```bash
poetry run python -m bt_platform.cli.scrape --source my_scraper --since 7d --limit 50
```

---

## ML Sentiment Classifier

### Train Model
```bash
# Prepare CSV with columns: text, outcome (positive/negative/neutral)
poetry run python -m ml.sentiment.trainer --data data/historical_catalysts.csv --version v1
```

### Predict Sentiment (Python)
```python
from ml.sentiment.trainer import SentimentTrainer

trainer = SentimentTrainer()
trainer.load_model(version="v1")

result = trainer.predict("FDA approves breakthrough therapy")
print(result['sentiment'])  # 'positive'
print(result['confidence'])  # 0.87
```

### Predict Sentiment (API)
```bash
curl -X POST http://localhost:8000/api/v1/ml/sentiment/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "FDA approves breakthrough therapy", "model_version": "v1"}'
```

---

## Backtesting Framework

### Run Backtest
```bash
poetry run python -m ml.backtesting.engine \
  --start-date 2020-01-01 \
  --end-date 2024-12-31 \
  --output reports/backtest_2024.json
```

### Get Historical Metrics (Python)
```python
from ml.backtesting.engine import BacktestEngine

with BacktestEngine() as engine:
    results = engine.run_backtest(
        start_date="2020-01-01",
        end_date="2024-12-31"
    )
    
    print("Overall win rate:", results['metrics_by_tier']['Overall']['win_rate'])
    print("High-Torque Sharpe:", results['metrics_by_tier']['High-Torque']['sharpe_ratio'])
```

### Get Historical Metrics (API)
```bash
# Get metrics for High-Torque catalysts
curl "http://localhost:8000/api/v1/ml/backtest/metrics?tier=High-Torque&days=730"

# Run full backtest
curl -X POST http://localhost:8000/api/v1/ml/backtest/run \
  -H "Content-Type: application/json" \
  -d '{"start_date": "2020-01-01", "end_date": "2024-12-31"}'
```

---

## WebSocket Streaming

### Connect from Client (TypeScript)
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Subscribe to catalyst updates
socket.emit('scraping:subscribe', {
  channels: ['updates', 'health']
});

// Listen for events
socket.on('scraping:completed', (event) => {
  console.log('New catalyst:', event.data);
});

socket.on('health:update', (event) => {
  console.log('Health:', event.data);
});
```

### Publish from Python Backend
```python
import httpx

async def publish_catalyst_event(catalyst_data: dict):
    async with httpx.AsyncClient() as client:
        await client.post(
            'http://localhost:3001/api/events/catalyst',
            json={'type': 'catalyst:detected', 'data': catalyst_data}
        )
```

---

## API Endpoints Summary

### ML Sentiment
- `POST /api/v1/ml/sentiment/predict` - Single prediction
- `POST /api/v1/ml/sentiment/predict-batch` - Batch predictions

### Backtesting
- `GET /api/v1/ml/backtest/metrics` - Historical metrics
- `POST /api/v1/ml/backtest/run` - Run full backtest
- `GET /api/v1/ml/backtest/calibration` - Calibration analysis
- `GET /api/v1/ml/backtest/feature-importance` - Feature importance

### Health
- `GET /api/v1/ml/health` - ML services health check

---

## Directory Structure

```
biotech-terminal/
├── ml/                          # ML components
│   ├── sentiment/               # Sentiment classifier
│   │   ├── trainer.py           # Training pipeline
│   │   ├── test_trainer.py      # Tests
│   │   └── models/              # Saved models
│   └── backtesting/             # Backtesting engine
│       ├── engine.py            # Backtest logic
│       └── test_engine.py       # Tests
├── bt_platform/
│   ├── core/
│   │   └── endpoints/
│   │       └── ml_endpoints.py  # FastAPI endpoints
│   └── scrapers/
│       ├── base/
│       │   └── interface.py     # Scraper base class
│       ├── sites/               # Scraper implementations
│       └── registry.yaml        # Scraper configuration
├── backend/
│   └── src/
│       └── scraping/
│           └── websocket-integration.ts  # WebSocket server
├── docs/
│   ├── EXTENSIBILITY_FRAMEWORK.md        # Full guide
│   └── SCRAPER_EXTENSIBILITY_GUIDE.md    # Scraper guide
└── examples/
    └── scraper_extensibility_example.py  # LinkedIn example
```

---

## Common Workflows

### 1. Add New Scraper + Train Model on Data
```bash
# 1. Create scraper
touch bt_platform/scrapers/sites/pubmed_scraper.py
# Implement scraper...

# 2. Register scraper
# Edit registry.yaml...

# 3. Test scraper
poetry run python -m bt_platform.cli.scrape --source pubmed --dry-run --limit 10

# 4. Scrape historical data
poetry run python -m bt_platform.cli.scrape --source pubmed --since 365d --limit 1000

# 5. Train sentiment model on scraped data
poetry run python -m ml.sentiment.trainer --data data/pubmed_catalysts.csv --version v2
```

### 2. Validate Scoring with Backtest
```bash
# 1. Run backtest
poetry run python -m ml.backtesting.engine \
  --start-date 2020-01-01 \
  --end-date 2024-12-31 \
  --output reports/backtest_2024.json

# 2. Review results
cat reports/backtest_2024.json | jq '.metrics_by_tier'

# 3. Check calibration
curl "http://localhost:8000/api/v1/ml/backtest/calibration?start_date=2020-01-01&end_date=2024-12-31"
```

### 3. Real-Time Catalyst Detection
```bash
# 1. Start Python backend (port 8000)
poetry run uvicorn bt_platform.core.app:app --reload

# 2. Start Node.js backend (port 3001)
cd backend && npm run dev

# 3. Connect client to WebSocket
# See WebSocket example above

# 4. Trigger scraping
curl -X POST http://localhost:8000/api/admin/scrape \
  -H "Content-Type: application/json" \
  -d '{"source": "fierce_biotech", "limit": 10}'

# 5. Watch for real-time events in WebSocket client
```

---

## Resources

- **Full Guide**: [docs/EXTENSIBILITY_FRAMEWORK.md](../docs/EXTENSIBILITY_FRAMEWORK.md)
- **Scraper Guide**: [docs/SCRAPER_EXTENSIBILITY_GUIDE.md](../docs/SCRAPER_EXTENSIBILITY_GUIDE.md)
- **Example Scraper**: [examples/scraper_extensibility_example.py](../examples/scraper_extensibility_example.py)
- **Catalyst Scoring**: [docs/CATALYST_SCORING_SYSTEM.md](../docs/CATALYST_SCORING_SYSTEM.md)
- **API Integration**: [docs/API_INTEGRATION.md](../docs/API_INTEGRATION.md)

---

## Next Steps

1. **Implement Priority Scrapers**
   - PubMed (academic publications)
   - LinkedIn (biotech jobs)
   - FDA PDUFA dates
   - Conference calendars

2. **Train ML Models**
   - Collect historical catalyst data
   - Train sentiment classifier
   - Validate with backtesting

3. **Deploy to Production**
   - Set up scheduled scraping
   - Configure WebSocket streaming
   - Monitor ML model performance

4. **Extend Framework**
   - Add new ContentTypes for different data
   - Create specialized scrapers for niche sources
   - Integrate with existing catalyst scoring
