#!/bin/bash
# Scraper convenience script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
SOURCE=""
SINCE="7d"
LIMIT="50"
DRY_RUN=""
SAVE_FIXTURE=""
URL=""

# Help message
show_help() {
    cat << EOF
Biotech Terminal Scraper Script

Usage: $0 [OPTIONS]

Options:
    -s, --source SOURCE      Source to scrape (required)
                            fierce, fda, businesswire, etc.
    -t, --since TIME        Time window (default: 7d)
                            Examples: 1d, 7d, 2w, 30d, 2024-01-01
    -l, --limit NUMBER      Maximum items to scrape (default: 50)
    -d, --dry-run          Don't write to database
    -f, --save-fixture     Save fixtures for testing
    -u, --url URL          Scrape specific URL
    -h, --help             Show this help

Examples:
    # Scrape FierceBiotech (last 7 days, max 50 items)
    $0 --source fierce

    # Scrape FDA with fixtures
    $0 --source fda --save-fixture --limit 10

    # Dry run BusinessWire
    $0 --source businesswire --dry-run

    # Scrape specific URL
    $0 --source fierce --url https://www.fiercebiotech.com/...

Available sources:
    News:        fierce, businesswire, globenewswire, prnewswire
    Regulators:  fda, ema, mhra
    Registries:  clinicaltrials
    Exchanges:   edgar
    Companies:   company:<slug>
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--source)
            SOURCE="$2"
            shift 2
            ;;
        -t|--since)
            SINCE="$2"
            shift 2
            ;;
        -l|--limit)
            LIMIT="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN="--dry-run"
            shift
            ;;
        -f|--save-fixture)
            SAVE_FIXTURE="--save-fixture"
            shift
            ;;
        -u|--url)
            URL="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Validate source
if [ -z "$SOURCE" ]; then
    echo -e "${RED}Error: --source is required${NC}"
    show_help
    exit 1
fi

# Build command
CMD="python -m platform.cli.scrape --source $SOURCE"

if [ -n "$SINCE" ]; then
    CMD="$CMD --since $SINCE"
fi

if [ -n "$LIMIT" ]; then
    CMD="$CMD --limit $LIMIT"
fi

if [ -n "$DRY_RUN" ]; then
    CMD="$CMD $DRY_RUN"
fi

if [ -n "$SAVE_FIXTURE" ]; then
    CMD="$CMD $SAVE_FIXTURE"
fi

if [ -n "$URL" ]; then
    CMD="$CMD --url $URL"
fi

# Run scraper
echo -e "${GREEN}🔍 Running scraper...${NC}"
echo -e "${YELLOW}Command: $CMD${NC}"
echo ""

eval $CMD

echo ""
echo -e "${GREEN}✅ Done!${NC}"
