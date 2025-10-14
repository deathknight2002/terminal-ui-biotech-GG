---
name: NIH Open-Data Connector Integration
about: Propose a new open-source/free data connector for NIH integration
title: '[CONNECTOR] Add [Source Name] connector'
labels: ['nih-integration', 'connector:new', 'data-source:verification-needed']
assignees: ''
---

## Data Source Information

### Source Name
<!-- e.g., ClinicalTrials.gov, PubMed, PubChem, etc. -->


### Open/Free Confirmation
<!-- 
REQUIRED: Confirm this data source is open-source and free to access
Check ALL that apply:
-->

- [ ] ✅ **No API key required** OR free API key with no usage limits
- [ ] ✅ **No subscription or payment required**
- [ ] ✅ **No commercial restrictions** for research/analytics use
- [ ] ✅ **Public domain** or open license (e.g., CC BY, CC0)
- [ ] ✅ **Redistributable** data (can store and transform locally)

**License Type**: <!-- e.g., Public Domain, CC BY 4.0, etc. -->

**API Terms URL**: <!-- Link to Terms of Service or API documentation -->

---

## API Details

### Endpoint(s)
<!-- Primary API base URL(s) -->
```
https://example.com/api/v1/
```

### Authentication
<!-- API key required? If yes, how to obtain? -->


### Rate Limits
<!-- Published rate limits from API documentation -->
- **Requests per second**: 
- **Requests per minute**: 
- **Requests per day**: 
- **Burst capacity** (if applicable): 

### Documentation
<!-- Link to official API documentation -->


---

## Sample Query

### Query Example
<!-- Provide a sample API call that demonstrates the connector -->

```bash
# Example curl command
curl "https://example.com/api/v1/search?query=cancer&limit=10"
```

### Expected Response Format
<!-- JSON, XML, CSV, etc. -->


### Sample Response
<!-- Paste a snippet of typical API response (anonymized if needed) -->

```json
{
  "results": [
    {
      "id": "12345",
      "title": "Example Entry",
      "date": "2024-01-15"
    }
  ]
}
```

---

## Data Schemas

### Source Data Fields
<!-- List key fields available from this API -->

| Field Name | Type | Description | Required? |
|------------|------|-------------|-----------|
| id | string | Unique identifier | Yes |
| title | string | Entry title | Yes |
| date | string | Publication/update date | No |

### Canonical Schema Mapping
<!-- Which canonical schema does this map to? (Trial, Publication, Compound, etc.) -->

**Target Schema**: `Trial` / `Publication` / `Compound` / `Patent` / `Grant` / `Variant` / `Assay` / `CompanyEvent`

**Mapping**:
<!-- How do source fields map to canonical schema? -->

| Source Field | Canonical Field | Transformation |
|--------------|-----------------|----------------|
| id | recordId | Direct mapping |
| title | data.title | Direct mapping |

---

## Signal/Feature Potential

### What signals can this connector provide?
<!-- Describe the analytical value this data brings to catalyst scoring -->


### Relevance to Spider-Web Scoring
<!-- Which dimension(s) of the 8-dimension spider-web does this enhance? -->

- [ ] Clinical Progress
- [ ] Scientific Momentum
- [ ] Target Validation
- [ ] Intellectual Property
- [ ] Funding & Academic Support
- [ ] Safety Profile
- [ ] Regulatory Path
- [ ] Commercial Potential

### Expected Impact
<!-- High/Medium/Low impact on catalyst scoring accuracy -->


---

## Priority

### Urgency
<!-- P0 = MVP critical, P1 = High value, P2 = Nice-to-have, P3 = Future -->

- [ ] P0 - MVP Required
- [ ] P1 - High Value
- [ ] P2 - Nice-to-Have
- [ ] P3 - Future Enhancement

### Justification
<!-- Why is this connector important? What problem does it solve? -->


---

## Implementation Checklist

### Pre-Implementation
- [ ] Verify data source is open/free (maintainer to confirm)
- [ ] Check for existing similar connectors
- [ ] Review rate limits and feasibility
- [ ] Confirm canonical schema fits data structure

### Implementation
- [ ] Create connector class implementing `DataConnector` interface
- [ ] Implement `fetch()` method with rate limiting
- [ ] Implement `transform()` method to canonical schema
- [ ] Implement `healthCheck()` method
- [ ] Add provenance tracking (source URL, timestamp, content hash)
- [ ] Store raw payloads to disk/S3
- [ ] Add Zod schemas for validation
- [ ] Handle pagination (if applicable)
- [ ] Handle incremental updates (if applicable)

### Testing
- [ ] Write unit tests (>80% coverage)
- [ ] Write integration test with live API
- [ ] Test rate limiter behavior
- [ ] Verify provenance metadata completeness
- [ ] Test error handling (rate limits, network errors, malformed responses)

### Documentation
- [ ] Update `connectors/README.md` with usage example
- [ ] Update `docs/DATA_SOURCES.md` with licensing info
- [ ] Add JSDoc comments to public methods
- [ ] Document any quirks or gotchas

### Review
- [ ] Code review by maintainer
- [ ] Verify compliance with open-source policy
- [ ] Validate rate limits in practice
- [ ] Check data quality and completeness

---

## Additional Context

### Related Issues
<!-- Link to related issues or PRs -->


### References
<!-- Any additional references, papers, or documentation -->


### Questions/Concerns
<!-- Any open questions or potential blockers? -->


---

## Contributor Agreement

By submitting this issue, I confirm that:

- [ ] I have verified this data source is **open-source and free** to access
- [ ] I will **not** include any proprietary, paid, or controlled-access data
- [ ] I will **respect rate limits** and API terms of service
- [ ] I will **include full provenance tracking** in the implementation
- [ ] I will **write tests** for the connector

---

**Note**: Connectors that access paid APIs, proprietary data, or controlled-access datasets (e.g., dbGaP) will be **rejected**. This project is committed to using only open-source, freely-available data sources.
