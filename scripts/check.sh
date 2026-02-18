#!/usr/bin/env bash
# Quality gates: black, ruff, pytest (backend) + frontend typecheck/build.
# Run from repo root. Requires: pip install black ruff pytest (in backend venv)

set -e
cd "$(dirname "$0")/.."

echo "=== Backend: black ==="
cd backend && python -m black . && cd ..

echo "=== Backend: ruff ==="
cd backend && ruff check . && cd ..

echo "=== Backend: pytest ==="
(cd backend && python -m pytest -q) || { r=$?; [ $r -eq 5 ] && echo "No tests (OK)"; [ $r -eq 5 ] || exit $r; }

echo "=== Frontend: typecheck + build ==="
cd frontend && npm run build && cd ..

echo "=== Check OK ==="
