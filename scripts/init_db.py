from __future__ import annotations

from link.config import load_config
from link.storage.db import init_db

if __name__ == "__main__":
    cfg = load_config()
    init_db(cfg.database_path)
    print(f"Initialized DB at {cfg.database_path}") 