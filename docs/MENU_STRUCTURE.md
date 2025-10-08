# Aurora Terminal Menu Structure

## Overview

The Aurora Terminal features a comprehensive menu system with 15 top-level categories and 57 distinct pages/features. The menu is accessible via the frozen, glass-Aurora top taskbar that scrolls with the user.

---

## Menu Categories

### 🏠 HOME
*Main dashboard and personal workspace*

- **Overview Dashboard** (`/`)
  - Key metrics and KPIs
  - Recent activity feed
  - Quick access tiles
  
- **Recents** (`/recents`)
  - Recently viewed items across all categories
  - Time-based organization
  - Quick navigation to previous views

- **Favorites** (`/favorites`)
  - User-bookmarked items
  - Custom collections
  - Quick access shortcuts

---

### 📰 NEWS
*Biotech intelligence and news tracking*

- **News Stream** (`/news`)
  - Latest biotech news articles
  - Verified external hyperlinks
  - Real-time sentiment analysis (regulatory/clinical/M&A)
  - Source attribution

- **Source Filters** (`/news/sources`)
  - Filter by news source (FierceBiotech, ScienceDaily, BioSpace, Endpoints News)
  - Source reliability indicators
  - Article count per source

- **Sentiment Tracker** (`/news/sentiment`)
  - Three-dimensional sentiment analysis:
    - Regulatory sentiment
    - Clinical development sentiment
    - M&A sentiment
  - Sentiment trends over time
  - Entity-linked sentiment

- **Trend Terms** (`/news/trends`)
  - Emerging topics and terminology
  - Frequency analysis
  - Related entity connections

---

### 🔬 SCIENCE
*Scientific research and epidemiology*

- **Epidemiology Builder** (`/science/epidemiology`)
  - Full-screen disease burden analysis workflow
  - Multi-source data integration (SEER, WHO, CDC, GBD)
  - Custom cohort definition
  - Export capabilities

- **Literature Explorer** (`/science/literature`)
  - PubMed integration
  - Citation network visualization
  - Search and filter by entity
  - Save and organize papers

- **Biomarker Atlas** (`/science/biomarkers`)
  - Comprehensive biomarker database
  - Disease-biomarker associations
  - Clinical validation status
  - Regulatory approval tracking

---

### 📅 CATALYSTS
*Market-moving events and milestones*

- **Catalyst Calendar** (`/catalysts/calendar`)
  - Full-page grid/timeline view
  - Month and agenda views
  - FDA dates, data readouts, conference presentations
  - Probability and impact estimates

- **Past Catalysts Log** (`/catalysts/past`)
  - Historical catalyst database
  - Outcomes and market reactions
  - Performance analytics

- **Manual Alert Notes** (`/catalysts/alerts`)
  - Custom catalyst tracking
  - User-defined events
  - Email/notification preferences

---

### 🧪 TRIALS
*Clinical trial intelligence*

- **Trial Finder** (`/trials`)
  - Advanced search with filters:
    - Phase, status, indication
    - Sponsor, location
    - Enrollment status
  - NCT ID lookup
  - Trial details and endpoints

- **Readout Timeline** (`/trials/readouts`)
  - Upcoming trial data releases
  - Expected dates and catalysts
  - Historical readout database

- **Enrollment Heatmap** (`/trials/enrollment`)
  - Geographic enrollment tracking
  - Site-level enrollment data
  - Recruitment velocity metrics

---

### 🏢 COMPANIES
*Pharmaceutical and biotech companies*

- **Company Profiles** (`/companies`)
  - Comprehensive company information
  - Pipeline overview
  - Financial metrics
  - Management team

- **Therapeutics Directory** (`/companies/therapeutics`)
  - Drug pipeline database
  - Phase distribution
  - Modality breakdown
  - Indication mapping

- **Pipeline Maps** (`/companies/pipelines`)
  - Visual pipeline representations
  - Gantt charts and timelines
  - Risk-adjusted NPV

---

### 🕸️ COMPETITORS
*Competitive intelligence and analysis*

- **Spiderweb Compare** (`/competitors/spiderweb`)
  - 6-axis radar chart visualization:
    - Safety
    - Efficacy
    - Regulatory position
    - Modality fit
    - Clinical maturity
    - Differentiation
  - Multi-entity comparison
  - Disease or company scope

- **Landscape Matrix** (`/competitors/matrix`)
  - 2D positioning charts
  - Market share analysis
  - Strategic group mapping

- **Share-of-Voice** (`/competitors/voice`)
  - Media presence tracking
  - Social media analytics
  - Conference activity
  - Publication trends

---

### 🏥 EPIDEMIOLOGY
*Disease burden and population health*

- **Disease Catalog** (`/epidemiology`)
  - Comprehensive disease database
  - ICD-10/ICD-11 mapping
  - Prevalence and incidence data
  - DALY/YLL/YLD metrics

- **Regional Burden Maps** (`/epidemiology/regional`)
  - Geographic distribution of disease burden
  - Country and state-level data
  - Interactive choropleth maps
  - Time-series animation

- **Cohort Builder** (`/epidemiology/cohorts`)
  - Patient population definitions
  - Demographic stratification
  - Risk factor analysis
  - Custom segment creation

---

### 📈 MARKETS
*Financial markets and valuations*

- **Sector Indices** (`/markets/sectors`)
  - Biotech sector performance
  - XBI, IBB, NBI tracking
  - Sub-sector breakdowns
  - Relative performance

- **Valuation Comps** (`/markets/valuations`)
  - Comparable company analysis
  - Valuation multiples (EV/Sales, P/E, etc.)
  - Peer group identification
  - Historical valuation ranges

- **Risk Factors** (`/markets/risks`)
  - Systematic and idiosyncratic risk
  - Beta and volatility metrics
  - Regulatory risk assessment
  - Clinical trial risk

---

### 💼 PORTFOLIOS & WATCHLISTS
*Portfolio management and tracking*

- **Watchlist Manager** (`/portfolios/watchlists`)
  - Create and manage watchlists
  - Real-time price tracking
  - Alert configuration
  - Performance attribution

- **Custom Baskets** (`/portfolios/baskets`)
  - Create themed portfolios
  - Rebalancing tools
  - Scenario analysis
  - Backtest performance

- **Risk Metrics** (`/portfolios/risk`)
  - Portfolio-level risk analysis
  - VaR and CVaR
  - Correlation analysis
  - Stress testing

---

### 🔍 ANALYTICS
*Advanced analytics and modeling*

- **Compare Engine** (`/analytics/compare`)
  - Side-by-side entity comparison
  - Multi-dimensional analysis
  - Customizable metrics
  - Export to Excel/CSV

- **Trend Detection** (`/analytics/trends`)
  - AI-powered trend identification
  - Anomaly detection
  - Pattern recognition
  - Outlier identification

- **Scenario Models** (`/analytics/scenarios`)
  - Drug uptake curves
  - Peak sales forecasting
  - Probability-weighted scenarios
  - Sensitivity analysis

---

### 📊 DATA
*Data management and governance*

- **Data Catalog** (`/data/catalog`)
  - Available datasets inventory
  - Data schema browser
  - Sample data previews
  - API documentation links

- **Provenance & Audit** (`/data/provenance`)
  - Data lineage tracking
  - Source attribution
  - Update history
  - Quality metrics

- **Exports** (`/data/exports`)
  - Bulk data export tools
  - Multiple format support (CSV, JSON, Excel, Parquet)
  - Scheduled exports
  - Export history

- **Freshness** (`/data/freshness`)
  - Data update tracking
  - Last refresh timestamps
  - Data staleness alerts
  - Update schedules

---

### 🛠️ TOOLS
*System utilities and preferences*

- **Command Palette** (`/tools/command`)
  - Global search and command execution
  - Keyboard-driven interface
  - Quick actions
  - Recent commands

- **Manual Refresh** (`/tools/refresh`)
  - Data ingestion controls
  - Source selection (news, trials, catalysts, all)
  - Ingestion history
  - Error logs

- **Keyboard Shortcuts** (`/tools/shortcuts`)
  - Complete shortcut reference
  - Customizable key bindings
  - Context-sensitive shortcuts
  - Cheat sheet overlay

- **Theme Toggle** (`/tools/theme`)
  - Theme selection (amber, green, cyan, purple, blue)
  - Color-blind modes
  - Dark/light mode
  - Custom theme builder

---

### ⚙️ SETTINGS
*User preferences and configuration*

- **Preferences** (`/settings`)
  - General settings
  - Notification preferences
  - Default views
  - Data refresh intervals

- **API Keys** (`/settings/api`)
  - Manage API keys
  - Generate new keys
  - Usage tracking
  - Rate limit information

- **Permissions** (`/settings/permissions`)
  - User role management
  - Feature access control
  - Data visibility rules
  - Audit log access

---

### ❓ HELP
*Documentation and support*

- **Documentation** (`/help/docs`)
  - User guides
  - Feature documentation
  - Video tutorials
  - FAQ

- **About** (`/help/about`)
  - System information
  - Version details
  - Credits
  - License information

- **Keyboard Map** (`/help/keyboard`)
  - Interactive keyboard shortcut guide
  - Searchable shortcuts
  - Context help
  - Print-friendly version

---

## Navigation Features

### Aurora Top Taskbar
- **Sticky positioning**: Travels with scroll, always accessible
- **Glass morphism**: Frosted glass effect with Aurora gradients
- **Hover mega-menu**: Dense, organized submenus with hover intent
- **Keyboard navigation**: Full keyboard support with focus management
- **Global search**: Integrated search across all entities
- **Refresh control**: Manual data ingestion trigger with source selection

### Keyboard Shortcuts (Global)
- `Ctrl+K` / `Cmd+K`: Open command palette
- `Ctrl+R` / `Cmd+R`: Manual refresh
- `Esc`: Close current overlay/menu
- `Arrow keys`: Navigate menus and results
- `Enter`: Select menu item or search result
- `/`: Focus global search

### Mobile Optimizations
- **Touch-friendly drawer**: Slide-out navigation menu
- **Pull-to-refresh**: Native mobile refresh gesture
- **Bottom tab bar**: Primary navigation for mobile
- **Responsive layouts**: Optimized for small screens
- **Gesture support**: Swipe navigation where applicable

---

## Data Architecture

### Manual Refresh System
- **NO background jobs or cron schedulers**
- **On-demand ingestion only** via `/admin/ingest` endpoint
- **Source-specific refresh**: news, trials, catalysts, or all
- **Toast notifications**: Real-time feedback on refresh status
- **Ingestion history**: Audit log of all refresh operations

### Link Validation
- **Asynchronous validation**: External links validated server-side
- **`link_valid` flag**: Stored in database, prevents UI blocking
- **Retry logic**: Failed validations retried with exponential backoff
- **Canonical URLs**: Resolved redirects to canonical URLs

### Caching Strategy
- **ETags**: Client-side caching with conditional requests
- **Short TTLs**: 5-15 minute cache for frequently updated data
- **Aggressive caching**: News and catalysts cached longer
- **Cache invalidation**: Manual refresh clears relevant caches

---

## Design Language

### Visual Identity
- **Bloomberg/FactSet aesthetic**: Dense, information-rich layouts
- **High-contrast typography**: WCAG AAA compliance
- **Aurora gradients**: iOS 26-inspired flowing gradients
- **Glass morphism**: Frosted glass panels with blur effects
- **Corner brackets**: Optional terminal-style corner accents

### Typography
- **Monospace fonts**: JetBrains Mono for terminal feel
- **Uppercase labels**: Section headers and buttons
- **Hierarchy**: Clear visual hierarchy with size and weight

### Color Themes
- **5 accent themes**: Amber, green, cyan, purple, blue
- **CVD modes**: Deuteranopia and protanomaly support
- **Dark-first**: Optimized for dark backgrounds
- **Aurora effects**: Subtle animated gradients

### Animations
- **Spring transitions**: Natural, physical motion
- **Hover intents**: Delayed mega-menu appearance
- **Micro-interactions**: Button feedback, loading states
- **Performance-first**: Hardware-accelerated CSS transforms

---

## Integration Points

### Backend APIs
- FastAPI (Python) on port 8000
- Node.js Express on port 3001 (WebSocket)
- RESTful design with JSON responses
- Standard error handling

### Frontend Architecture
- React 19 with TypeScript
- React Router for navigation
- TanStack Query for data fetching
- Framer Motion for animations

### Component Library
- Terminal atoms and molecules
- Biotech-specific widgets
- OpenBB integration components
- Plotly chart wrappers

---

## Future Roadmap

1. **WebSocket real-time updates**: Live data streaming
2. **Advanced filtering**: Complex query builder
3. **Data exports**: Bulk export capabilities
4. **Collaboration features**: Shared watchlists and notes
5. **AI insights**: Automated trend detection
6. **Mobile app**: Native iOS/Android apps
7. **API marketplace**: Third-party integrations
8. **Custom dashboards**: Drag-and-drop dashboard builder
