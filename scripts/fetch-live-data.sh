#!/bin/bash
# Fetch live biotech data using Python scraper
# This script runs the Python scraper to collect real-time data from free sources

set -e

echo "🚀 Fetching live biotech data from free sources..."
echo "📊 Data Sources:"
echo "   - Yahoo Finance (market data, prices, analyst ratings)"
echo "   - ClinicalTrials.gov (clinical trials)"
echo "   - FDA.gov (drug approvals, PDUFA dates)"
echo "   - SEC EDGAR (insider trading)"
echo ""

# Navigate to Python scrapers directory
cd "$(dirname "$0")/../backend/python-scrapers"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d ".venv" ]; then
    echo "📦 Installing Python dependencies..."
    python3 -m pip install -r requirements.txt --quiet
fi

# Run the scraper
echo "🔄 Running biotech data scraper..."
python3 biotech_scraper.py

# Check if data file was created
if [ -f "live_biotech_data.json" ]; then
    # Move to root directory for backend consumption
    mv live_biotech_data.json ../../live_biotech_data.json
    echo "✅ Live data collected successfully!"
    echo "📁 Data saved to: live_biotech_data.json"
    echo ""
    echo "💡 To view the data:"
    echo "   cat live_biotech_data.json | jq '.summary'"
    echo ""
    echo "🔌 Backend APIs will now serve this live data"
else
    echo "❌ Failed to generate live data"
    exit 1
fi
