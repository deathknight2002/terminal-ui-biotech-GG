# Cross-Platform Testing & Quality Assurance Guide
## Comprehensive Testing Checklist for Desktop and Mobile Applications

---

## 📋 Document Purpose

This guide provides detailed testing procedures to verify that all features of the Biotech Terminal Platform work correctly across desktop and mobile devices, ensuring consistency, reliability, and exceptional user experience.

**Target Users**: QA Engineers, Developers, Product Managers  
**Testing Scope**: Desktop (Terminal) + Mobile Applications  
**Testing Types**: Functional, Visual, Performance, Accessibility, Cross-Browser, Cross-Device

---

## 🎯 Testing Objectives

1. **Functional Completeness**: Verify all features work as designed
2. **Cross-Platform Consistency**: Ensure consistent behavior across desktop and mobile
3. **Responsive Design**: Validate layouts adapt properly to all screen sizes
4. **Performance**: Confirm app meets performance benchmarks
5. **Accessibility**: Verify WCAG compliance
6. **Error Handling**: Test graceful degradation and error recovery
7. **Data Integrity**: Ensure data consistency across platforms

---

## 🖥️ Desktop Testing Checklist

### Environment Setup

#### Required Browsers
- [ ] Chrome (latest stable)
- [ ] Firefox (latest stable)
- [ ] Safari (latest stable - macOS only)
- [ ] Edge (latest stable)

#### Screen Resolutions to Test
- [ ] 1920x1080 (Full HD) - most common
- [ ] 1440x900 (Laptop standard)
- [ ] 2560x1440 (QHD)
- [ ] 3840x2160 (4K)
- [ ] 1366x768 (minimum supported)

#### Operating Systems
- [ ] Windows 10/11
- [ ] macOS (latest)
- [ ] Linux (Ubuntu/Fedora)

---

### Desktop Functional Testing

#### Navigation & Layout
- [ ] **AuroraTopBar**: Loads with correct styling (glass effect, brand, refresh button)
- [ ] **Mega Menu**: Hover opens menu categories without clicks
- [ ] **Mega Menu Categories**: All 15 categories are present
  - [ ] Home
  - [ ] News
  - [ ] Science
  - [ ] Catalysts
  - [ ] Trials
  - [ ] Companies
  - [ ] Competitors
  - [ ] Epidemiology
  - [ ] Markets
  - [ ] Financials
  - [ ] Portfolios
  - [ ] Analytics
  - [ ] Data
  - [ ] Tools
  - [ ] Settings
- [ ] **Global Search**: Cmd+K (Mac) / Ctrl+K (Windows) opens command palette
- [ ] **Global Search**: Click search icon in topbar opens search
- [ ] **Global Search**: Typing shows filtered results
- [ ] **Global Search**: Arrow keys navigate results
- [ ] **Global Search**: Enter selects result and navigates
- [ ] **Global Search**: Escape closes search
- [ ] **Sidebar**: Persists across page navigation (if present)
- [ ] **Breadcrumbs**: Show current location (if implemented)

#### Dashboard Page (`/`)
- [ ] **Loads Successfully**: Page renders without errors
- [ ] **Metrics Display**: Key metrics cards show correct data
- [ ] **Widgets**: All dashboard widgets render correctly
- [ ] **Charts**: Visualizations load and display data
- [ ] **Interactivity**: Clicking widgets navigates to detail pages
- [ ] **Refresh**: Page updates when data refreshed

#### News Page (`/news`)
- [ ] **Loads Successfully**: News feed displays
- [ ] **Article Cards**: All articles show title, summary, source, date
- [ ] **Sentiment Badges**: REG/CLIN/M&A badges display with colors
  - [ ] Positive sentiment: Green
  - [ ] Neutral sentiment: Gray
  - [ ] Negative sentiment: Red
- [ ] **Diff Ribbon**: "Since Last Refresh" ribbon shows at top
- [ ] **Diff Counts**: NEW/UPDATED/DELETED counts display
- [ ] **Diff Highlights**: Top 3 changes highlighted
- [ ] **External Links**: Link icons (🔗) appear on verified links
- [ ] **External Links**: Click opens in new tab with `noopener noreferrer`
- [ ] **Article Click**: Click article to expand or navigate to details
- [ ] **Scroll Performance**: Smooth scrolling through long list
- [ ] **Time Filters**: 1h/1d/1w filter buttons work

#### Catalyst Calendar Page (`/catalysts/calendar`)
- [ ] **Loads Successfully**: Calendar view renders
- [ ] **Month View**: Calendar grid displays current month
- [ ] **Month Navigation**: Previous/Next month buttons work
- [ ] **Events on Calendar**: Catalyst events appear on correct dates
- [ ] **Event Details**: Hover/click shows event details
- [ ] **Week View**: Week view tab shows day-by-day breakdown
- [ ] **Agenda View**: Agenda view tab shows list format
- [ ] **Impact Badges**: High/Medium/Low badges display correctly
- [ ] **Probability Indicators**: 0-100% probability shows
- [ ] **Status Badges**: Upcoming/Completed/Cancelled status shown
- [ ] **ICS Export**: "EXPORT ICS" button downloads .ics file
- [ ] **ICS File Valid**: Downloaded .ics opens in calendar apps
- [ ] **Source Links**: Click source URL opens in new tab

#### Clinical Trials Page (`/trials`)
- [ ] **Loads Successfully**: Trial list displays
- [ ] **Trial Cards**: Each trial shows ID, name, phase, enrollment
- [ ] **Enrollment Progress**: Progress bars render with correct percentages
- [ ] **Phase Badges**: Phase I/II/III badges display correctly
- [ ] **Completion Date**: Target completion dates shown
- [ ] **Trial Details**: Click trial navigates to detail page (if exists)
- [ ] **Filters**: Filter trials by phase, status, company (if implemented)
- [ ] **Search**: Search trials by name or ID (if implemented)
- [ ] **Sorting**: Sort by date, enrollment, phase (if implemented)

#### Competitors Page (`/competitors/spiderweb`)
- [ ] **Loads Successfully**: Competitor analysis page displays
- [ ] **Radar Chart**: 6-axis radar chart renders
- [ ] **Chart Data**: Data points plotted correctly on axes
- [ ] **Tooltips**: Hover shows competitor names and values
- [ ] **Legend**: Legend shows all competitors with colors
- [ ] **Interactivity**: Click legend toggles competitor visibility
- [ ] **Multiple Competitors**: Can compare multiple competitors
- [ ] **Chart Export**: Export chart as image (if implemented)

#### Data Catalog Page (`/data/catalog`)
- [ ] **Loads Successfully**: Data catalog displays
- [ ] **Dataset List**: All available datasets shown
- [ ] **Search**: Search datasets by name or description
- [ ] **Filters**: Filter datasets by category, freshness, source
- [ ] **Dataset Details**: Click dataset shows details panel
- [ ] **Metadata**: Shows dataset size, last updated, schema
- [ ] **Preview**: Data preview available (if implemented)
- [ ] **Access**: Link or button to access dataset

#### Audit Log Page (`/data/provenance`)
- [ ] **Loads Successfully**: Audit log table displays
- [ ] **Log Entries**: All ingestion operations logged
- [ ] **Timestamps**: Accurate timestamps for each entry
- [ ] **Source Info**: Shows which source was ingested
- [ ] **Record Counts**: Shows number of records added/updated
- [ ] **User Info**: Shows who triggered ingestion (if applicable)
- [ ] **CSV Export**: "Export CSV" button works
- [ ] **CSV File Valid**: Downloaded CSV opens in Excel/Sheets
- [ ] **Sorting**: Sort by date, source, records
- [ ] **Filtering**: Filter by date range, source

#### Epidemiology Page (`/science/epidemiology` or `/epidemiology`)
- [ ] **Loads Successfully**: Epidemiology page displays
- [ ] **Disease Data**: Shows epidemiological data
- [ ] **Visualizations**: Charts/maps render correctly
- [ ] **Filters**: Filter by disease, region, time period
- [ ] **Data Accuracy**: Numbers match expected values

#### Financial Pages
**Financials Overview** (`/financials/overview`):
- [ ] **Loads Successfully**: Financial dashboard displays
- [ ] **Key Metrics**: Revenue, EBITDA, margin metrics shown
- [ ] **Charts**: Financial charts render correctly
- [ ] **Trends**: Trend indicators (up/down arrows) work

**Price Targets** (`/financials/price-targets`):
- [ ] **Loads Successfully**: Price targets page displays
- [ ] **Analyst Targets**: Shows analyst price targets
- [ ] **Consensus**: Displays consensus target
- [ ] **Range**: Shows low/high range

**LoE Cliff** (`/financials/loe-cliff`):
- [ ] **Loads Successfully**: Patent cliff visualization displays
- [ ] **Timeline**: Shows loss of exclusivity dates
- [ ] **Revenue Impact**: Visualizes revenue impact

**Other Financial Pages**:
- [ ] **Consensus vs House** (`/financials/consensus`): Loads and displays comparison
- [ ] **DCF & Multiples** (`/financials/dcf`): Valuation models display
- [ ] **Model Audit** (`/financials/audit`): Audit page functional
- [ ] **Reports** (`/financials/reports`): Reports list displays

#### Placeholder Pages
Test all placeholder pages display correctly:
- [ ] **Recents** (`/recents`)
- [ ] **Favorites** (`/favorites`)
- [ ] **News Sources** (`/news/sources`)
- [ ] **Sentiment Tracker** (`/news/sentiment`)
- [ ] **Trend Terms** (`/news/trends`)
- [ ] **Literature Explorer** (`/science/literature`)
- [ ] **Biomarker Atlas** (`/science/biomarkers`)
- [ ] **Past Catalysts** (`/catalysts/past`)
- [ ] **Catalyst Alerts** (`/catalysts/alerts`)
- [ ] **Readout Timeline** (`/trials/readouts`)
- [ ] **Enrollment Heatmap** (`/trials/enrollment`)
- [ ] **Company Profiles** (`/companies`)
- [ ] **Therapeutics Directory** (`/companies/therapeutics`)
- [ ] **Pipeline Maps** (`/companies/pipelines`)
- [ ] **Landscape Matrix** (`/competitors/matrix`)
- [ ] **Share-of-Voice** (`/competitors/voice`)
- [ ] **Regional Burden Maps** (`/epidemiology/regional`)
- [ ] **Cohort Builder** (`/epidemiology/cohorts`)
- [ ] **Sector Indices** (`/markets/sectors`)
- [ ] **Valuation Comps** (`/markets/valuations`)
- [ ] **Risk Factors** (`/markets/risks`)
- [ ] **Watchlist Manager** (`/portfolios/watchlists`)
- [ ] **Custom Baskets** (`/portfolios/baskets`)
- [ ] **Risk Metrics** (`/portfolios/risk`)
- [ ] **Compare Engine** (`/analytics/compare`)
- [ ] **Trend Detection** (`/analytics/trends`)
- [ ] **Scenario Models** (`/analytics/scenarios`)
- [ ] **Exports** (`/data/exports`)
- [ ] **Data Freshness** (`/data/freshness`)
- [ ] **Command Palette** (`/tools/command`)
- [ ] **Manual Refresh** (`/tools/refresh`)
- [ ] **Keyboard Shortcuts** (`/tools/shortcuts`)
- [ ] **Theme Toggle** (`/tools/theme`)
- [ ] **Preferences** (`/settings`)
- [ ] **API Keys** (`/settings/api`)
- [ ] **Permissions** (`/settings/permissions`)

Each placeholder should:
- [ ] Display page title
- [ ] Show "Under Construction" or similar message
- [ ] Maintain consistent styling with rest of app
- [ ] Allow navigation back to other pages

#### Manual Refresh System
- [ ] **Refresh Button Visible**: Top-right of AuroraTopBar
- [ ] **Refresh Icon**: Rotating circle icon present
- [ ] **Dropdown Opens**: Click reveals source options
- [ ] **Source Options**: news, trials, catalysts, all available
- [ ] **API Call**: POST to `/api/v1/admin/ingest` executes
- [ ] **Loading State**: Button shows loading animation during refresh
- [ ] **Toast Notification**: Success/error toast appears
- [ ] **Toast Message**: Shows number of records inserted/updated
- [ ] **Error Handling**: Graceful error message if refresh fails
- [ ] **Data Updates**: UI reflects new data after refresh
- [ ] **Audit Log Entry**: Refresh logged in Data Provenance page

---

### Desktop Visual & Design Testing

#### Theme System
Test all 5 themes render correctly:
- [ ] **Amber Theme** (default): `data-theme="amber"`
- [ ] **Green Theme**: `data-theme="green"`
- [ ] **Cyan Theme**: `data-theme="cyan"`
- [ ] **Purple Theme**: `data-theme="purple"`
- [ ] **Blue Theme**: `data-theme="blue"`

For each theme verify:
- [ ] Accent color changes throughout app
- [ ] Button colors update
- [ ] Link colors update
- [ ] Badge colors appropriate
- [ ] Chart colors harmonize
- [ ] Contrast ratios maintained (WCAG AAA)

#### Color-Blind Modes
- [ ] **Deuteranopia Mode**: `data-cvd="deuteranopia"` works
- [ ] **Protanomaly Mode**: `data-cvd="protanomaly"` works
- [ ] Color-blind modes maintain information clarity
- [ ] No information lost due to color changes

#### Typography
- [ ] **Font Family**: Monospace font (JetBrains Mono or fallback) loads
- [ ] **Font Sizes**: All text sizes readable (minimum 12px)
- [ ] **Line Heights**: Proper spacing for readability
- [ ] **Font Weights**: Bold/regular weights display correctly
- [ ] **Letter Spacing**: Appropriate tracking for density
- [ ] **Text Colors**: High contrast on all backgrounds
- [ ] **Links**: Underlined or clearly distinguishable

#### Layout & Spacing
- [ ] **Grid System**: 8px grid system consistently applied
- [ ] **Padding**: Consistent padding within components
- [ ] **Margins**: Appropriate spacing between components
- [ ] **Alignment**: All elements properly aligned
- [ ] **Whitespace**: Sufficient breathing room, not too dense
- [ ] **Containers**: Max-width containers center content properly

#### Glass Morphism Effects
- [ ] **AuroraTopBar**: Glass blur effect renders
- [ ] **Panels**: Glass panels have backdrop-filter blur
- [ ] **Modals**: Modals have frosted glass appearance
- [ ] **Transparency**: Appropriate opacity levels
- [ ] **Layering**: Proper z-index layering
- [ ] **Performance**: Glass effects don't cause lag

#### Corner Brackets (Terminal Aesthetic)
- [ ] **Panel Corners**: Corner brackets display on panels with `cornerBrackets` prop
- [ ] **Bracket Style**: Sharp, 90-degree brackets
- [ ] **Bracket Color**: Matches accent theme
- [ ] **Bracket Positioning**: Correct corner placement

---

### Desktop Performance Testing

#### Page Load Performance
Test in Chrome DevTools Performance tab:
- [ ] **Initial Load**: Time to Interactive <2s
- [ ] **First Contentful Paint**: <1s
- [ ] **Largest Contentful Paint**: <2.5s
- [ ] **Cumulative Layout Shift**: <0.1
- [ ] **Total Blocking Time**: <300ms

#### Navigation Performance
- [ ] **Page Transitions**: <500ms between routes
- [ ] **Search Results**: <100ms to display filtered results
- [ ] **Chart Rendering**: <1s for complex visualizations
- [ ] **Table Rendering**: <500ms for large tables
- [ ] **Scroll Performance**: Maintains 60fps during scroll

#### Resource Usage
- [ ] **JavaScript Bundle**: <500KB compressed
- [ ] **CSS Bundle**: <100KB compressed
- [ ] **Images**: Optimized (WebP if supported)
- [ ] **Memory Usage**: No memory leaks after 30min session
- [ ] **Network Requests**: Minimized, batched where possible

#### Lighthouse Audit
Run Lighthouse in Chrome DevTools:
- [ ] **Performance**: Score >90
- [ ] **Accessibility**: Score >90
- [ ] **Best Practices**: Score >90
- [ ] **SEO**: Score >80 (if applicable)

---

### Desktop Accessibility Testing

#### Keyboard Navigation
- [ ] **Tab Order**: Logical tab order through all interactive elements
- [ ] **Focus Indicators**: Visible focus rings/outlines
- [ ] **Keyboard Shortcuts**: Cmd+K, Cmd+R, etc. work
- [ ] **Skip Links**: "Skip to main content" link present
- [ ] **Trapped Focus**: Modals trap focus until dismissed
- [ ] **Escape Key**: Closes modals, dropdowns, search

#### Screen Reader Testing
Test with NVDA (Windows) or VoiceOver (Mac):
- [ ] **Headings**: Proper heading hierarchy (h1, h2, h3)
- [ ] **ARIA Labels**: All interactive elements have labels
- [ ] **ARIA Roles**: Appropriate roles (button, link, navigation)
- [ ] **Form Labels**: All inputs have associated labels
- [ ] **Alt Text**: All images have descriptive alt text
- [ ] **Live Regions**: Dynamic content announcements (toasts, alerts)
- [ ] **Landmarks**: Main, navigation, footer landmarks defined

#### Color Contrast
Use axe DevTools or WAVE extension:
- [ ] **Text on Background**: Minimum 7:1 ratio (WCAG AAA)
- [ ] **Links**: Distinguishable from surrounding text
- [ ] **Buttons**: Sufficient contrast against background
- [ ] **Icons**: Contrast meets standards or has text labels
- [ ] **Error Messages**: High contrast, clear visibility

#### Text Scaling
- [ ] **200% Zoom**: Page remains usable at 200% browser zoom
- [ ] **No Horizontal Scroll**: At 200% zoom, no horizontal scrolling
- [ ] **No Overlapping**: Text doesn't overlap at increased sizes
- [ ] **Layout Intact**: Layout doesn't break at large text sizes

---

### Desktop Cross-Browser Testing

#### Chrome (Latest)
- [ ] All features functional
- [ ] Visuals render correctly
- [ ] Performance meets targets
- [ ] No console errors

#### Firefox (Latest)
- [ ] All features functional
- [ ] Glass effects render (or graceful degradation)
- [ ] Keyboard shortcuts work
- [ ] No console errors

#### Safari (Latest - macOS)
- [ ] All features functional
- [ ] WebKit-specific CSS works
- [ ] Animations smooth
- [ ] No console errors

#### Edge (Latest)
- [ ] All features functional
- [ ] Identical to Chrome (Chromium-based)
- [ ] No Edge-specific bugs

---

## 📱 Mobile Testing Checklist

### Environment Setup

#### Devices to Test
**Physical Devices** (preferred):
- [ ] iPhone SE (375x667) - smallest modern iPhone
- [ ] iPhone 13/14 (390x844) - standard size
- [ ] iPhone 13/14 Pro Max (428x926) - largest
- [ ] iPad (768x1024) - tablet size

**Browser Simulators** (if physical unavailable):
- [ ] Safari iOS Simulator (Xcode)
- [ ] Chrome DevTools Device Mode
- [ ] BrowserStack / Sauce Labs

#### Browsers to Test
- [ ] Safari iOS (native)
- [ ] Chrome iOS

#### Orientations
- [ ] Portrait (primary)
- [ ] Landscape (verify graceful handling)

---

### Mobile Functional Testing

#### Navigation & Layout
- [ ] **Mobile Header**: Displays with menu button, brand, refresh button
- [ ] **Header Fixed**: Header stays at top during scroll
- [ ] **Aurora Background**: Aurora gradient background renders
- [ ] **Safe Area**: Content respects safe area insets (notch, home indicator)
- [ ] **Hamburger Menu**: Tap opens navigation drawer
- [ ] **Drawer Animation**: Smooth slide-in animation
- [ ] **Drawer Width**: Appropriate width (80%, max 320px)
- [ ] **Drawer Sections**: All navigation sections listed
- [ ] **Drawer Navigation**: Tap section navigates and closes drawer
- [ ] **Drawer Backdrop**: Tap backdrop closes drawer
- [ ] **Close Button**: X button closes drawer
- [ ] **Bottom Tab Bar**: Fixed at bottom with correct active state
- [ ] **Bottom Tab Icons**: Icons represent sections appropriately
- [ ] **Bottom Tab Labels**: Labels clear and readable
- [ ] **Tab Navigation**: Tap tab navigates to correct page

#### Mobile Dashboard Page (`/dashboard`)
- [ ] **Loads Successfully**: Dashboard renders on mobile
- [ ] **Mobile Layout**: Optimized for vertical scrolling
- [ ] **Touch Targets**: All tap targets minimum 44x44pt
- [ ] **Cards**: Dashboard cards stack vertically
- [ ] **Metrics**: Key metrics display clearly
- [ ] **Charts**: Charts scale to mobile width
- [ ] **Interactivity**: Tap cards to navigate (if applicable)

#### Mobile News Page (`/news`)
- [ ] **Loads Successfully**: News feed displays
- [ ] **Touch-Optimized Cards**: News cards larger, more padding
- [ ] **Sentiment Indicators**: Dots or badges display correctly
- [ ] **Scroll Performance**: Smooth scrolling, 60fps
- [ ] **Pull-to-Refresh**: Pull down refreshes news (if implemented)
- [ ] **Infinite Scroll**: Loads more articles as scroll (if implemented)
- [ ] **Article Tap**: Tap article to expand or view details
- [ ] **External Links**: Tap link opens in Safari/browser
- [ ] **Diff Ribbon**: Verify presence of "Since Last Refresh" ribbon
- [ ] **Touch Feedback**: Visual feedback on tap

#### Mobile Trials Page (`/trials`)
- [ ] **Loads Successfully**: Trial list displays
- [ ] **Trial Cards**: Mobile-optimized trial cards
- [ ] **Enrollment Progress**: Progress bars render correctly
- [ ] **Phase Badges**: Clear phase indicators
- [ ] **Single Column**: Cards stack in single column
- [ ] **Touch Targets**: All interactive elements tappable
- [ ] **Trial Details**: Tap card to expand or navigate
- [ ] **Scroll Performance**: Smooth scrolling

#### Mobile Pipeline Page (`/pipeline`)
- [ ] **Loads Successfully**: Pipeline view displays
- [ ] **Mobile Layout**: Optimized for touch interaction
- [ ] **Drug Cards**: Clear drug development cards
- [ ] **Phase Visualization**: Phase indicators mobile-friendly
- [ ] **Touch Interactions**: Tap to view details
- [ ] **Scroll Performance**: Smooth scrolling

#### Mobile Financial Page (`/financial`)
- [ ] **Loads Successfully**: Financial view displays
- [ ] **Metrics Display**: Financial metrics clear on mobile
- [ ] **Charts**: Charts scale to mobile, remain readable
- [ ] **Touch Zoom**: Pinch to zoom disabled (or appropriate)
- [ ] **Landscape Charts**: Charts adapt to landscape (if rotate allowed)

#### Mobile Intelligence Page (`/intelligence`)
- [ ] **Loads Successfully**: Market intelligence displays
- [ ] **Data Presentation**: Data clearly presented for mobile
- [ ] **Charts/Tables**: Optimized for mobile viewing
- [ ] **Touch Interactions**: All interactions touch-friendly

#### Mobile Refresh System
- [ ] **Refresh Button Visible**: Top-right of mobile header
- [ ] **Refresh Icon**: Rotating icon or appropriate indicator
- [ ] **Tap Area**: Large enough for easy tapping (44x44pt)
- [ ] **Animation**: Rotation animation during refresh
- [ ] **API Call**: POST to backend API executes
- [ ] **Feedback**: Toast, alert, or other feedback shown
- [ ] **Success State**: Clear indication of successful refresh
- [ ] **Error State**: Clear error message if fails
- [ ] **Loading State**: Button disabled during refresh

---

### Mobile Visual & Design Testing

#### iOS Design System
- [ ] **SF Pro Display**: Font loads or fallback appropriate
- [ ] **System Colors**: iOS system colors used (Blue, Green, etc.)
- [ ] **Glass UI**: Glass morphism effects render smoothly
- [ ] **Blur Intensity**: Appropriate for mobile (16px or less)
- [ ] **Aurora Gradients**: Smooth gradient backgrounds
- [ ] **Transparency**: Proper layering of transparent elements

#### Touch Targets & Spacing
- [ ] **Minimum Size**: All tap targets ≥44x44pt
- [ ] **Spacing**: Sufficient space between interactive elements
- [ ] **Thumb Zone**: Important actions within thumb reach (bottom)
- [ ] **Edge Cases**: Elements not too close to screen edges
- [ ] **Padding**: Comfortable padding for touch (1.25rem+)

#### Typography on Mobile
- [ ] **Readable Sizes**: Text minimum 14px (preferably 16px)
- [ ] **Line Length**: Optimal line length (50-75 characters)
- [ ] **Line Height**: Adequate line height for readability (1.5+)
- [ ] **Dynamic Type**: Respects iOS text size settings (if supported)
- [ ] **Font Weights**: Appropriate weights for hierarchy

#### Responsive Images
- [ ] **Proper Sizing**: Images scale to fit screen width
- [ ] **Aspect Ratios**: Images maintain correct aspect ratios
- [ ] **Loading**: Images lazy load for performance
- [ ] **Quality**: High DPI images for Retina displays

---

### Mobile Performance Testing

#### Load Performance
Test on physical device with Network tab:
- [ ] **Initial Load**: Time to Interactive <3s on 4G
- [ ] **First Contentful Paint**: <2s
- [ ] **Smooth Animations**: 60fps for all animations
- [ ] **No Jank**: No stuttering or frame drops

#### Touch Response
- [ ] **Tap Delay**: <100ms from tap to visual feedback
- [ ] **Scroll Start**: Scroll starts immediately on swipe
- [ ] **Momentum Scroll**: Natural momentum scrolling
- [ ] **Overscroll**: Bounce effect on iOS (if appropriate)

#### Resource Usage
- [ ] **Bundle Size**: Minimized for mobile (consider code splitting)
- [ ] **Image Sizes**: Appropriate sizes for mobile screens
- [ ] **Network Usage**: Minimize data transfer
- [ ] **Battery Impact**: No excessive battery drain

#### Safari iOS Performance
Use Safari Web Inspector (connected to Mac):
- [ ] **No Layout Thrashing**: Minimize forced reflows
- [ ] **GPU Acceleration**: Animations use GPU where appropriate
- [ ] **Memory Usage**: No memory leaks
- [ ] **Responsiveness**: Maintains 60fps

---

### Mobile Touch & Gesture Testing

#### Basic Touch Interactions
- [ ] **Tap**: Single tap actions work reliably
- [ ] **Double Tap**: Double tap works where implemented
- [ ] **Long Press**: Long press shows context menu (if implemented)
- [ ] **Swipe**: Swipe gestures work (if implemented)
  - [ ] Swipe to delete
  - [ ] Swipe to favorite
  - [ ] Swipe to navigate

#### Scroll Behaviors
- [ ] **Vertical Scroll**: Smooth vertical scrolling
- [ ] **Horizontal Scroll**: Horizontal scroll works where needed
- [ ] **Scroll Lock**: Content doesn't scroll behind modals
- [ ] **Overscroll**: Proper overscroll behavior (bounce on iOS)
- [ ] **Pull-to-Refresh**: Pull-to-refresh works (if implemented)

#### Form Interactions
- [ ] **Input Focus**: Tap focuses input field
- [ ] **Keyboard Opens**: Keyboard slides up smoothly
- [ ] **Input Visible**: Input remains visible above keyboard
- [ ] **Keyboard Type**: Correct keyboard (numeric, email, etc.)
- [ ] **Done/Go Button**: Keyboard action button appropriate

---

### Mobile Accessibility Testing

#### VoiceOver (iOS)
Enable VoiceOver in iOS Settings:
- [ ] **Navigation**: Can navigate with VoiceOver gestures
- [ ] **Labels**: All elements have descriptive labels
- [ ] **Buttons**: Buttons announce as "button"
- [ ] **Links**: Links announce as "link"
- [ ] **Images**: Images have alt text
- [ ] **Forms**: Form inputs properly labeled
- [ ] **Rotor**: Rotor navigation works (headings, links, etc.)

#### Dynamic Type
Enable larger text sizes in iOS Settings:
- [ ] **Text Scales**: All text scales with Dynamic Type
- [ ] **Layout Adapts**: Layout adjusts for larger text
- [ ] **No Truncation**: Text doesn't get cut off
- [ ] **Readable**: Remains readable at largest size

#### Reduced Motion
Enable Reduce Motion in iOS Settings:
- [ ] **Animations Disabled**: Respects reduced motion preference
- [ ] **Transitions**: Simpler transitions used
- [ ] **Functionality Intact**: All features still work

#### Color Contrast (Mobile)
- [ ] **High Contrast**: All text meets WCAG AAA on mobile screens
- [ ] **Outdoor Visibility**: Readable in bright sunlight
- [ ] **Dark Mode**: Works well in dark environments

---

### Mobile Device-Specific Testing

#### iPhone SE (375px width)
- [ ] All content fits without horizontal scroll
- [ ] No text truncation or overlapping
- [ ] Touch targets remain 44x44pt
- [ ] Navigation functional
- [ ] Performance acceptable

#### iPhone 13/14 (390px width)
- [ ] Optimal layout and spacing
- [ ] All features accessible
- [ ] Performance excellent
- [ ] Safe area handling correct

#### iPhone 13/14 Pro Max (428px width)
- [ ] Utilizes extra space appropriately
- [ ] Doesn't feel too spacious or empty
- [ ] All features scale properly
- [ ] Performance excellent

#### iPad (768px width)
- [ ] Either mobile layout or desktop layout
- [ ] If mobile: layout scales appropriately
- [ ] If desktop: works like desktop version
- [ ] Touch targets appropriate for tablet

---

## 🔄 Cross-Platform Consistency Testing

### Data Consistency
- [ ] **News Articles**: Same articles on desktop and mobile
- [ ] **Sentiment Scores**: Identical sentiment values
- [ ] **Clinical Trials**: Same trial data across platforms
- [ ] **Enrollment %**: Matching enrollment percentages
- [ ] **Financial Metrics**: Identical financial data
- [ ] **Pipeline Data**: Same drug pipeline information
- [ ] **Timestamps**: Consistent time displays

### Feature Behavior Consistency
- [ ] **Refresh**: Both platforms fetch same data on refresh
- [ ] **Search**: Same search results (if both have search)
- [ ] **Filters**: Same filtering logic across platforms
- [ ] **Sorting**: Same sorting behavior
- [ ] **Navigation**: Equivalent navigation paths

### Visual Consistency
- [ ] **Branding**: Aurora Terminal name and logo consistent
- [ ] **Color Themes**: Same themes available (adapted per platform)
- [ ] **Icons**: Same icons for same actions
- [ ] **Status Indicators**: Consistent semantics (success/warning/error)
- [ ] **Typography**: Similar hierarchy (adjusted for platform norms)

### Interaction Consistency
- [ ] **Feedback**: Similar feedback patterns (toasts, loading states)
- [ ] **Error Messages**: Consistent error communication
- [ ] **Success States**: Similar success confirmations
- [ ] **Loading States**: Comparable loading indicators

---

## 🧪 Integration & End-to-End Testing

### End-to-End User Flows

#### Flow 1: News Discovery Journey
**Desktop**:
1. [ ] User lands on dashboard
2. [ ] Clicks News in mega-menu
3. [ ] Views news feed with articles
4. [ ] Filters to last 24 hours
5. [ ] Clicks article to read
6. [ ] Clicks external link (opens new tab)
7. [ ] Clicks refresh to get latest
8. [ ] Sees new articles with toast notification

**Mobile**:
1. [ ] User opens app to dashboard
2. [ ] Taps News in bottom tab bar
3. [ ] Scrolls through news cards
4. [ ] Taps article for details
5. [ ] Taps external link (opens Safari)
6. [ ] Taps refresh button in header
7. [ ] Sees updated news

**Consistency Check**:
- [ ] Same news articles on both platforms
- [ ] Same external links work
- [ ] Refresh brings same new data

---

#### Flow 2: Clinical Trial Research
**Desktop**:
1. [ ] Navigate to Trials page
2. [ ] View list of clinical trials
3. [ ] Search for specific trial by name
4. [ ] Click trial to view details
5. [ ] Check enrollment progress bar
6. [ ] Note phase and completion date
7. [ ] Access external trial registry link

**Mobile**:
1. [ ] Tap Trials in bottom navigation
2. [ ] Scroll through trial cards
3. [ ] Tap trial card for details
4. [ ] View enrollment progress
5. [ ] Note phase badge
6. [ ] Tap to open trial registry

**Consistency Check**:
- [ ] Same trials appear on both
- [ ] Enrollment percentages match
- [ ] Phase information identical

---

#### Flow 3: Data Refresh & Verification
**Desktop**:
1. [ ] Note current timestamp on data
2. [ ] Click refresh button in topbar
3. [ ] Select "all" from dropdown
4. [ ] Wait for refresh to complete
5. [ ] See toast notification with success message
6. [ ] Navigate to Audit Log page
7. [ ] Verify ingestion logged with timestamp
8. [ ] Export audit log to CSV
9. [ ] Return to News/Trials and verify new data

**Mobile**:
1. [ ] Note current data state
2. [ ] Tap refresh button in header
3. [ ] See loading animation
4. [ ] Receive feedback (toast or alert)
5. [ ] Verify data updated

**Consistency Check**:
- [ ] Both hit same API endpoint
- [ ] Both receive new data
- [ ] Audit log shows both sources (if tracked)

---

### API Integration Testing
- [ ] **Backend Running**: Python FastAPI on port 8000
- [ ] **API Health**: `/health` endpoint returns 200
- [ ] **News Endpoint**: `/api/v1/news/latest` returns data
- [ ] **Trials Endpoint**: `/api/v1/trials` returns data
- [ ] **Catalysts Endpoint**: `/api/v1/catalysts/calendar` returns data
- [ ] **Refresh Endpoint**: `/api/v1/admin/ingest` accepts POST
- [ ] **Error Handling**: API returns appropriate error codes (4xx, 5xx)
- [ ] **CORS**: Cross-origin requests allowed from frontend domains

### Backend Functionality
- [ ] **Database Connects**: SQLite/PostgreSQL connection successful
- [ ] **Data Seeding**: Seed data populates correctly
- [ ] **Manual Refresh**: Data ingestion works on demand
- [ ] **No Auto-Refresh**: Confirm no background jobs/cron running
- [ ] **Audit Logging**: All ingestions logged in database

---

## 📊 Test Reporting Template

```markdown
## Test Execution Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Dev / Staging / Production]
**Platform**: [Desktop / Mobile / Both]

### Summary
- Total Tests: [X]
- Passed: [X]
- Failed: [X]
- Blocked: [X]
- Pass Rate: [X]%

### Critical Issues Found
1. **Issue Title**
   - Severity: Critical
   - Platform: [Desktop / Mobile]
   - Description: [Details]
   - Steps to Reproduce:
     1. Step 1
     2. Step 2
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]
   - Screenshot: [Link or attachment]

### Medium/Low Issues Found
[Same format as above]

### Performance Metrics
- Desktop Load Time: [X]s
- Mobile Load Time: [X]s
- Time to Interactive: [X]s
- Lighthouse Score: [X]/100

### Accessibility Findings
- Keyboard Navigation: [Pass/Fail]
- Screen Reader: [Pass/Fail]
- Color Contrast: [Pass/Fail]
- WCAG Compliance: [AA / AAA]

### Browser/Device Compatibility
- Chrome Desktop: ✅ Pass
- Firefox Desktop: ✅ Pass
- Safari iOS: ⚠️ Minor issue (details below)
...

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

### Test Evidence
- Screenshots: [Links]
- Videos: [Links]
- Logs: [Links]

**Sign-off**: [Name]
**Date**: [Date]
```

---

## 🚀 Automated Testing Recommendations

### Unit Tests
- [ ] Component tests with Vitest
- [ ] API endpoint tests with pytest
- [ ] Utility function tests
- [ ] Hook tests (React hooks)

### Integration Tests
- [ ] Page load tests
- [ ] Navigation flow tests
- [ ] API integration tests
- [ ] Data flow tests

### End-to-End Tests (Future)
- [ ] Playwright for critical user flows
- [ ] Mobile gesture testing (Appium)
- [ ] Cross-browser E2E (BrowserStack)
- [ ] Visual regression tests (Percy, Chromatic)

### Continuous Testing
- [ ] Run tests on every commit (GitHub Actions)
- [ ] Run tests on pull requests
- [ ] Automated lighthouse audits
- [ ] Automated accessibility scans

---

## 🔧 Testing Tools & Resources

### Desktop Testing Tools
- **Chrome DevTools**: Performance, Network, Accessibility
- **Firefox Developer Tools**: Similar to Chrome
- **Safari Web Inspector**: macOS/iOS testing
- **Lighthouse**: Performance and accessibility audits
- **axe DevTools**: Accessibility testing extension
- **WAVE**: Web accessibility evaluation tool
- **React DevTools**: Component inspection

### Mobile Testing Tools
- **Safari Web Inspector**: Connect iOS device to Mac
- **Chrome Remote Debugging**: Connect Android device
- **Xcode Simulator**: iOS device simulation
- **BrowserStack**: Real device cloud testing
- **Charles Proxy**: Network traffic inspection

### Performance Tools
- **WebPageTest**: Detailed performance analysis
- **GTmetrix**: Performance and optimization suggestions
- **Pingdom**: Speed test from multiple locations

### Accessibility Tools
- **NVDA**: Free screen reader (Windows)
- **JAWS**: Commercial screen reader (Windows)
- **VoiceOver**: Built-in screen reader (macOS/iOS)
- **Color Contrast Analyzer**: Check contrast ratios

---

## ✅ Quality Gates

### Before Merging to Main
- [ ] All critical tests pass
- [ ] No accessibility violations
- [ ] Performance benchmarks met
- [ ] Cross-browser testing complete
- [ ] Mobile testing complete
- [ ] Code review approved
- [ ] Documentation updated

### Before Production Deploy
- [ ] Full regression test suite pass
- [ ] Staging environment verified
- [ ] Performance tested under load
- [ ] Security scan complete
- [ ] Rollback plan in place
- [ ] Monitoring and alerts configured

---

**Document Status**: ✅ Complete  
**Owner**: QA Team  
**Last Updated**: October 2025  
**Next Review**: After each major feature release
