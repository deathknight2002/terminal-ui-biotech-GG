# Catalyst Scoring System Documentation

## Overview

This document describes the "Ionis-style" stealth catalyst scoring system implemented in the Biotech Terminal platform. The system provides a quantitative framework for identifying and ranking high-torque biotech catalysts with asymmetric risk/reward profiles.

## Table of Contents

1. [Scoring Methodology](#scoring-methodology)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Components](#frontend-components)
5. [Utility Functions](#utility-functions)
6. [50-Catalyst Watchlist](#50-catalyst-watchlist)
7. [Usage Examples](#usage-examples)

---

## Scoring Methodology

The catalyst scoring system uses a 5-dimensional framework totaling 0-16 points:

### Scoring Dimensions

1. **Event Leverage (0-4)**: Hard endpoint likelihood
   - 4: Hard clinical endpoint (MACE, pancreatitis events, CV death)
   - 3: Strong secondary or functional endpoint
   - 2: Biomarker or surrogate endpoint
   - 1: Exploratory endpoint
   - 0: No clarity on endpoints

2. **Timing Clarity (0-3)**: Event timing predictability
   - 3: Fixed PDUFA date or milestone
   - 2: Event-driven with expected timeframe
   - 1: Unclear timeline
   - 0: No timeline visibility

3. **Surprise Factor (0-3)**: Market pricing inefficiency
   - 3: Street models severely underweight key endpoints
   - 2: Some potential for upside surprise
   - 1: Limited surprise potential
   - 0: Fully priced in

4. **Downside Contained (0-3)**: Risk mitigation
   - 3: CRL resolution or strong class read-through
   - 2: Moderate downside protection
   - 1: Limited protection
   - 0: High downside risk

5. **Market Depth (0-3)**: Commercial opportunity
   - 3: Large addressable market with strong payer appetite
   - 2: Moderate market opportunity
   - 1: Niche market
   - 0: Limited commercial potential

### Tier Classifications

- **High-Torque (>8/16)**: High asymmetric upside potential with contained downside. Priority trading candidates.
- **Tradable (6-8/16)**: Moderate setup with tradable risk/reward. Secondary opportunities.
- **Watch (<6/16)**: Watch list candidates with lower conviction or clarity.

---

## Database Schema

### Catalyst Model (SQLAlchemy)

```python
class Catalyst(Base):
    __tablename__ = "catalysts"
    
    # Existing fields
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    company = Column(String, index=True)
    drug = Column(String, index=True)
    event_type = Column(String, index=True)
    event_date = Column(DateTime, index=True)
    probability = Column(Float)
    impact = Column(String)
    description = Column(Text)
    status = Column(String, default="Upcoming")
    
    # NEW: Ionis-style scoring fields
    event_leverage = Column(Integer)      # 0-4
    timing_clarity = Column(Integer)      # 0-3
    surprise_factor = Column(Integer)     # 0-3
    downside_contained = Column(Integer)  # 0-3
    market_depth = Column(Integer)        # 0-3
```

### TypeScript Type Definition

```typescript
export interface Catalyst {
  id: string;
  label: string;
  date: string;
  risk: RiskLevel;
  description?: string;
  expectedImpact?: ImpactLevel;
  category?: "Clinical" | "Regulatory" | "Commercial" | "Corporate";
  
  // Scoring fields
  eventLeverage?: number;      // 0-4
  timingClarity?: number;       // 0-3
  surpriseFactor?: number;      // 0-3
  downsideContained?: number;   // 0-3
  marketDepth?: number;         // 0-3
}
```

---

## API Endpoints

### GET `/api/v1/biotech/catalysts`

Returns upcoming catalysts with scoring data.

**Query Parameters:**
- `upcoming_days` (default: 90): Number of days to look ahead
- `company`: Filter by company name
- `event_type`: Filter by event type
- `min_probability`: Minimum probability threshold

**Response Example:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Olezarsen SHTG Pancreatitis Event Data",
      "company": "Ionis Pharmaceuticals",
      "drug": "Olezarsen (apoC-III)",
      "event_type": "Data Readout",
      "event_date": "2026-02-08T04:34:37.539719",
      "probability": 0.75,
      "impact": "High",
      "description": "FCS already approved as Tryngolza...",
      "status": "Upcoming",
      "days_until": 119,
      
      // Scoring fields
      "event_leverage": 4,
      "timing_clarity": 2,
      "surprise_factor": 3,
      "downside_contained": 2,
      "market_depth": 2,
      "total_score": 13,
      "tier": "High-Torque"
    }
  ],
  "count": 46
}
```

---

## Frontend Components

### CatalystScoringRadar

A beautiful glass-morphic radar chart for displaying catalyst scores.

**Location:** `frontend-components/src/biotech/organisms/CatalystScoringRadar/`

**Props:**

```typescript
interface CatalystScoringRadarProps {
  score: CatalystScore;
  title?: string;
  className?: string;
  size?: number;           // Default: 320
  showLegend?: boolean;    // Default: true
  animate?: boolean;       // Default: true
}

interface CatalystScore {
  eventLeverage: number;      // 0-4
  timingClarity: number;       // 0-3
  surpriseFactor: number;      // 0-3
  downsideContained: number;   // 0-3
  marketDepth: number;         // 0-3
  total?: number;              // 0-16
  tier?: 'High-Torque' | 'Tradable' | 'Watch';
}
```

**Usage Example:**

```tsx
import { CatalystScoringRadar } from '@biotech-terminal/frontend-components/biotech';

const score = {
  eventLeverage: 4,
  timingClarity: 2,
  surpriseFactor: 3,
  downsideContained: 2,
  marketDepth: 2,
  tier: 'High-Torque'
};

<CatalystScoringRadar
  score={score}
  title="Olezarsen SHTG Pancreatitis (Ionis)"
  size={400}
  showLegend={true}
  animate={true}
/>
```

**Visual Features:**
- 5-dimensional radar chart
- Color-coded by tier (cyan = High-Torque, amber = Tradable, purple = Watch)
- Animated rendering with smooth transitions
- Glass-morphic design with blur effects
- Pulsing tier badge
- Comprehensive legend with score breakdown

---

## Utility Functions

### Location: `src/utils/catalystScoring.ts`

#### computeCatalystScore

Computes the total score and tier classification for a catalyst.

```typescript
function computeCatalystScore(catalyst: Catalyst): CatalystScore
```

**Returns:**
```typescript
{
  total: number;              // Sum of all scores (0-16)
  eventLeverage: number;
  timingClarity: number;
  surpriseFactor: number;
  downsideContained: number;
  marketDepth: number;
  tier: 'High-Torque' | 'Tradable' | 'Watch';
  rationale: string[];        // Human-readable explanations
}
```

#### filterCatalystsByTier

Filters catalysts by tier classification.

```typescript
function filterCatalystsByTier(
  catalysts: Catalyst[],
  tier: 'High-Torque' | 'Tradable' | 'Watch'
): Catalyst[]
```

#### sortCatalystsByScore

Sorts catalysts by total score (descending).

```typescript
function sortCatalystsByScore(catalysts: Catalyst[]): Catalyst[]
```

#### getHighTorqueCatalysts

Returns only High-Torque catalysts (score > 8).

```typescript
function getHighTorqueCatalysts(catalysts: Catalyst[]): Catalyst[]
```

---

## 50-Catalyst Watchlist

The system includes 50 pre-seeded "Ionis-style" stealth catalysts covering:

### Therapeutic Areas

1. **Cardiometabolic & CV Outcomes (13 catalysts)**
   - apoC-III agents (Ionis, Arrowhead)
   - Lp(a) therapies (Novartis, Amgen, Lilly, Silence)
   - HTN (Alnylam)
   - Gene editing (Verve)
   - MASH (Madrigal)
   - And more...

2. **Rare Disease, Neuro & Respiratory (12 catalysts)**
   - SMA (Scholar Rock)
   - DMD (Sarepta, Solid)
   - Angelman (Ultragenyx, Ionis)
   - DEB (Krystal)
   - Hunter syndrome (Regenxbio)
   - T1D (Vertex)
   - And more...

3. **Ophthalmology (1 catalyst)**
   - GA (Annexon)

4. **Oncology - ADCs, Degraders, Radioligands (17 catalysts)**
   - ADCs (ADC Therapeutics, Zymeworks)
   - BTK degraders (Nurix)
   - Synthetic lethality (Repare)
   - Oncolytic viruses (Replimune)
   - And more...

5. **Immunology / Derm / Inflammation (6 catalysts)**
   - STAT6 degrader (Kymera)
   - CCR4 (RAPT)
   - T-reg therapies (Nektar)
   - And more...

6. **Virology / ID & Respiratory (3 catalysts)**
   - Coronavirus mAbs (Invivyd)
   - AATD (Sanofi)
   - CF gene therapy (Krystal)

7. **Kidney / Ophthalmology & Platform Wild Cards (2 catalysts)**
   - IgAN (Novartis)
   - Wet AMD gene therapy (Regenxbio)

### Top 10 High-Torque Catalysts

1. **Plozasiran FCS** (Arrowhead) - 14/16
2. **Olezarsen SHTG** (Ionis) - 13/16
3. **Sparsentan FSGS** (Travere) - 13/16
4. **Zilebesiran HTN** (Alnylam) - 12/16
5. **Pegozafermin Deal** (89bio) - 12/16
6. **RP1 CRL Resolution** (Replimune) - 12/16
7. **Apitegromab SMA** (Scholar Rock) - 13/16
8. **KT-621 STAT6** (Kymera) - 13/16
9. **GTX-102 Angelman** (Ultragenyx) - 11/16
10. **VERVE-102 Gene Editing** (Verve) - 11/16

---

## Usage Examples

### Backend: Seeding Catalysts

```python
from platform.core.seed_data import seed_catalysts
from platform.core.database import SessionLocal

async def main():
    db = SessionLocal()
    await seed_catalysts(db)
    db.commit()
    db.close()
```

### Backend: Querying by Score

```python
from platform.core.database import SessionLocal, Catalyst

db = SessionLocal()

# Get high-torque catalysts
high_torque = db.query(Catalyst).filter(
    (Catalyst.event_leverage or 0) + 
    (Catalyst.timing_clarity or 0) + 
    (Catalyst.surprise_factor or 0) + 
    (Catalyst.downside_contained or 0) + 
    (Catalyst.market_depth or 0) > 8
).all()
```

### Frontend: Fetching and Displaying

```typescript
import { useState, useEffect } from 'react';
import { CatalystScoringRadar } from '@biotech-terminal/frontend-components/biotech';
import { computeCatalystScore } from '../utils/catalystScoring';

function CatalystDashboard() {
  const [catalysts, setCatalysts] = useState([]);
  
  useEffect(() => {
    fetch('/api/v1/biotech/catalysts?upcoming_days=365')
      .then(res => res.json())
      .then(data => {
        // Filter high-torque catalysts
        const highTorque = data.data.filter(c => c.tier === 'High-Torque');
        setCatalysts(highTorque);
      });
  }, []);
  
  return (
    <div>
      {catalysts.map(catalyst => (
        <CatalystScoringRadar
          key={catalyst.id}
          score={{
            eventLeverage: catalyst.event_leverage,
            timingClarity: catalyst.timing_clarity,
            surpriseFactor: catalyst.surprise_factor,
            downsideContained: catalyst.downside_contained,
            marketDepth: catalyst.market_depth,
            tier: catalyst.tier
          }}
          title={`${catalyst.company} - ${catalyst.drug}`}
        />
      ))}
    </div>
  );
}
```

---

## Implementation Notes

### Why "Ionis-Style"?

The scoring methodology is inspired by the Ionis/olezarsen SHTG playbook:
- Market initially focused on TG reduction (primary endpoint)
- The real equity unlock was acute pancreatitis event reduction (secondary)
- Represented a 30%+ opportunity once the market recognized the harder, more clinically meaningful endpoint

This pattern repeats across biotech: **hard events > surrogates**, and markets often misprice secondary endpoints that have greater clinical/commercial impact.

### Database Migrations

When deploying to production:

1. Add columns to existing `catalysts` table:
   ```sql
   ALTER TABLE catalysts ADD COLUMN event_leverage INTEGER;
   ALTER TABLE catalysts ADD COLUMN timing_clarity INTEGER;
   ALTER TABLE catalysts ADD COLUMN surprise_factor INTEGER;
   ALTER TABLE catalysts ADD COLUMN downside_contained INTEGER;
   ALTER TABLE catalysts ADD COLUMN market_depth INTEGER;
   ```

2. Or recreate the database:
   ```bash
   rm biotech_terminal.db
   poetry run python -c "from platform.core.database import init_db; import asyncio; asyncio.run(init_db())"
   ```

### Performance Considerations

- Scoring calculations are lightweight (simple arithmetic)
- Consider caching `total_score` and `tier` in the database for large datasets
- API responses include computed fields to avoid client-side calculation

---

## References

- **Problem Statement**: 50-catalyst watchlist with scoring framework
- **Database Schema**: `platform/core/database.py`
- **Seed Data**: `platform/core/seed_data.py`
- **API Endpoints**: `platform/core/endpoints/biotech.py`
- **Frontend Component**: `frontend-components/src/biotech/organisms/CatalystScoringRadar/`
- **Utility Functions**: `src/utils/catalystScoring.ts`
- **Example**: `examples/CatalystScoringExample.tsx`

---

## Future Enhancements

1. **Live Data Integration**: Connect to FDA RSS, ClinicalTrials.gov, SEC filings for real-time catalyst updates
2. **ML-Based Scoring**: Train models on historical catalyst outcomes to refine scoring
3. **Portfolio Optimization**: Use catalyst scores to build optimized portfolios
4. **Alert System**: Push notifications for high-torque catalysts approaching key dates
5. **Backtest Framework**: Validate scoring methodology against historical data
6. **Collaborative Annotations**: Allow analysts to add notes and adjust scores

---

## Support

For questions or issues with the catalyst scoring system:
- Check the [main README](../README.md)
- Review the [API documentation](../docs/AURORA_TASKBAR_API.md)
- Examine the [example implementation](../examples/CatalystScoringExample.tsx)
