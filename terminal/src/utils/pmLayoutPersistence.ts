import type { SavedView } from '../../../src/types/biotech';

const STORAGE_KEY = 'pm_mode_saved_views';
const CURRENT_VIEW_KEY = 'pm_mode_current_view';

/**
 * Layout persistence utilities for PM Mode
 */
export class PMLayoutPersistence {
  /**
   * Save a view to localStorage
   */
  static saveView(view: SavedView): void {
    try {
      const views = this.getAllViews();
      const existingIndex = views.findIndex(v => v.id === view.id);

      if (existingIndex >= 0) {
        views[existingIndex] = view;
      } else {
        views.push(view);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
    } catch (error) {
      console.error('Failed to save view:', error);
    }
  }

  /**
   * Get all saved views
   */
  static getAllViews(): SavedView[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load views:', error);
      return [];
    }
  }

  /**
   * Get a specific view by ID
   */
  static getView(id: string): SavedView | null {
    const views = this.getAllViews();
    return views.find(v => v.id === id) || null;
  }

  /**
   * Delete a view
   */
  static deleteView(id: string): void {
    try {
      const views = this.getAllViews();
      const filtered = views.filter(v => v.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete view:', error);
    }
  }

  /**
   * Save current view state
   */
  static saveCurrentView(filters: Record<string, string[]>, layout?: string): void {
    try {
      const currentView = {
        filters,
        layout: layout || 'pmMode',
        timestamp: Date.now(),
      };
      localStorage.setItem(CURRENT_VIEW_KEY, JSON.stringify(currentView));
    } catch (error) {
      console.error('Failed to save current view:', error);
    }
  }

  /**
   * Load current view state
   */
  static loadCurrentView(): { filters: Record<string, string[]>; layout: string } | null {
    try {
      const stored = localStorage.getItem(CURRENT_VIEW_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load current view:', error);
      return null;
    }
  }

  /**
   * Generate shareable hash for view state
   */
  static generateShareHash(view: SavedView): string {
    const stateString = JSON.stringify({
      filters: view.filters,
      sort: view.sort,
      openNodes: view.openNodes,
      layout: view.layout,
    });

    // Simple base64 encoding for sharing (in production, use a proper URL shortener)
    return btoa(stateString);
  }

  /**
   * Parse shareable hash back to view state
   */
  static parseShareHash(hash: string): Partial<SavedView> | null {
    try {
      const stateString = atob(hash);
      return JSON.parse(stateString);
    } catch (error) {
      console.error('Failed to parse share hash:', error);
      return null;
    }
  }

  /**
   * Clear all saved views
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CURRENT_VIEW_KEY);
    } catch (error) {
      console.error('Failed to clear views:', error);
    }
  }
}
