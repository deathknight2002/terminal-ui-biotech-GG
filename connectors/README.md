# Connectors - NIH Open-Data Integration

## Overview

This directory contains modular data connectors for ingesting open-source, freely-available NIH and public domain datasets into the Biotech Terminal platform. Each connector implements a standardized interface for fetching, transforming, and storing data with full provenance tracking.

**Key Principles:**
- **Open/Free Only**: All connectors must access free, publicly-available APIs
- **Provenance First**: Every data point must include source URL, timestamp, and content hash
- **Rate Limiting**: Conservative rate limiting to respect API terms of service
- **Raw Payload Caching**: Store complete raw responses for audit trail and replay
- **Idempotent**: Re-running connectors should not duplicate data

---

## Connector Interface

All connectors must implement the `DataConnector` interface:

```typescript
/**
 * Standard interface for all data connectors
 */
export interface DataConnector {
  /**
   * Connector metadata
   */
  readonly name: string;           // e.g., "ClinicalTrials.gov v2"
  readonly source: string;          // e.g., "ClinicalTrials.gov"
  readonly version: string;         // e.g., "1.0.0"
  readonly apiVersion: string;      // e.g., "v2"

  /**
   * Initialize the connector with configuration
   */
  initialize(config?: ConnectorConfig): Promise<void>;

  /**
   * Fetch raw data from the source
   *
   * @param query - Query parameters specific to the data source
   * @returns Array of raw data records with full provenance
   */
  fetch(query: QueryParams): Promise<RawDataRecord[]>;

  /**
   * Transform raw data to canonical schema
   *
   * @param raw - Raw data records from fetch()
   * @returns Array of records in canonical schema format
   */
  transform(raw: RawDataRecord[]): Promise<CanonicalRecord[]>;

  /**
   * Health check - verify API is accessible and responding
   */
  healthCheck(): Promise<HealthStatus>;

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): RateLimitStatus;
}

/**
 * Configuration for connectors
 */
export interface ConnectorConfig {
  apiKey?: string;                 // Optional API key (if required)
  baseUrl?: string;                // Override default API base URL
  rateLimit?: RateLimitConfig;     // Custom rate limiting
  cacheDir?: string;               // Directory for raw payload cache
  enableCaching?: boolean;         // Enable/disable response caching
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  requestsPerSecond: number;       // Max requests per second
  burst?: number;                  // Burst capacity (token bucket)
  cacheTTL?: number;               // Cache time-to-live in seconds
  backoffMultiplier?: number;      // Exponential backoff multiplier
  maxRetries?: number;             // Max retry attempts on rate limit
}

/**
 * Query parameters (connector-specific)
 */
export interface QueryParams {
  [key: string]: any;              // Flexible params per connector
  limit?: number;                  // Max results to fetch
  offset?: number;                 // Pagination offset
  since?: string;                  // Incremental: fetch since timestamp
}

/**
 * Raw data record with provenance
 */
export interface RawDataRecord {
  sourceId: string;                // Unique ID from source (e.g., NCT ID, PMID)
  sourceType: string;              // Source name (e.g., "ClinicalTrials.gov")
  fetchedAt: string;               // ISO 8601 timestamp (UTC)
  rawPayload: any;                 // Full JSON/XML response (unmodified)
  contentHash: string;             // SHA-256 hash of rawPayload
  apiVersion: string;              // API version used
  connectorVersion: string;        // Connector code version
  queryParams?: Record<string, any>; // Parameters used in query
}

/**
 * Canonical record (transformed data)
 */
export interface CanonicalRecord {
  schemaVersion: string;           // Canonical schema version (e.g., "1.0")
  recordType: RecordType;          // Type of record
  recordId: string;                // Unique ID in canonical schema
  data: any;                       // Schema-specific data
  provenance: ProvenanceMetadata;  // Full provenance chain
}

/**
 * Supported record types (extensible)
 */
export type RecordType =
  | 'Trial'           // Clinical trial
  | 'Publication'     // Scientific paper
  | 'Compound'        // Chemical compound
  | 'Patent'          // Patent filing
  | 'Grant'           // Research grant
  | 'Variant'         // Genetic variant
  | 'Assay'           // Bioassay result
  | 'CompanyEvent';   // Company event/catalyst

/**
 * Provenance metadata (required for all records)
 */
export interface ProvenanceMetadata {
  sourceUrl: string;               // Exact API endpoint called
  sourceType: string;              // Source name
  accessedAt: string;              // ISO 8601 timestamp
  contentHash: string;             // SHA-256 of raw response
  apiVersion: string;              // API version
  connectorVersion: string;        // Connector code version
  rawPayloadLocation: string;      // Path to stored raw payload (S3 or local)
  dataQuality?: DataQualityMetrics; // Optional quality indicators
}

/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
  completeness: number;            // 0-1, fraction of fields populated
  freshness: number;               // Age in hours
  accuracy?: number;               // Optional accuracy score (if validated)
}

/**
 * Health status response
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;            // API response time in ms
  lastSuccessfulFetch?: string;    // ISO 8601 timestamp
  error?: string;                  // Error message if unhealthy
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  tokensRemaining: number;         // Tokens left in bucket
  tokensTotal: number;             // Total bucket capacity
  resetAt: string;                 // ISO 8601 timestamp when resets
  requestsInLastMinute: number;    // Actual requests made
  cacheHitRate: number;            // 0-1, fraction of cached responses
}
```

---

## Directory Structure

Organize connectors by data source:

```
connectors/
├── README.md                      # This file
├── base/                          # Base classes and utilities
│   ├── BaseConnector.ts           # Abstract base class
│   ├── RateLimiter.ts             # Rate limiting utility
│   ├── ProvenanceTracker.ts       # Provenance metadata handler
│   └── CacheManager.ts            # Response caching
├── clinical-trials/               # ClinicalTrials.gov connector
│   ├── CTGovV2Connector.ts        # Main connector class
│   ├── schemas.ts                 # Zod schemas for validation
│   ├── types.ts                   # TypeScript types
│   └── __tests__/                 # Unit and integration tests
│       ├── CTGovV2Connector.test.ts
│       └── integration.test.ts
├── pubmed/                        # PubMed/Entrez connector
│   ├── PubMedConnector.ts
│   ├── schemas.ts
│   └── __tests__/
├── pubchem/                       # PubChem REST API connector
│   ├── PubChemConnector.ts
│   ├── schemas.ts
│   └── __tests__/
└── openfda/                       # OpenFDA connector
    ├── OpenFDAConnector.ts
    ├── schemas.ts
    └── __tests__/
```

---

## Implementation Examples

### Example 1: ClinicalTrials.gov v2 Connector

```typescript
/**
 * ClinicalTrials.gov API v2 Connector
 *
 * Fetches clinical trial data from the public ClinicalTrials.gov API.
 * No API key required. Rate limit: 10 req/s (conservative).
 */

import { DataConnector, RawDataRecord, CanonicalRecord, QueryParams } from './base/types';
import { RateLimiter } from './base/RateLimiter';
import { ProvenanceTracker } from './base/ProvenanceTracker';
import { createHash } from 'crypto';
import fetch from 'node-fetch';

export interface CTGovQueryParams extends QueryParams {
  condition?: string;      // Disease/condition (e.g., "ulcerative colitis")
  intervention?: string;   // Drug/intervention name
  status?: string;         // Trial status (e.g., "RECRUITING")
  phase?: string;          // Trial phase (e.g., "PHASE3")
  sponsor?: string;        // Sponsor name
  nctId?: string;          // Specific NCT ID
  since?: string;          // ISO 8601 timestamp for incremental updates
}

export class CTGovV2Connector implements DataConnector {
  readonly name = "ClinicalTrials.gov v2";
  readonly source = "ClinicalTrials.gov";
  readonly version = "1.0.0";
  readonly apiVersion = "v2";

  private baseUrl = "https://clinicaltrials.gov/api/v2";
  private rateLimiter: RateLimiter;
  private provenanceTracker: ProvenanceTracker;

  constructor() {
    // Conservative rate limit: 10 req/s (API allows 20)
    this.rateLimiter = new RateLimiter({
      requestsPerSecond: 10,
      burst: 20,
      cacheTTL: 3600,  // Cache for 1 hour
    });

    this.provenanceTracker = new ProvenanceTracker({
      cacheDir: 'data/lake/raw/clinicaltrials',
    });
  }

  async initialize(config?: ConnectorConfig): Promise<void> {
    if (config?.rateLimit) {
      this.rateLimiter = new RateLimiter(config.rateLimit);
    }
    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  /**
   * Fetch trials from ClinicalTrials.gov API
   */
  async fetch(query: CTGovQueryParams): Promise<RawDataRecord[]> {
    const url = this.buildUrl(query);

    // Apply rate limiting
    await this.rateLimiter.acquire();

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Biotech-Terminal/1.0 (open-source catalyst platform)'
      }
    });

    if (!response.ok) {
      throw new Error(`CTGov API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawRecords: RawDataRecord[] = [];

    // Process each study in the response
    for (const study of data.studies || []) {
      const nctId = study.protocolSection?.identificationModule?.nctId;
      if (!nctId) continue;

      const rawPayload = study;
      const contentHash = createHash('sha256')
        .update(JSON.stringify(rawPayload))
        .digest('hex');

      // Store raw payload to disk
      const payloadLocation = await this.provenanceTracker.storeRawPayload(
        nctId,
        rawPayload,
        contentHash
      );

      rawRecords.push({
        sourceId: nctId,
        sourceType: this.source,
        fetchedAt: new Date().toISOString(),
        rawPayload,
        contentHash,
        apiVersion: this.apiVersion,
        connectorVersion: this.version,
        queryParams: query
      });
    }

    return rawRecords;
  }

  /**
   * Transform raw CTGov data to canonical Trial schema
   */
  async transform(raw: RawDataRecord[]): Promise<CanonicalRecord[]> {
    return raw.map(record => {
      const study = record.rawPayload;
      const proto = study.protocolSection || {};
      const ident = proto.identificationModule || {};
      const status = proto.statusModule || {};
      const design = proto.designModule || {};
      const sponsor = proto.sponsorCollaboratorsModule || {};

      // Extract canonical fields
      const canonicalData = {
        nctId: ident.nctId,
        title: ident.briefTitle || '',
        officialTitle: ident.officialTitle,
        status: status.overallStatus,
        phase: design.phases?.[0] || 'N/A',
        startDate: status.startDateStruct?.date,
        completionDate: status.completionDateStruct?.date,
        lastUpdateDate: status.lastUpdatePostDateStruct?.date,
        sponsor: sponsor.leadSponsor?.name,
        enrollmentTarget: design.enrollmentInfo?.count,
        studyType: design.studyType,
        interventions: proto.armsInterventionsModule?.interventions?.map((i: any) => i.name),
        conditions: proto.conditionsModule?.conditions,
        primaryEndpoint: proto.outcomesModule?.primaryOutcomes?.[0]?.measure,
      };

      return {
        schemaVersion: '1.0',
        recordType: 'Trial',
        recordId: ident.nctId,
        data: canonicalData,
        provenance: {
          sourceUrl: `${this.baseUrl}/studies/${ident.nctId}`,
          sourceType: this.source,
          accessedAt: record.fetchedAt,
          contentHash: record.contentHash,
          apiVersion: this.apiVersion,
          connectorVersion: this.version,
          rawPayloadLocation: `data/lake/raw/clinicaltrials/${ident.nctId}.json`,
        }
      };
    });
  }

  /**
   * Health check - verify API is accessible
   */
  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/studies?pageSize=1`);
      const responseTime = Date.now() - start;

      if (response.ok) {
        return {
          status: 'healthy',
          responseTime,
          lastSuccessfulFetch: new Date().toISOString()
        };
      } else {
        return {
          status: 'degraded',
          responseTime,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getRateLimitStatus(): RateLimitStatus {
    return this.rateLimiter.getStatus();
  }

  /**
   * Build API URL from query parameters
   */
  private buildUrl(query: CTGovQueryParams): string {
    const url = new URL(`${this.baseUrl}/studies`);

    if (query.condition) {
      url.searchParams.set('query.cond', query.condition);
    }
    if (query.intervention) {
      url.searchParams.set('query.intr', query.intervention);
    }
    if (query.status) {
      url.searchParams.set('filter.overallStatus', query.status);
    }
    if (query.phase) {
      url.searchParams.set('filter.phase', query.phase);
    }
    if (query.sponsor) {
      url.searchParams.set('query.lead', query.sponsor);
    }
    if (query.nctId) {
      // Direct fetch of specific trial
      return `${this.baseUrl}/studies/${query.nctId}`;
    }
    if (query.since) {
      // Incremental: fetch trials updated since timestamp
      url.searchParams.set('filter.lastUpdatePostDate', query.since);
    }

    url.searchParams.set('pageSize', String(query.limit || 50));
    url.searchParams.set('format', 'json');

    return url.toString();
  }
}
```

**Usage Example:**
```typescript
import { CTGovV2Connector } from './clinical-trials/CTGovV2Connector';

async function fetchUlcerativeColotisTrials() {
  const connector = new CTGovV2Connector();
  await connector.initialize();

  // Fetch raw data
  const rawRecords = await connector.fetch({
    condition: 'ulcerative colitis',
    phase: 'PHASE3',
    status: 'RECRUITING',
    limit: 100
  });

  console.log(`Fetched ${rawRecords.length} trials`);

  // Transform to canonical schema
  const canonical = await connector.transform(rawRecords);

  // canonical[0] = {
  //   schemaVersion: '1.0',
  //   recordType: 'Trial',
  //   recordId: 'NCT12345678',
  //   data: { nctId: 'NCT12345678', title: '...', ... },
  //   provenance: { sourceUrl: '...', accessedAt: '...', ... }
  // }

  return canonical;
}
```

---

### Example 2: PubMed/Entrez Connector

```typescript
/**
 * PubMed/Entrez E-utilities Connector
 *
 * Fetches publication data from NCBI's E-utilities API.
 * Free API key recommended for higher rate limits.
 * Rate limit: 2 req/s without key, 10 req/s with key.
 */

import { DataConnector, RawDataRecord, CanonicalRecord, QueryParams } from './base/types';
import { RateLimiter } from './base/RateLimiter';
import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export interface PubMedQueryParams extends QueryParams {
  term?: string;           // Search term (e.g., "pembrolizumab cancer")
  pmid?: string;           // Specific PubMed ID
  author?: string;         // Author name
  journal?: string;        // Journal name
  dateFrom?: string;       // Start date (YYYY/MM/DD)
  dateTo?: string;         // End date (YYYY/MM/DD)
  retmax?: number;         // Max results (default: 20)
}

export class PubMedConnector implements DataConnector {
  readonly name = "PubMed/Entrez";
  readonly source = "PubMed";
  readonly version = "1.0.0";
  readonly apiVersion = "eutils";

  private baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
  private apiKey?: string;
  private rateLimiter: RateLimiter;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;

    // Rate limit: 2 req/s without key, 10 req/s with key (use conservative 8)
    const rps = apiKey ? 8 : 2;
    this.rateLimiter = new RateLimiter({
      requestsPerSecond: rps,
      burst: rps * 2,
      cacheTTL: 7200,  // Cache for 2 hours (publications change slowly)
    });
  }

  async initialize(config?: ConnectorConfig): Promise<void> {
    if (config?.apiKey) {
      this.apiKey = config.apiKey;
      // Update rate limiter with key
      this.rateLimiter = new RateLimiter({
        requestsPerSecond: 8,
        burst: 16,
        cacheTTL: 7200
      });
    }
  }

  /**
   * Fetch publications from PubMed
   */
  async fetch(query: PubMedQueryParams): Promise<RawDataRecord[]> {
    // Step 1: Search for PMIDs
    const pmids = query.pmid
      ? [query.pmid]
      : await this.searchPMIDs(query);

    if (pmids.length === 0) {
      return [];
    }

    // Step 2: Fetch full records for each PMID
    const rawRecords: RawDataRecord[] = [];

    for (const pmid of pmids) {
      await this.rateLimiter.acquire();

      const url = this.buildFetchUrl(pmid);
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Failed to fetch PMID ${pmid}: ${response.status}`);
        continue;
      }

      const xmlText = await response.text();
      const rawPayload = await parseStringPromise(xmlText);

      const contentHash = createHash('sha256')
        .update(xmlText)
        .digest('hex');

      rawRecords.push({
        sourceId: pmid,
        sourceType: this.source,
        fetchedAt: new Date().toISOString(),
        rawPayload,
        contentHash,
        apiVersion: this.apiVersion,
        connectorVersion: this.version,
        queryParams: query
      });
    }

    return rawRecords;
  }

  /**
   * Search for PMIDs matching query
   */
  private async searchPMIDs(query: PubMedQueryParams): Promise<string[]> {
    await this.rateLimiter.acquire();

    const url = new URL(`${this.baseUrl}/esearch.fcgi`);
    url.searchParams.set('db', 'pubmed');
    url.searchParams.set('retmode', 'json');
    url.searchParams.set('retmax', String(query.retmax || 20));

    // Build search term
    const searchTerms: string[] = [];
    if (query.term) searchTerms.push(query.term);
    if (query.author) searchTerms.push(`${query.author}[Author]`);
    if (query.journal) searchTerms.push(`${query.journal}[Journal]`);
    if (query.dateFrom && query.dateTo) {
      searchTerms.push(`${query.dateFrom}:${query.dateTo}[Date - Publication]`);
    }

    url.searchParams.set('term', searchTerms.join(' AND '));

    if (this.apiKey) {
      url.searchParams.set('api_key', this.apiKey);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    return data.esearchresult?.idlist || [];
  }

  /**
   * Transform raw PubMed XML to canonical Publication schema
   */
  async transform(raw: RawDataRecord[]): Promise<CanonicalRecord[]> {
    return raw.map(record => {
      const article = record.rawPayload.PubmedArticleSet?.PubmedArticle?.[0];
      const medline = article?.MedlineCitation?.[0];
      const articleData = medline?.Article?.[0];

      const canonicalData = {
        pmid: medline?.PMID?.[0]?._ || medline?.PMID?.[0],
        title: articleData?.ArticleTitle?.[0] || '',
        abstract: articleData?.Abstract?.[0]?.AbstractText?.[0] || '',
        journal: articleData?.Journal?.[0]?.Title?.[0] || '',
        publicationDate: articleData?.Journal?.[0]?.JournalIssue?.[0]?.PubDate?.[0]?.Year?.[0],
        authors: articleData?.AuthorList?.[0]?.Author?.map((a: any) =>
          `${a.LastName?.[0] || ''} ${a.ForeName?.[0] || ''}`.trim()
        ) || [],
        meshTerms: medline?.MeshHeadingList?.[0]?.MeshHeading?.map((m: any) =>
          m.DescriptorName?.[0]?._ || ''
        ) || [],
      };

      return {
        schemaVersion: '1.0',
        recordType: 'Publication',
        recordId: canonicalData.pmid,
        data: canonicalData,
        provenance: {
          sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${canonicalData.pmid}/`,
          sourceType: this.source,
          accessedAt: record.fetchedAt,
          contentHash: record.contentHash,
          apiVersion: this.apiVersion,
          connectorVersion: this.version,
          rawPayloadLocation: `data/lake/raw/pubmed/${canonicalData.pmid}.xml`,
        }
      };
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/esearch.fcgi?db=pubmed&term=test&retmax=1`);
      const responseTime = Date.now() - start;

      return {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastSuccessfulFetch: new Date().toISOString(),
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  getRateLimitStatus(): RateLimitStatus {
    return this.rateLimiter.getStatus();
  }

  private buildFetchUrl(pmid: string): string {
    const url = new URL(`${this.baseUrl}/efetch.fcgi`);
    url.searchParams.set('db', 'pubmed');
    url.searchParams.set('id', pmid);
    url.searchParams.set('retmode', 'xml');

    if (this.apiKey) {
      url.searchParams.set('api_key', this.apiKey);
    }

    return url.toString();
  }
}
```

**Usage Example:**
```typescript
import { PubMedConnector } from './pubmed/PubMedConnector';

async function fetchPembrolizumabPublications() {
  const connector = new PubMedConnector(process.env.NCBI_API_KEY);
  await connector.initialize();

  const rawRecords = await connector.fetch({
    term: 'pembrolizumab AND (phase 3 OR phase 2)',
    dateFrom: '2023/01/01',
    dateTo: '2024/12/31',
    retmax: 50
  });

  const canonical = await connector.transform(rawRecords);

  return canonical;
}
```

---

## Rate Limiting Best Practices

### 1. Token Bucket Algorithm

```typescript
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      requestsPerSecond: config.requestsPerSecond,
      burst: config.burst || config.requestsPerSecond * 2,
      cacheTTL: config.cacheTTL || 3600,
      backoffMultiplier: config.backoffMultiplier || 2,
      maxRetries: config.maxRetries || 3,
    };

    this.tokens = this.config.burst!;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait until tokens available
    const waitTime = 1000 / this.config.requestsPerSecond;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    return this.acquire();
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const refill = elapsed * this.config.requestsPerSecond;

    this.tokens = Math.min(
      this.tokens + refill,
      this.config.burst!
    );
    this.lastRefill = now;
  }

  getStatus(): RateLimitStatus {
    this.refillTokens();

    return {
      tokensRemaining: Math.floor(this.tokens),
      tokensTotal: this.config.burst!,
      resetAt: new Date(
        this.lastRefill + (this.config.burst! / this.config.requestsPerSecond) * 1000
      ).toISOString(),
      requestsInLastMinute: 0,  // TODO: track
      cacheHitRate: 0,          // TODO: track
    };
  }
}
```

### 2. Exponential Backoff

```typescript
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  backoffMultiplier: number = 2
): Promise<Response> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        // Rate limited - exponential backoff
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.pow(backoffMultiplier, attempt) * 1000;

        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        attempt++;
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const waitTime = Math.pow(backoffMultiplier, attempt) * 1000;
      console.log(`Error, retrying in ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      attempt++;
    }
  }

  throw new Error(`Max retries (${maxRetries}) exceeded`);
}
```

### 3. Response Caching

```typescript
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class CacheManager {
  constructor(private cacheDir: string, private ttl: number) {}

  async get(key: string): Promise<any | null> {
    const cacheFile = this.getCacheFilePath(key);

    try {
      const stat = await fs.stat(cacheFile);
      const age = (Date.now() - stat.mtimeMs) / 1000;

      if (age > this.ttl) {
        // Expired
        await fs.unlink(cacheFile);
        return null;
      }

      const data = await fs.readFile(cacheFile, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    const cacheFile = this.getCacheFilePath(key);
    await fs.mkdir(path.dirname(cacheFile), { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify(value), 'utf-8');
  }

  private getCacheFilePath(key: string): string {
    const hash = createHash('sha256').update(key).digest('hex');
    return path.join(this.cacheDir, `${hash}.json`);
  }
}
```

---

## Provenance Tracking

### Store Raw Payloads

```typescript
export class ProvenanceTracker {
  constructor(private config: { cacheDir: string }) {}

  async storeRawPayload(
    sourceId: string,
    payload: any,
    contentHash: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().split('T')[0];
    const dir = path.join(this.config.cacheDir, timestamp);
    const filename = `${sourceId}.json`;
    const filepath = path.join(dir, filename);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      filepath,
      JSON.stringify(payload, null, 2),
      'utf-8'
    );

    // Also store metadata
    const metadata = {
      sourceId,
      contentHash,
      storedAt: new Date().toISOString(),
      filepath
    };

    await fs.writeFile(
      path.join(dir, `${sourceId}.meta.json`),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    return filepath;
  }
}
```

---

## Testing

### Unit Tests

```typescript
import { CTGovV2Connector } from '../CTGovV2Connector';

describe('CTGovV2Connector', () => {
  let connector: CTGovV2Connector;

  beforeEach(() => {
    connector = new CTGovV2Connector();
  });

  test('should initialize successfully', async () => {
    await expect(connector.initialize()).resolves.not.toThrow();
  });

  test('should build correct URL for condition query', () => {
    const url = connector['buildUrl']({
      condition: 'ulcerative colitis',
      limit: 10
    });

    expect(url).toContain('query.cond=ulcerative+colitis');
    expect(url).toContain('pageSize=10');
  });

  test('should respect rate limits', async () => {
    const start = Date.now();

    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      await connector['rateLimiter'].acquire();
    }

    const elapsed = Date.now() - start;

    // Should take at least 400ms (5 requests at 10 req/s = 0.5s, but burst allows faster)
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});
```

### Integration Tests

```typescript
describe('CTGovV2Connector Integration', () => {
  let connector: CTGovV2Connector;

  beforeEach(() => {
    connector = new CTGovV2Connector();
  });

  test('should fetch real trials from API', async () => {
    const rawRecords = await connector.fetch({
      condition: 'cancer',
      limit: 5
    });

    expect(rawRecords.length).toBeGreaterThan(0);
    expect(rawRecords[0]).toHaveProperty('sourceId');
    expect(rawRecords[0]).toHaveProperty('rawPayload');
    expect(rawRecords[0]).toHaveProperty('contentHash');
  }, 30000); // 30s timeout for API calls

  test('should transform raw data to canonical schema', async () => {
    const rawRecords = await connector.fetch({
      nctId: 'NCT00000102'  // Example trial
    });

    const canonical = await connector.transform(rawRecords);

    expect(canonical.length).toBe(rawRecords.length);
    expect(canonical[0].recordType).toBe('Trial');
    expect(canonical[0].provenance).toHaveProperty('sourceUrl');
  }, 30000);

  test('health check should return healthy status', async () => {
    const health = await connector.healthCheck();

    expect(health.status).toBe('healthy');
    expect(health.responseTime).toBeLessThan(5000);
  });
});
```

---

## Next Steps

1. **Implement Base Classes**: Start with `BaseConnector`, `RateLimiter`, `ProvenanceTracker`
2. **Build Priority Connectors** (see NIH_INTEGRATION_PLAN.md):
   - ClinicalTrials.gov v2 (P0)
   - PubMed/Entrez (P0)
   - PubChem (P0)
3. **Write Tests**: Unit and integration tests for each connector
4. **Documentation**: Add usage examples and API documentation
5. **CI/CD**: Add automated testing in GitHub Actions

---

## Contributing

When adding a new connector:

1. Create issue using `.github/ISSUE_TEMPLATE/nih-integration.md`
2. Verify data source is open/free (no cost, no subscription)
3. Follow interface specification in this document
4. Include unit and integration tests
5. Document rate limits and API terms
6. Add example usage to this README

---

## Resources

- [NIH Integration Plan](../docs/NIH_INTEGRATION_PLAN.md)
- [Data Sources Documentation](../docs/DATA_SOURCES.md)
- [Existing Connectors](../src/connectors/) (TypeScript examples)

---

**Last Updated**: 2024-01-15
**Maintained By**: Data Platform Team
