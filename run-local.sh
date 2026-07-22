#!/usr/bin/env sh
cd "$(dirname "$0")"
printf '%s\n' 'BeatBloom is running at http://localhost:8080'
if command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:8080 >/dev/null 2>&1 & fi
if command -v open >/dev/null 2>&1; then open http://localhost:8080 >/dev/null 2>&1 & fi
python3 -m http.server 8080
