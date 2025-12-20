import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel'
import { RefreshModeToggle } from '../../../frontend-components/src/terminal/molecules/RefreshModeToggle/RefreshModeToggle'
import type { RefreshMode } from '../../../src/types/biotech'
import './EvidenceJournalPage.css'
import { previewEvidence } from '../data/previewData'

export function EvidenceJournalPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [refreshMode, setRefreshMode] = useState<RefreshMode>('manual')
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toISOString())
  const [evidenceData, setEvidenceData] = useState<any>(previewEvidence)

  const getActiveTabFromRoute = (): 'today' | 'catalysts' | 'moa' | 'scorecard' | 'journal' => {
    const path = location.pathname
    if (path.includes('/catalysts')) return 'catalysts'
    if (path.includes('/moa')) return 'moa'
    if (path.includes('/companies/')) return 'scorecard'
    if (path.includes('/journal')) return 'journal'
    return 'today'
  }

  const [activeTab, setActiveTab] = useState<'today' | 'catalysts' | 'moa' | 'scorecard' | 'journal'>(
    getActiveTabFromRoute(),
  )

  useEffect(() => {
    setEvidenceData(previewEvidence)
    setLastRefreshed(new Date().toISOString())
  }, [])

  useEffect(() => {
    setActiveTab(getActiveTabFromRoute())
  }, [location.pathname])

  const handleTabChange = (tab: 'today' | 'catalysts' | 'moa' | 'scorecard' | 'journal') => {
    setActiveTab(tab)
    const routes = {
      today: '/evidence',
      catalysts: '/catalysts',
      moa: '/moa',
      scorecard: '/companies/example',
      journal: '/journal',
    }
    navigate(routes[tab])
  }

  return (
    <div className="evidence-journal-page">
      <div className="page-header">
        <h1 className="page-title">EVIDENCE JOURNAL</h1>
        <p className="page-subtitle">Science-first biotech intelligence • Mechanism → Evidence → Catalysts</p>
      </div>

      <RefreshModeToggle
        mode={refreshMode}
        onChange={(mode) => {
          setRefreshMode(mode)
          setLastRefreshed(new Date().toISOString())
        }}
        lastRefreshed={lastRefreshed}
        scheduledInterval={10}
      />

      <div className="journal-tabs">
        <button className={`tab-button ${activeTab === 'today' ? 'active' : ''}`} onClick={() => handleTabChange('today')}>
          TODAY'S EVIDENCE
        </button>
        <button
          className={`tab-button ${activeTab === 'catalysts' ? 'active' : ''}`}
          onClick={() => handleTabChange('catalysts')}
        >
          CATALYST BOARD
        </button>
        <button className={`tab-button ${activeTab === 'moa' ? 'active' : ''}`} onClick={() => handleTabChange('moa')}>
          MOA EXPLORER
        </button>
        <button
          className={`tab-button ${activeTab === 'scorecard' ? 'active' : ''}`}
          onClick={() => handleTabChange('scorecard')}
        >
          COMPANY SCORECARD
        </button>
        <button className={`tab-button ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => handleTabChange('journal')}>
          JOURNAL
        </button>
      </div>

      <div className="journal-content">
        {activeTab === 'today' && <TodaysEvidenceView refreshMode={refreshMode} />}
        {activeTab === 'catalysts' && <CatalystBoardView />}
        {activeTab === 'moa' && <MoaExplorerView />}
        {activeTab === 'scorecard' && <CompanyScorecardView />}
        {activeTab === 'journal' && <JournalNotebookView evidenceData={evidenceData} />}
      </div>
    </div>
  )
}

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
                badge: 'FDA',
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
  )
}

function CatalystBoardView() {
  return (
    <div className="catalyst-board-view">
      <Panel title="CATALYST BOARD" subtitle="Next 90-180 days" cornerBrackets>
        <div className="timeline-notice">
          <p>
            <strong>Catalyst Timeline:</strong> PDUFA dates, AdComm meetings, trial readouts, CHMP opinions. Color-coded by
            confidence level. Click for detailed dossier.
          </p>
        </div>

        <div className="catalyst-timeline">
          <CatalystCard
            date="2026-04-15"
            type="AdComm"
            drug="Drug A"
            company="Company X"
            confidence="High"
            expectedImpact="Upside"
          />
          <CatalystCard date="2026-05-10" type="CHMP" drug="Drug B" company="Company Y" confidence="Medium" expectedImpact="Inline" />
          <CatalystCard date="2026-06-01" type="Readout" drug="Drug C" company="Company Z" confidence="Medium" expectedImpact="Binary" />
        </div>
      </Panel>
    </div>
  )
}

function MoaExplorerView() {
  return (
    <Panel title="MOA EXPLORER" subtitle="Mechanism differentiation" cornerBrackets>
      <div className="moa-grid">
        <MoaCard
          mechanism="Base Editing"
          companies="VERV | BEAM"
          differentiation="Single-dose LDL lowering; delivery vs fidelity tradeoff"
        />
        <MoaCard mechanism="ASO" companies="IONS | WVE" differentiation="Chemistry and tissue targeting drive durability" />
        <MoaCard mechanism="GLP-1" companies="NVO | LLY" differentiation="Weight loss + renal/cardiac outcomes drive upside" />
      </div>
    </Panel>
  )
}

function CompanyScorecardView() {
  return (
    <Panel title="COMPANY SCORECARD" subtitle="Evidence stack" cornerBrackets>
      <div className="scorecard-grid">
        <ScorecardRow label="Mechanism Strength" score={0.82} trend="up" note="In vivo LDL durability" />
        <ScorecardRow label="Execution" score={0.74} trend="neutral" note="On-time data drops" />
        <ScorecardRow label="Financing" score={0.69} trend="down" note="Runway into 2027" />
      </div>
    </Panel>
  )
}

function JournalNotebookView({ evidenceData }: { evidenceData: any }) {
  return (
    <Panel title="JOURNAL" subtitle={evidenceData?.notebookTitle} cornerBrackets>
      <div className="journal-grid">
        <JournalEntry title="Why base editing matters" tag="Research" updated="Today" />
        <JournalEntry title="GLP-1 renal optionality" tag="Clinical" updated="2h ago" />
        <JournalEntry title="SMA durability tracker" tag="Trial" updated="1d ago" />
      </div>
    </Panel>
  )
}

function EvidenceCard({
  title,
  count,
  description,
  items,
}: {
  title: string
  count: number
  description: string
  items: { label: string; detail: string; badge: string }[]
}) {
  return (
    <div className="evidence-card">
      <div className="evidence-card-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="count-pill">{count}</div>
      </div>
      <ul className="evidence-list">
        {items.map((item) => (
          <li key={item.label}>
            <span className="badge">{item.badge}</span>
            <div>
              <div className="item-label">{item.label}</div>
              <div className="item-detail">{item.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CatalystCard({
  date,
  type,
  drug,
  company,
  confidence,
  expectedImpact,
}: {
  date: string
  type: string
  drug: string
  company: string
  confidence: 'High' | 'Medium' | 'Low'
  expectedImpact: string
}) {
  return (
    <div className="mini-card">
      <div className="mini-card-header">
        <span className="badge ghost">{type}</span>
        <span className={`badge ${confidence === 'High' ? 'success' : confidence === 'Medium' ? 'warning' : 'error'}`}>
          {confidence}
        </span>
      </div>
      <div className="mini-card-date">{new Date(date).toLocaleDateString()}</div>
      <h4>{drug}</h4>
      <p>{company}</p>
      <p className="muted">{expectedImpact}</p>
    </div>
  )
}

function MoaCard({ mechanism, companies, differentiation }: { mechanism: string; companies: string; differentiation: string }) {
  return (
    <div className="mini-card">
      <div className="mini-card-header">
        <span className="badge ghost">MOA</span>
        <span className="badge">{mechanism}</span>
      </div>
      <h4>{companies}</h4>
      <p className="muted">{differentiation}</p>
    </div>
  )
}

function ScorecardRow({ label, score, trend, note }: { label: string; score: number; trend: 'up' | 'down' | 'neutral'; note: string }) {
  return (
    <div className="scorecard-row">
      <div className="scorecard-label">{label}</div>
      <div className="scorecard-score">
        <span>{Math.round(score * 100)}%</span>
        <span className={`trend ${trend}`}>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'}</span>
      </div>
      <div className="scorecard-note">{note}</div>
    </div>
  )
}

function JournalEntry({ title, tag, updated }: { title: string; tag: string; updated: string }) {
  return (
    <div className="journal-entry">
      <div className="journal-title">{title}</div>
      <div className="journal-meta">
        <span className="badge ghost">{tag}</span>
        <span className="muted">Updated {updated}</span>
      </div>
    </div>
  )
}
