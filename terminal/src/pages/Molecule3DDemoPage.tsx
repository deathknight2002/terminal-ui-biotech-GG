import React, { useState } from 'react';
import {
  Molecule3DViewer,
  MoleculeBindingVisualizer,
  CompanyMoleculeSearch,
  type MoleculeData,
  type TargetProtein,
  type DrugMolecule,
  type Company,
  type CompanyMolecule,
} from '@biotech-terminal/frontend-components/biotech';
import { Panel } from '@biotech-terminal/frontend-components/terminal';
import './Molecule3DDemoPage.css';

// Sample molecule data - Ibuprofen-like structure
const sampleMolecule: MoleculeData = {
  id: 'ibuprofen',
  name: 'Ibuprofen',
  formula: 'C₁₃H₁₈O₂',
  modality: 'Small Molecule',
  mechanism: 'COX-1/COX-2 Inhibitor',
  atoms: [
    // Benzene ring
    { id: 'c1', element: 'C', x: 0, y: 1.4, z: 0 },
    { id: 'c2', element: 'C', x: 1.21, y: 0.7, z: 0 },
    { id: 'c3', element: 'C', x: 1.21, y: -0.7, z: 0 },
    { id: 'c4', element: 'C', x: 0, y: -1.4, z: 0 },
    { id: 'c5', element: 'C', x: -1.21, y: -0.7, z: 0 },
    { id: 'c6', element: 'C', x: -1.21, y: 0.7, z: 0 },
    // Isobutyl group
    { id: 'c7', element: 'C', x: 0, y: 2.9, z: 0 },
    { id: 'c8', element: 'C', x: 0, y: 4.2, z: 0.5 },
    { id: 'c9', element: 'C', x: -1.2, y: 4.8, z: 0.3 },
    { id: 'c10', element: 'C', x: 1.2, y: 4.8, z: 0.8 },
    // Propionic acid
    { id: 'c11', element: 'C', x: 0, y: -2.9, z: 0 },
    { id: 'c12', element: 'C', x: 0, y: -4.1, z: -0.5 },
    { id: 'c13', element: 'C', x: 0, y: -5.3, z: 0 },
    { id: 'o1', element: 'O', x: 1.1, y: -5.9, z: 0 },
    { id: 'o2', element: 'O', x: -1.1, y: -5.9, z: 0 },
    // Methyl on ring
    { id: 'c14', element: 'C', x: 2.4, y: 1.4, z: 0 },
  ],
  bonds: [
    { from: 'c1', to: 'c2', order: 2 },
    { from: 'c2', to: 'c3', order: 1 },
    { from: 'c3', to: 'c4', order: 2 },
    { from: 'c4', to: 'c5', order: 1 },
    { from: 'c5', to: 'c6', order: 2 },
    { from: 'c6', to: 'c1', order: 1 },
    { from: 'c1', to: 'c7', order: 1 },
    { from: 'c7', to: 'c8', order: 1 },
    { from: 'c8', to: 'c9', order: 1 },
    { from: 'c8', to: 'c10', order: 1 },
    { from: 'c4', to: 'c11', order: 1 },
    { from: 'c11', to: 'c12', order: 1 },
    { from: 'c12', to: 'c13', order: 1 },
    { from: 'c13', to: 'o1', order: 2 },
    { from: 'c13', to: 'o2', order: 1 },
    { from: 'c2', to: 'c14', order: 1 },
  ],
};

// Sample protein target
const sampleTarget: TargetProtein = {
  id: 'cox2',
  name: 'COX-2',
  fullName: 'Cyclooxygenase-2',
  family: 'Oxidoreductases',
  bindingSites: [
    { id: 'active', name: 'Active Site', x: 40, y: 50, type: 'competitive', affinity: 'IC50: 5.3 μM', isActive: true },
    { id: 'allo1', name: 'Allosteric 1', x: 70, y: 30, type: 'allosteric' },
    { id: 'allo2', name: 'Allosteric 2', x: 60, y: 75, type: 'allosteric' },
  ],
};

// Sample drug binding to target
const sampleDrug: DrugMolecule = {
  id: 'ibuprofen',
  name: 'Ibuprofen',
  modality: 'small-molecule',
  mechanism: 'Non-selective inhibition of cyclooxygenase enzymes (COX-1 and COX-2), reducing prostaglandin synthesis and inflammatory response.',
  bindingType: 'competitive',
  targetSiteId: 'active',
  color: '#EF4444',
};

// Sample company data for search
const sampleCompanies: Company[] = [
  {
    id: 'ionis',
    name: 'Ionis Pharmaceuticals',
    ticker: 'IONS',
    type: 'Biotech',
    molecules: [
      {
        id: 'tofersen',
        name: 'Tofersen (QALSODY)',
        company: 'Ionis Pharmaceuticals',
        ticker: 'IONS',
        phase: 'Approved',
        indication: 'SOD1-ALS',
        modality: 'Antisense Oligonucleotide',
        mechanism: 'SOD1 mRNA degradation via RNase H1',
        target: 'SOD1',
      },
      {
        id: 'eplontersen',
        name: 'Eplontersen (WAINUA)',
        company: 'Ionis Pharmaceuticals',
        ticker: 'IONS',
        phase: 'Approved',
        indication: 'hATTR-PN',
        modality: 'Antisense Oligonucleotide',
        mechanism: 'TTR mRNA knockdown',
        target: 'TTR',
      },
      {
        id: 'donidalorsen',
        name: 'Donidalorsen',
        company: 'Ionis Pharmaceuticals',
        ticker: 'IONS',
        phase: 'Phase III',
        indication: 'Hereditary Angioedema',
        modality: 'Antisense Oligonucleotide',
        mechanism: 'Prekallikrein reduction',
        target: 'PKK',
      },
    ],
  },
  {
    id: 'moderna',
    name: 'Moderna',
    ticker: 'MRNA',
    type: 'Biotech',
    molecules: [
      {
        id: 'mrna-1273',
        name: 'Spikevax (mRNA-1273)',
        company: 'Moderna',
        ticker: 'MRNA',
        phase: 'Approved',
        indication: 'COVID-19',
        modality: 'mRNA',
        mechanism: 'Spike protein expression for immune response',
        target: 'SARS-CoV-2 Spike',
      },
      {
        id: 'mrna-1944',
        name: 'mRNA-1944',
        company: 'Moderna',
        ticker: 'MRNA',
        phase: 'Phase I',
        indication: 'Chikungunya',
        modality: 'mRNA',
        mechanism: 'Antibody expression',
        target: 'CHIKV',
      },
    ],
  },
  {
    id: 'vertex',
    name: 'Vertex Pharmaceuticals',
    ticker: 'VRTX',
    type: 'Biotech',
    molecules: [
      {
        id: 'exagamglogene',
        name: 'CASGEVY',
        company: 'Vertex Pharmaceuticals',
        ticker: 'VRTX',
        phase: 'Approved',
        indication: 'Sickle Cell Disease',
        modality: 'Gene Therapy (CRISPR)',
        mechanism: 'BCL11A enhancer editing',
        target: 'BCL11A',
      },
      {
        id: 'vx-548',
        name: 'VX-548',
        company: 'Vertex Pharmaceuticals',
        ticker: 'VRTX',
        phase: 'Phase III',
        indication: 'Acute Pain',
        modality: 'Small Molecule',
        mechanism: 'Nav1.8 inhibition',
        target: 'Nav1.8',
      },
    ],
  },
  {
    id: 'lilly',
    name: 'Eli Lilly',
    ticker: 'LLY',
    type: 'Big Pharma',
    molecules: [
      {
        id: 'tirzepatide',
        name: 'Mounjaro/Zepbound',
        company: 'Eli Lilly',
        ticker: 'LLY',
        phase: 'Approved',
        indication: 'T2D / Obesity',
        modality: 'Peptide',
        mechanism: 'GIP/GLP-1 dual agonism',
        target: 'GIP-R / GLP-1R',
      },
      {
        id: 'donanemab',
        name: 'Kisunla (Donanemab)',
        company: 'Eli Lilly',
        ticker: 'LLY',
        phase: 'Approved',
        indication: 'Alzheimer\'s Disease',
        modality: 'Monoclonal Antibody',
        mechanism: 'Amyloid-beta plaque clearance',
        target: 'N3pG Aβ',
      },
    ],
  },
];

export const Molecule3DDemoPage: React.FC = () => {
  const [selectedMolecule, setSelectedMolecule] = useState<CompanyMolecule | null>(null);

  return (
    <div className="molecule-3d-demo-page">
      <div className="demo-header">
        <h1 className="demo-title">3D MOLECULAR VISUALIZATIONS</h1>
        <p className="demo-subtitle">
          Interactive 3D molecule viewers, binding site visualizations, and company pipeline search
        </p>
      </div>

      <div className="demo-grid">
        {/* Company Molecule Search */}
        <div className="demo-section full-width">
          <Panel 
            title="COMPANY MOLECULE SEARCH" 
            className="demo-panel"
          >
            <div className="search-description">
              Search for biotech companies or drug molecules to view their 3D structures and binding mechanisms
            </div>
            <CompanyMoleculeSearch
              companies={sampleCompanies}
              placeholder="Search Ionis, Moderna, Vertex, Lilly..."
              show3DViewer={true}
              showBindingVisualizer={true}
              onMoleculeSelect={(molecule) => setSelectedMolecule(molecule)}
              width="100%"
            />
          </Panel>
        </div>

        {/* 3D Molecule Viewer */}
        <div className="demo-section">
          <Panel 
            title="3D MOLECULE VIEWER" 
            className="demo-panel"
          >
            <div className="demo-description">
              Interactive 3D visualization with rotation, zoom, and atom highlighting
            </div>
            <div className="viewer-container">
              <Molecule3DViewer
                molecule={sampleMolecule}
                width={380}
                height={380}
                autoRotate={true}
                enableZoom={true}
                enableDrag={true}
                showLabels={true}
                showInfo={true}
              />
            </div>
          </Panel>
        </div>

        {/* Molecule Binding Visualizer */}
        <div className="demo-section">
          <Panel 
            title="BINDING MECHANISM" 
            className="demo-panel"
          >
            <div className="demo-description">
              Visualization of drug-target binding with mechanism of action
            </div>
            <div className="viewer-container">
              <MoleculeBindingVisualizer
                target={sampleTarget}
                drug={sampleDrug}
                width={500}
                height={380}
                animate={true}
                showMechanism={true}
                showAffinity={true}
              />
            </div>
          </Panel>
        </div>
      </div>

      {/* Feature List */}
      <div className="features-section">
        <Panel title="VISUALIZATION FEATURES" className="demo-panel">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔬</div>
              <div className="feature-title">3D Molecule Viewer</div>
              <div className="feature-description">
                Interactive canvas-based 3D visualization with CPK coloring, depth shading, and smooth rotation
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <div className="feature-title">Binding Visualization</div>
              <div className="feature-description">
                Animated drug-target interaction showing binding sites, mechanism of action, and affinity data
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <div className="feature-title">Company Search</div>
              <div className="feature-description">
                Search biotech companies and their pipeline molecules with instant 3D structure preview
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div className="feature-title">Real-time Interaction</div>
              <div className="feature-description">
                Drag to rotate, scroll to zoom, click atoms for details - all with smooth 60fps animation
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧬</div>
              <div className="feature-title">Modality Support</div>
              <div className="feature-description">
                Supports small molecules, antibodies, peptides, oligonucleotides, and gene therapies
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <div className="feature-title">Data Integration</div>
              <div className="feature-description">
                Displays phase, indication, target, mechanism, and binding affinity data alongside visuals
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {selectedMolecule && (
        <div className="selection-toast">
          Selected: <strong>{selectedMolecule.name}</strong> from {selectedMolecule.company}
        </div>
      )}
    </div>
  );
};

export default Molecule3DDemoPage;
