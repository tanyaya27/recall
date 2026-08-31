#!/bin/bash
# Build ReCall v0 and deploy to GitHub Pages.
# Pages serves the /docs folder at the REPO ROOT (one level above 04_Engineering).
set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$APP_DIR/../.." && pwd)"

cd "$APP_DIR"
[ -d node_modules ] || npm install --no-audit --no-fund
npm run build

cd "$REPO_ROOT"
git add -A
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" || echo "nothing to commit"
git push origin main
echo "Pushed. GitHub Pages will update in ~1 minute."
