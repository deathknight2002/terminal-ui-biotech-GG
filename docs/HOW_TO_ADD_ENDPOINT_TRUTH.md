# How to Add a New Indication to EndpointTruth

## Overview

EndpointTruth tables define indication-specific endpoint validation rules. They tell the Evidence Journal which endpoints are FDA-approvable ("decision-grade") vs supportive, what constitutes a meaningful clinical improvement (MCID), and what regulatory precedents exist.

## Step-by-Step Guide

### Step 1: Research Regulatory Precedent

Before adding an indication, gather:

1. **FDA Guidance Documents**
   - Search https://www.fda.gov/regulatory-information/search-fda-guidance-documents
   - Look for disease-specific guidance (e.g., "FDA 2016 Ulcerative Colitis")
   - Note which endpoints FDA mentions as approvable

2. **EMA Guidelines** (if applicable)
   - Check https://www.ema.europa.eu/en/human-regulatory/research-development/scientific-guidelines
   - Compare with FDA for differences

3. **Approved Drug Labels**
   - Go to https://www.accessdata.fda.gov/scripts/cder/daf/
   - Find drugs approved in your indication
   - Read their labels to see which endpoints supported approval

4. **Literature/Regulatory History**
   - PubMed search for "[indication] FDA approval endpoint"
   - Look for regulatory conference proceedings
   - Check CDER therapeutic area pages

### Step 2: Define Decision-Grade Endpoints

An endpoint is "decision-grade" (decisionGrade: true) if:
- FDA has explicitly approved a drug based on it
- FDA guidance lists it as approvable
- Regulatory precedent shows it supports marketing claims

**Examples**:

**Decision-Grade ✓**:
- IBD: Endoscopic remission (Mayo score ≤1)
- Cardiology: CV death or HF hospitalization
- DMD: North Star Ambulatory Assessment

**Supportive Only ✗**:
- IBD: CDAI (needs endoscopic confirmation)
- Cardiology: NT-proBNP (biomarker only)
- DMD: Dystrophin expression (needs functional correlation)

### Step 3: Determine MCID (Minimal Clinically Important Difference)

MCID = smallest change that matters clinically

**How to find MCID**:
1. Check FDA guidance for recommended thresholds
2. Review natural history studies
3. Look at what approved drugs achieved
4. Consult disease experts if needed

**Format MCID description clearly**:
- ✓ Good: "≥100 point reduction in CDAI; validated in natural history"
- ✗ Bad: "Lower score better"

### Step 4: Add to Backend Endpoint

Edit `platform/core/endpoints/evidence.py` in the `get_evidence_journal()` function:

```python
# In the endpointTruth array, add:

{
    "indication": "[Indication Name]",
    "endpoints": [
        {
            "name": "[Endpoint Name]",
            "decisionGrade": True,  # or False
            "mcidDescription": "[Clear description of MCID]",
            "regulatoryPrecedent": "[FDA guidance year; drugs approved]"
        },
        # Add more endpoints...
    ]
}
```

**Example for Atopic Dermatitis**:

```python
{
    "indication": "Atopic Dermatitis",
    "endpoints": [
        {
            "name": "EASI-75 (Eczema Area and Severity Index)",
            "decisionGrade": True,
            "mcidDescription": "≥75% improvement from baseline; FDA-accepted endpoint",
            "regulatoryPrecedent": "FDA 2020 AD guidance; approved for Dupixent, Rinvoq"
        },
        {
            "name": "IGA 0 or 1 (Investigator Global Assessment)",
            "decisionGrade": True,
            "mcidDescription": "Clear or almost clear skin; co-primary endpoint",
            "regulatoryPrecedent": "Required alongside EASI-75 for approval"
        },
        {
            "name": "Peak Pruritus NRS (itch score)",
            "decisionGrade": False,
            "mcidDescription": "≥4 point improvement on 0-10 scale; supportive endpoint",
            "regulatoryPrecedent": "FDA accepts as secondary endpoint but not for approval alone"
        },
        {
            "name": "DLQI (Quality of Life)",
            "decisionGrade": False,
            "mcidDescription": "Patient-reported outcomes; supportive only",
            "regulatoryPrecedent": "Not sufficient for approval without objective measures"
        }
    ]
}
```

### Step 5: Add Endpoint Weights to Scoring Logic

Edit `src/utils/scoring.ts` in the `getEndpointWeights()` function:

```typescript
// Add new condition block
if (lowerIndication.includes('atopic') || lowerIndication.includes('dermatitis')) {
  return {
    'easi': 1.0,        // Decision-grade
    'iga': 1.0,         // Decision-grade
    'pruritus': 0.6,    // Supportive
    'dlqi': 0.4,        // Patient-reported
    'biomarker': 0.3    // Laboratory
  };
}
```

**Weighting Guidelines**:
- Decision-grade endpoints: 1.0
- Important secondary endpoints: 0.6-0.8
- Supportive/exploratory: 0.3-0.5
- Pure biomarkers: 0.2-0.3

### Step 6: Test Your Addition

1. **Start backend**:
```bash
poetry run uvicorn platform.core.app:app --reload --port 8000
```

2. **Query endpoint**:
```bash
curl http://localhost:8000/api/v1/evidence/evidence-journal | jq '.endpointTruth[] | select(.indication | contains("Atopic"))'
```

3. **Verify structure**:
   - All endpoints have name, decisionGrade, mcidDescription, regulatoryPrecedent
   - decisionGrade is boolean (not string)
   - mcidDescription is clear and specific
   - regulatoryPrecedent cites specific guidance/approvals

4. **Test scoring**:
```typescript
import { getEndpointWeights } from './src/utils/scoring';

const weights = getEndpointWeights('Atopic Dermatitis');
console.log(weights); // Should show your custom weights
```

### Step 7: Document Your Addition

Update `docs/EVIDENCE_JOURNAL.md`:

```markdown
## Endpoint Truth Tables

### [Indication Name]

**Regulatory Context**: [Brief overview of FDA guidance]

**Decision-Grade Endpoints**:
- [Endpoint 1]: [Why it's approvable]
- [Endpoint 2]: [Why it's approvable]

**Supportive Endpoints**:
- [Endpoint 3]: [Why it's not sufficient alone]

**References**:
- [FDA Guidance URL]
- [Approved Drug Label URLs]
```

## Real-World Examples

### Example 1: IBD (Ulcerative Colitis)

**Research**:
- FDA 2016 UC guidance
- Approved: Entyvio (2014), Stelara (2019), Zeposia (2021)
- All approved on endoscopic remission

**EndpointTruth Entry**:
```python
{
    "indication": "IBD (Ulcerative Colitis)",
    "endpoints": [
        {
            "name": "Endoscopic remission",
            "decisionGrade": True,
            "mcidDescription": "Mayo endoscopic subscore ≤1; FDA considers approvable",
            "regulatoryPrecedent": "FDA 2016 UC guidance; approved for Entyvio, Stelara"
        },
        # ... more endpoints
    ]
}
```

**Scoring Weights**:
```typescript
if (lowerIndication.includes('ibd') || lowerIndication.includes('colitis')) {
  return {
    'endoscopic': 1.0,
    'histologic': 1.0,
    'mms': 0.7,
    'cdai': 0.7,
    'clinical response': 0.6,
    'symptoms': 0.4
  };
}
```

### Example 2: Cardiology (Heart Failure)

**Research**:
- FDA 2019 HF draft guidance
- Approved: Entresto (2015), Jardiance (2021)
- CV death or HF hospitalization is gold standard

**EndpointTruth Entry**:
```python
{
    "indication": "Cardiology (HFpEF)",
    "endpoints": [
        {
            "name": "CV death or HF hospitalization",
            "decisionGrade": True,
            "mcidDescription": "Time to first event; gold standard endpoint",
            "regulatoryPrecedent": "FDA 2019 HF guidance; approved for Jardiance, Entresto"
        },
        {
            "name": "6-minute walk distance",
            "decisionGrade": False,
            "mcidDescription": "≥30m improvement; surrogate only unless functional claim",
            "regulatoryPrecedent": "FDA accepts for functional capacity labeling only"
        }
    ]
}
```

**Scoring Weights**:
```typescript
if (lowerIndication.includes('hf') || lowerIndication.includes('cardio')) {
  return {
    'os': 1.0,
    'cv death': 1.0,
    'hospitalization': 0.9,
    'functional': 0.7,
    'symptoms': 0.5,
    'biomarker': 0.3
  };
}
```

## Common Pitfalls

### ❌ Avoid These Mistakes

1. **Vague MCID descriptions**
   - Bad: "Improvement in score"
   - Good: "≥75% improvement from baseline (EASI-75)"

2. **Missing regulatory context**
   - Bad: "FDA approved it"
   - Good: "FDA 2020 AD guidance; approved for Dupixent (2017), Rinvoq (2021)"

3. **Confusing supportive vs decision-grade**
   - Post-hoc analyses are NOT decision-grade
   - Biomarkers alone are NOT decision-grade (unless accelerated approval)
   - Patient-reported outcomes usually need objective confirmation

4. **Wrong endpoint weights**
   - Don't give biomarkers high weights
   - Don't weight exploratory endpoints equally with primary

5. **Forgetting rare disease exceptions**
   - Rare diseases may accept single-arm
   - N < 50 may be acceptable
   - Historical controls sometimes allowed

## Checklist

Before submitting your EndpointTruth addition:

- [ ] Researched FDA guidance for indication
- [ ] Checked approved drug labels
- [ ] Identified decision-grade endpoints clearly
- [ ] Defined MCID with specific thresholds
- [ ] Added regulatory precedent with years and drug names
- [ ] Implemented endpoint weights in scoring.ts
- [ ] Tested endpoint returns from API
- [ ] Verified scoring uses correct weights
- [ ] Documented in EVIDENCE_JOURNAL.md
- [ ] Added inline code comments

## Questions?

If unsure about an endpoint's status:
1. Check FDA's Therapeutic Area pages (CDER website)
2. Look for FDA review documents (Drugs@FDA)
3. Read the drug label's "Clinical Studies" section
4. Search PubMed for "[drug name] FDA approval"

When in doubt, mark `decisionGrade: False` and note uncertainty in `regulatoryPrecedent`.

## Maintenance

EndpointTruth should be updated when:
- New FDA guidance is published
- New drugs are approved with novel endpoints
- Regulatory standards shift (e.g., FDA accepting digital endpoints)
- Clinical community consensus changes on MCID

**Review frequency**: Every 6 months or when major approvals occur
