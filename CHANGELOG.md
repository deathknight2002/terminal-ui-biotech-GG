# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2024-01-15

### Changed - Scraper Migration to Manual Refresh

**Major architectural shift:** All news endpoints now backed by local archive; manual refresh only.

- **Manual Refresh Model**: News refresh triggered only via explicit user action (Refresh Now button). No background jobs, no cron, no automated polling.
- **Bespoke Scrapers**: Production-ready scraper framework with RSS/HTML parsing for FierceBiotech, BioPharma Dive, FDA, SEC EDGAR, ClinicalTrials.gov, and press release wires.
- **Point-in-Time Snapshots**: Market caps, ETF constituents, and price data stored with timestamps for reproducible analysis.
- **Entity Extraction**: LLM-assisted extraction of companies, tickers, drugs, diseases, and targets with confidence scoring.
- **Price Reactions**: Abnormal return calculations vs XBI benchmark with multiple time windows (intraday, daily).
- **Read-Through Exposures**: Competitor and ETF exposure mapping based on indication/target/class relationships.
- **Analyst Drop Zone**: Lane B ingestion for manual CSV/HTML uploads when scraping is disallowed or impractical.
- **Data Quality Gates**: Validation pipeline ensures title, URL, date sanity, and entity extraction before write.
- **Compliance Focus**: Respects robots.txt, ToS, and copyright. Title + summary + link only; no full text republication.

**New Configuration Files:**
- `SCRAPER_MIGRATION_PLAN.md` - Complete migration specification
- `SOURCES_ALLOWLIST.yaml` - Legal/compliance status for all sources
- `data/dictionaries/TA_KEYWORDS.yaml` - Therapeutic area keywords
- `data/dictionaries/CATALYST_KEYWORDS.yaml` - Catalyst keywords with weights
- `data/dictionaries/ENTITY_SYNONYMS.csv` - Company/drug/disease/target synonyms
- `data/dictionaries/ENTITY_GRAPH.csv` - Competitor relationships and read-throughs
- `DROP_ZONE_README.md` - Manual upload guide for analysts

**API Enhancements:**
- `GET /api/v1/news/refresh-now` - Manual refresh orchestrator with per-source stats
- `GET /api/v1/news/:id/exposures` - Direct, competitor, and ETF exposures with rationale
- `GET /api/v1/news/:id/reactions` - Price reactions with abnormal returns vs benchmark
- `POST /api/v1/news/:id/recompute-reaction` - Recompute with different windows/benchmarks
- `GET /api/v1/etf/:ticker/constituents?asof=YYYY-MM-DD` - Point-in-time ETF holdings
- `POST /api/v1/admin/drop-zone/*` - Upload price data, ETF constituents, news articles

**Why This Matters:**
- No API keys or quotas - scrape responsibly or ingest manually
- Deterministic results - not at the mercy of vendor outages
- Reproducible analysis - point-in-time snapshots for backtests
- Tradable focus - ranking tuned for SMID-cap catalyst events

## [1.0.0] - 2025-10-03

### Added

**Core Components (11 Atoms)**
- Button - Multiple variants, loading states, icons
- Text - Typography with semantic colors
- Input - Form input with prefix/suffix
- Badge - Status badges with dot indicators
- Spinner - Loading indicators
- Checkbox - Checkbox input
- Switch - Toggle switch
- Progress - Progress bars
- Select - Dropdown with keyboard navigation
- Tooltip - Hover popovers
- Breadcrumbs - Navigation trails

**Composite Components (5 Molecules)**
- Metric - KPI cards with trends
- StatusIndicator - Status displays with pulse
- Card - Content cards
- Toast - Notification system with useToast hook
- Accordion - Collapsible sections

**Complex Components (6 Organisms)**
- Panel - Container with corner brackets
- DataTable - Sortable data grid
- Tabs - Tab navigation
- Section - Colored header sections
- MonitoringTable - Action item lists
- Modal - Dialog/popup system

**Visualizations (9 Components)**
- Gauge - 270° arc gauges
- DonutChart - Pie/donut charts
- BarChart - Bar charts
- SparkLine - Micro line charts
- ProgressCircle - Circular progress
- WorldMap - Animated globe with markers
- RadarChart - 6-sided radar charts
- ActivityGraph - Time-series line graphs
- HeatmapGrid - Weekly heatmaps

**Design System**
- 5 color themes (amber, green, cyan, purple, blue)
- Color-blind support (deuteranopia, protanomaly)
- WCAG AAA compliant (7:1 contrast)
- CSS custom properties for theming
- 4px grid system
- Monospace typography

**Developer Experience**
- Full TypeScript support
- Tree-shaking ready
- ESM + UMD builds
- Source maps included
- CSS Modules for scoped styling
- Comprehensive documentation

### Infrastructure
- Vite build system
- React 18-19 compatibility
- MIT License
- NPM package ready
- GitHub repository

[1.0.0]: https://github.com/deaxu/terminal-ui/releases/tag/v1.0.0
