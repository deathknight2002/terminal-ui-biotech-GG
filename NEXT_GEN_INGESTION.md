# Next-Gen Ingestion (No APIs, Manual Refresh, Turbo Results)

> **Mission**: Build an API-free acquisition layer that eats biotech news for breakfast — faster, deeper, and fully manual-refresh.

---

## Core Idea

Ditch fragile vendor APIs. Replace with a **hybrid acquisition layer** that pulls from:
- **Standards**: RSS/Atom, sitemaps, structured metadata
- **Bespoke adapters**: Per-site custom parsers
- **Email ingestion**: IR/PR lists directly in your inbox
- **Headless capture**: On-demand, only when strictly necessary

Everything runs when an analyst hits **Refresh** — but inside that click, we go **max parallel** with **smart deltas** so it feels instant.

---

## Phase 1 — Speed & Stability (2–3 days of work)

### 1) Delta Fetching (skip the pointless downloads)

**Objective**: Stop downloading unchanged content.

**Implementation Checklist**:
- [ ] Implement conditional GET requests
  - [ ] Send `If-Modified-Since` header with stored `Last-Modified` timestamp
  - [ ] Send `If-None-Match` header with stored `ETag` value
  - [ ] Store and retrieve ETag/Last-Modified per URL in cache table
  - [ ] Handle 304 Not Modified responses appropriately
- [ ] Add HEAD preflight checks
  - [ ] Quick HEAD request to check `Content-Length` and `Last-Modified`
  - [ ] Skip GET if neither has changed
  - [ ] Fall back to GET if HEAD not supported
- [ ] Enable compressed transport
  - [ ] Accept `gzip` encoding in requests
  - [ ] Accept `br` (Brotli) encoding in requests  
  - [ ] Accept `zstd` encoding where supported
  - [ ] Automatic decompression in HTTP client
- [ ] Implement HTTP/2 multiplexing
  - [ ] Configure httpx with HTTP/2 support
  - [ ] Connection pooling with persistent connections
  - [ ] Fewer sockets, more parallel requests

**Acceptance Criteria**: For sources already seen in the last 48h, **70–90%** return `304 Not Modified` during refresh.

**Files to Modify**:
- `bt_platform/scrapers/utils/http_client.py` - Add conditional request headers
- `bt_platform/scrapers/base/scraper_interface.py` - Store/retrieve cache metadata
- `bt_platform/core/database.py` - Add cache table for ETag/Last-Modified

---

### 2) Polite, Parallel, Prioritized

**Objective**: Maximize throughput while respecting servers.

**Implementation Checklist**:
- [ ] Implement priority queue system
  - [ ] **High Priority**: IR pages, SEC EDGAR, FDA approvals
  - [ ] **Medium Priority**: FierceBiotech, BioPharma Dive, ClinicalTrials.gov
  - [ ] **Low Priority**: General news, syndicated content
  - [ ] Priority-based task scheduling in scraper orchestrator
- [ ] Add per-domain concurrency caps
  - [ ] Read `robots.txt` for crawl-delay hints
  - [ ] Default: 2-5 concurrent requests per domain
  - [ ] Configurable via `registry.yaml` per source
  - [ ] Respect good citizenship (no hammering)
- [ ] Implement timeout budgets
  - [ ] Connect timeout: 8 seconds
  - [ ] Read timeout: 10 seconds
  - [ ] Total timeout: 20 seconds per request
  - [ ] Slow hosts get deprioritized (not blocked)
  - [ ] Track performance metrics per domain
- [ ] Add domain health tracking
  - [ ] Moving average of response times
  - [ ] Automatic deprioritization of slow domains
  - [ ] Re-prioritize when performance improves

**Acceptance Criteria**: "Refresh Now (standard)" completes in **< 30–45s** for 60–100 feeds/pages under normal conditions.

**Files to Modify**:
- `bt_platform/scrapers/base/orchestrator.py` - New priority queue orchestrator
- `bt_platform/scrapers/utils/rate_limiter.py` - Enhance with per-domain concurrency
- `bt_platform/scrapers/registry.yaml` - Add priority levels per source

---

### 3) Renderless-First, Headless-Only-If-Needed

**Objective**: Avoid expensive browser automation unless absolutely necessary.

**Implementation Checklist**:
- [ ] Implement waterfall content acquisition strategy
  - [ ] **Step 1**: Try RSS/Atom feed (fastest, structured)
  - [ ] **Step 2**: Try sitemap.xml (index of recent content)
  - [ ] **Step 3**: Try HTML parsing with structured metadata
    - JSON-LD extraction
    - OpenGraph metadata
    - Microdata parsing
  - [ ] **Step 4**: Headless browser capture (only if JS-required)
- [ ] Add JS-required detection
  - [ ] Check for empty content in initial HTML
  - [ ] Look for `<noscript>` warnings
  - [ ] Heuristic: content-to-tag ratio too low
  - [ ] Mark source as "requires headless" in registry
- [ ] Implement point-in-time archival
  - [ ] Save WARC format for legal evidence
  - [ ] Alternative: MHTML snapshot
  - [ ] Store with timestamp and source URL
  - [ ] Retention policy: 90 days
- [ ] Track renderless success rate
  - [ ] Per-source metrics: renderless vs headless usage
  - [ ] Dashboard showing success rates
  - [ ] Alert when source shifts to requiring headless

**Acceptance Criteria**: **≥85%** of sources parsed without headless; headless pages still archived once per article.

**Files to Modify**:
- `bt_platform/scrapers/base/scraper_interface.py` - Add waterfall acquisition logic
- `bt_platform/scrapers/utils/playwright_capture.py` - Enhance with WARC/MHTML export
- `bt_platform/scrapers/sites/` - Update individual scrapers with strategy hints
- `bt_platform/cli/scrape.py` - Add `--renderless-only` flag for testing

---

## Phase 2 — Coverage & "More Info" (biotech-specific depth)

### 4) Standards Harvest (free signal you're not using enough)

**Objective**: Extract maximum information from standards-based metadata.

**Implementation Checklist**:
- [ ] Implement RSS/Atom auto-discovery
  - [ ] Parse homepage for `<link rel="alternate" type="application/rss+xml">`
  - [ ] Parse for `<link rel="alternate" type="application/atom+xml">`
  - [ ] Test discovered feeds and add to registry
  - [ ] Cache discovered feed URLs per domain
- [ ] Add comprehensive sitemap support
  - [ ] Check `/sitemap.xml` first
  - [ ] Check `/sitemap_index.xml` for sitemap collections
  - [ ] Check `/news-sitemap.xml` (Google News format)
  - [ ] Parse `<lastmod>` for incremental updates
  - [ ] Support sitemap pagination
- [ ] Enhance structured data extraction
  - [ ] **JSON-LD** (priority 1):
    - `NewsArticle`: headline, datePublished, author, articleBody
    - `Organization`: ticker symbols in `about` or `mentions`
    - `CreativeWork`: description, keywords
  - [ ] **OpenGraph** (priority 2):
    - `og:title`, `og:description`, `og:image`
    - `og:type`, `og:url`, `og:site_name`
  - [ ] **Twitter Card** (priority 3):
    - `twitter:title`, `twitter:description`
    - `twitter:card`, `twitter:image`
  - [ ] **Microdata** (priority 4):
    - Schema.org itemscope/itemtype parsing
- [ ] Store all metadata in structured format
  - [ ] Raw metadata JSON in `article_metadata` column
  - [ ] Extracted tickers in `mentioned_tickers` array
  - [ ] Confidence scores for each extraction

**Acceptance Criteria**: At least **+25%** more valid articles per refresh from sources that previously returned zero via HTML scraping.

**Files to Modify**:
- `bt_platform/scrapers/utils/structured_data.py` - New module for metadata extraction
- `bt_platform/scrapers/utils/feed_discovery.py` - New module for RSS/sitemap discovery
- `bt_platform/core/models.py` - Add metadata columns to Article model
- `bt_platform/scrapers/base/scraper_interface.py` - Integrate discovery phase

---

### 5) IR Inbox (not a scraper: let them email you)

**Objective**: Direct-to-inbox PR ingestion (ToS-friendly, ultra-fresh).

**Implementation Checklist**:
- [ ] Set up dedicated email account
  - [ ] Create `news@yourdomain.com` or similar
  - [ ] Document for team: "Subscribe to IR lists for portfolio companies"
  - [ ] Set up IMAP access credentials
- [ ] Implement IMAP inbox ingestion
  - [ ] Connect to IMAP server (Gmail, Outlook, etc.)
  - [ ] Fetch unread emails from IR senders
  - [ ] Parse email headers (From, Subject, Date)
  - [ ] Extract body content (text + HTML variants)
  - [ ] Download attachments (PDFs, presentations)
  - [ ] Mark as read after successful processing
- [ ] Add email sender whitelist/filter
  - [ ] Configure in `registry.yaml` or separate config
  - [ ] List of approved IR email domains
  - [ ] Pattern matching for PR email subjects
  - [ ] Auto-learn new IR senders (with approval)
- [ ] Link email content to web version
  - [ ] Extract URLs from email body
  - [ ] Verify URL points to IR/PR page
  - [ ] Store both email version and web version
- [ ] Trigger on refresh
  - [ ] Quick check: poll inbox every refresh
  - [ ] Deep check: full inbox scan on deep refresh
  - [ ] Rate limit: max 1 check per minute

**Acceptance Criteria**: New IR items appear in feed within **1 minute** of inbox check (triggered by Refresh).

**Files to Create**:
- `bt_platform/scrapers/sources/ir_inbox.py` - IMAP email ingestion module
- `bt_platform/scrapers/utils/email_parser.py` - Email content extraction utilities
- `config/ir_inbox.yaml` - Email configuration and whitelists

**Files to Modify**:
- `bt_platform/scrapers/base/orchestrator.py` - Add inbox check to refresh workflow
- `bt_platform/core/models.py` - Add `source_type` enum value for 'email'

---

### 6) PDF & Attachment Intelligence

**Objective**: Extract structured data from press release PDFs and investor presentations.

**Implementation Checklist**:
- [ ] Implement PDF text extraction
  - [ ] Use PyPDF2 or pdfplumber for text layer
  - [ ] OCR fallback with Tesseract for scanned documents
  - [ ] Preserve layout/structure where possible
- [ ] Extract trial identifiers
  - [ ] Regex patterns for NCT numbers (`NCT\d{8}`)
  - [ ] EudraCT numbers (`\d{4}-\d{6}-\d{2}`)
  - [ ] Other registry IDs (UMIN, ChiCTR, etc.)
- [ ] Extract trial details
  - [ ] **Phase**: Regex for "Phase I", "Phase 2", "Ph3", etc.
  - [ ] **Sample size**: Pattern for "N=123", "n = 456 patients"
  - [ ] **Endpoints**: Primary/secondary endpoint text
  - [ ] **p-values**: Statistical significance mentions
  - [ ] **Adverse events**: Safety data tables/mentions
- [ ] Extract regulatory tokens
  - [ ] PDUFA dates (format: "PDUFA date: January 15, 2025")
  - [ ] Breakthrough Therapy designation mentions
  - [ ] Fast Track mentions
  - [ ] Complete Response Letter (CRL) mentions
  - [ ] Accelerated Approval mentions
- [ ] Implement table extraction
  - [ ] Camelot or Tabula for table detection
  - [ ] Parse common layouts (efficacy tables, safety tables)
  - [ ] Extract headers and data rows
  - [ ] Convert to structured JSON
- [ ] Store extracted fields
  - [ ] Link PDF to parent article
  - [ ] Store raw text + structured extractions
  - [ ] Confidence scores for each field
  - [ ] Flag low-confidence extractions for review

**Acceptance Criteria**: For **10 random PR PDFs**, extract **≥70%** of structured fields (phase, n, primary endpoint, direction).

**Files to Create**:
- `bt_platform/scrapers/utils/pdf_parser.py` - PDF text and table extraction
- `bt_platform/scrapers/utils/trial_extractor.py` - Trial detail regex patterns
- `bt_platform/scrapers/utils/regulatory_extractor.py` - Regulatory token extraction

**Files to Modify**:
- `bt_platform/core/models.py` - Add `ArticleAttachment` model with extracted fields
- `bt_platform/scrapers/sources/ir_inbox.py` - Integrate PDF parsing for email attachments

---

### 7) Biotech-Native Fields (more context per card)

**Objective**: Rich, filterable metadata on every article.

**Implementation Checklist**:
- [ ] Expand Article model with biotech fields
  - [ ] `indication` (String): Cancer, diabetes, rare disease, etc.
  - [ ] `target` (String): PD-1, GLP-1, BCMA, etc.
  - [ ] `modality` (Enum): antibody, siRNA, ASO, gene therapy, small molecule, etc.
  - [ ] `line_of_therapy` (String): First-line, second-line, third-line+
  - [ ] `trial_phase` (Enum): Preclinical, Phase 1, Phase 2, Phase 3, Filed, Approved
  - [ ] `trial_size` (Integer): Number of patients (n)
  - [ ] `primary_endpoint` (String): Free text of primary endpoint
  - [ ] `secondary_endpoints` (Array[String]): List of secondary endpoints
  - [ ] `regulatory_status` (Array[String]): IND, BTD, Fast Track, PDUFA, etc.
  - [ ] `conference_abstract` (String): ASCO#12345, ESMO LBA-6, etc.
- [ ] Implement field extraction logic
  - [ ] NLP/regex patterns for each field type
  - [ ] Context-based extraction (e.g., indication from surrounding text)
  - [ ] Confidence scoring for each extracted field
  - [ ] Manual override capability in UI
- [ ] Add to database schema
  - [ ] Migration script to add new columns
  - [ ] Indexes on frequently filtered fields (indication, phase)
  - [ ] JSON column for flexible additional metadata
- [ ] Expose in API
  - [ ] Filter endpoints: `/api/articles?indication=oncology&phase=phase_3`
  - [ ] Faceted search support
  - [ ] Aggregations (count by indication, phase distribution)
- [ ] Update UI components
  - [ ] Display badges for modality, phase, regulatory status
  - [ ] Filter panel with checkboxes/dropdowns
  - [ ] "Show only Phase 3 Oncology trials" quick filters

**Acceptance Criteria**: Cards show these fields and become filterable (e.g., **Oncology + siRNA + Phase 3**).

**Files to Modify**:
- `bt_platform/core/models.py` - Expand Article model
- `bt_platform/core/database.py` - Add migration
- `bt_platform/scrapers/utils/biotech_extractor.py` - New module for field extraction
- `bt_platform/core/routers.py` - Add filter query parameters
- `terminal/src/types/biotech.ts` - Add new TypeScript types
- `terminal/src/components/NewsCard.tsx` - Display new fields

---

## Phase 3 — Intelligence Upgrades (smarter, not just faster)

### 8) Near-Duplicate & "Same Story" Clustering

**Objective**: Collapse duplicate coverage of the same event.

**Implementation Checklist**:
- [ ] Implement SimHash for article fingerprinting
  - [ ] Generate 64-bit SimHash from title + first 500 chars
  - [ ] Hamming distance calculation for similarity
  - [ ] Threshold: ≤3 bits different = near-duplicate
- [ ] Implement MinHash LSH for clustering
  - [ ] Generate MinHash signatures (k=128 hashes)
  - [ ] Use LSH (Locality-Sensitive Hashing) for efficient clustering
  - [ ] Jaccard similarity threshold: ≥0.8 = same story
  - [ ] Band/row configuration for desired precision/recall
- [ ] Cluster detection workflow
  - [ ] Run clustering after all articles fetched
  - [ ] Group articles by cluster ID
  - [ ] Select canonical article (earliest, or from highest-priority source)
  - [ ] Link duplicates to canonical
- [ ] UI presentation
  - [ ] Show canonical article in main feed
  - [ ] Badge: "5 sources" indicating cluster size
  - [ ] Expand to see all sources in cluster
  - [ ] Sort cluster by priority (IR > FDA > news)
- [ ] Boost cross-source signal
  - [ ] Increase `importance_score` for multi-source stories
  - [ ] Weight formula: `base_score * (1 + 0.1 * cross_source_count)`
  - [ ] Cap boost at 5 sources to prevent gaming

**Acceptance Criteria**: Duplicate links drop by **≥60%** with no loss of coverage.

**Files to Create**:
- `bt_platform/scrapers/utils/deduplicator.py` - SimHash + MinHash clustering logic
- `bt_platform/core/models.py` - Add `cluster_id` and `canonical_article_id` columns

**Files to Modify**:
- `bt_platform/scrapers/base/orchestrator.py` - Run deduplication after refresh
- `bt_platform/core/routers.py` - Expose cluster information in API
- `terminal/src/components/NewsCard.tsx` - Show source count badge

---

### 9) Self-Healing Parsers

**Objective**: Resilient scrapers that adapt to site changes.

**Implementation Checklist**:
- [ ] Per-site adapter configuration
  - [ ] CSS/XPath selectors in YAML config
  - [ ] Multiple selector fallbacks (primary, secondary, tertiary)
  - [ ] Version history for selectors
  - [ ] Last-successful-parse timestamp
- [ ] Readability fallback algorithm
  - [ ] Strip ads, navigation, footers (common boilerplate)
  - [ ] Identify main content block (largest text block heuristic)
  - [ ] Extract title from `<h1>` or `<title>` fallback
  - [ ] Extract published date from common patterns
  - [ ] Use Mozilla Readability.js port in Python
- [ ] Parse failure handling
  - [ ] Catch parse exceptions gracefully
  - [ ] Try fallback selectors in order
  - [ ] Try Readability if all selectors fail
  - [ ] Store raw HTML on failure for manual review
  - [ ] Flag article as "Needs Review" in database
- [ ] Health dashboard implementation
  - [ ] Per-source metrics table
    - Pass rate (successful parses / total attempts)
    - Last change date (when selectors were updated)
    - Average parse time
    - Error types (selector not found, timeout, etc.)
  - [ ] Visual indicators: 🟢 Green (>95%), 🟡 Yellow (80-95%), 🔴 Red (<80%)
  - [ ] Weekly automated report
  - [ ] Auto-open GitHub issue for failing sources
- [ ] Automated testing
  - [ ] Fixture-based tests for each source
  - [ ] Store sample HTML in `tests/fixtures/`
  - [ ] CI runs parser tests on every commit
  - [ ] Alert on test failures (site structure changed)

**Acceptance Criteria**: Each source has a green/red health indicator; weekly failures auto-open a task.

**Files to Create**:
- `bt_platform/scrapers/utils/readability.py` - Readability algorithm implementation
- `bt_platform/scrapers/utils/health_dashboard.py` - Health metrics collector
- `bt_platform/scrapers/tests/fixtures/` - Sample HTML for testing

**Files to Modify**:
- `bt_platform/scrapers/registry.yaml` - Add selector versions and fallbacks
- `bt_platform/scrapers/base/scraper_interface.py` - Integrate fallback chain
- `bt_platform/cli/scrape.py` - Add `--health-report` command
- `terminal/src/pages/AdminPanel.tsx` - Display health dashboard

---

### 10) Competitor Graph 2.0

**Objective**: Richer read-through exposure analysis.

**Implementation Checklist**:
- [ ] Expand entity graph data model
  - [ ] **Nodes**: Drug, Target, Indication, Company, Modality
  - [ ] **Edges**: 
    - Drug → Target (mechanism of action)
    - Drug → Indication (approved/investigated for)
    - Drug → Company (manufacturer)
    - Drug → Modality (type of therapy)
    - Target → Target (pathway/class relationships)
  - [ ] **Edge weights**: Strength of relationship (1.0 = direct, 0.5 = indirect)
- [ ] Enhance ENTITY_GRAPH.csv
  - [ ] Add `target_class` column (e.g., GLP-1 receptor agonist)
  - [ ] Add `line_of_therapy` column
  - [ ] Add `mechanism_similarity` score between drugs
  - [ ] Add `market_overlap` score (same indication + phase)
- [ ] Implement read-through algorithm
  - [ ] Find all drugs sharing same target
  - [ ] Find all drugs in same target class (e.g., GLP-1 vs GIP/GLP-1)
  - [ ] Find all drugs in same indication + line of therapy
  - [ ] Calculate exposure score:
    ```
    exposure = (target_match * 0.5) + 
               (class_match * 0.3) + 
               (indication_match * 0.2)
    ```
  - [ ] Weight by development stage (Phase 3 > Phase 2 > Phase 1)
- [ ] Generate exposure rationale
  - [ ] Template: "Same target {TARGET}; {INDICATION}; {PHASE}"
  - [ ] Example: "Same target GLP-1; obesity; Phase 3"
  - [ ] Include market overlap percentage
  - [ ] Show competitive threat level (High/Medium/Low)
- [ ] UI integration
  - [ ] Exposure drawer on news card click
  - [ ] List of exposed tickers with weights
  - [ ] One-line rationale per ticker
  - [ ] Sort by exposure score descending
  - [ ] Link to company profile for each ticker

**Acceptance Criteria**: Exposure drawer includes rationale (e.g., **"Same target GLP-1; obesity; Phase 3"**).

**Files to Modify**:
- `data/ENTITY_GRAPH.csv` - Add new columns
- `bt_platform/logic/competitor_graph.py` - Enhance algorithm
- `bt_platform/core/routers.py` - Expose rationale in API response
- `terminal/src/components/ExposureDrawer.tsx` - Display rationale

---

### 11) Catalyst Calendar Assist (still manual)

**Objective**: Surface relevant events automatically.

**Implementation Checklist**:
- [ ] Maintain catalyst CSVs
  - [ ] `data/adcom_dates.csv`: FDA Advisory Committee meetings
    - Columns: ticker, drug_name, indication, adcom_date
  - [ ] `data/pdufa_dates.csv`: PDUFA action dates
    - Columns: ticker, drug_name, indication, pdufa_date, type (BLA/NDA)
  - [ ] `data/conference_dates.csv`: Major medical conferences
    - Columns: conference_name, start_date, end_date, focus_areas
  - [ ] Manual update process documented in README
- [ ] Load catalyst data on startup
  - [ ] Parse CSV files into in-memory cache
  - [ ] Refresh cache on file change (file watcher)
  - [ ] API endpoint to force refresh
- [ ] Match catalysts to articles
  - [ ] Extract tickers from article metadata
  - [ ] Check if today ± 7 days matches any catalyst for that ticker
  - [ ] Multiple matches possible (e.g., ASCO + PDUFA same week)
- [ ] Boost relevance for near-term catalysts
  - [ ] Add `catalyst_proximity_bonus` to importance score
  - [ ] Formula: `bonus = 10 * (1 - days_until_event / 7)`
  - [ ] Max bonus: +10 points for events today
  - [ ] Decays linearly over 7-day window
- [ ] Visual indicators in UI
  - [ ] Ribbon on card: "🔔 PDUFA in 3 days"
  - [ ] Badge: "⚖️ AdCom Tomorrow"
  - [ ] Color coding: Red (<3d), Orange (3-5d), Yellow (5-7d)
  - [ ] Tooltip with event details

**Acceptance Criteria**: Events within **±7d** consistently reflected in importance score.

**Files to Create**:
- `data/adcom_dates.csv` - AdCom calendar
- `data/pdufa_dates.csv` - PDUFA calendar
- `data/conference_dates.csv` - Conference calendar
- `bt_platform/logic/catalyst_matcher.py` - Catalyst matching logic

**Files to Modify**:
- `bt_platform/core/models.py` - Add `nearby_catalysts` field to Article
- `bt_platform/core/routers.py` - Include catalyst data in API response
- `bt_platform/logic/importance_scorer.py` - Add catalyst proximity bonus
- `terminal/src/components/NewsCard.tsx` - Display catalyst ribbons

---

## Phase 4 — Price & UX Polish (feels pro)

### 12) Price Sources Without APIs (legit paths)

**Objective**: Enable reaction analysis without violating ToS.

**Implementation Checklist**:
- [ ] Implement CSV drop-zone for analysts
  - [ ] UI component: Drag-and-drop file upload
  - [ ] Accept CSV format: `date,ticker,open,high,low,close,volume`
  - [ ] Validate CSV structure and data types
  - [ ] Store in `price_data` table with source = 'user_upload'
  - [ ] Timestamp and attribution (uploaded_by)
- [ ] Add end-of-day file ingestion
  - [ ] Document approved sources (e.g., Nasdaq public data)
  - [ ] Automated download on refresh (if ToS permits)
  - [ ] Example: Nasdaq end-of-day downloadable files
  - [ ] Store download timestamp for reproducibility
- [ ] Implement point-in-time price snapshots
  - [ ] Snapshot price at article publication time
  - [ ] Store in `article_price_snapshot` table
  - [ ] Fields: ticker, price, volume, timestamp, source
  - [ ] Link to article for reaction calculation
- [ ] Calculate reactions
  - [ ] Windows: 1h, 1d, 3d, 1w after publication
  - [ ] Metrics: Absolute change, percentage change, volume spike
  - [ ] Compare to XBI (biotech index) for abnormal return
  - [ ] Store reactions in `article_reactions` table
- [ ] Reproducibility guarantee
  - [ ] Store data source and version
  - [ ] Immutable snapshots (never update historical prices)
  - [ ] Audit trail: when downloaded, from where
  - [ ] Display data provenance in UI

**Acceptance Criteria**: Reactions compute for **≥95%** of portfolio tickers for standard windows.

**Files to Create**:
- `bt_platform/logic/price_ingestion.py` - Price data handling
- `bt_platform/logic/reaction_calculator.py` - Reaction metrics
- `terminal/src/components/PriceDropZone.tsx` - CSV upload UI

**Files to Modify**:
- `bt_platform/core/models.py` - Add `PriceData` and `ArticleReaction` models
- `bt_platform/core/routers.py` - Add price upload and reaction endpoints
- `terminal/src/components/NewsCard.tsx` - Display reaction sparklines

---

### 13) Two Refresh Modes

**Objective**: Fast refresh for quick updates, deep refresh for comprehensive analysis.

**Implementation Checklist**:
- [ ] Implement Quick Refresh mode (≤10s target)
  - [ ] RSS/Atom feeds only (pre-configured, fast)
  - [ ] Sitemaps only (structured, efficient)
  - [ ] IR inbox check (single IMAP poll)
  - [ ] Skip unchanged domains (use HEAD requests)
  - [ ] No headless capture
  - [ ] No PDF parsing
  - [ ] No deduplication clustering
  - [ ] No reaction calculation
- [ ] Implement Deep Refresh mode (≤60s target)
  - [ ] All Quick Refresh sources
  - [ ] Plus: HTML parsing with fallbacks
  - [ ] Plus: Headless capture for JS-required sites
  - [ ] Plus: PDF attachment parsing
  - [ ] Plus: Near-duplicate clustering
  - [ ] Plus: Reaction calculation (if prices available)
  - [ ] Plus: Catalyst proximity matching
- [ ] Add UI controls
  - [ ] Button: "Quick Refresh" (lightning bolt icon)
  - [ ] Button: "Deep Refresh" (magnifying glass icon)
  - [ ] Setting: Default mode preference
  - [ ] Display: "Last Quick Refresh: 2m ago" or "Last Deep Refresh: 15m ago"
- [ ] Performance logging
  - [ ] Track duration for each mode
  - [ ] Log per-source timings
  - [ ] Identify bottlenecks (slowest sources)
  - [ ] Dashboard: Average Quick vs Deep timing
  - [ ] Alert if exceeds target (10s or 60s)
- [ ] Optimize for targets
  - [ ] Parallel execution within mode constraints
  - [ ] Progressive UI updates (stream results as they arrive)
  - [ ] Cancel slow requests if approaching timeout
  - [ ] Cache aggressively in Quick mode

**Acceptance Criteria**: **Quick vs Deep timings** logged and stable (Quick ≤10s, Deep ≤60s).

**Files to Modify**:
- `bt_platform/scrapers/base/orchestrator.py` - Add mode parameter and routing
- `bt_platform/cli/scrape.py` - Add `--quick` and `--deep` flags
- `terminal/src/components/RefreshButton.tsx` - Add mode selection
- `bt_platform/core/monitoring.py` - Log timing metrics

---

### 14) Card Glow-Up (analyst candy)

**Objective**: Make news cards visually informative and delightful.

**Implementation Checklist**:
- [ ] Design and implement status badges
  - [ ] 🚨 **Critical**: Breaking regulatory action, FDA rejection, halt
  - [ ] ⚖️ **AdCom**: Advisory Committee meeting scheduled
  - [ ] 📑 **8-K**: SEC filing linked
  - [ ] 🧪 **Ph3**: Phase 3 trial data
  - [ ] 🎯 **GLP-1**: Target-specific badge (customizable)
  - [ ] 💊 **Approval**: FDA/EMA approval announcement
  - [ ] 🔬 **Preclinical**: Early-stage research
- [ ] Implement price sparklines
  - [ ] Inline chart: Last 30 days of price action
  - [ ] Raw price line (blue)
  - [ ] Abnormal return vs XBI (red/green)
  - [ ] Event marker at article publication time
  - [ ] Hover shows exact values and dates
- [ ] Create Read-Through drawer
  - [ ] Slide-out panel on card click
  - [ ] List of exposed tickers with weights
  - [ ] Visual weight bars (0-100%)
  - [ ] One-line rationale per ticker
    - Example: "GLP-1 competitor; obesity; Phase 3 (0.85 exposure)"
  - [ ] Sort by weight descending
  - [ ] Link to full company profile
- [ ] Add contextual highlighting
  - [ ] Highlight ticker mentions in article summary
  - [ ] Highlight target/drug names in summary
  - [ ] Color code by sentiment (positive/negative/neutral)
- [ ] Implement card animations
  - [ ] Subtle fade-in when new article appears
  - [ ] Pulse glow for Critical badge
  - [ ] Hover effects (elevation, border glow)
  - [ ] Smooth expand/collapse for read-through drawer

**Acceptance Criteria**: Cards are visually rich with badges, sparklines, and informative read-through drawers.

**Files to Modify**:
- `terminal/src/components/NewsCard.tsx` - Integrate all new UI elements
- `terminal/src/components/StatusBadge.tsx` - Badge components
- `terminal/src/components/PriceSparkline.tsx` - Sparkline chart
- `terminal/src/components/ReadThroughDrawer.tsx` - Exposure panel
- `frontend-components/src/terminal/atoms/Badge.tsx` - Enhance badge variants

---

## "Not a Scraper" Extras (your ace cards)

These tools dramatically increase coverage **without** touching site ToS.

### 1) Browser Extension (one-click "Add to Archive")

**Objective**: Let analysts save articles they're reading without any scraping.

**Implementation Checklist**:
- [ ] Create browser extension manifest
  - [ ] Manifest V3 for Chrome/Edge/Brave
  - [ ] Firefox WebExtensions compatible
  - [ ] Permissions: activeTab, storage
- [ ] Implement extension UI
  - [ ] Browser toolbar icon
  - [ ] Click to save current page
  - [ ] Success toast notification
  - [ ] Error handling and retry
- [ ] Capture page data
  - [ ] URL, title, full HTML (DOM snapshot)
  - [ ] Meta tags (author, published date, description)
  - [ ] Timestamp of capture
  - [ ] User who saved it (attribution)
- [ ] Send to backend API
  - [ ] POST to `/api/articles/capture`
  - [ ] Authentication via API key (stored in extension settings)
  - [ ] Compress HTML before sending (gzip)
- [ ] Run intelligence pipeline
  - [ ] Same entity extraction as scraped articles
  - [ ] Same catalyst detection
  - [ ] Same importance scoring
  - [ ] Tag with source = 'browser_extension'
- [ ] Display in feed
  - [ ] Badge: "👤 User Saved"
  - [ ] Attribution: "Saved by [User Name]"
  - [ ] Same card UI as scraped articles

**Benefits**:
- ✅ Zero scraping risk (user provides content)
- ✅ Instant capture (no refresh needed)
- ✅ User-curated (high signal)
- ✅ Works on any site (even paywalled)

**Files to Create**:
- `browser-extension/manifest.json` - Extension configuration
- `browser-extension/popup.html` - Extension UI
- `browser-extension/capture.js` - DOM capture logic
- `bt_platform/core/routers.py` - Add `/api/articles/capture` endpoint

---

### 2) Bookmarklet for PDFs

**Objective**: Quick analysis of PDF press releases from any page.

**Implementation Checklist**:
- [ ] Create bookmarklet JavaScript
  - [ ] One-liner: `javascript:(function(){...})();`
  - [ ] Extract current page URL
  - [ ] Check if URL ends with `.pdf` or contains PDF indicator
  - [ ] Open small modal window
- [ ] Implement modal window
  - [ ] Display PDF URL
  - [ ] "Analyze" button
  - [ ] Loading spinner during processing
  - [ ] Results display area
- [ ] Backend PDF analysis endpoint
  - [ ] POST to `/api/pdf/analyze`
  - [ ] Accept URL parameter
  - [ ] Download PDF
  - [ ] Run extraction pipeline (trials, regulatory tokens, etc.)
  - [ ] Return structured fields as JSON
- [ ] Display results in modal
  - [ ] Trial phase, sample size, endpoints
  - [ ] Regulatory status (PDUFA, BTD, etc.)
  - [ ] Key statistical findings
  - [ ] Copy-to-clipboard button
- [ ] Save to database
  - [ ] "Save to Archive" button in modal
  - [ ] Create article record with extracted fields
  - [ ] Link to PDF URL
  - [ ] Appear in main feed

**Usage**:
1. Analyst finds PDF on any IR site
2. Clicks bookmarklet in browser toolbar
3. Modal opens with extracted data
4. One click to save to terminal feed

**Files to Create**:
- `bookmarklets/pdf-analyzer.js` - Bookmarklet code
- `bt_platform/core/routers.py` - Add `/api/pdf/analyze` endpoint
- `docs/BOOKMARKLET_INSTALL.md` - Installation guide

---

### 3) Local Watch Folder

**Objective**: Auto-ingest files dropped into a shared folder.

**Implementation Checklist**:
- [ ] Implement file watcher service
  - [ ] Monitor designated folder (e.g., `~/BiotechTerminal/DropZone/`)
  - [ ] Use `watchdog` library for file system events
  - [ ] Trigger on new file creation
  - [ ] Debounce (wait 2s after last change before processing)
- [ ] Support multiple file types
  - [ ] **PDF**: Run PDF extraction pipeline
  - [ ] **CSV**: Price data or custom data import
  - [ ] **HTML**: Saved web pages (archive format)
  - [ ] **JSON**: Structured data (API responses, custom exports)
- [ ] Process files automatically
  - [ ] Detect file type by extension
  - [ ] Route to appropriate handler
  - [ ] Extract and store data
  - [ ] Move processed files to `_processed/` subfolder
  - [ ] Log errors to `_errors/` subfolder
- [ ] Integration with refresh
  - [ ] Check watch folder on every refresh
  - [ ] Process any pending files
  - [ ] Display count: "3 new files processed"
- [ ] Team collaboration
  - [ ] Shared network folder for team use
  - [ ] Attribution: Track which user dropped file
  - [ ] Duplicate detection (hash-based)

**Usage**:
- Analyst downloads PR PDF from email
- Drags PDF to DropZone folder
- Next refresh: Automatically appears in feed with extracted data

**Files to Create**:
- `bt_platform/watchers/drop_zone.py` - File watcher service
- `bt_platform/watchers/file_processor.py` - File type routing
- `docs/DROP_ZONE_SETUP.md` - Setup instructions

---

## Quality & Compliance (non-negotiable)

### ToS Compliance

**Always respect robots.txt and Terms of Service**:
- [ ] Parse and obey `robots.txt` for every domain
- [ ] Check `Crawl-delay` directive and respect it
- [ ] Check `User-agent: *` and specific rules
- [ ] If blocked by robots.txt: **Do not scrape**
- [ ] Alternative routes when blocked:
  - Route via IR Inbox (subscribe to emails)
  - Route via Drop Zone (analysts save manually)
  - Route via Browser Extension (user-curated)

### Content Storage Limits

**Never republish full paywalled text**:
- [ ] Store only: Title + URL + ≤250-char summary
- [ ] Summaries are extractive (first paragraph) or generated
- [ ] Full text stored only for:
  - Free/public press releases
  - User-saved content (extension/drop-zone)
  - Content with explicit republishing rights
- [ ] WARC/MHTML snapshots for audit purposes only
  - Not displayed in UI
  - Not searchable by default
  - Retained for compliance/reproducibility

### Data Provenance

**Every transform is traceable**:
- [ ] `created_at` timestamp for every record
- [ ] `created_by` for user-initiated actions
- [ ] `source_url` for scraped content
- [ ] `rules_version` for parser version
- [ ] `extraction_metadata` JSON with:
  - Scraper name and version
  - Extraction date/time
  - Confidence scores
  - Fallback chain used (if any)

### Audit Trail

**Maintain comprehensive logs**:
- [ ] HTTP request logs (URL, timestamp, response code, duration)
- [ ] Parse logs (success/failure, fallback usage, error messages)
- [ ] User action logs (extension saves, drop-zone uploads)
- [ ] Data transformation logs (field extraction, clustering)
- [ ] Retention: 90 days for operational logs, 1 year for compliance logs

---

## What to Tell the Team (slack-ready)

### Mission Statement

> **Make Refresh feel instant and complete without APIs.**

### How We're Doing It

Pull from RSS/sitemaps/IR inbox first → parse structured metadata → use per-site adapters → fall back to headless only when needed → archive everything point-in-time.

### Deliverables This Sprint

1. ✅ **Delta fetching + concurrency + Quick/Deep modes**
   - Conditional GET with ETag/Last-Modified
   - Priority queue with per-domain rate limiting
   - Quick Refresh (≤10s) and Deep Refresh (≤60s)

2. ✅ **RSS/Atom + sitemap discovery on all sources**
   - Auto-discover feeds from homepages
   - Parse sitemaps for incremental updates
   - 25%+ increase in article coverage

3. ✅ **IR Inbox ingestion + PDF field extraction**
   - IMAP email monitoring
   - PDF parsing for trials, regulatory tokens
   - 70%+ extraction success on common fields

4. ✅ **Near-duplicate clustering + health dashboard**
   - SimHash + MinHash for deduplication
   - 60%+ reduction in duplicate links
   - Per-source health metrics with green/red indicators

5. ✅ **Expanded biotech fields on cards**
   - Indication, target, modality, phase, endpoints
   - Filterable and searchable
   - Rich UI with badges and sparklines

### Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Deep Refresh time | < 45s | 🔄 In progress |
| Quick Refresh time | < 10s | 🔄 In progress |
| Article coverage increase | +25% | 🔄 In progress |
| PDF field extraction | ≥70% | 🔄 In progress |
| Duplicate reduction | ≥60% | 🔄 In progress |
| Reaction computation | ≥95% | 🔄 In progress |

**Definition of Done**: Refresh <45s Deep, <10s Quick; +25% article coverage; ≥70% PDF field extraction; dupes down ≥60%; reactions computed for ≥95% of target tickers.

---

## Stretch Goals (when you're feeling spicy)

### Multi-Language Support

**Objective**: Capture JP/DE press releases and translate to English.

**Implementation**:
- [ ] Add language detection (langdetect library)
- [ ] Integrate translation API (DeepL, Google Translate)
- [ ] Store original + translated text
- [ ] UI toggle: Show original / Show translation
- [ ] Prioritize sources: JP pharma, EU biotech

**Benefit**: Capture announcements from global companies before US coverage.

---

### Diff-View for PR Updates

**Objective**: Detect silent edits to press releases.

**Implementation**:
- [ ] Store version history for each URL
- [ ] Compute text diff between versions
- [ ] Highlight changed sections in UI
- [ ] Alert on material changes (trial results, dates, endpoints)
- [ ] Example: "Updated 2 hours ago: Primary endpoint changed from X to Y"

**Benefit**: Catch stealth corrections and updates that might signal trouble.

---

### Semantic Search & Trend Heatmaps

**Objective**: "Find similar catalysts" and visualize trends.

**Implementation**:
- [ ] Generate embeddings for article content (Sentence-BERT)
- [ ] Vector similarity search (FAISS or pgvector)
- [ ] "Similar articles" widget on each card
- [ ] Trend heatmap: Cluster articles by theme
  - Rows: Therapeutic areas
  - Columns: Time periods
  - Color: Activity intensity
- [ ] Queries: "Show me all GLP-1 phase 3 announcements from last 6 months"

**Benefit**: Surface non-obvious connections and emerging trends.

---

## Why This Wins for Biotech Intelligence

### More Signal
- ✅ IR inbox → Never miss embargo drops
- ✅ Sitemaps → Discover articles you'd never find via HTML scraping
- ✅ JSON-LD → Extract tickers and metadata automatically
- ✅ PDFs → Structured trial data from presentations

### Faster Refresh
- ✅ Delta fetch → Skip unchanged content (70-90% efficiency gain)
- ✅ Priority queue → Focus on high-value sources first
- ✅ Quick mode → 10s for routine checks
- ✅ Deep mode → 45s for comprehensive analysis

### Safer Operation
- ✅ No API keys → No vendor lock-in or rate limit games
- ✅ ToS-respecting → Routes around blocks via inbox/extension
- ✅ Manual refresh → Predictable, controlled network usage
- ✅ Point-in-time → Reproducible reactions and audit trail

### Elite Read-Throughs
- ✅ Competitor Graph 2.0 → Target + class + line of therapy
- ✅ Exposure rationale → Understand *why* tickers are related
- ✅ Catalyst proximity → Context from upcoming events
- ✅ Rich metadata → Filter by phase, modality, indication

---

## Next Steps

### For Implementation Teams

1. **Review this document** with product and engineering leads
2. **Assign DRIs** (Directly Responsible Individuals) for each phase
3. **Create sprint board** with tasks broken down by phase
4. **Set up health dashboard** to track scraper performance
5. **Document ToS compliance** for each new source added

### For Source-Specific Work

Convert this roadmap into a source-specific checklist for:
- FierceBiotech, FiercePharma
- BioPharma Dive, MedCity News
- FDA.gov, ClinicalTrials.gov
- Top 50 IR pages (Pfizer, Roche, Novartis, etc.)
- Business Wire, GlobeNewswire, PR Newswire

**Each source gets**:
- Priority level (High/Medium/Low)
- Acquisition strategy (RSS/Sitemap/HTML/Email)
- Rate limit configuration
- Selector/field mappings
- Test fixtures
- Health metrics

---

## Questions or Need Sprint Board?

Want me to convert this into a sprint board with:
- **Owner** for each task
- **DRI** for each source
- **Checklists** per source (FierceBiotech, FDA, CT.gov, etc.)
- **Time estimates** for each phase
- **Dependencies** between tasks

Just ask and I'll generate the detailed sprint plan! 🚀

---

**Document Version**: 1.0  
**Last Updated**: 2024-10-17  
**Maintained By**: Biotech Terminal Engineering Team  
**Questions**: Open an issue or ping #biotech-terminal-dev
