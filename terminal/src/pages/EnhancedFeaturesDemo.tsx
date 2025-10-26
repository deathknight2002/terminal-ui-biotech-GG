import React, { useState } from 'react';
import { Panel } from '../../../frontend-components/src/terminal/organisms/Panel/Panel';
import { AdvancedDataTable } from '../../../frontend-components/src/terminal/organisms/AdvancedDataTable';
import { WorkspaceManager } from '../../../frontend-components/src/terminal/organisms/WorkspaceManager';
import { ContextMenu, useContextMenu, commonContextMenuItems } from '../../../frontend-components/src/terminal/features/ContextMenu';
import { Button } from '../../../frontend-components/src/terminal/atoms/Button/Button';
import type { Column } from '../../../frontend-components/src/terminal/organisms/AdvancedDataTable/AdvancedDataTable';
import './EnhancedFeaturesDemo.css';

// Sample data for demo
const sampleData = [
  { id: 1, drug: 'Pembrolizumab', company: 'Merck', phase: 'Approved', indication: 'NSCLC', targetDate: '2024-Q4', probability: 95 },
  { id: 2, drug: 'Trastuzumab Deruxtecan', company: 'Daiichi Sankyo', phase: 'Phase III', indication: 'Breast Cancer', targetDate: '2025-Q2', probability: 78 },
  { id: 3, drug: 'Semaglutide', company: 'Novo Nordisk', phase: 'Approved', indication: 'Type 2 Diabetes', targetDate: '2024-Q3', probability: 92 },
  { id: 4, drug: 'Bimekizumab', company: 'UCB', phase: 'Phase III', indication: 'Psoriasis', targetDate: '2025-Q1', probability: 82 },
  { id: 5, drug: 'Evinacumab', company: 'Regeneron', phase: 'Phase II', indication: 'HoFH', targetDate: '2026-Q3', probability: 65 },
  { id: 6, drug: 'Etranacogene Dezaparvovec', company: 'CSL Behring', phase: 'Filed', indication: 'Hemophilia B', targetDate: '2025-Q1', probability: 88 },
  { id: 7, drug: 'Efgartigimod', company: 'Argenx', phase: 'Phase III', indication: 'MG', targetDate: '2025-Q4', probability: 75 },
  { id: 8, drug: 'Pelacarsen', company: 'Ionis', phase: 'Phase II', indication: 'CVD', targetDate: '2026-Q2', probability: 68 },
  { id: 9, drug: 'Imetelstat', company: 'Geron', phase: 'Phase III', indication: 'MF', targetDate: '2025-Q3', probability: 71 },
  { id: 10, drug: 'Tofersen', company: 'Biogen', phase: 'Filed', indication: 'ALS', targetDate: '2025-Q1', probability: 85 },
  { id: 11, drug: 'Linzagolix', company: 'ObsEva', phase: 'Phase III', indication: 'Endometriosis', targetDate: '2025-Q2', probability: 73 },
  { id: 12, drug: 'Aficamten', company: 'Cytokinetics', phase: 'Phase II', indication: 'HCM', targetDate: '2026-Q4', probability: 62 },
];

export const EnhancedFeaturesDemo: React.FC = () => {
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false);
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();

  const columns: Column[] = [
    { key: 'id', header: 'ID', width: 60, align: 'center', sortable: true },
    { key: 'drug', header: 'DRUG NAME', width: 200, sortable: true },
    { key: 'company', header: 'COMPANY', width: 150, sortable: true },
    {
      key: 'phase',
      header: 'PHASE',
      width: 120,
      sortable: true,
      render: (row) => {
        const colors: Record<string, string> = {
          'Approved': 'var(--status-success, #00ff00)',
          'Filed': 'var(--status-warning, #ffaa00)',
          'Phase III': 'var(--status-info, #00d4ff)',
          'Phase II': 'var(--text-secondary, #888)'
        };
        return <span style={{ color: colors[row.phase] || '#fff' }}>{row.phase}</span>;
      }
    },
    { key: 'indication', header: 'INDICATION', width: 150, sortable: true },
    { key: 'targetDate', header: 'TARGET DATE', width: 120, align: 'center', sortable: true },
    {
      key: 'probability',
      header: 'PROBABILITY',
      width: 120,
      align: 'right',
      sortable: true,
      format: (value) => `${value}%`,
      render: (row) => {
        const color = row.probability >= 80 ? 'var(--status-success, #00ff00)' :
                      row.probability >= 70 ? 'var(--status-warning, #ffaa00)' :
                      'var(--text-secondary, #888)';
        return <span style={{ color }}>{row.probability}%</span>;
      }
    }
  ];

  const handleRowContextMenu = (e: React.MouseEvent, row: typeof sampleData[0]) => {
    const items = [
      commonContextMenuItems.viewDetails(() => alert(`Viewing ${row.drug} details`)),
      commonContextMenuItems.bookmark(() => alert(`Added ${row.drug} to watchlist`)),
      commonContextMenuItems.analyze(() => alert(`Analyzing ${row.drug}`)),
      commonContextMenuItems.divider(),
      commonContextMenuItems.export(() => alert(`Exporting ${row.drug} data`)),
      commonContextMenuItems.alert(() => alert(`Creating alert for ${row.drug}`)),
    ];
    openContextMenu(e, items);
  };

  return (
    <div className="enhanced-features-demo">
      <div className="demo-header">
        <h1>🚀 ENHANCED TERMINAL FEATURES</h1>
        <p className="subtitle">Bloomberg-style enhancements with advanced data management</p>
      </div>

      <div className="demo-controls">
        <Button
          onClick={() => setShowWorkspaceManager(true)}
          variant="primary"
        >
          OPEN WORKSPACE MANAGER
        </Button>
      </div>

      {/* Advanced Data Table Demo */}
      <Panel title="ADVANCED DATA TABLE" cornerBrackets>
        <div className="demo-section">
          <h3>Features Demonstrated:</h3>
          <ul className="feature-list">
            <li>✅ Global search across all columns</li>
            <li>✅ Per-column filtering</li>
            <li>✅ Multi-column sorting</li>
            <li>✅ Export to CSV/JSON</li>
            <li>✅ Copy to clipboard</li>
            <li>✅ Pagination (50 rows per page)</li>
            <li>✅ Custom cell rendering with colors</li>
            <li>✅ Right-click context menu (try it!)</li>
          </ul>

          <div
            className="table-wrapper"
            onContextMenu={(e) => {
              e.preventDefault();
              const items = [
                commonContextMenuItems.export(() => alert('Export all data')),
                commonContextMenuItems.divider(),
                {
                  label: 'Select All',
                  onClick: () => alert('Select all rows'),
                  icon: null
                },
                {
                  label: 'Clear Filters',
                  onClick: () => alert('Clear all filters'),
                  icon: null
                }
              ];
              openContextMenu(e, items);
            }}
          >
            <AdvancedDataTable
              columns={columns}
              data={sampleData}
              keyExtractor={(row) => row.id.toString()}
              title="DRUG PIPELINE TRACKER"
              cornerBrackets
              exportable
              searchable
              filterable
              sortable
              pageSize={8}
            />
          </div>

          <div className="demo-tip">
            <strong>💡 Pro Tips:</strong>
            <ul>
              <li>Right-click on any row for context menu actions</li>
              <li>Click column headers to sort</li>
              <li>Use the filter inputs under each column</li>
              <li>Search globally using the search box</li>
              <li>Export data using the EXPORT button</li>
            </ul>
          </div>
        </div>
      </Panel>

      {/* Context Menu Demo */}
      <Panel title="RIGHT-CLICK CONTEXT MENUS" cornerBrackets>
        <div className="demo-section">
          <h3>Bloomberg-Style Quick Actions</h3>
          <div className="context-menu-demo-grid">
            {sampleData.slice(0, 6).map(drug => (
              <div
                key={drug.id}
                className="context-menu-card"
                onContextMenu={(e) => handleRowContextMenu(e, drug)}
              >
                <h4>{drug.drug}</h4>
                <p>{drug.company}</p>
                <span className="badge">{drug.phase}</span>
                <p className="hint">Right-click for actions</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Workspace Manager */}
      {showWorkspaceManager && (
        <WorkspaceManager
          isOpen={showWorkspaceManager}
          onClose={() => setShowWorkspaceManager(false)}
          currentPanels={[]}
        />
      )}

      {/* Context Menu Renderer */}
      {contextMenu && (
        <ContextMenu
          items={contextMenu.items}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}

      {/* Feature Summary */}
      <Panel title="WHAT'S NEW" cornerBrackets>
        <div className="demo-section">
          <div className="feature-grid">
            <div className="feature-card">
              <h3>📊 Advanced Data Tables</h3>
              <p>Full-featured data grids with sorting, filtering, search, export, and pagination</p>
            </div>
            <div className="feature-card">
              <h3>💾 Workspace Persistence</h3>
              <p>Save, load, and share custom layouts. Import/export workspaces as files</p>
            </div>
            <div className="feature-card">
              <h3>🖱️ Context Menus</h3>
              <p>Right-click anywhere for quick actions. Bloomberg-style interaction</p>
            </div>
            <div className="feature-card">
              <h3>📤 Data Export</h3>
              <p>Export to CSV, JSON, or copy to clipboard. Professional data portability</p>
            </div>
            <div className="feature-card">
              <h3>⚡ Performance</h3>
              <p>Optimized rendering for large datasets. Pagination and virtual scrolling support</p>
            </div>
            <div className="feature-card">
              <h3>🎨 Terminal Aesthetics</h3>
              <p>Consistent monospace fonts, high contrast, and professional styling</p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="demo-footer">
        <p>These enhancements bring the terminal closer to Bloomberg Terminal functionality</p>
        <p className="version">Enhanced Features v1.0 • Oct 2025</p>
      </div>
    </div>
  );
};
