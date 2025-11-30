from __future__ import annotations

import threading
import time
from typing import Callable, Optional

import schedule

from .config import load_config
from .latency import sample_latency_and_jitter
from .speed import run_speed_test
from .database import init_db, insert_result
from .logger import get_logger

logger = get_logger(__name__)


class Scheduler:
    def __init__(self, interval_minutes: Optional[int] = None):
        self.cfg = load_config()
        self.interval_minutes = interval_minutes or self.cfg.interval_minutes
        init_db(self.cfg.database_path)
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()

    def _job(self) -> None:
        try:
            logger.info("Starting network measurement job")
            
            # Run speed test
            speed = run_speed_test(timeout=self.cfg.speed_timeout)
            logger.info(f"Speed test completed: {speed['download_mbps']:.1f}/{speed['upload_mbps']:.1f} Mbps")
            
            # Run latency test
            lat = sample_latency_and_jitter(self.cfg.ping_target, self.cfg.ping_samples)
            logger.info(f"Latency test completed: {lat['latency_ms']:.1f}ms/{lat['jitter_ms']:.1f}ms")
            
            # Store results
            insert_result(
                self.cfg.database_path,
                download_mbps=speed["download_mbps"],
                upload_mbps=speed["upload_mbps"],
                latency_ms=lat["latency_ms"],
                jitter_ms=lat["jitter_ms"],
            )
            logger.info("Network measurement completed and stored")
        except Exception as exc:
            logger.error(f"Network measurement failed: {exc}", exc_info=True)

    def start(self) -> None:
        schedule.every(self.interval_minutes).minutes.do(self._job)
        logger.info(f"Scheduler started: every {self.interval_minutes} minutes")

        def _run():
            while not self._stop_event.is_set():
                schedule.run_pending()
                time.sleep(1)

        self._thread = threading.Thread(target=_run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=5)
        logger.info("Scheduler stopped") 