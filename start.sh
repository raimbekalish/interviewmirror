#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v python3 >/dev/null || ! command -v npm >/dev/null; then
  echo 'Install Python 3.12+ and Node.js 22+ first.' >&2
  exit 1
fi
if [ ! -f .env ]; then
  cp .env.example .env
  echo 'Created .env. Add GEMINI_API_KEY there and restart to enable AI; local practice works now.'
fi
if [ ! -d .venv ]; then python3 -m venv .venv; fi
.venv/bin/pip install -r backend/requirements.lock.txt
npm ci
npm run build
echo 'Open http://127.0.0.1:8000 — stop with Ctrl+C.'
exec .venv/bin/python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
