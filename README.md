# Cerula Care Patient Dashboard

## Purpose
This project is a lightweight care management dashboard for Care Admins to manage patients, assign care team members, and track behavioral health screening trends over time. It provides a React/TypeScript frontend backed by a FastAPI/SQLModel API, seeded with six months of screening data per patient for visualization and workflow testing.

## Structure
- `dev/`: FastAPI backend, SQLModel models, seed script, and tests.
- `ui/`: React + TypeScript frontend (Vite) with list/detail views and charts.
- `docker-compose.yaml`: local orchestration for both services.

## Quick Start (Docker)
1. Start containers (installs deps, seeds, and boots both services):
   ```bash
   docker compose up --build
   ```
2. Visit:
   - Frontend: http://0.0.0.0:5173
   - Backend: http://0.0.0.0:8083

## Local (No Docker)
1. Backend:
   ```bash
   cd dev
   python -m venv .venv
   source .venv/bin/activate
   # install deps (uv or pip)
   uv sync
   uvicorn src.main:app --host 0.0.0.0 --port 8083
   ```
2. Seed data:
   ```bash
   python data/seed.py
   ```
3. Frontend:
   ```bash
   cd ui
   npm install
   VITE_BACKEND_URL=http://localhost:8083 npm run dev -- --host 0.0.0.0 --port 5173
   ```
4. Visit:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8083

## Notes
- The frontend uses a Vite dev proxy. Requests to `/api/*` are forwarded to the backend URL defined by `VITE_BACKEND_URL`.
- If you set `VITE_API_BASE_URL`, ensure it is `/api` for proxy mode. If you point directly to the backend host, CORS must be enabled.
- Re-seeding wipes and recreates patients. IDs will change after running `data/seed.py`.
- Docker entrypoints handle install + seed on first run:
  - Backend: `dev/entrypoint.sh` (uv + seed + uvicorn)
  - Frontend: `ui/entrypoint.sh` (npm install + Vite dev server)
- If the patient list is empty, re-run `python data/seed.py` in the backend container and refresh the UI.

## Design Decisions & Tradeoffs
- SQLModel + SQLite (`dev.db`) keeps local setup zero-config and fast to iterate, at the cost of production-grade concurrency and migrations.
- The patient list endpoint computes "latest screening" and active assignments with separate queries and in-memory aggregation for clarity and fewer complex joins, at the cost of extra queries as data scales.
- React Query + Axios provide caching and request deduplication; mutations invalidate list/detail queries instead of doing optimistic updates for simplicity.
- Vite dev proxy (`/api`) keeps frontend/backend integration simple in dev, but direct backend URLs require CORS to be enabled.
- Tailwind utility classes enable rapid UI iteration with consistent styling, at the cost of more verbose JSX.
- Recharts provides quick trend visualizations for screenings, with limited deep customization compared to lower-level charting libraries.

## Scripts
- Backend seed: `python dev/data/seed.py`
- Backend tests: `pytest dev/tests`
- Frontend dev server: `npm run dev` (from `ui/`)
