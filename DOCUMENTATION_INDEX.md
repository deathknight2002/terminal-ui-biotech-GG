# 📚 Documentation Index

> **Complete guide to all documentation in the Biotech Terminal Platform**

This index helps you find the right documentation quickly. All documents are organized by category and purpose.

## 🚀 Getting Started

**Start here if you're new to the platform:**

1. **[README.md](./README.md)** - Platform overview, architecture, and quick start
2. **[INSTALLATION.md](./INSTALLATION.md)** - Detailed installation instructions
3. **[docs/QUICK_START_MONITORING.md](./docs/QUICK_START_MONITORING.md)** - Quick start for monitoring features
4. **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Development environment setup

## 📖 Core Documentation

### Project Information
- **[README.md](./README.md)** - Main project documentation
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to the project
- **[LICENSE](./LICENSE)** - MIT License

### Setup & Installation
- **[INSTALLATION.md](./INSTALLATION.md)** - Installation guide for all platforms
- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Development environment setup
- **[scripts/](./scripts/)** - Setup scripts for automated installation

### Migration & Reorganization
- **[docs/MIGRATION.md](./docs/MIGRATION.md)** - Migration guide from v1.x to new architecture
- **[REORGANIZATION_COMPLETE.md](./REORGANIZATION_COMPLETE.md)** - Summary of repository reorganization
- **[CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md)** - Cleanup and refactoring summary
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation status and progress

## 🎯 Feature Documentation

### Monitoring & TUI
- **[docs/TUI.md](./docs/TUI.md)** - Terminal User Interface documentation
- **[docs/TUI_EXAMPLES.md](./docs/TUI_EXAMPLES.md)** - TUI usage examples
- **[docs/LIVE_MONITORING.md](./docs/LIVE_MONITORING.md)** - Live monitoring features
- **[docs/MONITORING_INTEGRATION.md](./docs/MONITORING_INTEGRATION.md)** - Monitoring integration guide
- **[docs/FRONTEND_MONITORING_EXAMPLES.md](./docs/FRONTEND_MONITORING_EXAMPLES.md)** - Frontend monitoring examples
- **[MONITORING_COMPLETE.md](./MONITORING_COMPLETE.md)** - Monitoring implementation summary

### Data & Scraping
- **[SCRAPING_INFRASTRUCTURE.md](./SCRAPING_INFRASTRUCTURE.md)** - Web scraping infrastructure
- **[backend/src/scraping/README.md](./backend/src/scraping/README.md)** - Scraping module documentation
- **[backend/src/scraping/NEWS_SCRAPERS.md](./backend/src/scraping/NEWS_SCRAPERS.md)** - News scraper implementations

### Integration & Planning
- **[INTEGRATION_PLAN.md](./INTEGRATION_PLAN.md)** - Backend-frontend integration plan
- **[OPEN_DATA_TERMINAL_PLAN.md](./OPEN_DATA_TERMINAL_PLAN.md)** - Open data terminal roadmap

## 💻 Component Documentation

### Examples & Usage
- **[examples/README.md](./examples/README.md)** - Component examples and demos

### Reference Materials
- **[REFERENCE/](./REFERENCE/)** - Reference implementations and legacy code
  - **[REFERENCE/jsx/10.2.2025/README.md](./REFERENCE/jsx/10.2.2025/README.md)** - Aurora Mega Learning reference

## 🔧 Developer Resources

### Architecture & Design
- Platform architecture: See [README.md § Platform Architecture](./README.md#-platform-architecture)
- Component library: See [frontend-components/](./frontend-components/)
- Backend API: See [platform/](./platform/)

### Configuration
- **[package.json](./package.json)** - NPM workspace configuration
- **[pyproject.toml](./pyproject.toml)** - Python/Poetry configuration
- **[tsconfig.json](./tsconfig.json)** - TypeScript configuration
- **[vite.config.ts](./vite.config.ts)** - Vite build configuration

### Testing
- Test scripts: `npm test` (see package.json)
- Component tests: `frontend-components/` and `terminal/`
- Backend tests: `poetry run pytest`

## 📋 Documentation by Audience

### For New Users
1. [README.md](./README.md) - Start here
2. [INSTALLATION.md](./INSTALLATION.md) - Install the platform
3. [docs/QUICK_START_MONITORING.md](./docs/QUICK_START_MONITORING.md) - Try monitoring features

### For Developers
1. [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Set up dev environment
2. [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
3. [docs/MIGRATION.md](./docs/MIGRATION.md) - Understand the architecture

### For Contributors
1. [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute
2. [CHANGELOG.md](./CHANGELOG.md) - Recent changes
3. [docs/MIGRATION.md](./docs/MIGRATION.md) - Migration patterns

### For Maintainers
1. [REORGANIZATION_COMPLETE.md](./REORGANIZATION_COMPLETE.md) - Project status
2. [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Implementation progress
3. [CLEANUP_SUMMARY.md](./CLEANUP_SUMMARY.md) - Cleanup history

## 🔍 Quick Find

### By Topic
- **Installation**: INSTALLATION.md, docs/DEVELOPMENT.md
- **Migration**: docs/MIGRATION.md, REORGANIZATION_COMPLETE.md
- **Monitoring**: docs/TUI.md, docs/LIVE_MONITORING.md, MONITORING_COMPLETE.md
- **Scraping**: SCRAPING_INFRASTRUCTURE.md, backend/src/scraping/
- **Components**: examples/README.md, frontend-components/
- **API**: platform/, docs/DEVELOPMENT.md

### By Status
- **Complete**: MONITORING_COMPLETE.md, REORGANIZATION_COMPLETE.md
- **In Progress**: INTEGRATION_PLAN.md, OPEN_DATA_TERMINAL_PLAN.md
- **Reference**: CLEANUP_SUMMARY.md, IMPLEMENTATION_SUMMARY.md

## 📝 Documentation Standards

### File Naming Convention
- `ALLCAPS.md` - Project-level documentation (root directory)
- `PascalCase.md` or `lowercase.md` - Module-specific docs (subdirectories)
- `README.md` - Directory-level overview

### Documentation Structure
1. **Title** - Clear, descriptive title
2. **Overview** - Brief description and purpose
3. **Content** - Organized with headers and sections
4. **Links** - References to related documentation
5. **Status** - Current status if applicable (✅ Complete, 🚧 In Progress)

### Keeping Documentation Current
- Update CHANGELOG.md for version changes
- Update relevant documentation when features change
- Keep README.md synchronized with project structure
- Add new documentation to this index

## 🆘 Need Help?

1. **Check this index** - Find the right documentation
2. **Search the repository** - Use GitHub search or `grep`
3. **Check issues** - See if your question is already answered
4. **Create an issue** - Ask for help or clarification

## 🔗 External Resources

- **OpenBB Platform**: OpenBB architecture patterns (see [external/OpenBB/](./external/OpenBB/))
- **GitHub Copilot**: Instructions in [.github/copilot-instructions.md](./.github/copilot-instructions.md)

---

**Last Updated**: 2025-01-08  
**Documentation Files**: 25 total files  
**Maintained By**: Project maintainers  

💡 **Tip**: Use `Ctrl+F` (or `Cmd+F` on Mac) to search this index, or use GitHub's file finder (`t` key) to navigate directly to files.
