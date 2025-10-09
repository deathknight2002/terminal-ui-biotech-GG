.PHONY: help scrape-fierce scrape-fda scrape-businesswire scrape-all scrape-fixtures scrape-url

help:
	@echo "Biotech Terminal - Scraper Targets"
	@echo ""
	@echo "Usage:"
	@echo "  make scrape-fierce          Scrape FierceBiotech (last 7 days)"
	@echo "  make scrape-fda             Scrape FDA news (last 7 days)"
	@echo "  make scrape-businesswire    Scrape BusinessWire (last 7 days)"
	@echo "  make scrape-all             Scrape all news sources"
	@echo "  make scrape-fixtures        Generate test fixtures (all sources, 5 items each)"
	@echo "  make scrape-url URL=...     Scrape specific URL"
	@echo ""
	@echo "Examples:"
	@echo "  make scrape-fierce"
	@echo "  make scrape-url URL=https://www.fiercebiotech.com/..."
	@echo ""

scrape-fierce:
	@echo "🔍 Scraping FierceBiotech..."
	@./scripts/scrape.sh --source fierce --since 7d --limit 50

scrape-fda:
	@echo "🔍 Scraping FDA..."
	@./scripts/scrape.sh --source fda --since 7d --limit 50

scrape-businesswire:
	@echo "🔍 Scraping BusinessWire..."
	@./scripts/scrape.sh --source businesswire --since 7d --limit 50

scrape-globenewswire:
	@echo "🔍 Scraping GlobeNewswire..."
	@./scripts/scrape.sh --source globenewswire --since 7d --limit 50

scrape-prnewswire:
	@echo "🔍 Scraping PR Newswire..."
	@./scripts/scrape.sh --source prnewswire --since 7d --limit 50

scrape-ema:
	@echo "🔍 Scraping EMA..."
	@./scripts/scrape.sh --source ema --since 7d --limit 50

scrape-mhra:
	@echo "🔍 Scraping MHRA..."
	@./scripts/scrape.sh --source mhra --since 7d --limit 50

scrape-clinicaltrials:
	@echo "🔍 Scraping ClinicalTrials.gov..."
	@./scripts/scrape.sh --source clinicaltrials --since 7d --limit 50

scrape-edgar:
	@echo "🔍 Scraping SEC EDGAR..."
	@./scripts/scrape.sh --source edgar --since 7d --limit 20

scrape-all:
	@echo "🔍 Scraping all sources..."
	@$(MAKE) scrape-fierce
	@$(MAKE) scrape-fda
	@$(MAKE) scrape-businesswire
	@$(MAKE) scrape-globenewswire
	@$(MAKE) scrape-prnewswire
	@echo "✅ All sources scraped!"

scrape-fixtures:
	@echo "🔍 Generating test fixtures..."
	@./scripts/scrape.sh --source fierce --save-fixture --limit 5
	@./scripts/scrape.sh --source fda --save-fixture --limit 5
	@./scripts/scrape.sh --source businesswire --save-fixture --limit 5
	@./scripts/scrape.sh --source globenewswire --save-fixture --limit 5
	@./scripts/scrape.sh --source prnewswire --save-fixture --limit 5
	@echo "✅ Fixtures generated in tmp/fixtures/"

scrape-url:
	@if [ -z "$(URL)" ]; then \
		echo "❌ Error: URL parameter required"; \
		echo "Usage: make scrape-url URL=https://..."; \
		exit 1; \
	fi
	@echo "🔍 Scraping URL: $(URL)"
	@./scripts/scrape.sh --source fierce --url "$(URL)"

# Development targets
fixtures: scrape-fixtures

scrape-dry:
	@echo "🔍 Dry run (no database writes)..."
	@./scripts/scrape.sh --source fierce --dry-run --limit 10
