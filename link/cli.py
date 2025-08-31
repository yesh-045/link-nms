from __future__ import annotations

import json
from typing import Optional

import typer

from .config import load_config

from .engines.latency_engine import sample_latency_and_jitter
from .engines.speed_engine import run_speed_test
from .scheduler import Scheduler
from .storage.db import fetch_averages, fetch_latest, fetch_since_days, init_db, insert_result
from .utils.logger import get_logger

app = typer.Typer(help="LINK – Lightweight Internet Network Keeper")
app.__name__ = "__main__"
logger = get_logger(__name__)


@app.command("run-once")
def run_once() -> None:
    """Run one immediate measurement and store the result."""
    cfg = load_config()
    init_db(cfg.database_path)
    speed = run_speed_test(timeout=cfg.speed_timeout)
    lat = sample_latency_and_jitter(cfg.ping_target, cfg.ping_samples)
    row_id = insert_result(
        cfg.database_path,
        download_mbps=speed["download_mbps"],
        upload_mbps=speed["upload_mbps"],
        latency_ms=lat["latency_ms"],
        jitter_ms=lat["jitter_ms"],
    )
    typer.echo(json.dumps({"id": row_id, **speed, **lat}, indent=2))


@app.command("schedule")
def schedule_cmd(interval: Optional[int] = typer.Option(None, help="Interval minutes (default from config)")) -> None:
    """Start background scheduler (runs until interrupted)."""
    scheduler = Scheduler(interval_minutes=interval)
    scheduler.start()
    try:
        typer.echo("Scheduler running. Press Ctrl+C to stop.")
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        scheduler.stop()


@app.command("export")
def export_cmd(fmt: str = typer.Option("json", "--fmt", help="Export format: json"), days: int = typer.Option(30, "--days", help="Days of history")) -> None:
    cfg = load_config()
    rows = fetch_since_days(cfg.database_path, days)
    data = [r.__dict__ for r in rows]
    if fmt == "json":
        typer.echo(json.dumps(data, indent=2))
    else:
        raise typer.BadParameter("Unsupported format")



@app.command("dashboard")
def dashboard_cmd() -> None:
    """Launch the FastAPI backend for the modern dashboard."""
    cfg = load_config()
    import uvicorn
    from .api.main import app
    typer.echo(f"Starting LINK Network Health API at http://{cfg.api_host}:{cfg.api_port}")
    uvicorn.run(app, host=cfg.api_host, port=cfg.api_port)

@app.command("stats")
def stats_cmd(days: int = typer.Option(7, help="Averages over last N days")) -> None:
    cfg = load_config()
    avgs = fetch_averages(cfg.database_path, days)
    if not avgs:
        typer.echo(json.dumps({"error": "no data"}))
        raise typer.Exit(code=1)
    download_mbps, upload_mbps, latency_ms, jitter_ms = avgs
    typer.echo(
        json.dumps(
            {
                "days": days,
                "avg_download_mbps": round(download_mbps, 2),
                "avg_upload_mbps": round(upload_mbps, 2),
                "avg_latency_ms": round(latency_ms, 2),
                "avg_jitter_ms": round(jitter_ms, 2),
            },
            indent=2,
        )
    ) 