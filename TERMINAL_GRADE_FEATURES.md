# Terminal-Grade Features Documentation

## Overview

This document describes the Bloomberg/FactSet/LSEG-Workspace inspired features implemented in the Aurora Biotech Terminal. All features maintain the **manual-refresh-only** architecture with **NO background polling or streaming**.

## Core Terminal Primitives

### 1. Linked Context Groups (A/B/C Channels)

**Pattern**: Bloomberg Launchpad / LSEG Workspace color-channel linking

**Purpose**: Synchronize data across multiple panels without page reloads

**Implementation**:
- **Location**: `src/contexts/ContextGroupContext.tsx`
- **Channels**: A (red), B (blue), C (green), NONE (gray)
- **Component**: `ContextChannelSelector` (`frontend-components/src/terminal/molecules/ContextChannelSelector`)

**Usage**:
```typescript
import { useContextGroups } from '../../../src/contexts/ContextGroupContext';
import { ContextChannelSelector } from '../../../frontend-components/src/terminal/molecules/ContextChannelSelector';

function MyPanel() {
  const { broadcastEntity, getActiveEntity, subscribePanel } = useContextGroups();
  const [channel, setChannel] = useState<ContextChannel>('A');

  // Subscribe panel to channel
  useEffect(() => {
    subscribePanel('my-panel-id', channel);
    return () => unsubscribePanel('my-panel-id');
  }, [channel]);

  // Broadcast entity selection to all subscribers
  const handleSelectEntity = (entity) => {
    broadcastEntity(channel, {
      type: 'company',
      id: entity.id,
      name: entity.name,
    });
  };

  // Listen for entity changes
  useEffect(() => {
    const activeEntity = getActiveEntity(channel);
    if (activeEntity) {
      // Update panel with new entity data
      loadEntityData(activeEntity);
    }
  }, [getActiveEntity(channel)]);

  return (
    <div>
      <ContextChannelSelector
        currentChannel={channel}
        onChannelChange={setChannel}
      />
      {/* Panel content */}
    </div>
  );
}
```

**Key Features**:
- ✅ Multi-channel support (A/B/C/NONE)
- ✅ Panel subscription/unsubscription
- ✅ Entity broadcasting across subscribed panels
- ✅ Color-coded UI indicators
- ✅ Real-time synchronization without reload

---

### 2. Command Palette (Function Codes)

**Pattern**: Bloomberg Terminal command line / function codes

**Purpose**: Quick keyboard-driven navigation using function codes

**Implementation**:
- **Component**: `CommandPalette` (`frontend-components/src/terminal/organisms/CommandPalette`)
- **Config**: `src/config/functionCodes.ts`
- **Hook**: `terminal/src/hooks/useCommandPalette.ts`

**Function Codes**:
| Code | Destination | Description |
|------|------------|-------------|
| `HO` | `/` | Home Dashboard |
| `NE` | `/news` | News Stream |
| `CO` | `/companies` | Company Profiles |
| `TR` | `/trials` | Clinical Trials |
| `CA` | `/catalysts/calendar` | Catalyst Calendar |
| `EPI` | `/epidemiology` | Epidemiology |
| `DATA` | `/data/catalog` | Data Catalog |

**Keyboard Shortcuts**:
- `⌘+K` (Mac) or `Ctrl+K` (Windows/Linux): Open command palette
- `↑/↓`: Navigate results
- `Enter`: Execute selected command
- `Esc`: Close palette

**Usage**:
```typescript
// Already integrated in TerminalLayout
// Press ⌘+K anywhere in the app to open
// Type function code or search for commands
// Recent commands are tracked automatically
```

**Key Features**:
- ✅ Bloomberg-style function codes (2-4 letter shortcuts)
- ✅ Autocomplete and fuzzy search
- ✅ Recent commands history (localStorage)
- ✅ Keyboard-first navigation
- ✅ Category filtering

---

### 3. App Library

**Pattern**: LSEG Workspace App Library / Launchpad sample views

**Purpose**: Discover and launch all terminal modules

**Implementation**:
- **Component**: `AppLibrary` (`frontend-components/src/terminal/organisms/AppLibrary`)
- **Config**: `src/config/appModules.ts`
- **Hook**: `terminal/src/hooks/useAppLibrary.ts`

**Categories**:
- 📰 News
- 🧬 Science
- 📅 Catalysts
- 🔍 Trials
- 🏢 Companies
- 📊 Analytics
- 📂 Data
- ⚙️ Tools

**Usage**:
```typescript
// Click app library icon in AuroraTopBar
// Or use keyboard shortcut (configured in hook)
// Search, filter by category, or browse all apps
// Favorites and recently used tracked automatically
```

**Key Features**:
- ✅ Grid and list views
- ✅ Category filtering
- ✅ Search by name, description, or function code
- ✅ Favorites tracking (localStorage)
- ✅ Recently used tracking
- ✅ Function code display

---

### 4. Workspace Layouts

**Pattern**: Bloomberg Launchpad saved views / LSEG layout manager

**Purpose**: Save, load, and share multi-panel workspace configurations

**Implementation**:
- **Config**: `src/config/starterLayouts.ts`
- **Types**: `WorkspaceLayout`, `PanelConfig` in `src/types/biotech.ts`

**Starter Layouts**:

1. **Oncology PM** 🎯
   - Watchlist + Catalyst Calendar + News Feed
   - Trials Timeline + Pipeline Visualization
   - All on Channel A for synchronized updates

2. **Catalyst War-Room** ⚡
   - Catalyst Calendar + Sentiment Tracker + Alerts
   - Spiderweb Compare + Readout Timeline
   - Multi-channel (A/B) for independent tracking

3. **Epi Ops** 🧬
   - Disease Catalog + Epi Builder + Regional Burden
   - Cohort Builder + Literature Explorer
   - Channel A for disease-centric workflow

4. **Market Intelligence** 📊
   - Company Profiles + Spiderweb + Share-of-Voice
   - Market Valuations + Pipeline Maps
   - Multi-channel (A/B) for comparison

**Layout Structure**:
```typescript
interface WorkspaceLayout {
  id: string;
  name: string;
  description: string;
  category: 'starter' | 'custom' | 'shared';
  panels: PanelConfig[];
  contextGroups: Record<ContextChannel, ContextGroup>;
  shareToken?: string; // For shareable links
}

interface PanelConfig {
  id: string;
  type: string; // 'news', 'calendar', 'trials', etc.
  position: { x, y, col, row };
  size: { width, height, cols, rows };
  contextChannel?: ContextChannel;
  settings?: Record<string, any>;
}
```

---

## Navigation & Search

### Global Search Enhancement
**Status**: ✅ Component exists, ready for function code integration

Enhance `GlobalSearch` to support function code shortcuts:
```typescript
// Type "CO ARYAZ" to search companies for ARYAZ
// Type "TR oncology" to search trials for oncology
// Type "DI DMD" to load DMD disease
```

### Keyboard Shortcuts
**Shortcuts configured in useCommandPalette**:
- `⌘+K` / `Ctrl+K`: Command Palette
- `⌘+H`: Home
- `⌘+N`: News
- `⌘+C`: Companies
- `⌘+T`: Trials
- `⌘+E`: Epidemiology
- `⌘+/`: Keyboard Shortcuts Guide

---

## Data & Export Features

### Manual Refresh System
**Already Implemented** ✅

Located in `AuroraTopBar`:
- News Articles refresh
- Clinical Trials refresh
- Market Catalysts refresh
- Refresh All

**API Endpoint**: `POST /api/v1/admin/ingest`

### Export System (To Be Implemented)
**Types**: CSV, Excel, PowerPoint, PDF, JSON

```typescript
interface ExportConfig {
  format: ExportFormat;
  filename?: string;
  includeCharts?: boolean;
  includeMetadata?: boolean;
  dateRange?: { start, end };
  filters?: Record<string, any>;
}
```

---

## Entitlements & Roles

**Pattern**: FactSet identity/entitlement model

```typescript
type UserRole = "admin" | "analyst" | "viewer" | "guest";

type FeatureEntitlement = 
  | "data_export"
  | "manual_refresh"
  | "layout_management"
  | "admin_tools"
  | "premium_data"
  | "api_access"
  | "audit_log_view"
  | "user_management";

interface UserPermissions {
  userId: string;
  role: UserRole;
  entitlements: FeatureEntitlement[];
}
```

**Usage**:
```typescript
// Gate features by entitlement
if (userPermissions.entitlements.includes('data_export')) {
  // Show export button
}

// Gate menu items by role
{menuItems.filter(item => 
  !item.requiresRole || user.role === item.requiresRole
)}
```

---

## Audit Logging

**Pattern**: FactSet/LSEG audit trail

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: "ingest" | "export" | "view" | "edit" | "delete" | "share";
  entityType?: string;
  entityId?: string;
  status: "success" | "failure" | "warning";
  details?: string;
}
```

**Log all operations**:
- Manual data ingestion
- Data exports
- Layout sharing
- Permission changes

---

## Accessibility & UX

### CVD-Safe Themes
Already implemented in terminal with multiple accent colors:
- 🟡 Amber
- 🟢 Green
- 🔵 Cyan
- 🟣 Purple
- 🔵 Blue

### UI Density (To Be Implemented)
```typescript
type UIDensity = "compact" | "comfortable" | "spacious";

interface UIPreferences {
  density: UIDensity;
  fontSize: "small" | "medium" | "large";
  reduceMotion: boolean;
  highContrast: boolean;
}
```

---

## Mobile & Cross-Platform

Context channels work across web and mobile:
- Mobile already has refresh button
- Add channel selector to mobile header
- Sync channel state via localStorage or URL params

---

## Architecture Principles

### ✅ Manual-Refresh-Only
- **NO** background jobs
- **NO** automatic polling
- **NO** streaming data
- User explicitly triggers all data updates

### ✅ Linked Workspaces
- Panels synchronize via context groups
- Updates propagate instantly within browser
- No network calls for panel updates

### ✅ Keyboard-First
- All major functions have shortcuts
- Command palette for quick access
- Arrow key navigation everywhere

### ✅ Terminal Aesthetics
- Monospace fonts
- Corner brackets on panels
- WCAG AAA contrast
- Bloomberg/FactSet visual language

---

## File Structure

```
src/
├── config/
│   ├── functionCodes.ts       # Bloomberg-style function codes
│   ├── appModules.ts           # App library configuration
│   └── starterLayouts.ts       # Pre-configured workspace layouts
├── contexts/
│   └── ContextGroupContext.tsx # Context group provider
└── types/
    └── biotech.ts              # All terminal types

frontend-components/src/terminal/
├── organisms/
│   ├── CommandPalette/         # Function code command system
│   ├── AppLibrary/             # Launchable app modules
│   └── AuroraTopBar/           # Enhanced with command/app buttons
└── molecules/
    └── ContextChannelSelector/ # A/B/C channel switcher

terminal/src/
├── hooks/
│   ├── useCommandPalette.ts    # Command palette state management
│   └── useAppLibrary.ts        # App library state management
└── components/
    └── TerminalLayout.tsx      # Integrated command palette & app library
```

---

## Next Steps

1. **Implement Layout Manager UI**
   - Save custom layouts
   - Load layouts
   - Share layouts (generate tokens)

2. **Add Data Freshness Indicators**
   - Show last refresh time
   - "Since last refresh" diff ribbon
   - Highlight new/updated data

3. **Implement Export System**
   - CSV/Excel/PowerPoint export
   - Audit logging for exports
   - Entitlement checks

4. **Add Audit Log Viewer**
   - Admin panel for audit logs
   - Filter by user, action, date
   - Export audit logs

5. **Enhance Mobile Support**
   - Add context channel selector to mobile
   - Touch-optimized command palette
   - Mobile layout manager

---

## Usage Examples

### Creating a Context-Aware Panel

```typescript
import { useContextGroups } from '../../../src/contexts/ContextGroupContext';
import { ContextChannelSelector } from '../../../frontend-components/src/terminal/molecules/ContextChannelSelector';

function WatchlistPanel() {
  const { broadcastEntity, subscribePanel, unsubscribePanel, getActiveEntity } = useContextGroups();
  const [channel, setChannel] = useState<ContextChannel>('A');

  useEffect(() => {
    const panelId = 'watchlist-1';
    subscribePanel(panelId, channel);
    return () => unsubscribePanel(panelId);
  }, [channel]);

  const handleSelectStock = (stock) => {
    // Broadcast to all panels on same channel
    broadcastEntity(channel, {
      type: 'company',
      id: stock.symbol,
      name: stock.name,
    });
  };

  return (
    <Panel
      title="WATCHLIST"
      headerAction={
        <ContextChannelSelector
          currentChannel={channel}
          onChannelChange={setChannel}
        />
      }
    >
      {watchlist.map(stock => (
        <button key={stock.symbol} onClick={() => handleSelectStock(stock)}>
          {stock.symbol}
        </button>
      ))}
    </Panel>
  );
}
```

### Listening to Context Updates

```typescript
function NewsPanel() {
  const { getActiveEntity } = useContextGroups();
  const [channel] = useState<ContextChannel>('A');
  const [newsFiltered, setNewsFiltered] = useState([]);

  useEffect(() => {
    const activeEntity = getActiveEntity(channel);
    if (activeEntity && activeEntity.type === 'company') {
      // Filter news by selected company
      const filtered = allNews.filter(n => 
        n.companies.includes(activeEntity.name)
      );
      setNewsFiltered(filtered);
    }
  }, [getActiveEntity(channel)]);

  return (
    <Panel title="NEWS FEED">
      {newsFiltered.map(article => (
        <NewsCard key={article.id} article={article} />
      ))}
    </Panel>
  );
}
```

---

## Testing the Features

1. **Test Command Palette**:
   - Press `⌘+K`
   - Type `CO` → Should show "COMPANIES"
   - Press Enter → Navigate to companies page
   - Verify recent commands persist

2. **Test App Library**:
   - Click grid icon in top bar
   - Search for "news"
   - Favorite an app
   - Close and reopen → Verify favorites persist

3. **Test Context Groups**:
   - Create two panels with `ContextChannelSelector`
   - Set both to Channel A
   - Click entity in panel 1
   - Verify panel 2 updates automatically

---

## Support & Documentation

- **Types**: All terminal types in `src/types/biotech.ts`
- **Examples**: See `REFERENCE/jsx/10.2.2025/` for UI patterns
- **Architecture**: See `docs/AURORA_TASKBAR_IMPLEMENTATION.md`

