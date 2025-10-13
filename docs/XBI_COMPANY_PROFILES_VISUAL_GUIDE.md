# XBI Company Profiles - UI Visual Guide

## Feature Overview

The XBI Company Profiles feature provides a comprehensive browser for all constituents of the XBI ETF (SPDR S&P Biotech ETF), with detailed company profiles powered by Yahoo Finance.

## UI Screenshots & Features

### 1. XBI Companies Browser Page (`/companies/xbi`)

**Route**: `/companies/xbi`

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  XBI COMPANIES BROWSER                                    [≡] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─ Sync Controls ─────────────────────────────────────────┐│
│  │ XBI Constituents: 56  Last Updated: Oct 13, 2025        ││
│  │                        [SYNC NOW] [FORCE REFRESH]        ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─ Filters ─────────────────────────────────────────────┐  │
│  │ SEARCH: [Search name, ticker, or location...     ]    │  │
│  │                                                        │  │
│  │ COMPANY TYPE: [All Types ▼]  SECTOR: [All Sectors ▼] │  │
│  │ SORT BY: [Market Cap ▼]      ORDER: [Descending ▼]   │  │
│  │                                                        │  │
│  │ Showing 56 of 56 companies                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─ Companies Grid ─────────────────────────────────────┐   │
│  │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │   │
│  │ │ VRTX   │ │ REGN   │ │ BMRN   │ │ ALNY   │  ...    │   │
│  │ │Big Ph. │ │Big Ph. │ │Biotech │ │Biotech │         │   │
│  │ │────────│ │────────│ │────────│ │────────│         │   │
│  │ │Vertex  │ │Regeneron│ │BioMarin│ │Alnylam │         │   │
│  │ │Pharmac.│ │Pharmac. │ │Pharmac.│ │Pharmac.│         │   │
│  │ │────────│ │────────│ │────────│ │────────│         │   │
│  │ │Cap:$125B│ │Cap:$95B│ │Cap:$15B│ │Cap:$18B│         │   │
│  │ │Boston MA│ │Tarry NY│ │San Raf.│ │Cambr MA│         │   │
│  │ │HC, Bio. │ │HC, Bio.│ │HC, Bio.│ │HC, Bio.│         │   │
│  │ └────────┘ └────────┘ └────────┘ └────────┘         │   │
│  │                                                        │   │
│  │ [... grid continues with more companies ...]          │   │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Sync Controls**: Manual sync with status display
- **Real-time Search**: Filter by name, ticker, or location
- **Multi-criteria Filters**: Company type, sector
- **Sortable**: By market cap, name, or ticker
- **Grid View**: Responsive card layout
- **Click-through**: Navigate to detailed company profiles

**Visual Design**:
- Terminal aesthetics with monospace fonts
- Bloomberg-style corner brackets on panels
- Accent color highlighting (amber/green/cyan/purple/blue themes)
- High contrast for accessibility (WCAG AAA)
- Hover effects on company cards

### 2. Company Profile Page (`/companies/{ticker}/profile`)

**Route**: `/companies/VRTX/profile`

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│  [← XBI Companies] / VRTX                                    │
├─────────────────────────────────────────────────────────────┤
│  COMPANY PROFILE: VRTX                                    [≡] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─ Header ───────────────────────────────────────────────┐ │
│  │  VRTX                              [XBI CONSTITUENT]    │ │
│  │  Vertex Pharmaceuticals                                 │ │
│  │  Big Pharma  •  Boston, MA  •  Founded 1989            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─ Overview Tab ───────────────────────────────────────┐   │
│  │                                                        │   │
│  │  ┌─ Financials ───────┐  ┌─ Company Info ──────────┐ │   │
│  │  │ Market Cap: $125B  │  │ Employees: 4,500        │ │   │
│  │  │ Price: $450.25     │  │ Website: vrtx.com       │ │   │
│  │  │ Volume: 1.25M      │  │ Sector: Healthcare      │ │   │
│  │  │ 52W High: $475.00  │  │ Industry: Biotechnology │ │   │
│  │  └────────────────────┘  └─────────────────────────┘ │   │
│  │                                                        │   │
│  │  ┌─ Business Summary ─────────────────────────────────┐  │
│  │  │ Vertex Pharmaceuticals is a global biotechnology   │  │
│  │  │ company that invests in scientific innovation to   │  │
│  │  │ create transformative medicines for people with    │  │
│  │  │ serious diseases...                                │  │
│  │  └────────────────────────────────────────────────────┘  │
│  │                                                        │   │
│  │  ┌─ Pipeline ─────────────────────────────────────────┐  │
│  │  │ 12 Programs  •  Therapeutic Areas:                 │  │
│  │  │ Cystic Fibrosis, Pain, Sickle Cell Disease         │  │
│  │  └────────────────────────────────────────────────────┘  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  [Overview] [Pipeline] [Catalysts] [Sources] [Ownership]     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
- **Breadcrumb Navigation**: Easy navigation back to XBI browser
- **XBI Badge**: Indicates XBI membership
- **Comprehensive Data**: Financials, company info, business summary
- **Tabbed Interface**: Overview, Pipeline, Catalysts, Sources, Ownership
- **Real-time Data**: From Yahoo Finance with caching
- **Responsive Layout**: Works on desktop and mobile

### 3. Search and Filter Workflow

**Use Case**: Finding all mid-cap biotech companies in oncology

**Steps**:
1. Navigate to `/companies/xbi`
2. Set filters:
   - COMPANY TYPE: "Mid Biotech"
   - SECTOR: "Oncology"
3. Results instantly filtered
4. Sort by Market Cap (descending)
5. Click any company card to view profile

**Visual Feedback**:
- Real-time result count updates
- Hover effects on company cards
- Active filter highlighting
- Loading states during sync

### 4. Sync Workflow

**Use Case**: Refreshing XBI data

**Manual Sync via UI**:
1. Navigate to `/companies/xbi`
2. Click "SYNC NOW" button
3. Status updates in real-time
4. Success message shows statistics:
   - Total constituents synced
   - New companies added
   - Companies updated
   - Any errors encountered

**Manual Sync via CLI**:
```bash
# Basic sync (uses cache)
$ python -m bt_platform.cli.sync_xbi

Starting XBI sync...
Force refresh: False
Found 56 XBI constituents
Fetching profile 1/56: VRTX
...
============================================================
XBI Sync Complete!
============================================================
Total constituents: 56
New companies: 3
Updated companies: 53
Failed companies: 0
============================================================
```

**Force Refresh**:
- Bypasses cache
- Fetches fresh data from Yahoo Finance
- Takes 1-2 minutes due to rate limiting
- Use weekly or when data seems stale

### 5. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction                          │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Terminal UI     │  │  API Endpoints   │
│  /companies/xbi  │  │  /api/v1/...     │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         │                     ▼
         │            ┌──────────────────┐
         │            │  XBI Sync Service│
         │            │  + YFinance Prov.│
         │            └────────┬─────────┘
         │                     │
         │                     ▼
         │            ┌──────────────────┐
         │            │  Yahoo Finance   │
         │            │  (yfinance lib)  │
         │            └────────┬─────────┘
         │                     │
         │                     ▼
         │            ┌──────────────────┐
         │            │  SQLite Database │
         │            │  (Company table) │
         │            └──────────────────┘
         │                     │
         └─────────────────────┘
```

### 6. Mobile Responsive Design

**Desktop (1600px+)**:
- Grid: 4 columns
- Full filters visible
- Side-by-side company info

**Tablet (768px - 1200px)**:
- Grid: 2-3 columns
- Filters in 2 columns
- Stacked company info

**Mobile (< 768px)**:
- Grid: 1 column
- Filters stack vertically
- Sync controls stack
- Touch-friendly buttons

### 7. Accessibility Features

**Keyboard Navigation**:
- Tab through filters and cards
- Enter to select company
- Arrow keys for navigation

**Screen Reader Support**:
- Semantic HTML elements
- ARIA labels on interactive elements
- Descriptive button text

**Color Blind Support**:
- High contrast text
- Not relying on color alone
- Multiple visual indicators

**WCAG AAA Compliance**:
- 7:1 contrast ratio
- Large touch targets (44px+)
- Focus indicators

### 8. Performance Optimizations

**Caching Strategy**:
- Profiles: 24 hours
- Quotes: 15 minutes
- Holdings: 6 hours

**Rate Limiting**:
- 1 request per second
- Prevents API throttling
- Progress logging

**Lazy Loading**:
- Company cards render as needed
- Virtual scrolling for large lists
- Debounced search input

**Database Indexing**:
- Ticker indexed
- Company name indexed
- XBI constituent flag indexed

### 9. Error Handling

**Network Errors**:
- Graceful fallback messages
- Retry options
- Offline indicators

**Data Errors**:
- Missing data displays as "N/A"
- Validation before save
- Error logs for debugging

**User Errors**:
- Clear error messages
- Helpful suggestions
- Easy recovery paths

### 10. Future Enhancements

**Planned Features**:
- [ ] Export to CSV/Excel
- [ ] Watchlist integration
- [ ] Historical XBI tracking
- [ ] Peer comparison tool
- [ ] Advanced analytics
- [ ] Custom alerts
- [ ] Portfolio tracking
- [ ] Alternative data sources

## Color Themes

The UI supports 5 color themes:

1. **Amber** (default): Bloomberg-style `#FF9500`
2. **Green**: Matrix/Hacker `#00FF00`
3. **Cyan**: Cyberpunk `#00D4FF`
4. **Purple**: Synthwave `#A855F7`
5. **Blue**: Classic Terminal `#0A84FF`

**Switching Themes**:
```html
<html data-theme="cyan">
  <!-- UI automatically updates -->
</html>
```

## Technical Stack

**Backend**:
- Python 3.9+
- FastAPI
- SQLAlchemy
- yfinance
- SQLite/PostgreSQL

**Frontend**:
- React 18+
- TypeScript
- Vite
- TanStack React Query
- CSS Modules

**Design System**:
- Monospace fonts (JetBrains Mono)
- Terminal aesthetics
- Bloomberg-inspired layouts
- WCAG AAA accessible

## Documentation

- **Feature Guide**: `docs/XBI_COMPANY_PROFILES.md`
- **Data Sources**: `docs/DATA_SOURCES.md`
- **API Docs**: FastAPI auto-generated at `/docs`
- **README**: Main repository README

---

**Last Updated**: 2025-10-13  
**Feature Status**: ✅ Complete  
**Platform**: Biotech Terminal v1.0
