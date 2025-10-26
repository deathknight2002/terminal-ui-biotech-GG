# Analyst Drop Zone - Manual Data Upload Guide

## Overview

The Drop Zone is a **Lane B ingestion method** that allows analysts to manually upload price data, ETF constituents, and news articles when automated scraping is unavailable or impractical.

**Why Drop Zone?**
- No API keys or quotas needed
- Full control over data sources
- Fallback when scraping is disallowed
- Point-in-time snapshots for reproducibility
- Compliance with paywalled content restrictions

---

## Supported File Types

### 1. Price Data (OHLCV)

**Format:** CSV
**Purpose:** Price reactions and abnormal return calculations

**Required Columns:**
```csv
ticker,date,open,high,low,close,volume,source
VRTX,2024-01-15,420.50,425.30,418.20,423.10,1250000,manual_upload
IONS,2024-01-15,45.20,46.10,44.80,45.90,850000,yahoo_finance
XBI,2024-01-15,95.30,96.20,94.80,95.70,5000000,yahoo_finance
```

**Column Definitions:**
- `ticker` (required): Stock symbol
- `date` (required): Trading date (YYYY-MM-DD)
- `open` (required): Opening price
- `high` (required): High price
- `low` (required): Low price
- `close` (required): Closing price
- `volume` (optional): Trading volume
- `source` (optional): Data source (e.g., "yahoo_finance", "manual_entry", "bloomberg_terminal")

**Notes:**
- One file can contain multiple tickers and dates
- Dates must be valid trading days
- Prices must be positive numbers
- Duplicates (same ticker + date) will update existing records

**Upload via API:**
```bash
POST /api/v1/admin/drop-zone/price-data
Content-Type: multipart/form-data

{
  "file": <csv_file>,
  "source": "yahoo_finance",
  "uploaded_by": "analyst_name"
}
```

**Upload via UI:**
1. Navigate to Admin > Drop Zone
2. Click "Upload Price Data"
3. Select CSV file
4. Specify source (optional)
5. Click "Upload"

---

### 2. ETF Constituents

**Format:** CSV
**Purpose:** Point-in-time ETF holdings for read-through exposures

**Required Columns:**
```csv
etf_ticker,member_ticker,member_name,weight,asof_date,source
XBI,VRTX,Vertex Pharmaceuticals,0.0245,2024-01-15,ssga_factsheet
XBI,IONS,Ionis Pharmaceuticals,0.0198,2024-01-15,ssga_factsheet
XBI,SRPT,Sarepta Therapeutics,0.0187,2024-01-15,ssga_factsheet
```

**Column Definitions:**
- `etf_ticker` (required): ETF symbol (e.g., "XBI", "IBB", "XLV")
- `member_ticker` (required): Constituent stock symbol
- `member_name` (optional): Company name
- `weight` (required): Weight in ETF (0.0-1.0 or 0-100%, will be normalized)
- `asof_date` (required): Snapshot date (YYYY-MM-DD)
- `source` (optional): Data source (e.g., "ssga_factsheet", "ishares_holdings")

**Notes:**
- Weights should sum to ~1.0 (or 100%) per ETF per date
- One file can contain multiple ETFs and dates
- System will normalize weights if they don't sum to 1.0
- Keeps historical snapshots for point-in-time lookups

**Upload via API:**
```bash
POST /api/v1/admin/drop-zone/etf-constituents
Content-Type: multipart/form-data

{
  "file": <csv_file>,
  "etf_ticker": "XBI",
  "asof_date": "2024-01-15",
  "source": "ssga_factsheet"
}
```

**Upload via UI:**
1. Navigate to Admin > Drop Zone
2. Click "Upload ETF Constituents"
3. Select CSV file
4. Specify ETF ticker and date
5. Click "Upload"

---

### 3. News Articles (Manual Entry)

**Format:** CSV or HTML
**Purpose:** Add articles from paywalled sources or when scraping is disallowed

**CSV Format:**
```csv
title,url,source,published_at,summary,tags
"Vertex Announces Phase 3 Results for VX-548","https://example.com/article1","Endpoints News","2024-01-15T10:30:00Z","Vertex reports positive Phase 3 topline data...","pain,phase3,topline"
"Ionis Presents ATTR Data at ASH","https://example.com/article2","STAT News","2024-01-14T15:00:00Z","Ionis showcases long-term ATTR amyloidosis data...","cardiology,ASH,phase2"
```

**Column Definitions:**
- `title` (required): Article headline
- `url` (required): Full URL to original article
- `source` (required): Publication name (e.g., "Endpoints News", "STAT News")
- `published_at` (required): Publish timestamp (ISO 8601 format)
- `summary` (optional): Brief summary (≤250 chars recommended)
- `tags` (optional): Comma-separated tags

**HTML Format:**
Upload a saved HTML file from the article. The system will attempt to extract:
- Title (from `<title>` or `<h1>`)
- Published date (from metadata or content)
- Summary (from meta description or first paragraph)
- URL (from `<link rel="canonical">` or file metadata)

**Notes:**
- For paywalled sources, **title + URL + summary only** (no full text)
- System will run entity extraction on title + summary
- Manual entries flagged with `source_type: "manual_upload"`

**Upload via API:**
```bash
POST /api/v1/admin/drop-zone/news-articles
Content-Type: multipart/form-data

{
  "file": <csv_or_html_file>,
  "uploaded_by": "analyst_name",
  "notes": "Articles from Endpoints paywall"
}
```

**Upload via UI:**
1. Navigate to Admin > Drop Zone
2. Click "Upload News Articles"
3. Select CSV or HTML file
4. Add notes (optional)
5. Click "Upload"

---

## Data Quality Checks

All uploads go through validation gates:

### Price Data:
- ✅ Ticker exists or can be created
- ✅ Date is valid and not in future
- ✅ OHLC values are positive and consistent (High ≥ Low, Close between High/Low)
- ✅ Volume ≥ 0
- ❌ Fails: Invalid date, negative prices, duplicate with different values

### ETF Constituents:
- ✅ ETF ticker valid
- ✅ Member tickers valid or can be created
- ✅ Weights are 0-1 (or will be normalized from 0-100)
- ✅ Date is valid
- ❌ Fails: Invalid tickers, negative weights, invalid date

### News Articles:
- ✅ Title present (min 10 chars)
- ✅ URL is valid and resolvable
- ✅ Published date is sane (±2 years from today)
- ✅ Summary ≤500 chars (warning if >250)
- ❌ Fails: Missing title, invalid URL, date too far in past/future

**Rejected Uploads:**
- Saved to "Needs Review" queue
- Accessible via Admin > Drop Zone > Rejected
- Can be corrected and re-uploaded

---

## Upload Response

**Success Response:**
```json
{
  "success": true,
  "records_processed": 150,
  "records_inserted": 145,
  "records_updated": 5,
  "records_rejected": 0,
  "upload_id": "upload_20240115_123456",
  "uploaded_at": "2024-01-15T12:34:56Z",
  "uploaded_by": "analyst_name"
}
```

**Partial Success (with rejections):**
```json
{
  "success": true,
  "records_processed": 150,
  "records_inserted": 140,
  "records_updated": 5,
  "records_rejected": 5,
  "rejected_records": [
    {
      "row": 10,
      "ticker": "INVALID",
      "reason": "Invalid ticker format"
    },
    {
      "row": 25,
      "date": "2024-02-30",
      "reason": "Invalid date"
    }
  ],
  "upload_id": "upload_20240115_123456"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid file format",
  "detail": "Expected CSV with columns: ticker,date,open,high,low,close"
}
```

---

## Best Practices

### For Price Data:
1. **Use end-of-day (EOD) prices** - More stable than intraday
2. **Include benchmark (XBI)** - Always upload XBI alongside stock prices for reactions
3. **Consistent source** - Use same data provider to avoid mismatches
4. **Date format** - Always use YYYY-MM-DD
5. **Trading days only** - Exclude weekends and holidays

### For ETF Constituents:
1. **Match factsheet date** - Use the exact date from the ETF provider's factsheet
2. **Complete snapshots** - Upload full constituent list, not partial
3. **Verify weights sum to 1.0** - Double-check before upload
4. **Regular updates** - Upload monthly or quarterly (XBI rebalances quarterly)
5. **Keep historical** - Don't delete old snapshots; system maintains point-in-time history

### For News Articles:
1. **Paywalled content** - Title + URL + summary only, never full text
2. **Include URL** - Always link back to original source
3. **Timestamp precision** - Use exact publish time if available
4. **Controlled tags** - Use tags from TA_KEYWORDS and CATALYST_KEYWORDS
5. **Summary quality** - Keep ≤250 chars, include key catalyst explicitly

---

## Security & Compliance

### Access Control:
- Drop Zone restricted to **admin users only**
- All uploads logged with user ID and timestamp
- Audit trail maintained for compliance

### Data Retention:
- Uploaded files stored in cold storage (S3/local) for 90 days
- Metadata (upload ID, user, timestamp) retained permanently
- Can be purged on request for compliance

### Copyright & ToS:
- **Do not upload** full articles from paywalled sources
- **Do not upload** copyrighted content without rights
- Use Drop Zone for **metadata only** when scraping disallowed
- Always link back to original source

---

## API Reference

### Upload Price Data
```
POST /api/v1/admin/drop-zone/price-data
Content-Type: multipart/form-data

Body:
- file: CSV file (required)
- source: Data source name (optional)
- uploaded_by: Analyst name (optional)

Response: UploadResult
```

### Upload ETF Constituents
```
POST /api/v1/admin/drop-zone/etf-constituents
Content-Type: multipart/form-data

Body:
- file: CSV file (required)
- etf_ticker: ETF symbol (optional, can be in CSV)
- asof_date: Snapshot date (optional, can be in CSV)
- source: Data source name (optional)

Response: UploadResult
```

### Upload News Articles
```
POST /api/v1/admin/drop-zone/news-articles
Content-Type: multipart/form-data

Body:
- file: CSV or HTML file (required)
- uploaded_by: Analyst name (optional)
- notes: Upload notes (optional)

Response: UploadResult
```

### List Uploads
```
GET /api/v1/admin/drop-zone/uploads
Query:
- limit: Max results (default: 50)
- offset: Pagination offset (default: 0)
- status: Filter by status (success|partial|error)

Response: List[UploadRecord]
```

### Get Upload Details
```
GET /api/v1/admin/drop-zone/uploads/{upload_id}

Response: UploadRecord with rejected rows
```

---

## Troubleshooting

### "Invalid file format"
- Check CSV has correct columns
- Use UTF-8 encoding
- No extra commas or special characters in values

### "Ticker not found"
- Ensure ticker is valid (uppercase, no spaces)
- System will create new tickers for stocks not in database
- For ETFs, must match existing ETF ticker exactly

### "Date validation failed"
- Use YYYY-MM-DD format
- Ensure date is not in future
- For price data, must be a trading day (Mon-Fri, excluding holidays)

### "Duplicate records"
- Same ticker + date will update existing record
- Check if you meant to update or if there's a data error
- Review rejected records for details

### "Upload rejected"
- Check "Needs Review" queue in Admin panel
- Review error messages for each rejected row
- Correct errors and re-upload

---

## Support

For issues or questions:
- **UI:** Admin > Help > Contact Support
- **API:** Check `/api/v1/health` endpoint
- **Logs:** Admin > Drop Zone > Upload History
- **Email:** support@bioterminal.dev

---

**Last Updated:** 2024-01-15
**Version:** 1.0
