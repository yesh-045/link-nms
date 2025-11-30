from __future__ import annotations

import platform
import statistics
import subprocess
import socket
import time
from typing import Dict, List, Optional

from .logger import get_logger

logger = get_logger(__name__)

def _ping_once(host: str, timeout_s: int = 3) -> Optional[float]:
    system = platform.system().lower()
    if system == "windows":
        cmd = ["ping", "-n", "1", "-w", str(int(timeout_s * 1000)), host]
    else:
        cmd = ["ping", "-c", "1", "-W", str(max(1, int(timeout_s))), host]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout_s + 2, shell=False)
    except FileNotFoundError:
        logger.debug("ping not found on system")
        return None
    except subprocess.TimeoutExpired:
        return None

    out = proc.stdout or ""
    if proc.returncode != 0 and not out:
        return None

    # parse time=...ms
    import re
    m = re.search(r"time[=<]\s*(\d+(?:\.\d+)?)\s*ms", out, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1))
        except Exception:
            return None

    # fallback any ms value
    ms = re.findall(r"(\d+(?:\.\d+)?)\s*ms", out, re.IGNORECASE)
    for val in ms:
        try:
            f = float(val)
            if 0.01 <= f <= 10000:
                return f
        except Exception:
            continue
    return None

def _tcp_connect_once(host: str, port: int = 443, timeout_s: float = 2.0) -> Optional[float]:
    try:
        start = time.perf_counter()
        sock = socket.create_connection((host, port), timeout=timeout_s)
        sock.close()
        return (time.perf_counter() - start) * 1000.0
    except Exception:
        return None

def sample_latency_and_jitter(host: str, samples: int = 8, base_timeout: int = 1) -> Dict[str, Optional[float]]:
    """
    Attempts ICMP first. If all ICMP samples fail, falls back to TCP connect probes (port 443).
    Always returns:
      { "latency_ms": float|None, "jitter_ms": float|None, "packet_loss_pct": float, "samples": int, "failed": int, "method": "ICMP"|"TCP"|"NONE" }
    """
    logger.info("Starting latency measurement to %s with %d samples", host, samples)

    # Try ICMP to host
    icmp_samples: List[float] = []
    failed = 0
    for i in range(samples):
        val = _ping_once(host, timeout_s=base_timeout)
        if val is not None:
            icmp_samples.append(val)
        else:
            failed += 1
        time.sleep(0.12)

    if icmp_samples:
        loss = round(100.0 * (failed / samples), 2)
        mean = round(statistics.mean(icmp_samples), 2)
        jitter = round(statistics.stdev(icmp_samples) if len(icmp_samples) > 1 else 0.0, 2)
        return {
            "latency_ms": mean,
            "jitter_ms": jitter,
            "packet_loss_pct": loss,
            "samples": samples,
            "failed": failed,
            "method": "ICMP",
        }

    # If ICMP entirely failed: try fallback targets (public resolvers) on TCP
    fallback_hosts = [host, "1.1.1.1", "8.8.8.8"]
    tcp_samples: List[float] = []
    used_host = None
    for fh in fallback_hosts:
        tcp_samples.clear()
        failed_tcp = 0
        for i in range(samples):
            val = _tcp_connect_once(fh, port=443, timeout_s=base_timeout)
            if val is not None:
                tcp_samples.append(val)
            else:
                failed_tcp += 1
            time.sleep(0.12)
        if tcp_samples:
            used_host = fh
            loss = round(100.0 * (failed_tcp / samples), 2)
            mean = round(statistics.mean(tcp_samples), 2)
            jitter = round(statistics.stdev(tcp_samples) if len(tcp_samples) > 1 else 0.0, 2)
            return {
                "latency_ms": mean,
                "jitter_ms": jitter,
                "packet_loss_pct": loss,
                "samples": samples,
                "failed": failed_tcp,
                "method": "TCP",
                "probe_host": used_host,
            }

    # Nothing worked
    return {
        "latency_ms": -1,
        "jitter_ms": -1,
        "packet_loss_pct": 100.0,
        "samples": samples,
        "failed": samples,
        "method": "NONE",
    }
