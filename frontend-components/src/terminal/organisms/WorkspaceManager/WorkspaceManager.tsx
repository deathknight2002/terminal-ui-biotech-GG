import React, { useState, useEffect } from 'react';
import { Save, Upload, Download, Trash2, Copy, Star, X, Plus } from 'lucide-react';
import {
  getAllWorkspaces,
  deleteWorkspace,
  getActiveWorkspaceId,
  setActiveWorkspace,
  duplicateWorkspace,
  exportWorkspace,
  importWorkspace,
  setDefaultWorkspace,
  createWorkspace,
  type WorkspaceLayout
} from '../../../../../src/utils/workspaceUtils';
import './WorkspaceManager.css';

export interface WorkspaceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadWorkspace?: (workspace: WorkspaceLayout) => void;
  currentPanels?: any[];
}

export const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  isOpen,
  onClose,
  onLoadWorkspace,
  currentPanels = []
}) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceLayout[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadWorkspaces();
    }
  }, [isOpen]);

  const loadWorkspaces = () => {
    setWorkspaces(getAllWorkspaces());
    setActiveWorkspaceId(getActiveWorkspaceId());
  };

  const handleSaveCurrent = () => {
    const name = prompt('Workspace name:');
    if (!name) return;
    const description = prompt('Description (optional):');
    const workspace = createWorkspace(name, description || undefined, currentPanels);
    setActiveWorkspace(workspace.id);
    loadWorkspaces();
  };

  const handleLoad = (workspace: WorkspaceLayout) => {
    setActiveWorkspace(workspace.id);
    setActiveWorkspaceId(workspace.id);
    onLoadWorkspace?.(workspace);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this workspace?')) return;
    deleteWorkspace(id);
    loadWorkspaces();
  };

  const handleDuplicate = (id: string) => {
    const newName = prompt('New workspace name:');
    if (!newName) return;
    duplicateWorkspace(id, newName);
    loadWorkspaces();
  };

  const handleExport = (id: string) => {
    exportWorkspace(id);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importWorkspace(file);
      loadWorkspaces();
      e.target.value = '';
    } catch (err) {
      alert(`Import failed: ${err}`);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultWorkspace(id);
    loadWorkspaces();
  };

  const handleCreate = () => {
    if (!newWorkspaceName.trim()) return;
    const workspace = createWorkspace(newWorkspaceName, newWorkspaceDesc || undefined);
    setActiveWorkspace(workspace.id);
    setShowCreateDialog(false);
    setNewWorkspaceName('');
    setNewWorkspaceDesc('');
    loadWorkspaces();
  };

  if (!isOpen) return null;

  return (
    <div className="workspace-manager-overlay" onClick={onClose}>
      <div className="workspace-manager" onClick={(e) => e.stopPropagation()}>
        <div className="workspace-header">
          <h2>WORKSPACE MANAGER</h2>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="workspace-actions">
          <button className="action-btn primary" onClick={handleSaveCurrent}><Save size={16} />Save Current</button>
          <button className="action-btn" onClick={() => setShowCreateDialog(true)}><Plus size={16} />New Empty</button>
          <label className="action-btn"><Upload size={16} />Import<input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} /></label>
        </div>
        {showCreateDialog && (
          <div className="create-dialog">
            <h3>Create New Workspace</h3>
            <input type="text" placeholder="Workspace name" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} className="input-field" />
            <input type="text" placeholder="Description (optional)" value={newWorkspaceDesc} onChange={(e) => setNewWorkspaceDesc(e.target.value)} className="input-field" />
            <div className="dialog-actions">
              <button onClick={() => setShowCreateDialog(false)} className="btn-cancel">Cancel</button>
              <button onClick={handleCreate} className="btn-create">Create</button>
            </div>
          </div>
        )}
        <div className="workspace-list">
          {workspaces.length === 0 ? (
            <div className="empty-state"><p>No saved workspaces yet</p><p className="hint">Save your current layout to get started</p></div>
          ) : (
            workspaces.map(workspace => (
              <div key={workspace.id} className={`workspace-item ${activeWorkspaceId === workspace.id ? 'active' : ''}`}>
                <div className="workspace-info">
                  <div className="workspace-name">{workspace.name}{workspace.isDefault && <span className="default-badge">DEFAULT</span>}</div>
                  {workspace.description && <div className="workspace-desc">{workspace.description}</div>}
                  <div className="workspace-meta">{workspace.panels.length} panels • Updated {new Date(workspace.updatedAt).toLocaleDateString()}</div>
                </div>
                <div className="workspace-actions-row">
                  <button className="icon-btn" onClick={() => handleLoad(workspace)} title="Load workspace">Load</button>
                  <button className="icon-btn" onClick={() => handleSetDefault(workspace.id)} title="Set as default"><Star size={14} fill={workspace.isDefault ? 'currentColor' : 'none'} /></button>
                  <button className="icon-btn" onClick={() => handleDuplicate(workspace.id)} title="Duplicate"><Copy size={14} /></button>
                  <button className="icon-btn" onClick={() => handleExport(workspace.id)} title="Export"><Download size={14} /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(workspace.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="workspace-footer">
          <div className="footer-info">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} saved</div>
          <div className="footer-hint">Pro tip: Use Ctrl+Shift+W to quickly open this dialog</div>
        </div>
      </div>
    </div>
  );
};
