/**
 * Workspace persistence utilities
 * Enables saving and loading of terminal workspace layouts
 */

export interface WorkspacePanel {
  id: string;
  type: string;
  route: string;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings?: Record<string, any>;
}

export interface WorkspaceLayout {
  id: string;
  name: string;
  description?: string;
  panels: WorkspacePanel[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

const STORAGE_KEY = 'biotech-terminal-workspaces';
const ACTIVE_WORKSPACE_KEY = 'biotech-terminal-active-workspace';

/**
 * Get all saved workspaces
 */
export function getAllWorkspaces(): WorkspaceLayout[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load workspaces:', err);
    return [];
  }
}

/**
 * Get workspace by ID
 */
export function getWorkspace(id: string): WorkspaceLayout | null {
  const workspaces = getAllWorkspaces();
  return workspaces.find(w => w.id === id) || null;
}

/**
 * Save a workspace
 */
export function saveWorkspace(workspace: WorkspaceLayout): void {
  try {
    const workspaces = getAllWorkspaces();
    const existingIndex = workspaces.findIndex(w => w.id === workspace.id);
    
    const updatedWorkspace = {
      ...workspace,
      updatedAt: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      workspaces[existingIndex] = updatedWorkspace;
    } else {
      workspaces.push(updatedWorkspace);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  } catch (err) {
    console.error('Failed to save workspace:', err);
    throw err;
  }
}

/**
 * Delete a workspace
 */
export function deleteWorkspace(id: string): void {
  try {
    const workspaces = getAllWorkspaces();
    const filtered = workspaces.filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    
    // If this was the active workspace, clear it
    if (getActiveWorkspaceId() === id) {
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    }
  } catch (err) {
    console.error('Failed to delete workspace:', err);
    throw err;
  }
}

/**
 * Get active workspace ID
 */
export function getActiveWorkspaceId(): string | null {
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
}

/**
 * Set active workspace
 */
export function setActiveWorkspace(id: string): void {
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
}

/**
 * Create a new workspace
 */
export function createWorkspace(name: string, description?: string, panels: WorkspacePanel[] = []): WorkspaceLayout {
  const workspace: WorkspaceLayout = {
    id: `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    panels,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  saveWorkspace(workspace);
  return workspace;
}

/**
 * Duplicate a workspace
 */
export function duplicateWorkspace(id: string, newName?: string): WorkspaceLayout | null {
  const original = getWorkspace(id);
  if (!original) return null;
  
  const duplicate: WorkspaceLayout = {
    ...original,
    id: `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: newName || `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false,
  };
  
  saveWorkspace(duplicate);
  return duplicate;
}

/**
 * Export workspace to JSON file
 */
export function exportWorkspace(id: string): void {
  const workspace = getWorkspace(id);
  if (!workspace) {
    throw new Error('Workspace not found');
  }
  
  const json = JSON.stringify(workspace, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${workspace.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import workspace from JSON
 */
export async function importWorkspace(file: File): Promise<WorkspaceLayout> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const workspace = JSON.parse(content) as WorkspaceLayout;
        
        // Generate new ID to avoid conflicts
        workspace.id = `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        workspace.createdAt = new Date().toISOString();
        workspace.updatedAt = new Date().toISOString();
        
        saveWorkspace(workspace);
        resolve(workspace);
      } catch (err) {
        reject(new Error('Invalid workspace file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Set default workspace
 */
export function setDefaultWorkspace(id: string): void {
  const workspaces = getAllWorkspaces();
  
  // Clear existing default
  workspaces.forEach(w => {
    w.isDefault = false;
  });
  
  // Set new default
  const workspace = workspaces.find(w => w.id === id);
  if (workspace) {
    workspace.isDefault = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  }
}

/**
 * Get default workspace
 */
export function getDefaultWorkspace(): WorkspaceLayout | null {
  const workspaces = getAllWorkspaces();
  return workspaces.find(w => w.isDefault) || null;
}

/**
 * Clear all workspaces (use with caution)
 */
export function clearAllWorkspaces(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
}
