import React, { useState } from 'react';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel';
import { RefreshModeToggle } from '../../../frontend-components/src/terminal/molecules/RefreshModeToggle/RefreshModeToggle';
import type { RefreshMode } from '../../../src/types/biotech';
import './EvidenceJournalPage.css';

/**
 * Evidence Journal Page
 * 
 * A science-first evidence journal that ranks companies and assets by mechanistic 
 * differentiation and surfaces near-term catalysts with transparent evidence trails.
 * 
 * Features:
 * - Manual/Scheduled/Live refresh modes
 * - Today's Evidence updates
 * - Catalyst Board (90-180 day timeline)
 * - MoA Explorer (mechanism differentiation)
 * - Company Scorecard (evidence stack)
 * - Journal notebook (pinned notes + evidence stream)
 */
export function EvidenceJournalPage() {
  const [refreshMode, setRefreshMode] = useState<RefreshMode>('manual');
  const [lastRefreshed] = useState<string>(new Date().toISOString());
  const [activeTab, setActiveTab] = useState<'today' | 'catalysts' | 'moa' | 'scorecard' | 'journal'>('today');

  return (
    <div className="evidence-journal-page">
      <div className="page-header">
        <h1 className="page-title">EVIDENCE JOURNAL</h1>
        <p className="page-subtitle">
          Science-first biotech intelligence • Mechanism → Evidence → Catalysts
        </p>
      </div>

      <RefreshModeToggle
        mode={refreshMode}
        onChange={setRefreshMode}
        lastRefreshed={lastRefreshed}
        scheduledInterval={10}
      />

      <div className="journal-tabs">
        <button
          className={`tab-button ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          TODAY'S EVIDENCE
        </button>
        <button
          className={`tab-button ${activeTab === 'catalysts' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalysts')}
        >
          CATALYST BOARD
        </button>
        <button
          className={`tab-button ${activeTab === 'moa' ? 'active' : ''}`}
          onClick={() => setActiveTab('moa')}
        >
          MOA EXPLORER
        </button>
        <button
          className={`tab-button ${activeTab === 'scorecard' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorecard')}
        >
          COMPANY SCORECARD
        </button>
        <button
          className={`tab-button ${activeTab === 'journal' ? 'active' : ''}`}
          onClick={() => setActiveTab('journal')}
        >
          JOURNAL
        </button>
      </div>

      <div className="journal-content">
        {activeTab === 'today' && <TodaysEvidenceView refreshMode={refreshMode} />}
        {activeTab === 'catalysts' && <CatalystBoardView />}
        {activeTab === 'moa' && <MoaExplorerView />}
        {activeTab === 'scorecard' && <CompanyScorecardView />}
        {activeTab === 'journal' && <JournalNotebookView />}
      </div>
    </div>
  );
}

// Today's Evidence View
function TodaysEvidenceView({ refreshMode }: { refreshMode: RefreshMode }) {
  return (
    <div className="todays-evidence-view">
      <Panel title="TODAY'S EVIDENCE" cornerBrackets>
        <div className="evidence-grid">
          <EvidenceCard
            title="New Trial Events"
            count={3}
            description="Status changes, enrollment milestones, readout dates"
            items={[
              { label: 'NCT12345678', detail: 'Status → Recruiting (DMD trial)', badge: 'CT.gov' },
              { label: 'NCT87654321', detail: 'Primary completion: Q2 2026 (IBD)', badge: 'CT.gov' },
              { label: 'NCT11223344', detail: 'Interim analysis scheduled (Cardio)', badge: 'CT.gov' },
            ]}
          />

          <EvidenceCard
            title="Label/Guidance Changes"
            count={1}
            description="FDA label updates, guidance documents, safety alerts"
            items={[
              { 
                label: 'FDA Guidance', 
                detail: 'Heart Failure endpoints - functional capacity now approvable',
                badge: 'FDA'
              },
            ]}
          />

          <EvidenceCard
            title="AdComm Docket Changes"
            count={2}
            description="Advisory committee meeting updates and rescheduling"
            items={[
              { label: 'DRUG-2026-001', detail: 'AdComm date confirmed: April 15, 2026', badge: 'FDA' },
              { label: 'DRUG-2026-003', detail: 'CHMP opinion expected: May 2026', badge: 'EMA' },
            ]}
          />

          <EvidenceCard
            title="New 8-K Filings"
            count={4}
            description="Recent SEC filings mentioning clinical endpoints or regulatory updates"
            items={[
              { label: 'TICKER: XYZ', detail: 'Phase III readout mentioned in 8-K', badge: 'SEC' },
              { label: 'TICKER: ABC', detail: 'CRL response submitted to FDA', badge: 'SEC' },
              { label: 'TICKER: DEF', detail: 'Partnership announced for IBD program', badge: 'SEC' },
              { label: 'TICKER: GHI', detail: 'DME study interim results disclosed', badge: 'SEC' },
            ]}
          />
        </div>

        {refreshMode !== 'manual' && (
          <div className="pending-updates-banner">
            <span className="banner-icon">📬</span>
            <span>5 new updates pending. </span>
            <button className="apply-diff-button">Review & Apply Changes</button>
          </div>
        )}
      </Panel>
    </div>
  );
}

// Catalyst Board View
function CatalystBoardView() {
  return (
    <div className="catalyst-board-view">
      <Panel title="CATALYST BOARD" subtitle="Next 90-180 days" cornerBrackets>
        <div className="timeline-notice">
          <p>
            <strong>Catalyst Timeline:</strong> PDUFA dates, AdComm meetings, trial readouts, 
            CHMP opinions. Color-coded by confidence level. Click for detailed dossier.
          </p>
        </div>

        <div className="catalyst-timeline">
          <CatalystCard
            date="2026-04-15"
            type="AdComm"
            drug="Drug A"
            company="Company X"
            confidence="High"
            source="FDA Advisory Committee Calendar"
          />
          <CatalystCard
            date="2026-05-20"
            type="PDUFA"
            drug="Drug B"
            company="Company Y"
            confidence="High"
            source="FDA Drugs@FDA"
          />
          <CatalystCard
            date="2026-06-15 to 2026-07-15"
            type="Readout"
            drug="Drug C"
            company="Company Z"
            confidence="Medium"
            source="ClinicalTrials.gov + Company 8-K"
          />
        </div>
      </Panel>
    </div>
  );
}

// MoA Explorer View
function MoaExplorerView() {
  return (
    <div className="moa-explorer-view">
      <Panel title="MOA EXPLORER" subtitle="Mechanism-centric differentiation" cornerBrackets>
        <div className="moa-search">
          <input
            type="text"
            placeholder="Search targets: IL-23, TL1A, Factor XI, Lp(a)..."
            className="moa-search-input"
          />
        </div>

        <div className="moa-results">
          <MoaCard
            target="IL-23"
            geneticScore={0.85}
            benchPotency="IC50 < 10nM"
            competitors={['Drug A (Phase III)', 'Drug B (Phase II)', 'Drug C (Filed)']}
            differentiationScore={78}
          />
          <MoaCard
            target="TL1A/DR3"
            geneticScore={0.72}
            benchPotency="IC50 15nM"
            competitors={['Drug D (Phase II)', 'Drug E (Preclinical)']}
            differentiationScore={82}
          />
          <MoaCard
            target="Factor XI"
            geneticScore={0.91}
            benchPotency="Ki < 5nM"
            competitors={['Drug F (Phase III)', 'Drug G (Phase II)']}
            differentiationScore={88}
          />
        </div>
      </Panel>
    </div>
  );
}

// Company Scorecard View
function CompanyScorecardView() {
  return (
    <div className="company-scorecard-view">
      <Panel title="COMPANY SCORECARD" subtitle="Evidence stack + runway + catalysts" cornerBrackets>
        <div className="company-select">
          <select className="company-selector">
            <option>Select company...</option>
            <option>Company X (Ticker: XYZ)</option>
            <option>Company Y (Ticker: ABC)</option>
            <option>Company Z (Ticker: DEF)</option>
          </select>
        </div>

        <div className="scorecard-content">
          <div className="evidence-pyramid">
            <h3>EVIDENCE STACK</h3>
            <div className="pyramid-level genetic">
              <strong>Genetic:</strong> Open Targets score 0.85 (IL-23 → IBD association)
            </div>
            <div className="pyramid-level translational">
              <strong>Translational:</strong> Biomarker alignment confirmed in Phase I
            </div>
            <div className="pyramid-level clinical">
              <strong>Clinical:</strong> Phase II data: 45% remission (MMS), p&lt;0.001
            </div>
          </div>

          <div className="runway-catalysts">
            <div className="runway-widget">
              <h4>CASH RUNWAY</h4>
              <p className="runway-months">18 months</p>
              <p className="runway-detail">Based on Q4 2025 10-K filing</p>
            </div>

            <div className="near-catalysts-widget">
              <h4>NEAR CATALYSTS</h4>
              <ul className="catalyst-list">
                <li>Phase III readout: Q2 2026</li>
                <li>FDA AdComm: April 15, 2026</li>
              </ul>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

// Journal Notebook View
function JournalNotebookView() {
  return (
    <div className="journal-notebook-view">
      <div className="journal-layout">
        <div className="pinned-notes">
          <Panel title="PINNED NOTES" cornerBrackets>
            <div className="note-item">
              <h4>IL-23 vs TL1A in IBD</h4>
              <p>
                <strong>So what?</strong> IL-23 has broader genetic support but TL1A may offer 
                better endoscopic remission rates. Watch for combo studies.
              </p>
              <div className="note-sources">
                <span className="source-badge">Open Targets</span>
                <span className="source-badge">CT.gov NCT12345</span>
              </div>
            </div>

            <div className="note-item">
              <h4>DMD: Elevidys vs Next-Gen</h4>
              <p>
                <strong>So what?</strong> First-mover advantage vs better expression profile. 
                Safety durability is the key differentiator.
              </p>
              <div className="note-sources">
                <span className="source-badge">FDA Label</span>
                <span className="source-badge">8-K Filing</span>
              </div>
            </div>
          </Panel>
        </div>

        <div className="evidence-stream">
          <Panel title="EVIDENCE STREAM" subtitle="Source-linked snippets" cornerBrackets>
            <div className="stream-item">
              <div className="stream-header">
                <span className="evidence-class">Genetic</span>
                <span className="evidence-source">Open Targets</span>
                <span className="evidence-date">2026-01-10</span>
              </div>
              <p className="evidence-snippet">
                IL-23 → Crohn's disease association score: 0.85 (top decile for IBD genetics)
              </p>
              <a href="#" className="evidence-link">View source →</a>
              <button className="add-to-journal">Add to Journal</button>
            </div>

            <div className="stream-item">
              <div className="stream-header">
                <span className="evidence-class">Clinical</span>
                <span className="evidence-source">ClinicalTrials.gov</span>
                <span className="evidence-date">2026-01-09</span>
              </div>
              <p className="evidence-snippet">
                NCT12345: Phase II IBD trial, endpoint = MMS (Mayo score), multiplicity-controlled, 
                N=250, powered for superiority
              </p>
              <a href="#" className="evidence-link">View NCT12345 →</a>
              <button className="add-to-journal">Add to Journal</button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// Helper Components
interface EvidenceCardProps {
  title: string;
  count: number;
  description: string;
  items: Array<{ label: string; detail: string; badge: string }>;
}

function EvidenceCard({ title, count, description, items }: EvidenceCardProps) {
  return (
    <div className="evidence-card">
      <div className="card-header">
        <h3>{title}</h3>
        <span className="count-badge">{count}</span>
      </div>
      <p className="card-description">{description}</p>
      <div className="card-items">
        {items.map((item, idx) => (
          <div key={idx} className="evidence-item">
            <div className="item-header">
              <strong>{item.label}</strong>
              <span className={`source-badge ${item.badge.toLowerCase()}`}>{item.badge}</span>
            </div>
            <p className="item-detail">{item.detail}</p>
            <button className="add-button">Add to Journal</button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CatalystCardProps {
  date: string;
  type: string;
  drug: string;
  company: string;
  confidence: string;
  source: string;
}

function CatalystCard({ date, type, drug, company, confidence, source }: CatalystCardProps) {
  return (
    <div className={`catalyst-card confidence-${confidence.toLowerCase()}`}>
      <div className="catalyst-date">{date}</div>
      <div className="catalyst-type">{type}</div>
      <div className="catalyst-drug">{drug} ({company})</div>
      <div className="catalyst-confidence">Confidence: {confidence}</div>
      <div className="catalyst-source">Source: {source}</div>
      <button className="promote-watchlist">Promote to Watchlist</button>
    </div>
  );
}

interface MoaCardProps {
  target: string;
  geneticScore: number;
  benchPotency: string;
  competitors: string[];
  differentiationScore: number;
}

function MoaCard({ target, geneticScore, benchPotency, competitors, differentiationScore }: MoaCardProps) {
  return (
    <div className="moa-card">
      <h3 className="moa-target">{target}</h3>
      <div className="moa-metrics">
        <div className="metric-item">
          <span className="metric-label">Genetic Evidence:</span>
          <span className="metric-value">{(geneticScore * 100).toFixed(0)}/100</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Bench Potency:</span>
          <span className="metric-value">{benchPotency}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Differentiation:</span>
          <span className="metric-value score-high">{differentiationScore}/100</span>
        </div>
      </div>
      <div className="competitors-section">
        <h4>Competitors:</h4>
        <ul>
          {competitors.map((comp, idx) => (
            <li key={idx}>{comp}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
