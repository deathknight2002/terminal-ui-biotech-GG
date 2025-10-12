# Terminal Enhancement Features Guide

## Overview

This document describes the major enhancements added to the Biotech Terminal to match and exceed OpenBB Terminal functionality while maintaining our own backend architecture.

---

## 🎯 Quick Access

**Try the demo**: Navigate to `/enhanced-demo` in your browser to see all features in action

---

## 📊 Advanced Data Table

### Description
Professional-grade data grid with Bloomberg Terminal-style features for sorting, filtering, searching, and exporting large datasets.

### Key Features
- **Multi-column sorting** with visual indicators (↑ ↓)
- **Global search** across all columns
- **Per-column filtering** with inline inputs
- **Export to CSV/JSON** with one click
- **Copy to clipboard** for quick sharing
- **Pagination** with customizable page sizes
- **Custom cell rendering** for formatted data
- **Corner brackets** for terminal aesthetics
- **Responsive** with max-height scrolling

### Usage Example

```typescript
import { AdvancedDataTable } from '@biotech-terminal/frontend-components/terminal';
import type { Column } from '@biotech-terminal/frontend-components/terminal';

const columns: Column[] = [
  { key: 'id', header: 'ID', width: 60, align: 'center', sortable: true },
  { key: 'drug', header: 'DRUG NAME', width: 200, sortable: true },
  { 
    key: 'phase', 
    header: 'PHASE', 
    width: 120, 
    render: (row) => <span style={{ color: getPhaseColor(row.phase) }}>{row.phase}</span>
  },
  { 
    key: 'probability', 
    header: 'PROBABILITY', 
    width: 120, 
    align: 'right',
    format: (value) => `${value}%`
  }
];

<AdvancedDataTable
  columns={columns}
  data={pipelineData}
  keyExtractor={(row) => row.id.toString()}
  title="DRUG PIPELINE TRACKER"
  cornerBrackets
  exportable
  searchable
  filterable
  sortable
  pageSize={50}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `Column[]` | required | Column definitions |
| `data` | `T[]` | required | Array of data objects |
| `keyExtractor` | `(row: T) => string \| number` | required | Unique key for each row |
| `title` | `string` | - | Table title |
| `maxHeight` | `number` | 600 | Maximum height in pixels |
| `striped` | `boolean` | true | Alternating row colors |
| `hoverable` | `boolean` | true | Highlight row on hover |
| `exportable` | `boolean` | true | Show export button |
| `searchable` | `boolean` | true | Show search input |
| `filterable` | `boolean` | true | Show column filters |
| `sortable` | `boolean` | true | Enable column sorting |
| `pageSize` | `number` | 50 | Rows per page |
| `cornerBrackets` | `boolean` | false | Terminal-style corner brackets |

---

## 💾 Workspace Persistence

### Description
Bloomberg Launchpad-style system for saving, loading, and sharing custom terminal layouts.

### Key Features
- **Save current layout** with one click
- **Load saved workspaces** instantly
- **Set default workspace** for quick access
- **Duplicate workspaces** with custom names
- **Import/Export** as JSON files for sharing
- **Delete workspaces** with confirmation
- **Track active workspace** across sessions
- **LocalStorage-based** for instant access

### Usage Example

```typescript
import { WorkspaceManager } from '@biotech-terminal/frontend-components/terminal';
import { 
  getAllWorkspaces, 
  setActiveWorkspace,
  getActiveWorkspaceId 
} from '../../../src/utils/workspaceUtils';

function MyApp() {
  const [showManager, setShowManager] = useState(false);
  
  const handleLoadWorkspace = (workspace) => {
    // Apply the workspace layout
    applyPanelLayout(workspace.panels);
  };
  
  return (
    <>
      <button onClick={() => setShowManager(true)}>
        MANAGE WORKSPACES
      </button>
      
      {showManager && (
        <WorkspaceManager
          isOpen={showManager}
          onClose={() => setShowManager(false)}
          onLoadWorkspace={handleLoadWorkspace}
          currentPanels={activePanels}
        />
      )}
    </>
  );
}
```

### Utility Functions

```typescript
// Get all saved workspaces
const workspaces = getAllWorkspaces();

// Create a new workspace
const workspace = createWorkspace('My Layout', 'Description', panels);

// Save/update a workspace
saveWorkspace(workspace);

// Load a workspace
const workspace = getWorkspace(workspaceId);

// Set active workspace
setActiveWorkspace(workspaceId);

// Get active workspace ID
const activeId = getActiveWorkspaceId();

// Export workspace to file
exportWorkspace(workspaceId);

// Import workspace from file
const workspace = await importWorkspace(file);

// Duplicate workspace
const copy = duplicateWorkspace(workspaceId, 'New Name');

// Delete workspace
deleteWorkspace(workspaceId);

// Set default workspace
setDefaultWorkspace(workspaceId);
```

---

## 🖱️ Context Menu System

### Description
Bloomberg-style right-click context menus for quick actions throughout the terminal.

### Key Features
- **Reusable component** with hook
- **Position-aware** rendering
- **Keyboard shortcuts** (ESC to close)
- **Icon support** (lucide-react)
- **Pre-built actions** (copy, download, share, etc.)
- **Custom actions** support
- **Danger actions** (red highlight)
- **Dividers** for grouping

### Usage Example

```typescript
import { ContextMenu, useContextMenu, commonContextMenuItems } from '@biotech-terminal/frontend-components/terminal';

function MyComponent() {
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  
  const handleRowRightClick = (e, row) => {
    const items = [
      commonContextMenuItems.copy(() => copyToClipboard(row)),
      commonContextMenuItems.export(() => exportRow(row)),
      commonContextMenuItems.bookmark(() => addToWatchlist(row)),
      commonContextMenuItems.divider(),
      commonContextMenuItems.viewDetails(() => navigate(`/details/${row.id}`)),
      commonContextMenuItems.analyze(() => openAnalysis(row)),
      commonContextMenuItems.divider(),
      {
        label: 'Delete',
        icon: <Trash size={14} />,
        onClick: () => deleteRow(row),
        danger: true
      }
    ];
    
    openContextMenu(e, items);
  };
  
  return (
    <>
      <div onContextMenu={(e) => handleRowRightClick(e, data)}>
        Right-click me!
      </div>
      
      {contextMenu && (
        <ContextMenu
          items={contextMenu.items}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}
```

### Pre-built Actions

```typescript
commonContextMenuItems.copy(onCopy)         // Copy action
commonContextMenuItems.download(onDownload) // Download action
commonContextMenuItems.share(onShare)       // Share action
commonContextMenuItems.bookmark(onBookmark) // Add to watchlist
commonContextMenuItems.viewDetails(onView)  // View details
commonContextMenuItems.analyze(onAnalyze)   // Analyze
commonContextMenuItems.export(onExport)     // Export data
commonContextMenuItems.alert(onAlert)       // Create alert
commonContextMenuItems.more(onMore)         // More actions
commonContextMenuItems.divider()            // Separator
```

---

## 📤 Export Utilities

### Description
Comprehensive data export system supporting multiple formats.

### Key Features
- **CSV export** with proper escaping
- **JSON export** (pretty or minified)
- **TSV export** for Excel
- **Clipboard copying** in multiple formats
- **Number formatting** (1,234,567.89)
- **Currency formatting** ($1,234.56)
- **Date formatting** (short/medium/long)

### Usage Example

```typescript
import { 
  exportToCSV, 
  exportToJSON, 
  exportToTSV,
  copyToClipboard,
  formatNumber,
  formatCurrency,
  formatDate 
} from '../../../src/utils/exportUtils';

// Export to CSV
exportToCSV(data, ['id', 'name', 'value'], 'my-data.csv');

// Export to JSON
exportToJSON(data, 'my-data.json', true); // pretty=true

// Export to TSV
exportToTSV(data, ['id', 'name', 'value'], 'my-data.tsv');

// Copy to clipboard
await copyToClipboard(data, 'csv');

// Format numbers
formatNumber(1234567.89, 2);        // "1,234,567.89"
formatCurrency(1234.56, 'USD');     // "$1,234.56"
formatDate(new Date(), 'medium');   // "Jan 15, 2025"
```

### Export Functions

```typescript
// Export data to CSV file
exportToCSV(data: any[], columns?: string[], filename?: string): void

// Export data to JSON file
exportToJSON(data: any[], filename?: string, pretty?: boolean): void

// Export data to TSV file
exportToTSV(data: any[], columns?: string[], filename?: string): void

// Copy data to clipboard
copyToClipboard(data: any[], format: 'csv' | 'json' | 'tsv'): Promise<void>

// Format numbers
formatNumber(num: number, decimals?: number): string

// Format currency
formatCurrency(amount: number, currency?: string): string

// Format dates
formatDate(date: Date | string, format?: 'short' | 'medium' | 'long'): string
```

---

## 🎨 Terminal Aesthetics

All new components follow the terminal's design system:

- **Monospace fonts** (`var(--font-mono)`)
- **High contrast** (WCAG AAA compliant)
- **Corner brackets** option
- **Accent colors** (`var(--accent-primary)`)
- **Consistent spacing** (`var(--space-*)`)
- **Professional styling** (borders, shadows, transitions)

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+W` | Open Workspace Manager |
| `Ctrl+K` | Open Command Palette (existing) |
| `ESC` | Close context menu |
| `ESC` | Close modals |

---

## 💡 Pro Tips

### Data Tables
- Click column headers multiple times to cycle through sort states
- Use per-column filters for precise data filtering
- Export filtered/sorted data using the EXPORT button
- Right-click rows for quick actions

### Workspaces
- Create empty workspaces and build them up over time
- Export workspaces to share with team members
- Set a default workspace for quick startup
- Use descriptive names and descriptions

### Context Menus
- Works on any element with `onContextMenu` handler
- Automatically positions to stay on screen
- Press ESC to close without clicking
- Combine with data tables for powerful workflows

---

## 🚀 Best Practices

### Performance
- Use pagination for large datasets (1000+ rows)
- Enable virtual scrolling for very large datasets
- Debounce search inputs for better performance
- Export only visible/filtered data when possible

### User Experience
- Always provide visual feedback for actions
- Use loading states during exports
- Confirm destructive actions (delete, clear)
- Show success/error toasts after operations

### Accessibility
- Ensure keyboard navigation works
- Provide ARIA labels for custom actions
- Use semantic HTML elements
- Maintain high color contrast

---

## 📚 Additional Resources

- **Demo Page**: `/enhanced-demo` - Interactive demonstrations
- **Component Docs**: See individual component files
- **Type Definitions**: Check `*.tsx` files for full TypeScript types
- **Examples**: Look at `EnhancedFeaturesDemo.tsx` for usage patterns

---

## 🐛 Troubleshooting

### Data not exporting
- Check browser permissions for downloads
- Ensure data array is not empty
- Verify column keys match data object keys

### Context menu not appearing
- Ensure `onContextMenu` handler prevents default
- Check that `ContextMenu` component is rendered
- Verify `contextMenu` state is not null

### Workspace not loading
- Check localStorage is enabled
- Verify workspace ID is correct
- Ensure panels array structure matches expected format

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Try the `/enhanced-demo` page
3. Review example code in `EnhancedFeaturesDemo.tsx`
4. Check component prop types for usage details

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Author**: Biotech Terminal Team
