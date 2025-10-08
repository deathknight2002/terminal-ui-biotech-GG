# Documentation & Version Control Guide

> **How to manage documentation and avoid merge conflicts in the Biotech Terminal Platform**

## 📖 Overview

This guide helps you work with documentation and prevent version control issues when collaborating on the project.

## 🗂️ Documentation Structure

The repository contains **25+ documentation files** organized across multiple locations:

```
biotech-terminal-platform/
├── 📄 Root Documentation (11 files)
│   ├── README.md                    # Main project docs
│   ├── DOCUMENTATION_INDEX.md       # Complete documentation index
│   ├── CHANGELOG.md                 # Version history
│   ├── CONTRIBUTING.md              # Contribution guidelines
│   ├── INSTALLATION.md              # Installation guide
│   ├── INTEGRATION_PLAN.md          # Integration roadmap
│   ├── MONITORING_COMPLETE.md       # Monitoring features
│   ├── REORGANIZATION_COMPLETE.md   # Project reorganization
│   ├── IMPLEMENTATION_SUMMARY.md    # Implementation status
│   ├── CLEANUP_SUMMARY.md           # Cleanup history
│   └── SCRAPING_INFRASTRUCTURE.md   # Scraping features
│
├── 📂 docs/ (8 files)
│   ├── README.md                    # Documentation hub
│   ├── DEVELOPMENT.md               # Development setup
│   ├── MIGRATION.md                 # Migration guide
│   ├── TUI.md                       # Terminal UI
│   ├── TUI_EXAMPLES.md              # TUI examples
│   ├── QUICK_START_MONITORING.md    # Quick start
│   ├── LIVE_MONITORING.md           # Live monitoring
│   ├── MONITORING_INTEGRATION.md    # Integration guide
│   └── FRONTEND_MONITORING_EXAMPLES.md
│
├── 📂 Module-Specific Docs (6 files)
│   ├── examples/README.md
│   ├── backend/src/scraping/README.md
│   ├── backend/src/scraping/NEWS_SCRAPERS.md
│   ├── REFERENCE/jsx/10.2.2025/README.md
│   └── .github/copilot-instructions.md
```

## 🎯 Finding Documentation

### Use the Documentation Index

**DOCUMENTATION_INDEX.md** is your primary resource:
- Organized by category (Getting Started, Features, Development)
- Organized by audience (Users, Developers, Maintainers)
- Quick find by topic and status
- Links to all documentation files

### Quick Navigation

```bash
# View the documentation index
cat DOCUMENTATION_INDEX.md

# View the docs directory hub
cat docs/README.md

# Search all documentation
grep -r "search term" *.md docs/

# Find specific files
find . -name "*monitoring*.md"
```

## 🔄 Version Control Best Practices

### 1. Understanding .gitattributes

The `.gitattributes` file is configured to help prevent merge conflicts:

**Union Merge for Documentation:**
```gitattributes
*.md merge=union              # Keep both versions during merge
CHANGELOG.md merge=union      # Especially important for changelogs
```

This means when two people edit the same markdown file, Git will try to combine both versions instead of creating a conflict.

**Binary Merge for Lock Files:**
```gitattributes
package-lock.json binary merge=binary
poetry.lock binary merge=binary
```

Lock files should never be manually merged - regenerate them instead.

### 2. Working with Documentation

**Before editing:**
```bash
# Pull latest changes
git pull origin main

# Create a feature branch
git checkout -b docs/update-readme
```

**While editing:**
```bash
# Check what you've changed
git status
git diff

# Stage and commit frequently
git add DOCUMENTATION_INDEX.md
git commit -m "docs: Update documentation index with new files"
```

**Before pushing:**
```bash
# Pull latest changes again
git pull origin main

# If there are conflicts, resolve them
# (Most markdown conflicts should auto-merge with union strategy)

# Push your changes
git push origin docs/update-readme
```

### 3. Handling Merge Conflicts

**If a merge conflict occurs in documentation:**

1. **Check the conflict:**
   ```bash
   git status  # See which files have conflicts
   ```

2. **For markdown files with union merge:**
   Most conflicts auto-resolve, but if not:
   ```bash
   # Edit the file and keep both versions where appropriate
   # Remove conflict markers (<<<<<<, =======, >>>>>>>)
   git add <filename>
   git commit
   ```

3. **For lock files (package-lock.json, poetry.lock):**
   ```bash
   # Never manually edit! Regenerate instead:
   npm install      # Regenerates package-lock.json
   poetry lock      # Regenerates poetry.lock
   
   git add package-lock.json poetry.lock
   git commit
   ```

### 4. Avoiding Conflicts

**Best practices:**

1. **Pull frequently:** Get latest changes before starting work
2. **Commit frequently:** Small, focused commits are easier to merge
3. **Coordinate large changes:** Communicate when making major documentation updates
4. **Use feature branches:** Never commit directly to main
5. **Review before merging:** Check for conflicts in PRs before merging

## 📝 Documentation Workflow

### Adding New Documentation

1. **Create the document:**
   ```bash
   # Create in appropriate location
   # Root for project-level docs
   # docs/ for feature/development docs
   # Module directories for module-specific docs
   ```

2. **Update the index:**
   ```markdown
   # Edit DOCUMENTATION_INDEX.md
   # Add your new file in the appropriate section
   # Include a brief description
   ```

3. **Add cross-references:**
   ```markdown
   # Link to related documentation
   # Update docs/README.md if it's in docs/
   ```

4. **Commit with clear message:**
   ```bash
   git add your-new-doc.md DOCUMENTATION_INDEX.md
   git commit -m "docs: Add guide for XYZ feature"
   ```

### Updating Existing Documentation

1. **Check current content:**
   ```bash
   git log --oneline -- path/to/file.md  # See recent changes
   git blame path/to/file.md             # See who changed what
   ```

2. **Make your changes:**
   - Keep existing structure where possible
   - Add new sections rather than replacing
   - Update dates/version info
   - Maintain formatting consistency

3. **Test all links:**
   ```bash
   # Make sure all links in your document work
   # Check relative paths
   ```

4. **Commit with context:**
   ```bash
   git add path/to/file.md
   git commit -m "docs: Update XYZ guide with new examples"
   ```

### Removing Outdated Documentation

1. **Verify it's truly outdated:**
   - Check if content exists elsewhere
   - Verify no other docs link to it
   - Confirm with team if unsure

2. **Update references:**
   ```bash
   # Find all references to the file
   grep -r "old-doc.md" .
   
   # Update or remove those references
   ```

3. **Remove and commit:**
   ```bash
   git rm old-doc.md
   # Update DOCUMENTATION_INDEX.md
   git commit -m "docs: Remove outdated XYZ guide (consolidated into ABC.md)"
   ```

## 🛠️ Tools & Commands

### Useful Git Commands

```bash
# See what changed in documentation
git diff --name-only '*.md'

# See who last modified a doc
git log --oneline -- README.md

# Find when text was added/removed
git log -S "search term" -- '*.md'

# Compare documentation between branches
git diff main feature-branch -- '*.md'

# See all documentation changes in last N commits
git log -n 10 --oneline -- '*.md'
```

### Searching Documentation

```bash
# Search all markdown files
grep -r "search term" *.md docs/

# Case-insensitive search
grep -ir "search term" *.md docs/

# Search with line numbers
grep -rn "search term" *.md docs/

# Search specific files
grep "search term" DOCUMENTATION_INDEX.md docs/README.md
```

### Checking Documentation Health

```bash
# Find broken internal links (basic check)
grep -r "\[.*\](.*/.*)" *.md docs/ | grep -v "http"

# Find markdown files not in DOCUMENTATION_INDEX.md
comm -23 \
  <(find . -name "*.md" ! -path "./.git/*" ! -path "./node_modules/*" | sort) \
  <(grep -o '\[.*\]([^)]*\.md)' DOCUMENTATION_INDEX.md | sed 's/.*(\.\///' | sed 's/).*//' | sort)

# Count total markdown files
find . -name "*.md" ! -path "./.git/*" ! -path "./node_modules/*" | wc -l
```

## 🎓 Examples

### Example 1: Adding a New Feature Guide

```bash
# Create feature branch
git checkout -b docs/add-websocket-guide

# Create the guide
cat > docs/WEBSOCKET_GUIDE.md << 'EOF'
# WebSocket Integration Guide
...your content...
EOF

# Update the index
# Edit DOCUMENTATION_INDEX.md to add:
# - **[docs/WEBSOCKET_GUIDE.md](./docs/WEBSOCKET_GUIDE.md)** - WebSocket integration

# Update docs README
# Edit docs/README.md to add the new guide

# Commit
git add docs/WEBSOCKET_GUIDE.md DOCUMENTATION_INDEX.md docs/README.md
git commit -m "docs: Add WebSocket integration guide"

# Push and create PR
git push origin docs/add-websocket-guide
```

### Example 2: Resolving a Documentation Conflict

```bash
# You're working on README.md, pull latest changes
git pull origin main

# Conflict occurs in README.md
Auto-merging README.md
CONFLICT (content): Merge conflict in README.md

# Check the conflict
git diff README.md

# With union merge, this should be rare, but if it happens:
# 1. Open README.md in editor
# 2. Look for conflict markers
# 3. Keep both versions or choose one
# 4. Remove markers

# Stage and commit
git add README.md
git commit -m "docs: Merge README.md changes"
```

### Example 3: Updating Documentation After Feature Change

```bash
# Feature added: New monitoring dashboard
# Update relevant docs

# Update main README
# Edit README.md - add feature to list

# Update monitoring docs
# Edit docs/LIVE_MONITORING.md - add new dashboard section
# Edit docs/MONITORING_INTEGRATION.md - add integration example

# Update changelog
# Edit CHANGELOG.md - add entry under Unreleased

# Commit all together
git add README.md docs/LIVE_MONITORING.md docs/MONITORING_INTEGRATION.md CHANGELOG.md
git commit -m "docs: Update documentation for new monitoring dashboard"
```

## 🚨 Common Issues & Solutions

### Issue: "I can't find the documentation I need"

**Solution:**
1. Check **DOCUMENTATION_INDEX.md** first
2. Use search: `grep -ir "topic" *.md docs/`
3. Check **docs/README.md** for guides
4. Create an issue if documentation is missing

### Issue: "Too many documentation files to read"

**Solution:**
1. Start with **DOCUMENTATION_INDEX.md** - it categorizes everything
2. Read only what's relevant to your task:
   - New user? Read README.md → INSTALLATION.md → QUICK_START
   - Developer? Read DEVELOPMENT.md → CONTRIBUTING.md
   - Migrating? Read MIGRATION.md
3. Use the "Quick Find" section in DOCUMENTATION_INDEX.md

### Issue: "Merge conflicts in documentation"

**Solution:**
1. For markdown files: Union merge should prevent most conflicts
2. If conflict occurs: Keep both versions where they don't contradict
3. For lock files: Regenerate them (npm install, poetry lock)
4. When in doubt: Ask the team or create a PR for review

### Issue: "Lock file conflicts (package-lock.json, poetry.lock)"

**Solution:**
```bash
# NEVER manually edit lock files!

# For package-lock.json:
git checkout origin/main -- package-lock.json
npm install
git add package-lock.json
git commit -m "chore: Regenerate package-lock.json"

# For poetry.lock:
git checkout origin/main -- poetry.lock
poetry lock
git add poetry.lock
git commit -m "chore: Regenerate poetry.lock"
```

## 📋 Checklist for Documentation Changes

- [ ] Created or updated documentation file(s)
- [ ] Updated **DOCUMENTATION_INDEX.md** if adding new files
- [ ] Updated **docs/README.md** if adding files to docs/
- [ ] Checked all links work (relative paths are correct)
- [ ] Followed markdown formatting standards
- [ ] Added cross-references to related docs
- [ ] Updated **CHANGELOG.md** if documenting new features
- [ ] Tested that examples/code snippets are correct
- [ ] Committed with clear commit message
- [ ] Pulled latest changes before pushing
- [ ] Created PR if working on feature branch

## 🔗 Related Resources

- **Git Documentation**: https://git-scm.com/doc
- **Markdown Guide**: https://www.markdownguide.org/
- **Git Attributes**: https://git-scm.com/docs/gitattributes
- **Merge Strategies**: https://git-scm.com/docs/merge-strategies

## 💡 Tips

1. **Commit messages**: Use `docs:` prefix for documentation changes
2. **Branch names**: Use `docs/` prefix for documentation branches
3. **File names**: Use descriptive UPPERCASE.md for root docs, lowercase.md for module docs
4. **Updates**: Keep DOCUMENTATION_INDEX.md and CHANGELOG.md current
5. **Review**: Always preview markdown before committing
6. **Links**: Use relative paths for internal links
7. **Search**: Use `grep` and GitHub search to find documentation

---

**Last Updated**: 2025-01-08  
**Maintained by**: Project maintainers  
**Related**: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md), [CONTRIBUTING.md](./CONTRIBUTING.md)

Need help? Create an issue with the `documentation` label!
