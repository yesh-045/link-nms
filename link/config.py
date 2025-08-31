from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class Config:
    database_path: str = os.environ.get("LINK_DB", os.path.join(os.getcwd(), "link_data.sqlite3"))
    interval_minutes: int = int(os.environ.get("LINK_INTERVAL", "15"))
    api_host: str = os.environ.get("LINK_API_HOST", "127.0.0.1")
    api_port: int = int(os.environ.get("LINK_API_PORT", "5000"))
    ping_target: str = os.environ.get("LINK_PING_TARGET", "10.1.216.10")
    ping_samples: int = int(os.environ.get("LINK_PING_SAMPLES", "8"))
    speed_timeout: int = int(os.environ.get("LINK_SPEED_TIMEOUT", "30"))


def load_config() -> Config:
    return Config()