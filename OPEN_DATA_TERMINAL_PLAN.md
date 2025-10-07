# Open Data Terminal Integration Blueprint

## 1. Avalonia Shell Wiring

| Legacy Surface (`ui_black_biotech`) | React Component | Notes |
| --- | --- | --- |
| Terminal Frame & Gradient Backdrop | `TerminalFrame` (`src/features/home/components/TerminalFrame`) | Wraps the glass layout, exposes `headline`, optional `watchlistSlot`, and renders all feature cards. Avalonia only needs to host `<TerminalHome />`. |
| Watchlist Ribbon | `WatchlistPanel` (`src/features/home/components/WatchlistPanel`) | Accepts an array of `{ symbol, label, price, change, changeState }`. Routed into the frame via `watchlistSlot`. |
| Stage Mix Heatmap | `StageMixCard` (`src/features/home/components/StageMixCard`) | Renders gradient cells + stat tiles. Takes `StageMetric[]` and `StatMetric[]`. Optional `onAction` can route to analytics module. |
| Command Palette Buttons | `QuickActions` (internal to `TerminalHome`) | Emits `onNavigate(module)` or opens external links. Avalonia should forward `terminal:navigate` payloads when hosting inside WebView. |
| Catalyst Screener Table | `Screener` (internal to `TerminalHome`) | Still consumes the default screener rows; ready for live data replacement. |
| Regulatory + Ops Tiles | `Regulatory` & `Resources` (internal) | No API change; cards remain self-contained glass panels. |
| Runway Metrics | Runway card (`TerminalHome` inline) | Uses `TrendValue` helper for delta coloring; expects downstream data hook. |

### Mount Contract

```tsx
import { TerminalHome } from '@biotech-terminal/frontend-components';

<TerminalHome
  data={{
    headline,
    watchlist,
    stageMix,
    stats,
    screener,
    regulatory,
    resources,
  }}
  onNavigate={(module) => bridge.invoke('navigation', module)}
  onOpenLink={(href) => bridge.invoke('openLink', href)}
/>
```

- `onNavigate` should dispatch into Avalonia's command bus (e.g., `bridge.invoke` above).
- `onOpenLink` defaults to `window.open`; override it to use Avalonia's browser launcher.
- When neither callback is supplied, the component sends `terminal:navigate` via `window.parent.postMessage` and `chrome.webview.postMessage`, matching the previous host integration.

## 2. UI Data Contracts

| Dataset | Shape | Source Plan |
| --- | --- | --- |
| Watchlist | `WatchlistRow[]` | DuckDB parity view fed by `market_snapshots` parquet (Step 4). |
| Stage Mix | `StageMetric[]` | Aggregated pipeline counts grouped by clinical stage. |
| Stage Stats | `StatMetric[]` | Derived analytics (velocity, runway, risk). |
| Screener | `ScreenerRow[]` | Mapped from catalyst scoring engine (`awesome-quant` pipeline). |
| Regulatory | `RegulatoryItem[]` | FDA/EMA event ingest (see ingestion scaffold). |
| Resources | `ResourceLink[]` | Local markdown manifest or CMS feed. |

All datasets remain optional; the component backfills them with `DEFAULT_HOME_DATA` for local previews.

## 3. Licensing & Attribution Tracking

- **UI Library:** MIT (this repository); ensure downstream Avalonia distribution retains LICENSE.
- **Data Sources (planned):**
  - FDA / EMA updates: public domain, cite source + timestamp.
  - OpenBB market data: abide by OpenBB API terms; cache in DuckDB with attribution banner.
  - ClinicalTrials.gov: public domain, include `ClinicalTrials.gov Identifier` in UI.
  - Company fundamentals: confirm licensing if sourced via OpenBB or alternative feeds.
- Document new feeds inside this file as they are wired. Add a bullet under “Data Sources” with the API endpoint and relevant rate/usage limits.

## 4. Next UI Actions

1. Replace placeholder data with live selectors once ingestion views exist.
2. Add responsive snapshots (≤768px) to ensure Avalonia shell mobile embeds render correctly.
3. Introduce theming tokens so Avalonia can toggle between dark/black glass palettes without React rebuilds.

See Section 5 (Ingestion Scaffold) for backend tasks. Update this document as new components or data flows come online.
