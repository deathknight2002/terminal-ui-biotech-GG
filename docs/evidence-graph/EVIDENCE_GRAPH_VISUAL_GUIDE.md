# Visual Guide

## Page Anatomy
- Header: Title, counts, **REFRESH** button, last-updated.
- Body: Graph (left), Timeline (right).
- Alerts: Inline error bar (red), muted placeholders (gray).

## Colors
- Primary (button): `#2563eb` (blue - accessible on white).
- Neutral text: `#374151` / `#6b7280` / `#9ca3af`.
- Borders: `#e5e7eb`.
- Terminal theme: `#0f1419` background, `#e2e8f0` text.
- Orange accents: `#ed8936` for titles and active states.

## Motion
- REFRESH button pulse during loads.
- No gratuitous animations in graph beyond d3 forces.

## Accessibility
- Button `aria-busy`, `aria-label`.
- Status region `aria-live=polite`.
- Keyboard focus outline preserved.
- Keyboard shortcut: Press 'R' to refresh.

## States
- Empty: "Loading evidence graph..." with spinner.
- Loading: "⟳ LOADING..." button disabled.
- Error: Red error message with details.
- Timeline: Loads when thesis node is selected.

## Node Types
- **Thesis** (◆): Purple `#805ad5`
- **Trial** (●): Blue `#3182ce`
- **Catalyst** (★): Orange `#dd6b20`
- **KOL** (■): Green `#38a169`
- **Document** (■): Yellow `#d69e2e`
