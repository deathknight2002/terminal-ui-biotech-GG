# Company Profile Feature - User Guide

## Overview

The Company Profile feature provides comprehensive information about biotech companies, with special focus on XBI (SPDR S&P Biotech ETF) constituents. Access detailed company data, pipeline information, catalysts, news, and institutional ownership all in one place.

## Accessing Company Profiles

### Method 1: Direct URL
Navigate directly to a company profile using the ticker:
```
https://your-terminal.com/companies/VRTX
https://your-terminal.com/companies/BMRN
https://your-terminal.com/companies/REGN
```

### Method 2: Global Search
1. Click the search bar at the top of the terminal
2. Type a company name or ticker (e.g., "Vertex" or "VRTX")
3. Select the company from the results
4. You'll be taken directly to the company profile

### Method 3: Navigation Links
Company profiles can be accessed from:
- Dashboard company cards
- Pipeline view company names
- Catalyst company links
- Article company mentions
- Competitor analysis sections

## Profile Layout

### Header Section
The profile header displays:
- **Ticker Symbol**: Large, prominent ticker (e.g., VRTX)
- **Company Name**: Full company name (e.g., Vertex Pharmaceuticals)
- **XBI Badge**: Shows if company is an XBI constituent
- **Quick Stats**: Key metrics at a glance
  - Current stock price
  - Market capitalization
  - Number of pipeline programs
  - Number of upcoming catalysts

### Tab Navigation
The profile is organized into 5 main tabs:

#### 1. OVERVIEW Tab
Shows:
- Company information (type, headquarters, founded, employees)
- Website and investor relations links
- Company description
- Recent news articles (last 5)
- Therapeutic areas focus

#### 2. PIPELINE Tab
Displays all drug development programs grouped by therapeutic area:
- Program name and generic name
- Development phase (color-coded)
- Indication/disease target
- Mechanism of action (MOA)
- Target molecule
- Current status

**Phase Color Coding:**
- Approved: Green
- Filed: Blue
- Phase III: Cyan
- Phase II: Purple
- Phase I: Amber
- Preclinical: Gray

#### 3. CATALYSTS Tab
Shows upcoming catalysts for the next 90 days:
- Event title and type
- Event date
- Associated drug
- Event description
- Probability of success (if available)
- Expected impact (High/Medium/Low)

#### 4. SOURCES Tab
Access to company materials:
- Investor presentations
- Press releases
- SEC filings (10-K, 10-Q, 8-K)
- IR materials

Each source shows:
- Document type
- Title
- Publication date
- Description
- Direct download link

#### 5. OWNERSHIP Tab
Institutional ownership details:
- Top 10-20 institutional holders
- Shares held
- Percentage of ownership
- Position value
- Recent changes (shares and percentage)
- Reporting date

**Color Coding:**
- Green: Increased position
- Red: Decreased position
- White: No change

## Mobile Experience

The Company Profile page is fully optimized for mobile:
- Responsive grid layouts
- Touch-friendly tabs and buttons
- Readable text sizes
- Efficient data density
- Collapsible sections

### Mobile Features
- Safe area support for notched devices
- Landscape and portrait orientation support
- Swipe-friendly tab navigation
- Reduced columns on small screens (ownership table shows 3 columns instead of 5)

## PWA Features

When installed as a Progressive Web App:
- Offline access to cached company data
- Home screen icon
- Fullscreen experience (no browser chrome)
- Fast loading with service worker caching

## Keyboard Shortcuts

- `Esc`: Close current view/return to previous page
- `Tab`: Navigate between interactive elements
- `←` / `→`: Switch between tabs (when focused)
- `Enter`: Activate selected button or link

## Data Refresh

Company profile data is updated:
- **Stock prices**: Real-time or 15-minute delay
- **News articles**: Daily
- **SEC filings**: Daily (as filed)
- **Ownership data**: Quarterly (13F filings)
- **Pipeline data**: As announced by companies
- **Catalysts**: Continuously updated

To manually refresh data, use the refresh button in the top bar of the terminal.

## Tips and Best Practices

### Finding Companies
- Use partial names in search (e.g., "Vert" will find Vertex)
- Ticker search is case-insensitive
- Search includes aliases and alternative names

### Navigating Large Pipelines
- Use the therapeutic area grouping to quickly find programs of interest
- Phase colors help identify development stage at a glance
- Click program names to see full details

### Tracking Catalysts
- Catalysts are sorted by date (nearest first)
- Use probability and impact to prioritize monitoring
- Link to source URLs for more detail

### Reading Ownership Changes
- Green/red indicators show recent position changes
- Compare reporting dates to understand timing
- Top holders are sorted by position size

### Mobile Navigation
- Use landscape mode for ownership table (more columns visible)
- Tab swipe navigation is fastest on mobile
- Long-press links for options (open in new tab, etc.)

## Common Use Cases

### Due Diligence Research
1. Start with Overview to understand the company
2. Check Pipeline for development stage diversity
3. Review Catalysts for near-term value drivers
4. Examine Ownership for institutional confidence
5. Read recent Sources for management perspective

### Catalyst Tracking
1. Navigate directly to Catalysts tab
2. Note event dates and types
3. Click source URLs for detailed event info
4. Cross-reference with Pipeline tab for drug details

### Pipeline Analysis
1. Go to Pipeline tab
2. Filter by therapeutic area (grouped automatically)
3. Compare phases and MOAs across programs
4. Check Sources tab for pipeline updates

### Competitive Intelligence
1. Compare multiple company profiles side-by-side
2. Note overlapping therapeutic areas
3. Compare pipeline phase distribution
4. Review ownership overlap between competitors

## Troubleshooting

### "Company not found" Error
- Verify ticker spelling
- Check if company is in database
- Try searching by full name instead
- Ensure company is publicly traded

### Missing Data Sections
- Some companies may have limited data available
- Ownership data requires 13F filings (quarterly)
- Pipeline data depends on company disclosure
- Sources require IR page scraping

### Slow Loading
- Check internet connection
- Some companies have large datasets
- First load may be slower (caching occurs)
- Try refreshing the page

### Mobile Display Issues
- Rotate device for better ownership table view
- Update to latest browser version
- Clear browser cache if styles appear broken
- Ensure JavaScript is enabled

## Future Enhancements

Upcoming features include:
- Side-by-side company comparison
- Custom catalyst alerts
- Financial modeling integration
- Conference presentation calendar
- Patent cliff analysis
- M&A probability scoring
- Executive team profiles
- Clinical trial enrollment tracking

## Feedback

To report issues or suggest improvements:
- File an issue on GitHub
- Contact support team
- Use in-app feedback button

---

**Last Updated**: October 2024
**Version**: 1.0.0
