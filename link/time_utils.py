from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Tuple


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_unix_ms(dt: datetime) -> int:
    return int(dt.timestamp() * 1000)


def days_ago_utc(days: int) -> datetime:
    return now_utc() - timedelta(days=days)


def split_datetime(dt: datetime) -> Tuple[str, str]:
    date_part = dt.astimezone(timezone.utc).strftime("%Y-%m-%d")
    time_part = dt.astimezone(timezone.utc).strftime("%H:%M:%S")
    return date_part, time_part 