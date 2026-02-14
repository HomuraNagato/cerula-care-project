#!/usr/bin/env bash
set -euo pipefail

cd /home

if [ ! -d "node_modules" ]; then
  npm install
fi

exec npm run dev -- --host 0.0.0.0 --port 5173
