# Documentation Guide

Welcome to the Biotech Terminal Platform documentation! This directory contains comprehensive guides for using and developing the platform.

## 📚 Quick Navigation

**New to the project?** Start with these:
1. [../README.md](../README.md) - Project overview
2. [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup
3. [QUICK_START_MONITORING.md](./QUICK_START_MONITORING.md) - Quick start guide

**Looking for specific features?**
- **Terminal UI**: [TUI.md](./TUI.md) and [TUI_EXAMPLES.md](./TUI_EXAMPLES.md)
- **Monitoring**: [LIVE_MONITORING.md](./LIVE_MONITORING.md) and [MONITORING_INTEGRATION.md](./MONITORING_INTEGRATION.md)
- **Migration**: [MIGRATION.md](./MIGRATION.md)

**Complete documentation index**: See [../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)

## 📖 Documentation in This Directory

### Setup & Development
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete development environment setup guide
  - Installing dependencies (Python, Node.js)
  - Running the platform locally
  - Development workflows
  - Testing strategies

### Terminal User Interface (TUI)
- **[TUI.md](./TUI.md)** - Terminal User Interface documentation
  - Overview of TUI features
  - Command reference
  - Usage patterns
  
- **[TUI_EXAMPLES.md](./TUI_EXAMPLES.md)** - Practical TUI examples
  - Real-world usage scenarios
  - Code examples
  - Best practices

### Monitoring Features
- **[QUICK_START_MONITORING.md](./QUICK_START_MONITORING.md)** - Quick start guide for monitoring
  - Basic setup
  - First steps
  - Common use cases

- **[LIVE_MONITORING.md](./LIVE_MONITORING.md)** - Live monitoring capabilities
  - Real-time data updates
  - WebSocket connections
  - Monitoring dashboards

- **[MONITORING_INTEGRATION.md](./MONITORING_INTEGRATION.md)** - Integrating monitoring into applications
  - API integration
  - Component usage
  - Advanced configurations

- **[FRONTEND_MONITORING_EXAMPLES.md](./FRONTEND_MONITORING_EXAMPLES.md)** - Frontend monitoring examples
  - React component examples
  - State management
  - UI patterns

### Migration & Architecture
- **[MIGRATION.md](./MIGRATION.md)** - Migration guide from v1.x to current architecture
  - Breaking changes
  - Step-by-step migration
  - Code updates required
  - Testing strategies

## 🎯 Documentation by Use Case

### I want to...

#### Get Started Quickly
1. Read [../README.md](../README.md) for overview
2. Follow [DEVELOPMENT.md](./DEVELOPMENT.md) to set up
3. Try [QUICK_START_MONITORING.md](./QUICK_START_MONITORING.md) for first features

#### Understand the Terminal UI
1. Start with [TUI.md](./TUI.md) for concepts
2. See [TUI_EXAMPLES.md](./TUI_EXAMPLES.md) for examples
3. Check [../MONITORING_COMPLETE.md](../MONITORING_COMPLETE.md) for implementation status

#### Set Up Monitoring
1. Quick start: [QUICK_START_MONITORING.md](./QUICK_START_MONITORING.md)
2. Live data: [LIVE_MONITORING.md](./LIVE_MONITORING.md)
3. Integration: [MONITORING_INTEGRATION.md](./MONITORING_INTEGRATION.md)
4. Frontend examples: [FRONTEND_MONITORING_EXAMPLES.md](./FRONTEND_MONITORING_EXAMPLES.md)

#### Migrate from Old Version
1. Read [MIGRATION.md](./MIGRATION.md) completely
2. Check [../REORGANIZATION_COMPLETE.md](../REORGANIZATION_COMPLETE.md) for context
3. Review [../INTEGRATION_PLAN.md](../INTEGRATION_PLAN.md) if needed

#### Contribute to the Project
1. Read [../CONTRIBUTING.md](../CONTRIBUTING.md)
2. Set up dev environment with [DEVELOPMENT.md](./DEVELOPMENT.md)
3. Review [MIGRATION.md](./MIGRATION.md) to understand architecture

## 🔧 Developer Resources

### Key Files
- **Development**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Migration**: [MIGRATION.md](./MIGRATION.md)
- **Examples**: [TUI_EXAMPLES.md](./TUI_EXAMPLES.md), [FRONTEND_MONITORING_EXAMPLES.md](./FRONTEND_MONITORING_EXAMPLES.md)

### API Documentation
- Backend API: Run `npm run dev:backend` and visit http://localhost:8000/docs
- Component API: See [../frontend-components/](../frontend-components/)

### Testing
```bash
# Run all tests
npm test

# Test specific workspace
npm run test:components
npm run test:terminal
poetry run pytest
```

## 📋 Documentation Standards

### Creating New Documentation
1. **Use clear titles** - Descriptive and specific
2. **Add to index** - Update [../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
3. **Link related docs** - Cross-reference relevant documentation
4. **Include examples** - Show, don't just tell
5. **Keep it current** - Update when features change

### Markdown Standards
- Use ATX-style headers (`#` not `===`)
- Include code blocks with language hints
- Add links to related documentation
- Use emoji sparingly for visual hierarchy
- Keep line length reasonable for readability

### File Organization
```
docs/
├── README.md                    # This file
├── DEVELOPMENT.md               # Dev setup
├── MIGRATION.md                 # Migration guide
├── TUI.md                       # TUI overview
├── TUI_EXAMPLES.md              # TUI examples
├── QUICK_START_MONITORING.md    # Monitoring quick start
├── LIVE_MONITORING.md           # Live monitoring
├── MONITORING_INTEGRATION.md    # Integration guide
└── FRONTEND_MONITORING_EXAMPLES.md  # Frontend examples
```

## 🔗 Related Documentation

### Root Directory
- [../README.md](../README.md) - Main project documentation
- [../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) - Complete documentation index
- [../CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [../CHANGELOG.md](../CHANGELOG.md) - Version history

### Feature Documentation
- [../MONITORING_COMPLETE.md](../MONITORING_COMPLETE.md) - Monitoring implementation
- [../SCRAPING_INFRASTRUCTURE.md](../SCRAPING_INFRASTRUCTURE.md) - Scraping features
- [../INTEGRATION_PLAN.md](../INTEGRATION_PLAN.md) - Integration roadmap

### Module-Specific
- [../backend/src/scraping/README.md](../backend/src/scraping/README.md) - Scraping module
- [../examples/README.md](../examples/README.md) - Component examples

## 💡 Tips for Finding Information

1. **Start with the index**: [../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
2. **Use GitHub search**: Press `/` to search the repository
3. **Check file headers**: Most docs have a clear structure
4. **Follow links**: Documentation is interconnected
5. **Use `grep`**: Search across all docs with `grep -r "search term" docs/`

## 🆘 Getting Help

If you can't find what you're looking for:
1. Check [../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
2. Search existing GitHub issues
3. Review related documentation links
4. Create a new issue with the `documentation` label

## 📝 Contributing to Documentation

We welcome documentation improvements! See [../CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Common documentation tasks:**
- Fixing typos or unclear explanations
- Adding examples or use cases
- Updating outdated information
- Creating new guides for features
- Improving organization and structure

**How to contribute:**
1. Fork the repository
2. Make your changes
3. Update [../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) if adding new files
4. Submit a pull request

---

**Last Updated**: 2025-01-08  
**Files in this directory**: 8 markdown files  
**Maintained by**: Project maintainers

For the complete documentation index, see [../DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)
