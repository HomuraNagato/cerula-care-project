#!/usr/bin/env bash
set -euo pipefail

cd /home

if [ ! -d ".venv" ]; then
  uv venv
fi

source .venv/bin/activate
uv sync

python data/seed.py

exec uvicorn src.main:app --host 0.0.0.0 --port 8083
