# Biotech Terminal Preview

This repository is now organized around an offline-friendly preview for both desktop and mobile builds. The desktop terminal loads curated preview data, so you can explore the UI without wiring up Python/Node services.

## Run the desktop preview (PC)
```bash
npm install
npm run dev:terminal
```
Open http://localhost:3000 to use the streamlined routes:
- **/** – overview dashboard
- **/news** – biotech headline stream (static preview)
- **/trials** – curated trials timeline
- **/catalysts** – catalyst calendar with expectations
- **/financials** – sample valuation workspace
- **/evidence** – evidence journal
- **/3d** – molecule canvas

## Run the mobile preview
```bash
npm install
npm run dev:mobile
```
Open http://localhost:3002 on your device or emulator to view the mobile terminal shell with pull-to-refresh and haptics.

## What changed
- Desktop routes are trimmed to preview-ready surfaces only.
- All critical pages now ship with preloaded data (no backend required).
- Navigation, status banner, and refresh controls clearly indicate preview mode.
