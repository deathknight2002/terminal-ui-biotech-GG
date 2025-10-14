# Quick Start Guide - Advanced Intelligence Features

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Backend
```bash
cd /home/runner/work/terminal-ui-biotech-GG/terminal-ui-biotech-GG
poetry run uvicorn bt_platform.core.app:app --reload --port 8000
```

Wait for: `✓ Application startup complete`

### Step 2: Test API Endpoints

Open another terminal and try these:

```bash
# Get dashboard metrics
curl http://localhost:8000/api/v1/intelligence/dashboard | jq

# Analyze Keytruda
curl http://localhost:8000/api/v1/intelligence/comprehensive/Keytruda | jq

# Get recent FDA approvals
curl http://localhost:8000/api/v1/intelligence/fda/approvals?days=30 | jq

# Check safety signals for Ozempic
curl http://localhost:8000/api/v1/intelligence/safety/signals/Ozempic | jq

# Get literature sentiment for Opdivo
curl http://localhost:8000/api/v1/intelligence/literature/sentiment/Opdivo | jq
```

### Step 3: Start the Frontend
```bash
cd terminal
npm run dev
```

Access at: `http://localhost:3000`

### Step 4: Navigate to Intelligence Dashboard

Add to your routing (e.g., in App.tsx):
```typescript
import { AdvancedIntelligencePage } from './pages/AdvancedIntelligencePage';

// Add route
<Route path="/intelligence" element={<AdvancedIntelligencePage />} />
```

Or use the component directly:
```typescript
import { AdvancedIntelligenceDashboard } from './components/AdvancedIntelligenceDashboard';

<AdvancedIntelligenceDashboard />
```

### Step 5: Try Example Searches

Enter these drug names to see the magic:

1. **Keytruda** (pembrolizumab)
   - Expect: Moderate-high risk, many adverse events, positive sentiment
   
2. **Ozempic** (semaglutide)
   - Expect: Moderate risk, GI adverse events, very positive sentiment
   
3. **Opdivo** (nivolumab)
   - Expect: Similar to Keytruda (PD-1 inhibitor class)
   
4. **Wegovy** (semaglutide)
   - Expect: Weight loss indication, similar safety to Ozempic

5. **Mounjaro** (tirzepatide)
   - Expect: Newer drug, emerging data

## 🎯 What You'll See

### Dashboard Metrics (Top)
- Recent FDA approvals (30 days)
- Active recalls count
- Data sources status

### Search & Analysis
1. Enter drug name
2. Click "ANALYZE"
3. Wait 3-5 seconds (fetching from multiple APIs)
4. See comprehensive report

### Risk Assessment
- **Risk Score**: 0-100 with color coding
  - 0-30: Green (Low Risk)
  - 31-60: Yellow (Moderate Risk)
  - 61-100: Red (High Risk)
- **Factors**: Safety signals, sentiment, trials, molecular data

### Safety Profile
- Total adverse events
- Serious events count
- Signal strength (low/medium/high)
- Top 5 adverse reactions

### Research Landscape
- Publication count
- Sentiment (positive/negative/neutral)
- Confidence level
- Recent publications

### Clinical Development
- Total trials
- Active trials count
- Recent trials list

### Molecular Data
- Structural data availability
- PDB structure count

### Recent Approvals Feed
- Drug names
- Sponsors
- Approval dates

### Data Sources Status
- OpenFDA: Active/Inactive
- PubMed: Active/Inactive
- ClinicalTrials.gov: Active/Inactive
- Protein Data Bank: Active/Inactive
- DrugBank: Inactive (not implemented)

## 🔧 Configuration (Optional)

Add API keys for higher rate limits:

Create `.env` file:
```bash
# Optional - APIs work without keys but have rate limits
OPENFDA_API_KEY=your_key_here
PUBMED_API_KEY=your_key_here
PUBMED_EMAIL=your_email@example.com
PROTEIN_DATA_BANK_API_KEY=your_key_here
```

Get keys from:
- OpenFDA: https://open.fda.gov/apis/authentication/
- PubMed: https://www.ncbi.nlm.nih.gov/account/

## 🐛 Troubleshooting

### Backend won't start
```bash
# Install dependencies
poetry install

# Check Python version (needs 3.9+)
python --version
```

### Frontend errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Clear cache
npm run clean
```

### API returns empty results
- Check drug name spelling
- Try generic name instead of brand name
- Some drugs may have limited data

### CORS errors
- Ensure backend is running on port 8000
- Check CORS configuration in `bt_platform/core/config.py`

### Timeout errors
- APIs can be slow (PubMed especially)
- Increase timeout if needed
- Try fewer results (limit parameter)

## 📊 Understanding the Results

### Risk Score Interpretation
- **0-30 (Low)**: Safe drug, positive sentiment, many active trials
- **31-60 (Moderate)**: Some concerns, mixed sentiment, normal development
- **61-100 (High)**: Safety signals, negative sentiment, or limited trials

### Safety Signal Strength
- **Low**: < 15% serious events
- **Medium**: 15-30% serious events
- **High**: > 30% serious events

### Sentiment Confidence
- **High (>0.7)**: Strong consensus in literature
- **Medium (0.4-0.7)**: Mixed opinions
- **Low (<0.4)**: Insufficient data or conflicting views

## 🎓 Advanced Usage

### Custom Queries
```bash
# Predict trial success for a condition
curl "http://localhost:8000/api/v1/intelligence/trials/predict-success?condition=diabetes"

# Get competitive landscape
curl "http://localhost:8000/api/v1/intelligence/trials/competitive-landscape?condition=melanoma&sponsor=Merck"

# Predict trial timeline
curl "http://localhost:8000/api/v1/intelligence/trials/timeline/NCT12345678"

# Get molecular targets
curl "http://localhost:8000/api/v1/intelligence/molecular/targets/Keytruda"
```

### Programmatic Access (Python)
```python
import httpx

async def analyze_drug(drug_name: str):
    async with httpx.AsyncClient() as client:
        url = f"http://localhost:8000/api/v1/intelligence/comprehensive/{drug_name}"
        response = await client.get(url)
        return response.json()

# Usage
data = await analyze_drug("Keytruda")
print(f"Risk score: {data['risk_assessment']['risk_score']}")
```

### Programmatic Access (JavaScript)
```javascript
async function analyzeDrug(drugName) {
  const response = await fetch(
    `http://localhost:8000/api/v1/intelligence/comprehensive/${drugName}`
  );
  return response.json();
}

// Usage
const data = await analyzeDrug('Keytruda');
console.log(`Risk score: ${data.risk_assessment.risk_score}`);
```

## 🎬 Demo Video Script

1. **Show dashboard** (0:00-0:30)
   - Metrics at top
   - Recent approvals
   - Data sources active

2. **Search Keytruda** (0:30-1:00)
   - Type in search box
   - Click analyze
   - Watch loading state

3. **Explain risk score** (1:00-1:30)
   - Point to risk circle
   - Explain factors
   - Show color coding

4. **Dive into safety** (1:30-2:00)
   - Adverse events count
   - Top reactions
   - Signal strength

5. **Show sentiment** (2:00-2:30)
   - Publication count
   - Sentiment indicator
   - Recent publications

6. **Clinical trials** (2:30-3:00)
   - Active vs total
   - Recent trials

7. **Wrap up** (3:00-3:30)
   - Molecular data
   - Data sources
   - Call to action

## 📞 Next Steps

1. **Test thoroughly**: Try 10+ different drugs
2. **Report bugs**: Open GitHub issues
3. **Suggest features**: What else would impress investors?
4. **Share feedback**: What works? What doesn't?
5. **Deploy**: Consider cloud deployment (AWS, Azure, GCP)

## 🌟 Pro Tips

1. **Generic vs Brand**: Try both names if no results
2. **Spelling matters**: Use exact drug names
3. **Wait for results**: Some queries take 5-10 seconds
4. **Compare drugs**: Analyze multiple drugs to see differences
5. **Check data sources**: Ensure all are active for best results

## 🚀 You're Ready!

You now have access to institutional-grade biotech intelligence. Use it wisely, and may your investments prosper! 📈

---

Questions? Check the full docs:
- Technical: `/docs/ADVANCED_INTELLIGENCE_API.md`
- Showcase: `/ADVANCED_INTELLIGENCE_README.md`
- Providers: `/bt_platform/providers/README.md`
