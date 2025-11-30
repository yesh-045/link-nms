from __future__ import annotations

import json
import logging
import time
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.style import Style

from .config import load_config

from .latency import sample_latency_and_jitter
from .speed import run_speed_test
from .scheduler import Scheduler
from .database import fetch_averages, fetch_latest, fetch_since_days, init_db, insert_result
from .logger import get_logger

app = typer.Typer(help="LINK – Lightweight Internet Network Keeper")
app.__name__ = "__main__"
logger = get_logger(__name__)
console = Console()


@app.command("run-once")
def run_once() -> None:
    """Run one immediate measurement and store the result."""
    # Suppress info logs for clean CLI output
    logging.getLogger("link").setLevel(logging.WARNING)
    
    cfg = load_config()
    init_db(cfg.database_path)

    console.print(Panel.fit("Network Health Check", style="bold blue"))

    speed = {"download_mbps": 0.0, "upload_mbps": 0.0}
    lat = {"latency_ms": None, "jitter_ms": 0.0}

    with console.status("[bold cyan]Measuring network performance...[/bold cyan]", spinner="dots"):
        # Speed Test
        speed = run_speed_test(timeout=cfg.speed_timeout)
        
        # Latency Test
        lat = sample_latency_and_jitter(cfg.ping_target, cfg.ping_samples)

    if lat["latency_ms"] is None:
        console.print("[bold red]Error:[/bold red] Latency check failed.")
        raise typer.Exit(code=1)

    # Store results
    row_id = insert_result(
        cfg.database_path,
        download_mbps=speed["download_mbps"],
        upload_mbps=speed["upload_mbps"],
        latency_ms=lat["latency_ms"],
        jitter_ms=lat["jitter_ms"],
    )

    # Display Results
    table = Table(box=None, show_header=True, header_style="bold magenta")
    table.add_column("Metric", style="dim")
    table.add_column("Value", justify="right")
    table.add_column("Unit")

    table.add_row("Download", f"[bold green]{speed['download_mbps']:.2f}[/bold green]", "Mbps")
    table.add_row("Upload", f"[bold blue]{speed['upload_mbps']:.2f}[/bold blue]", "Mbps")
    table.add_row("Latency", f"[bold yellow]{lat['latency_ms']:.1f}[/bold yellow]", "ms")
    table.add_row("Jitter", f"{lat['jitter_ms']:.1f}", "ms")

    console.print(table)


@app.command("schedule")
def schedule_cmd(interval: Optional[int] = typer.Option(None, help="Interval minutes (default from config)")) -> None:
    """Start background scheduler (runs until interrupted)."""
    scheduler = Scheduler(interval_minutes=interval)
    scheduler.start()
    
    console.print(Panel.fit(
        f"[bold green]Scheduler Running[/bold green]\n"
        f"Interval: {scheduler.interval_minutes} minutes\n"
        f"Press [bold red]Ctrl+C[/bold red] to stop.",
        title="LINK Scheduler"
    ))
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        console.print("\n[bold yellow]Stopping scheduler...[/bold yellow]")
        scheduler.stop()
        console.print("[bold green]Scheduler stopped.[/bold green]")


@app.command("export")
def export_cmd(fmt: str = typer.Option("json", "--fmt", help="Export format: json"), days: int = typer.Option(30, "--days", help="Days of history")) -> None:
    cfg = load_config()
    rows = fetch_since_days(cfg.database_path, days)
    data = [r.__dict__ for r in rows]
    if fmt == "json":
        console.print_json(json.dumps(data))
    else:
        console.print("[bold red]Error:[/bold red] Unsupported format")
        raise typer.Exit(code=1)


@app.command("dashboard")
def dashboard_cmd() -> None:
    """Launch the FastAPI backend for the modern dashboard."""
    cfg = load_config()
    import uvicorn
    from .api.main import app
    
    console.print(Panel.fit(
        f"[bold cyan]LINK Dashboard API[/bold cyan]\n"
        f"Running at: [underline]http://{cfg.api_host}:{cfg.api_port}[/underline]",
        style="bold"
    ))
    uvicorn.run(app, host=cfg.api_host, port=cfg.api_port)

@app.command("stats")
def stats_cmd(days: int = typer.Option(7, help="Averages over last N days")) -> None:
    cfg = load_config()
    avgs = fetch_averages(cfg.database_path, days)
    
    if not avgs:
        console.print("[bold red]No data available for statistics.[/bold red]")
        raise typer.Exit(code=1)
        
    download_mbps, upload_mbps, latency_ms, jitter_ms = avgs
    
    table = Table(title=f"Network Statistics (Last {days} Days)")
    table.add_column("Metric", style="cyan")
    table.add_column("Average Value", justify="right", style="bold green")
    
    table.add_row("Avg Download", f"{download_mbps:.2f} Mbps")
    table.add_row("Avg Upload", f"{upload_mbps:.2f} Mbps")
    table.add_row("Avg Latency", f"{latency_ms:.2f} ms")
    table.add_row("Avg Jitter", f"{jitter_ms:.2f} ms")
    
    console.print(table) 