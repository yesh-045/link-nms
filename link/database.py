from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from typing import Iterator, List, Optional, Tuple

from .time_utils import now_utc


@dataclass
class ResultRow:
    id: int
    timestamp: str
    download_mbps: float
    upload_mbps: float
    latency_ms: float
    jitter_ms: float


def get_connection(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str) -> None:
    conn = get_connection(db_path)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                download_mbps REAL NOT NULL,
                upload_mbps REAL NOT NULL,
                latency_ms REAL NOT NULL,
                jitter_ms REAL NOT NULL
            );
            """
        )
        conn.commit()
    finally:
        conn.close()


@contextmanager
def session(db_path: str) -> Iterator[sqlite3.Connection]:
    conn = get_connection(db_path)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def insert_result(db_path: str, download_mbps: float, upload_mbps: float, latency_ms: float, jitter_ms: float, timestamp: Optional[datetime] = None) -> int:
    ts = (timestamp or now_utc()).isoformat()
    with session(db_path) as conn:
        cur = conn.execute(
            "INSERT INTO results (timestamp, download_mbps, upload_mbps, latency_ms, jitter_ms) VALUES (?, ?, ?, ?, ?)",
            (ts, download_mbps, upload_mbps, latency_ms, jitter_ms),
        )
        return int(cur.lastrowid)


def fetch_latest(db_path: str) -> Optional[ResultRow]:
    with session(db_path) as conn:
        cur = conn.execute("SELECT * FROM results ORDER BY id DESC LIMIT 1")
        row = cur.fetchone()
        if not row:
            return None
        return ResultRow(
            id=row["id"],
            timestamp=row["timestamp"],
            download_mbps=row["download_mbps"],
            upload_mbps=row["upload_mbps"],
            latency_ms=row["latency_ms"],
            jitter_ms=row["jitter_ms"],
        )


def fetch_since_days(db_path: str, days: int) -> List[ResultRow]:
    with session(db_path) as conn:
        cur = conn.execute(
            "SELECT * FROM results WHERE timestamp >= datetime('now', ?) ORDER BY timestamp ASC",
            (f"-{days} days",),
        )
        rows = cur.fetchall()
        return [
            ResultRow(
                id=r["id"],
                timestamp=r["timestamp"],
                download_mbps=r["download_mbps"],
                upload_mbps=r["upload_mbps"],
                latency_ms=r["latency_ms"],
                jitter_ms=r["jitter_ms"],
            )
            for r in rows
        ]


def fetch_averages(db_path: str, days: int) -> Optional[Tuple[float, float, float, float]]:
    with session(db_path) as conn:
        cur = conn.execute(
            """
            SELECT AVG(download_mbps), AVG(upload_mbps), AVG(latency_ms), AVG(jitter_ms)
            FROM results
            WHERE timestamp >= datetime('now', ?)
            """,
            (f"-{days} days",),
        )
        row = cur.fetchone()
        if not row or all(v is None for v in row):
            return None
        return float(row[0]), float(row[1]), float(row[2]), float(row[3]) 