import React, { useState, useMemo } from 'react';
import type { Program, Phase } from '../../../src/types/biotech';
import './QueryBuilder.css';

interface Filters {
  phases: Phase[];
  therapeuticAreas: string[];
  indications: string[];
  partnered: boolean | null;
}

interface QueryBuilderProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  programs: Program[];
}

interface SavedFilter {
  id: string;
  name: string;
  filters: Filters;
}

const QUICK_FILTERS: { name: string; filters: Partial<Filters> }[] = [
  {
    name: 'Neuro Mid-Stage',
    filters: {
      therapeuticAreas: ['Neurology', 'CNS'],
      phases: ['Phase II', 'Phase III'],
    },
  },
  {
    name: 'Late-Stage',
    filters: {
      phases: ['Phase III', 'Filed'],
    },
  },
  {
    name: 'Partnered Programs',
    filters: {
      partnered: true,
    },
  },
  {
    name: 'Oncology All Phases',
    filters: {
      therapeuticAreas: ['Oncology'],
    },
  },
];

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  filters,
  onFiltersChange,
  programs,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const saved = localStorage.getItem('pm-saved-filters');
    return saved ? JSON.parse(saved) : [];
  });

  // Extract unique values
  const { therapeuticAreas, indications, phases } = useMemo(() => {
    const tas = new Set<string>();
    const inds = new Set<string>();
    const phs = new Set<Phase>();

    programs.forEach(p => {
      tas.add(p.therapeuticArea);
      inds.add(p.indication);
      phs.add(p.phase);
    });

    return {
      therapeuticAreas: Array.from(tas).sort(),
      indications: Array.from(inds).sort(),
      phases: Array.from(phs).sort() as Phase[],
    };
  }, [programs]);

  const handlePhaseToggle = (phase: Phase) => {
    const newPhases = filters.phases.includes(phase)
      ? filters.phases.filter(p => p !== phase)
      : [...filters.phases, phase];
    onFiltersChange({ ...filters, phases: newPhases });
  };

  const handleTAToggle = (ta: string) => {
    const newTAs = filters.therapeuticAreas.includes(ta)
      ? filters.therapeuticAreas.filter(t => t !== ta)
      : [...filters.therapeuticAreas, ta];
    onFiltersChange({ ...filters, therapeuticAreas: newTAs });
  };

  const handleIndicationToggle = (ind: string) => {
    const newInds = filters.indications.includes(ind)
      ? filters.indications.filter(i => i !== ind)
      : [...filters.indications, ind];
    onFiltersChange({ ...filters, indications: newInds });
  };

  const handlePartneredToggle = () => {
    const next = filters.partnered === true ? false : filters.partnered === false ? null : true;
    onFiltersChange({ ...filters, partnered: next });
  };

  const clearAll = () => {
    onFiltersChange({
      phases: [],
      therapeuticAreas: [],
      indications: [],
      partnered: null,
    });
  };

  const applyQuickFilter = (quickFilter: { name: string; filters: Partial<Filters> }) => {
    onFiltersChange({
      phases: quickFilter.filters.phases || [],
      therapeuticAreas: quickFilter.filters.therapeuticAreas || [],
      indications: quickFilter.filters.indications || [],
      partnered: quickFilter.filters.partnered ?? null,
    });
  };

  const saveCurrentFilter = () => {
    if (!viewName.trim()) return;

    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name: viewName,
      filters: { ...filters },
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('pm-saved-filters', JSON.stringify(updated));
    setShowSaveDialog(false);
    setViewName('');
  };

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filters);
  };

  const deleteSavedFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('pm-saved-filters', JSON.stringify(updated));
  };

  const activeFilterCount =
    filters.phases.length +
    filters.therapeuticAreas.length +
    filters.indications.length +
    (filters.partnered !== null ? 1 : 0);

  return (
    <div className="query-builder">
      <div className="query-builder-header">
        <h3 className="query-builder-title">ADVANCED FILTERS</h3>
        <div className="query-builder-actions">
          {activeFilterCount > 0 && (
            <span className="active-filter-count">{activeFilterCount} active</span>
          )}
          <button className="btn-clear" onClick={clearAll}>
            CLEAR ALL
          </button>
          <button className="btn-save" onClick={() => setShowSaveDialog(true)}>
            💾 SAVE VIEW
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="quick-filters">
        <span className="filter-section-label">QUICK FILTERS:</span>
        <div className="filter-chips">
          {QUICK_FILTERS.map(qf => (
            <button
              key={qf.name}
              className="filter-chip quick"
              onClick={() => applyQuickFilter(qf)}
            >
              {qf.name}
            </button>
          ))}
        </div>
      </div>

      {/* Phase Filters */}
      <div className="filter-group">
        <span className="filter-section-label">PHASE:</span>
        <div className="filter-chips">
          {phases.map(phase => (
            <button
              key={phase}
              className={`filter-chip ${filters.phases.includes(phase) ? 'active' : ''}`}
              onClick={() => handlePhaseToggle(phase)}
            >
              {phase}
              {filters.phases.includes(phase) && <span className="chip-close">✕</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Therapeutic Area Filters */}
      <div className="filter-group">
        <span className="filter-section-label">THERAPEUTIC AREA:</span>
        <div className="filter-chips">
          {therapeuticAreas.map(ta => (
            <button
              key={ta}
              className={`filter-chip ${filters.therapeuticAreas.includes(ta) ? 'active' : ''}`}
              onClick={() => handleTAToggle(ta)}
            >
              {ta}
              {filters.therapeuticAreas.includes(ta) && <span className="chip-close">✕</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Indication Filters */}
      <div className="filter-group">
        <span className="filter-section-label">INDICATION:</span>
        <div className="filter-chips scrollable">
          {indications.slice(0, 12).map(ind => (
            <button
              key={ind}
              className={`filter-chip ${filters.indications.includes(ind) ? 'active' : ''}`}
              onClick={() => handleIndicationToggle(ind)}
            >
              {ind}
              {filters.indications.includes(ind) && <span className="chip-close">✕</span>}
            </button>
          ))}
          {indications.length > 12 && (
            <span className="filter-more">+{indications.length - 12} more</span>
          )}
        </div>
      </div>

      {/* Partnered Filter */}
      <div className="filter-group">
        <span className="filter-section-label">PARTNERSHIP:</span>
        <div className="filter-chips">
          <button
            className={`filter-chip ${filters.partnered === true ? 'active' : ''}`}
            onClick={handlePartneredToggle}
          >
            Partnered
            {filters.partnered === true && <span className="chip-close">✕</span>}
          </button>
          <button
            className={`filter-chip ${filters.partnered === false ? 'active' : ''}`}
            onClick={handlePartneredToggle}
          >
            Wholly Owned
            {filters.partnered === false && <span className="chip-close">✕</span>}
          </button>
        </div>
      </div>

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="saved-filters">
          <span className="filter-section-label">SAVED VIEWS:</span>
          <div className="saved-filter-list">
            {savedFilters.map(sf => (
              <div key={sf.id} className="saved-filter-item">
                <button
                  className="saved-filter-btn"
                  onClick={() => loadSavedFilter(sf)}
                >
                  📁 {sf.name}
                </button>
                <button
                  className="saved-filter-delete"
                  onClick={() => deleteSavedFilter(sf.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="save-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={e => e.stopPropagation()}>
            <h4>SAVE FILTER VIEW</h4>
            <input
              type="text"
              placeholder="Enter view name..."
              value={viewName}
              onChange={e => setViewName(e.target.value)}
              className="view-name-input"
              autoFocus
            />
            <div className="dialog-actions">
              <button onClick={saveCurrentFilter} className="btn-primary">
                SAVE
              </button>
              <button onClick={() => setShowSaveDialog(false)} className="btn-secondary">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
