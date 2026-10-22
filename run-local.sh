#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { printf '%s\n' 'Install Node.js 24 LTS first.'; exit 1; }
[ -d node_modules ] || { printf '%s\n' 'Run npm ci --ignore-scripts first.'; exit 1; }
exec npm run dev -- --open
