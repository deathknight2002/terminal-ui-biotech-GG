# SCRAPER MIGRATION PLAN — From Placeholder APIs to Bespoke Scrapers (Manual Refresh Only)

## North Star

Build a manual-refresh biotech news intelligence stack that:
- Pulls headlines and press releases from first-party publisher sites (where allowed).
- Stores everything point-in-time for reproducibility (articles, ETF constituents, market caps).
- Extracts entities (tickers, drugs, diseases, targets), ranks importance, and computes price reactions vs XBI.
- Surfaces read-through exposures (competitors + ETF) and keeps a searchable archive.
- Runs only when an analyst presses Refresh. No background jobs. No fragile API quotas.

**Legal/Compliance vibe check:** respect robots.txt and site ToS. Favor RSS/Atom, structured newsroom pages, and official press release feeds. Store metadata + short excerpts; link back to the source. For paywalled sites, store title/URL/summary only.

---

## 0) Operating Principles

- **Manual trigger only (Refresh Now).** No cron, no daemons.
- **Two-lane ingestion:**
  - Lane A (preferred): scrape publisher/IR/RSS where permitted.
  - Lane B (fallback): analyst CSV/HTML drop-zone (drag files in; system parses).
- **Point-in-time snapshots** for market caps and ETF holdings used in reactions.
- **Deterministic outputs:** same inputs → same scores, exposures, reactions.
- **Document every transform** (created_at, created_by, source_url, etag/last-modified).

---

## 1) Sources & What We Store (minimal + useful)

### News / PR (primary)
- Industry trades: Fierce Biotech/Fierce Pharma, BioPharma Dive.
- Company IR press releases (portfolio + watchlist + peers).
- FDA announcements (CDER/CBER press pages), ClinicalTrials.gov study updates.
- SEC EDGAR 8-K/6-K (for material events).
- (Optional) Endpoints/STAT: titles/links only if paywalled.

### Market data (for price reactions)
- OHLCV snapshots for tickers of interest and XBI.
- Source options in order:
  1. Analyst manual upload (CSV drop-zone).
  2. Public download endpoints where ToS allows (manual refresh).
  3. Your internal cache (once built).

### ETF constituents
- XBI member list + weights captured as daily snapshots (via permitted public fact sheets, downloadable tables, or manual CSV uploads).

We don't need full articles to compute impact. Title + deck, press release excerpt, and link plus the structured fields below are enough.

### Per-article fields (stored)
- `source`, `title`, `url`, `published_at`, `fetched_at`, `canonical_key`, `summary_250`
- `ta_tags[]`, `catalyst_tags[]`, `importance`, `cross_source_count`
- `entities[]` (companies, tickers, drugs, diseases, targets) with role, confidence
- `exposures` (direct/competitor/ETF) with rationale + weights
- `reactions[]` (per ticker: window, raw_return, benchmark_return, abnormal_return, p_value)

---

## 2) Scraper Kit (how each site is handled—sans code)

### Fetch Layer (Manual Refresh Orchestrator)
- Pull concurrently with polite throttling + randomized User-Agent.
- Use If-Modified-Since/ETag when available.
- Respect robots.txt. If disallowed, route to Lane B: manual upload.

### Parse Layer
- Strategy: prefer RSS/Atom → newsroom list pages → article pages.
- Extract: title, url, published time, brief summary, category tags if present.
- Normalize titles to a canonical_key = host::normalized_title to dedupe.

### Dedupe / Cross-source clustering
- Same title across different domains = separate articles.
- Same title within a domain (case/punct variations) = single canonical row; increment cross_source_count when multiple sources carry the same story.

### Entity extraction (LLM-assisted + dictionaries)
- Dictionaries for: tickers (watchlist + SMID universe), company synonyms, drug aliases/codes, diseases/targets.
- LLM prompt (see Section 8) to upgrade precision, assign roles, and suggest competitor read-throughs.

### Importance scoring
- Scored by catalyst keywords, cross-source lift, portfolio relevance, SMID bucket, and recent price volatility. Output: Critical | High | Medium | Low + relevance_score 0–100.

---

## 3) Price Reaction Engine (manual, on-refresh)

- **Event time:** article published_at (or IR timestamp).
- **Windows:** intraday [0,+60m], [0,+4h]; daily [-1d,+1d], [-5d,+5d].
- **Benchmark:** default XBI; option to switch to a peer basket.
- **Abnormal return** = raw − benchmark; store per window.
- **p-value (optional):** bootstrap on historical residuals for that ticker.
- **Always stamp** the OHLCV source and timestamp used for reproducibility.

### Data acquisition strategy (no fragile API keys):
1. **Analyst Drop-Zone:** allow CSV uploads (one-click import).
2. **Public CSV/Download pages** where ToS permits, fetched only on manual refresh; cache locally.
3. **Local cache** grows over time; reactions can be computed from cache once seeded.

---

## 4) Read-Through Exposures (competitor + ETF)

- Maintain a lightweight **Entity Graph**: company ↔ indication, company ↔ target, class_peers.
- **Weights:**
  - direct mention = 1.0
  - same indication/target competitor = 0.6
  - same class peer = 0.3
  - ETF = actual weight at the snapshot date
- **Store rationale** per exposure (human-readable, e.g., "SMA competitor; different MOA").

---

## 5) UX & API Contract (no code changes to callers)

Current endpoints keep the same shapes; they now read from the archive DB only:

- `GET /api/v1/news/refresh-now` → runs Orchestrator, returns ingestion stats.
- `GET /api/v1/news/aggregate` / `top-news` / `by-category/:ta` / `search` → query archive.
- `GET /api/v1/news/:id/exposures` → direct + competitor + ETF exposures.
- `GET /api/v1/news/:id/reactions` → per-ticker reactions for standard windows.
- `POST /api/v1/news/:id/recompute-reaction?...` → recompute with new window/benchmark using stored price snapshots.
- `GET /api/v1/etf/:ticker/constituents?asof=YYYY-MM-DD` → returns the point-in-time snapshot.

All features remain **manual**—no background calls.

---

## 6) Anti-Breakage & Politeness

- Respect robots.txt + ToS; skip disallowed paths (log "skipped (robots)").
- Back-off & retry on 429/5xx with capped attempts.
- Timeouts per request (≤ 10s) so a single cranky site can't stall refresh.
- Keep raw HTML in cold storage (hash-addressed) for audit/debug, not for redistribution.
- Log every transform with source_url, fetched_at, parser_name, rules_version.

---

## 7) Data Quality Gates (acceptance before write)

- Title present, URL resolvable, published_at sane (±2y).
- Not a duplicate within the same domain.
- At least one of: TA tag, catalyst tag, or entity extracted.
- For reactions: price snapshot present for ticker and benchmark over the window.

If a gate fails → send to **"Needs Review"** queue (visible in UI).

---

## 8) "No-Code" LLM Prompts (drop-in, tool-agnostic)

### A) Article → Structured Record

```
You are a biotech news structurer for an investment firm. Input is a news headline, optional dek/summary, and the source URL + publish time.
Output a single JSON object with these fields:
- ta_tags: array of therapeutic areas from this controlled list ["SMA","GLP-1","Oncology","Rare Disease","Immunology","Neurology","Cardiovascular","Metabolic","Hematology","Pulmonology","Infectious Disease"].
- catalyst_tags: array from ["FDA Approval","AdCom","Breakthrough Designation","Fast Track","Phase 1","Phase 2","Phase 3","Pivotal","Topline","Partnering","Licensing","M&A","Financing","Manufacturing","Safety","Clinical Hold","Regulatory Filing"].
- entities: array of objects with {kind: "company"|"drug"|"disease"|"target", name, ticker?, role: "primary"|"mentioned", confidence: 0–1}.
- importance: one of "Critical","High","Medium","Low" – decide using your best judgment for **tradability** (SMID-cap clinical/regulatory events rank higher).
- summary_250: ≤250 chars, factual, no hype; include the catalyst explicitly.
- rationale: one sentence why this matters to a trader.

Rules:
- Prefer SMID-cap companies when assigning importance.
- If paywalled or vague, return `importance: "Medium"` and keep `summary_250` conservative.
- Never hallucinate tickers: only include if explicitly inferable or widely known; else omit ticker.
```

### B) Competitor / Read-Through Suggestions

```
Given the structured article JSON and the portfolio watchlist, suggest competitor read-through tickers.
Output `exposures`:
- direct: companies explicitly involved (weight 1.0).
- competitor: up to 8 companies in same indication/target/class with {ticker, weight 0.6 or 0.3, rationale}.
- etf: always include XBI with weight from snapshot if available; else include {ticker:"XBI", weight:null, rationale:"ETF proxy"}.
Prefer SMID caps. Avoid megacaps unless they are the only relevant peers.
```

### C) Importance Re-Scoring with Cross-Source Lift

```
Input: structured article JSON + cross_source_count + portfolio_relevance (boolean).
Re-score `importance` and `relevance_score 0–100`:
- Start with catalyst weight (FDA Approval > Phase 3 > M&A > Phase 2 > Financing > Routine).
- +15 if portfolio_relevance, +10 if cross_source_count ≥ 2, +10 if SMID bucket.
- Cap at 100; map to importance bands: 85–100=Critical, 70–84=High, 40–69=Medium, else Low.
Return updated fields only.
```

### D) Price Reaction Note

```
Input: article JSON, ticker, event_time, returns: raw_return, benchmark_return, abnormal_return, window, p_value(optional).
Output a 1–2 sentence analyst note:
- Start with "[TICKER] [±X%] on [catalyst], [±Y% vs XBI] over [window]."
- Add 1 clause for read-through ("Peers [A,B] may react due to [shared target/indication].")
Keep it strictly factual.
```

---

## 9) Risk, Ethics, and Guardrails

- **Robots & ToS:** if scraping is disallowed, switch to Lane B (manual input) or use RSS/title-only metadata.
- **Copyright:** store minimal text; never republish full bodies. Summaries ≤ ~2–3 sentences.
- **Paywalls:** store title/URL/metadata only; no content extraction behind the wall.
- **Attribution:** always keep source and link prominent.

---

## 10) Work Breakdown (dependency-light)

1. **Wire Refresh Orchestrator** to call new Scraper Kit and persist outputs.
2. **Implement Source Adapters** (RSS/list pages/IR pages) for:
   - Fierce (Biotech/Pharma), BioPharma Dive, FDA news, ClinicalTrials.gov updates, top 50 IR pages (portfolio + peers).
3. **Build Analyst Drop-Zone** (CSV/HTML) for prices and ETF constituents.
4. **Add LLM extraction & scoring steps** (prompts above).
5. **Add Reactions calculator** based on stored OHLCV + XBI snapshots.
6. **Ship Read-Through** using the Entity Graph (start with curated CSVs).
7. **Harden search & filters**; ensure all existing endpoints read from the archive.

---

## 11) Acceptance Criteria (we ship when)

- Refresh completes with per-source stats and no background work.
- Each article shows: TA, catalyst tags, entities, importance, exposures, reactions.
- XBI vs raw badges visible on cards; recompute works using stored snapshots.
- "📊 Tradable Only" view is dominated by SMID-cap catalyst events.
- Search finds articles by ticker, drug, disease, or catalyst within <300ms (cache OK).
- Point-in-time replay: reopening any article yields the same exposures and reactions.

---

## 12) Repo Hygiene (docs + config)

- `SCRAPER_MIGRATION_PLAN.md` (this doc).
- `SOURCES_ALLOWLIST.yaml` (domains, paths, robots status, fetch cadence).
- `TA_KEYWORDS.yaml`, `CATALYST_KEYWORDS.yaml`, `ENTITY_SYNONYMS.csv`.
- `ENTITY_GRAPH.csv` (company ↔ indication/target/class).
- `DROP_ZONE_README.md` (how to upload price/ETF CSVs).
- Changelog entry: "All news endpoints now backed by local archive; manual refresh only."

---

## 13) Nice-to-Haves (later, not now)

- Headless browser fallback (Playwright) for sites that render via JS (respecting robots).
- Vector search over summaries for "find similar catalysts".
- Optional intraday minute-bars if you later add a legit data source.

---

## Why this dodges API pain

- **No keys, no quotas:** either scrape responsibly where allowed or ingest via analyst uploads.
- **Deterministic:** your results aren't at the mercy of a vendor's outage.
- **Reproducible:** point-in-time snapshots make post-mortems and backtests legit.
- **Tradable focus:** the ranking and read-throughs are tuned for SMID-cap catalysts, not pharma fluff.

---

## Implementation Status

See implementation progress in the checklist at the top of the associated pull request.

**Key Files:**
- Configuration: `bt_platform/scrapers/registry.yaml`, `SOURCES_ALLOWLIST.yaml`
- Dictionaries: `data/dictionaries/` (TA_KEYWORDS, CATALYST_KEYWORDS, ENTITY_SYNONYMS)
- Services: `bt_platform/core/services/` (entity_extraction, price_reaction, read_through)
- Endpoints: `bt_platform/core/endpoints/news.py`
- Drop Zone: `bt_platform/core/services/drop_zone_service.py`
