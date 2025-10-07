#!/bin/bash
# TUI Manual Test Script
# Run this to manually test all TUI features

echo "======================================"
echo "Biotech Terminal TUI - Manual Test"
echo "======================================"
echo ""
echo "This script will guide you through testing the TUI."
echo ""
echo "The TUI will launch with the following test sequence:"
echo ""
echo "1. View onboarding panel (auto-shown on launch)"
echo "2. Commands to test:"
echo "   - help (show onboarding again)"
echo "   - view BCRX-001 (view asset with risk metrics)"
echo "   - watch BCRX-001 (add to watchlist)"
echo "   - watch SRPT-001 (add another)"
echo "   - watchlist (show all watched)"
echo "   - view NTLA-001 (test recent assets tracking)"
echo "   - refresh (test data refresh)"
echo "   - unwatch BCRX-001 (remove from watchlist)"
echo "   - quit (exit)"
echo ""
echo "Press Enter to launch the TUI..."
read

# Launch the TUI
cd /home/runner/work/terminal-ui-biotech-GG/terminal-ui-biotech-GG
PYTHONPATH=/home/runner/work/terminal-ui-biotech-GG/terminal-ui-biotech-GG python3 -m platform.tui
