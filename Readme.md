# LINK – Lightweight Internet Network Keeper

A full-stack network performance monitoring and health scoring portal. It measures download/upload speed, latency, jitter, stores time‑series results in SQLite, computes a composite health score, exposes a FastAPI backend, and renders a modern analytics dashboard with Next.js + Tailwind + Recharts.

---

## Features

- Automated periodic measurements (speed + latency + jitter)
- SQLite storage with simple schema
- Health scoring with weighted components (speed, latency, jitter, stability)
- Trend, comparative, variability, peak hour and health timeline analytics
- JSON API (FastAPI) for frontend + CLI interoperability
- Rich dashboard (Next.js App Router, Tailwind CSS, Recharts)
- Export + Stats CLI commands
- Zero external DB dependency (self‑contained)
- Extensible architecture

---

## Project Structure

```
link/                Python backend (core engine, API, analysis, storage)
frontend/            Next.js dashboard
scripts/             Helper scripts (e.g. init_db)
tests/               Basic backend tests
start_link.ps1       Convenience launcher (Windows)
```

Key backend modules:
- [link/cli.py](link/cli.py) – Typer CLI (run-once, schedule, stats, export, dashboard)
- [link/config.py](link/config.py) – Environment-driven configuration
- [link/scheduler.py](link/scheduler.py) – Periodic measurement job (thread + schedule)
- [link/storage/db.py](link/storage/db.py) – SQLite access layer
- [link/analysis/health_score.py](link/analysis/health_score.py) – Health scoring + insights
- [link/api/main.py](link/api/main.py) – FastAPI service

Frontend highlights:
- [frontend/app/page.tsx](frontend/app/page.tsx) – Main dashboard
- Components under [frontend/app/components](frontend/app/components) (analytics, layout, ui)
- Hooks: [frontend/app/lib/hooks.ts](frontend/app/lib/hooks.ts)
- API client: [frontend/app/lib/api.ts](frontend/app/lib/api.ts)
- Types: [frontend/app/lib/types.ts](frontend/app/lib/types.ts)
- Styling: Tailwind configured in [frontend/tailwind.config.js](frontend/tailwind.config.js), globals in [frontend/app/globals.css](frontend/app/globals.css)

---

## Data Flow

1. Measurement
   - `run_speed_test()` + `sample_latency_and_jitter()` invoked by CLI or `Scheduler`.
2. Persistence
   - Inserted via [`insert_result`](link/storage/db.py) into `results` table.
3. Analysis
   - Latest record → health score via [`compute_health`](link/analysis/health_score.py).
4. API
   - FastAPI endpoints expose raw + aggregated data.
5. Frontend
   - React hooks call API, build derived analytics (trend, variability, comparative).
6. Visualization
   - Recharts components render time-series + comparative charts.

---

## Database Design

Single table: `results`

| Column        | Type   | Description                       |
|---------------|--------|-----------------------------------|
| id            | INTEGER PRIMARY KEY AUTOINCREMENT |
| timestamp     | TEXT   | ISO8601 UTC timestamp             |
| download_mbps | REAL   | Measured download speed           |
| upload_mbps   | REAL   | Measured upload speed             |
| latency_ms    | REAL   | Average latency (ms)              |
| jitter_ms     | REAL   | Latency variation (ms)            |

Schema initialized in [`init_db`](link/storage/db.py).  
Aggregations: `fetch_averages`, `fetch_since_days`, `fetch_latest`.

---

## Health Scoring

Weights (see [`WEIGHTS`](link/analysis/health_score.py)):
- Speed: 0.35
- Latency: 0.35
- Jitter: 0.20
- Stability: 0.10 (currently constant 1.0 placeholder)

Normalization:
- Higher speed = higher score
- Lower latency/jitter = higher score
- Composite → status buckets: Excellent / Good / Fair / Poor
- Explanations + recommendations generated per metric.

---

## API Endpoints

Base: `http://localhost:5000/api`

| Endpoint        | Method | Description |
|-----------------|--------|-------------|
| `/api/latest`   | GET    | Most recent measurement |
| `/api/history?days=N` | GET | Time-series results |
| `/api/stats?days=N` | GET | Averages over period |
| `/api/trends?days=N` | GET | Chart-ready arrays |
| `/api/health`   | GET    | Current health result |
| `/api/profiles` | GET    | (Placeholder / profile listing if extended) |

Models defined in [link/api/main.py](link/api/main.py).  

Example (health):
```json
{
  "score": 78.5,
  "status": "Good",
  "profile": "default",
  "components": { "speed": 74.3, "latency": 82.1, "jitter": 69.0, "stability": 100.0 },
  "explanations": [...],
  "insights": [...],
  "timestamp": "2024-05-21T10:15:00Z"
}
```

---

## Frontend Architecture

- Framework: Next.js (App Router)
- Charts: Recharts (line, area, radar, composed, reference lines)
- Styling: Tailwind CSS
- State/Data fetching: Custom hooks (see [`useLatestMetrics`, `useHistory`, `useStats`, `useTrends`](frontend/app/lib/hooks.ts))
- Utility formatting: [frontend/app/lib/utils.ts](frontend/app/lib/utils.ts)
- Analytics modules:
  - Trend: [`TrendAnalysis`](frontend/app/components/analytics/TrendAnalysis.tsx)
  - Comparative: [`ComparativePerformance`](frontend/app/components/analytics/ComparativePerformance.tsx)
  - Variability: [`SpeedVariability`](frontend/app/components/analytics/SpeedVariability.tsx)
  - Peak Hours: [`PeakHoursAnalysis`](frontend/app/components/analytics/PeakHoursAnalysis.tsx)
  - Health Timeline: [`NetworkHealthTimeline`](frontend/app/components/analytics/NetworkHealthTimeline.tsx)
  - Insights: [`NetworkInsights`](frontend/app/components/analytics/NetworkInsights.tsx)

---

## CLI Usage

Run module:
```
python -m link --help
```

Commands:
- `python -m link run-once`  
  Single measurement → JSON output
- `python -m link schedule --interval 15`  
  Continuous capture
- `python -m link export --days 30 --fmt json`  
  Export historical data
- `python -m link stats --days 7`  
  Period averages
- `python -m link dashboard`  
  Start FastAPI backend

Logging via internal logger (see `utils/logger` if added).

---

## Quick Start

### Backend

Prereqs: Python 3.11+, (optional) virtualenv.

```
pip install -e .
python -m link dashboard
```

### Frontend

```
cd frontend
npm install
npm run dev
```

Open: `http://localhost:3000`

### Combined (Windows)

```
./start_link.ps1
```

---

## Configuration (Environment Variables)

| Variable            | Default              | Purpose |
|---------------------|----------------------|---------|
| LINK_DB             | ./link_data.sqlite3 | DB file path |
| LINK_INTERVAL       | 15                   | Scheduler interval minutes |
| LINK_API_HOST       | 127.0.0.1           | FastAPI bind host |
| LINK_API_PORT       | 5000                | FastAPI port |
| LINK_PING_TARGET    | 10.1.216.10         | ICMP target |
| LINK_PING_SAMPLES   | 8                   | Latency sample count |
| LINK_SPEED_TIMEOUT  | 30                  | Speed test timeout sec |

---

## Testing

Backend example test: [tests/test_db.py](tests/test_db.py)  
Run:
```
pytest
```

---

## Error Handling

- Missing data → 404 on `/api/*` queries
- Latency failure in CLI run-once aborts with message
- Scheduler logs exceptions; continues next cycle
- Frontend shows connection & data absence states

---

## Extensibility Ideas

- Additional metrics (packet loss)
- Multi-profile weighting (gaming / streaming / VoIP)
- Alert rules + notifications
- Aggregated daily rollups
- Authentication & RBAC
- Dark/light auto theme toggle
- Prometheus export

---

## Security Notes

- CORS currently permissive (`allow_origins=["*"]`) – tighten for production
- No authentication layer yet
- SQLite file path should be controlled

---

## Performance Notes

- Lightweight single-table reads
- In-memory aggregation in API handlers
- Frontend slices last N points for charts
- Scheduler thread safe via SQLite autocommit

---

## License

Add appropriate license (not included yet).

---

## Contributing

1. Fork & branch
2. Add tests for backend changes
3. Open PR with concise description

---

## Troubleshooting

| Symptom | Resolution |
|---------|------------|
| Frontend “Connection Error” | Ensure backend on port 5000 |
| Empty charts | Run `python -m link run-once` or start scheduler |
| Locked DB on Windows | Avoid concurrent writers outside scheduler |
| Health score NaN | Check inserted rows for numeric values |

---

## Summary

LINK delivers a compact, extensible monitoring stack: scheduled measurement → SQLite → health & analytics → FastAPI → Next.js dashboard. Minimal dependencies, easy to run locally, and structured for incremental enhancement.

---