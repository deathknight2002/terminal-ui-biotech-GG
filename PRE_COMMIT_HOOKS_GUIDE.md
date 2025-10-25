# Pre-commit Hooks Usage Guide

## Quick Start

### Installation
```bash
# Install pre-commit
pip3 install pre-commit

# Or with poetry (recommended)
poetry run pip install pre-commit

# Install the git hooks
pre-commit install
```

### Usage

#### Automatic (on commit)
Once installed, hooks run automatically on `git commit`:

```bash
git add my_file.py
git commit -m "Add new feature"
# Hooks will run automatically
# If any hook fails, commit is aborted
# Fixed files are staged automatically (for auto-fix hooks)
```

#### Manual (on-demand)
Run hooks without committing:

```bash
# Run on all files
pre-commit run --all-files

# Run on specific files
pre-commit run --files bt_platform/core/app.py

# Run specific hook
pre-commit run black --all-files
pre-commit run prettier --all-files

# Run with poetry
poetry run pre-commit run --all-files
```

## Configured Hooks

### Python Hooks
1. **Black** - Code formatter
   - Auto-fixes Python code style
   - Uses pyproject.toml configuration
   
2. **isort** - Import sorter
   - Organizes imports
   - Compatible with Black

3. **Flake8** - Linter
   - Checks code quality
   - Reports errors but doesn't auto-fix

4. **Ruff** - Fast linter
   - Modern Python linter
   - Auto-fixes many issues

5. **Bandit** - Security scanner
   - Detects security vulnerabilities
   - Skips common false positives

### JavaScript/TypeScript Hooks
1. **Prettier** - Code formatter
   - Formats JS/TS/JSON/YAML/MD
   - Uses .prettierrc.json config

2. **ESLint** - Linter
   - Lints JavaScript/TypeScript
   - Auto-fixes many issues

### General Hooks
1. **trailing-whitespace** - Remove trailing spaces
2. **end-of-file-fixer** - Ensure newline at EOF
3. **check-yaml** - Validate YAML syntax
4. **check-json** - Validate JSON syntax
5. **check-added-large-files** - Block large files (>1MB)
6. **check-merge-conflict** - Detect merge markers
7. **detect-private-key** - Detect committed secrets

## Common Workflows

### Before Committing
```bash
# Run all hooks
pre-commit run --all-files

# Fix Python formatting
pre-commit run black --all-files
pre-commit run isort --all-files

# Fix JS/TS formatting
pre-commit run prettier --all-files

# Check for security issues
pre-commit run bandit --all-files
```

### After Installing New Dependencies
```bash
# Update hook versions
pre-commit autoupdate

# Re-install hooks
pre-commit clean
pre-commit install
```

### Skipping Hooks (emergency only)
```bash
# Skip all hooks for one commit
git commit --no-verify -m "Emergency fix"

# Or set environment variable
SKIP=black,flake8 git commit -m "Skip specific hooks"
```

## Troubleshooting

### Hook Installation Failed
```bash
# Clean and reinstall
pre-commit clean
pre-commit install --install-hooks
```

### Hooks Running Slow
```bash
# Run only on changed files (default)
pre-commit run

# Skip expensive hooks
SKIP=bandit pre-commit run
```

### Conflict with Editor Formatting
```bash
# Disable editor formatting and use pre-commit
# Or configure editor to use same settings

# Black config in pyproject.toml
# Prettier config in .prettierrc.json
```

### Python Version Issues
```bash
# Ensure correct Python version
python3 --version  # Should be 3.9+

# Use poetry's Python
poetry run pre-commit run --all-files
```

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Install pre-commit
  run: pip install pre-commit

- name: Run pre-commit
  run: pre-commit run --all-files
```

## Best Practices

1. **Run before pushing** - Catch issues early
2. **Fix all warnings** - Don't ignore linter warnings
3. **Update regularly** - Keep hooks up to date
4. **Team consistency** - Everyone should use same hooks
5. **CI enforcement** - Run hooks in CI/CD pipeline

## Example Output

### Successful run:
```
$ pre-commit run --all-files
black....................................................................Passed
isort....................................................................Passed
flake8...................................................................Passed
ruff.....................................................................Passed
prettier.................................................................Passed
trailing-whitespace......................................................Passed
end-of-file-fixer........................................................Passed
check-yaml...............................................................Passed
check-json...............................................................Passed
```

### Failed run (auto-fixed):
```
$ pre-commit run --all-files
black....................................................................Failed
- hook id: black
- files were modified by this hook

reformatted bt_platform/core/app.py
1 file reformatted.

# Re-run after auto-fix
$ pre-commit run --all-files
black....................................................................Passed
```

### Failed run (manual fix required):
```
$ pre-commit run --all-files
flake8...................................................................Failed
- hook id: flake8
- exit code: 1

bt_platform/core/app.py:42:80: E501 line too long (92 > 88 characters)

# Fix the issue manually, then commit
```

## Integration with IDEs

### VS Code
```json
{
  "python.formatting.provider": "black",
  "python.linting.flake8Enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### PyCharm
1. Settings → Tools → External Tools
2. Add Black/isort as external tools
3. Configure File Watchers for auto-format

## Advanced Configuration

### Skip specific files
In `.pre-commit-config.yaml`:
```yaml
- repo: https://github.com/psf/black
  hooks:
    - id: black
      exclude: ^(tests/fixtures/|migrations/)
```

### Run only on specific file types
```yaml
- repo: https://github.com/pre-commit/pre-commit-hooks
  hooks:
    - id: trailing-whitespace
      types_or: [python, javascript]
```

### Custom hook timeout
```yaml
- repo: https://github.com/psf/black
  hooks:
    - id: black
      args: [--timeout=60]
```
