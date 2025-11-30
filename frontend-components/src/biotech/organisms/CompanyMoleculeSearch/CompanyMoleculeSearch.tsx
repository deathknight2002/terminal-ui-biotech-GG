import React, { useState, useCallback, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { Molecule3DViewer, type MoleculeData } from '../Molecule3DViewer';
import { MoleculeBindingVisualizer, type TargetProtein, type DrugMolecule } from '../MoleculeBindingVisualizer';
import styles from './CompanyMoleculeSearch.module.css';

export interface CompanyMolecule {
  id: string;
  name: string;
  company: string;
  ticker?: string;
  phase: string;
  indication: string;
  modality: string;
  mechanism: string;
  target: string;
  moleculeData?: MoleculeData;
  bindingData?: {
    target: TargetProtein;
    drug: DrugMolecule;
  };
}

export interface Company {
  id: string;
  name: string;
  ticker?: string;
  type: 'Big Pharma' | 'Biotech' | 'SMid' | 'Academic';
  molecules: CompanyMolecule[];
}

export interface CompanyMoleculeSearchProps {
  /** List of companies with their molecules */
  companies: Company[];
  /** Placeholder text for search input */
  placeholder?: string;
  /** Called when a molecule is selected */
  onMoleculeSelect?: (molecule: CompanyMolecule) => void;
  /** Called when a company is selected */
  onCompanySelect?: (company: Company) => void;
  /** Show 3D viewer for selected molecule */
  show3DViewer?: boolean;
  /** Show binding visualizer for selected molecule */
  showBindingVisualizer?: boolean;
  /** Width of the component */
  width?: number | string;
  /** Additional class name */
  className?: string;
}

// Sample molecules for demo (if no moleculeData provided)
const generateSampleMolecule = (name: string): MoleculeData => {
  const atoms: Array<{ id: string; element: string; x: number; y: number; z: number }> = [];
  const bonds: Array<{ from: string; to: string; order?: number }> = [];
  
  // Generate a random but structured molecule
  const ringSize = 6;
  const radius = 1.5;
  
  // Create a central ring
  for (let i = 0; i < ringSize; i++) {
    const angle = (Math.PI * 2 / ringSize) * i;
    atoms.push({
      id: `c${i}`,
      element: 'C',
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: 0,
    });
    bonds.push({
      from: `c${i}`,
      to: `c${(i + 1) % ringSize}`,
      order: i % 2 === 0 ? 2 : 1,
    });
  }

  // Add some substituents
  const substituents = [
    { element: 'O', pos: 0 },
    { element: 'N', pos: 2 },
    { element: 'O', pos: 4 },
  ];

  substituents.forEach((sub, idx) => {
    const baseAtom = atoms[sub.pos];
    const angle = (Math.PI * 2 / ringSize) * sub.pos;
    atoms.push({
      id: `s${idx}`,
      element: sub.element,
      x: baseAtom.x + Math.cos(angle) * 1.2,
      y: baseAtom.y + Math.sin(angle) * 1.2,
      z: (Math.random() - 0.5) * 0.5,
    });
    bonds.push({
      from: `c${sub.pos}`,
      to: `s${idx}`,
      order: sub.element === 'O' ? 2 : 1,
    });

    // Add hydrogen atoms
    if (sub.element === 'N') {
      const lastAtom = atoms[atoms.length - 1];
      atoms.push({
        id: `h${idx}a`,
        element: 'H',
        x: lastAtom.x + 0.8,
        y: lastAtom.y + 0.5,
        z: lastAtom.z,
      });
      bonds.push({
        from: `s${idx}`,
        to: `h${idx}a`,
      });
    }
  });

  return {
    id: name.toLowerCase().replace(/\s/g, '-'),
    name,
    formula: 'C₆H₄NO₂',
    modality: 'Small Molecule',
    mechanism: 'Kinase Inhibitor',
    atoms,
    bonds,
  };
};

export const CompanyMoleculeSearch: React.FC<CompanyMoleculeSearchProps> = ({
  companies,
  placeholder = 'Search companies or molecules...',
  onMoleculeSelect,
  onCompanySelect,
  show3DViewer = true,
  showBindingVisualizer = true,
  width = '100%',
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedMolecule, setSelectedMolecule] = useState<CompanyMolecule | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'binding'>('3d');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter companies and molecules based on search
  const results = React.useMemo(() => {
    if (!searchQuery.trim()) return { companies: [], molecules: [] };

    const query = searchQuery.toLowerCase();
    const matchedCompanies: Company[] = [];
    const matchedMolecules: CompanyMolecule[] = [];

    companies.forEach(company => {
      const companyMatches = 
        company.name.toLowerCase().includes(query) ||
        (company.ticker?.toLowerCase().includes(query));

      if (companyMatches) {
        matchedCompanies.push(company);
      }

      company.molecules.forEach(molecule => {
        const moleculeMatches =
          molecule.name.toLowerCase().includes(query) ||
          molecule.indication.toLowerCase().includes(query) ||
          molecule.target.toLowerCase().includes(query) ||
          molecule.mechanism.toLowerCase().includes(query);

        if (moleculeMatches || companyMatches) {
          matchedMolecules.push(molecule);
        }
      });
    });

    return { 
      companies: matchedCompanies.slice(0, 5), 
      molecules: matchedMolecules.slice(0, 10) 
    };
  }, [searchQuery, companies]);

  const handleCompanySelect = useCallback((company: Company) => {
    setSelectedCompany(company);
    setSelectedMolecule(null);
    setSearchQuery(company.name);
    setIsOpen(false);
    onCompanySelect?.(company);
  }, [onCompanySelect]);

  const handleMoleculeSelect = useCallback((molecule: CompanyMolecule) => {
    setSelectedMolecule(molecule);
    const company = companies.find(c => c.molecules.some(m => m.id === molecule.id));
    if (company) setSelectedCompany(company);
    setSearchQuery(molecule.name);
    setIsOpen(false);
    onMoleculeSelect?.(molecule);
  }, [companies, onMoleculeSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
    if (!e.target.value) {
      setSelectedCompany(null);
      setSelectedMolecule(null);
    }
  }, []);

  const handleInputFocus = useCallback(() => {
    if (searchQuery) setIsOpen(true);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get molecule data for viewer
  const moleculeData = selectedMolecule?.moleculeData || 
    (selectedMolecule ? generateSampleMolecule(selectedMolecule.name) : null);

  return (
    <div className={clsx(styles.companyMoleculeSearch, className)} style={{ width }}>
      {/* Search Input */}
      <div className={styles.searchContainer} ref={dropdownRef}>
        <div className={styles.searchInputWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
          {searchQuery && (
            <button 
              className={styles.clearButton}
              onClick={() => {
                setSearchQuery('');
                setSelectedCompany(null);
                setSelectedMolecule(null);
                inputRef.current?.focus();
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {isOpen && (results.companies.length > 0 || results.molecules.length > 0) && (
          <div className={styles.dropdown}>
            {results.companies.length > 0 && (
              <div className={styles.dropdownSection}>
                <div className={styles.sectionHeader}>COMPANIES</div>
                {results.companies.map(company => (
                  <button
                    key={company.id}
                    className={styles.dropdownItem}
                    onClick={() => handleCompanySelect(company)}
                  >
                    <span className={styles.companyIcon}>🏢</span>
                    <div className={styles.itemContent}>
                      <span className={styles.itemName}>{company.name}</span>
                      {company.ticker && (
                        <span className={styles.itemTicker}>{company.ticker}</span>
                      )}
                    </div>
                    <span className={styles.itemType}>{company.type}</span>
                  </button>
                ))}
              </div>
            )}

            {results.molecules.length > 0 && (
              <div className={styles.dropdownSection}>
                <div className={styles.sectionHeader}>MOLECULES</div>
                {results.molecules.map(molecule => (
                  <button
                    key={molecule.id}
                    className={styles.dropdownItem}
                    onClick={() => handleMoleculeSelect(molecule)}
                  >
                    <span className={styles.moleculeIcon}>⬡</span>
                    <div className={styles.itemContent}>
                      <span className={styles.itemName}>{molecule.name}</span>
                      <span className={styles.itemCompany}>{molecule.company}</span>
                    </div>
                    <span className={styles.itemPhase}>{molecule.phase}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Company/Molecule Info */}
      {selectedCompany && !selectedMolecule && (
        <div className={styles.companyPanel}>
          <div className={styles.companyHeader}>
            <div className={styles.companyInfo}>
              <h3 className={styles.companyName}>{selectedCompany.name}</h3>
              {selectedCompany.ticker && (
                <span className={styles.companyTicker}>{selectedCompany.ticker}</span>
              )}
            </div>
            <span className={styles.companyType}>{selectedCompany.type}</span>
          </div>
          
          <div className={styles.moleculeGrid}>
            <div className={styles.gridHeader}>PIPELINE ({selectedCompany.molecules.length} molecules)</div>
            {selectedCompany.molecules.map(molecule => (
              <button
                key={molecule.id}
                className={styles.moleculeCard}
                onClick={() => handleMoleculeSelect(molecule)}
              >
                <div className={styles.moleculeHeader}>
                  <span className={styles.moleculeName}>{molecule.name}</span>
                  <span className={clsx(styles.moleculePhase, styles[`phase${molecule.phase.replace(/\s/g, '')}`])}>
                    {molecule.phase}
                  </span>
                </div>
                <div className={styles.moleculeDetails}>
                  <span>{molecule.indication}</span>
                  <span className={styles.moleculeTarget}>{molecule.target}</span>
                </div>
                <div className={styles.moleculeModality}>{molecule.modality}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3D Molecule Viewer */}
      {selectedMolecule && moleculeData && (
        <div className={styles.visualizationPanel}>
          <div className={styles.vizHeader}>
            <div className={styles.vizInfo}>
              <h3 className={styles.vizName}>{selectedMolecule.name}</h3>
              <span className={styles.vizCompany}>{selectedMolecule.company}</span>
            </div>
            <div className={styles.vizTabs}>
              {show3DViewer && (
                <button
                  className={clsx(styles.vizTab, viewMode === '3d' && styles.active)}
                  onClick={() => setViewMode('3d')}
                >
                  3D Structure
                </button>
              )}
              {showBindingVisualizer && selectedMolecule.bindingData && (
                <button
                  className={clsx(styles.vizTab, viewMode === 'binding' && styles.active)}
                  onClick={() => setViewMode('binding')}
                >
                  Binding
                </button>
              )}
            </div>
          </div>

          <div className={styles.vizContent}>
            {viewMode === '3d' && show3DViewer && (
              <Molecule3DViewer
                molecule={moleculeData}
                width={400}
                height={350}
                autoRotate
                showLabels
                showInfo
              />
            )}
            {viewMode === 'binding' && showBindingVisualizer && selectedMolecule.bindingData && (
              <MoleculeBindingVisualizer
                target={selectedMolecule.bindingData.target}
                drug={selectedMolecule.bindingData.drug}
                width={400}
                height={350}
                animate
                showMechanism
                showAffinity
              />
            )}
          </div>

          <div className={styles.moleculeMetaPanel}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>PHASE</span>
              <span className={styles.metaValue}>{selectedMolecule.phase}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>INDICATION</span>
              <span className={styles.metaValue}>{selectedMolecule.indication}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>TARGET</span>
              <span className={styles.metaValue}>{selectedMolecule.target}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>MODALITY</span>
              <span className={styles.metaValue}>{selectedMolecule.modality}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>MECHANISM</span>
              <span className={styles.metaValue}>{selectedMolecule.mechanism}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CompanyMoleculeSearch.displayName = 'CompanyMoleculeSearch';
