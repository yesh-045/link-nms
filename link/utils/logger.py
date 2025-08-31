from __future__ import annotations

import logging
from logging import Logger

try:
    from colorlog import ColoredFormatter
except Exception:  # pragma: no cover
    ColoredFormatter = None  # type: ignore


def get_logger(name: str = "link") -> Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()

    if ColoredFormatter:
        formatter = ColoredFormatter(
            "%(log_color)s[%(levelname)s]%(reset)s %(asctime)s - %(name)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
            reset=True,
            log_colors={
                "DEBUG": "cyan",
                "INFO": "green",
                "WARNING": "yellow",
                "ERROR": "red",
                "CRITICAL": "bold_red",
            },
        )
    else:
        formatter = logging.Formatter("[%(levelname)s] %(asctime)s - %(name)s: %(message)s")

    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False
    return logger 