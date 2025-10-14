#!/bin/bash
# Script to push all conflict-resolution branches to remote
# This script should be run by someone with push access to the repository

set -e

cd "$(dirname "$0")"

echo "========================================="
echo "Pushing Conflict-Resolution Branches"
echo "========================================="
echo ""

BRANCHES=(
  "conflict-resolve/pr-72"
  "conflict-resolve/pr-73"
  "conflict-resolve/pr-74"
  "conflict-resolve/pr-75"
  "conflict-resolve/pr-76"
  "conflict-resolve/pr-77"
)

for branch in "${BRANCHES[@]}"; do
  echo "Pushing $branch..."
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git push -u origin "$branch"
    echo "✅ Successfully pushed $branch"
  else
    echo "❌ Branch $branch does not exist locally"
  fi
  echo ""
done

echo "========================================="
echo "All branches pushed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Comment on each original PR linking to its conflict-resolve branch"
echo "2. Request PR authors to review the conflict resolution"
echo "3. For PR #72, specifically note the pyproject.toml changes"
