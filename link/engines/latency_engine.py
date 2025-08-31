from __future__ import annotations

import platform
import statistics
import subprocess
from typing import Dict, List

from ..utils.logger import get_logger

logger = get_logger(__name__)


def _ping_once(host: str) -> float:
    system = platform.system().lower()
    if system == "windows":
        # Use Windows ping command with longer timeout and larger packet
        cmd = ["ping", "-n", "1", "-w", "10000", "-l", "32", host]
    else:
        cmd = ["ping", "-c", "1", "-W", "5", host]

    logger.debug(f"Running ping command: {' '.join(cmd)}")
    
    try:
        # Don't use shell=True to avoid command interpretation issues
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=15, shell=False)
        logger.debug(f"Ping return code: {proc.returncode}")
        logger.debug(f"Ping stdout: {repr(proc.stdout)}")
        logger.debug(f"Ping stderr: {repr(proc.stderr)}")
        
        if proc.returncode != 0:
            # Log more details about the failure
            error_msg = f"Ping failed with return code {proc.returncode}"
            if proc.stderr:
                error_msg += f", stderr: {proc.stderr.strip()}"
            if proc.stdout:
                error_msg += f", stdout: {proc.stdout.strip()}"
            raise RuntimeError(error_msg)
    except subprocess.TimeoutExpired:
        raise RuntimeError("Ping command timed out")
    except FileNotFoundError:
        raise RuntimeError("Ping command not found - check if ping is available in PATH")
    
    output = proc.stdout
    logger.debug(f"Ping output: {output}")

    # Parse ping output
    import re
    if system == "windows":
        # Windows ping output patterns
        patterns = [
            r'time[<=](\d+(?:\.\d+)?)ms',  # time=32ms or time<1ms
            r'Average\s*=\s*(\d+(?:\.\d+)?)ms',  # Average = 32ms
            r'(\d+(?:\.\d+)?)ms',  # Just 32ms
            r'Reply.*time[<=](\d+(?:\.\d+)?)ms'  # Reply from ... time=32ms
        ]
        
        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                latency = float(match.group(1))
                logger.debug(f"Parsed Windows ping latency: {latency}ms")
                return latency
        
        # Handle sub-millisecond responses
        if "time<1ms" in output.lower() or "<1ms" in output.lower():
            logger.debug("Parsed Windows ping latency: <1ms, using 0.5ms")
            return 0.5
    else:
        # Linux/Unix ping output
        match = re.search(r'time=(\d+(?:\.\d+)?)\s*ms', output)
        if match:
            latency = float(match.group(1))
            logger.debug(f"Parsed Unix ping latency: {latency}ms")
            return latency

    # Fallback parsing - look for any millisecond values
    matches = re.findall(r'(\d+(?:\.\d+)?)\s*ms', output, re.IGNORECASE)
    if matches:
        # Return the first reasonable latency value
        for match in matches:
            value = float(match)
            if 0.1 <= value <= 2000:  # Reasonable ping range
                logger.debug(f"Parsed latency: {value}ms from output")
                return value

    # Log full output for debugging
    logger.error(f"Unable to parse ping output: {repr(output)}")
    raise RuntimeError(f"Unable to parse ping output from: {output[:200]}...")



def sample_latency_and_jitter(host: str, samples: int = 10) -> Dict[str, float]:
    latencies: List[float] = []
    failed_samples = 0
    
    logger.info(f"Starting latency measurement to {host} with {samples} samples")
    
    for i in range(samples):
        try:
            # Try ICMP ping first
            latency = _ping_once(host)
            latencies.append(latency)
            logger.debug(f"Sample {i+1}: {latency:.2f}ms")
        except Exception as exc:
            failed_samples += 1
            logger.warning(f"Ping sample {i+1} failed: {exc}")
            # Continue with remaining samples

    if not latencies:
        raise RuntimeError(f"All {samples} ping samples failed")
    
    if failed_samples > 0:
        logger.warning(f"{failed_samples}/{samples} ping samples failed")

    # Calculate statistics
    avg_latency = statistics.mean(latencies)
    
    # Calculate jitter as standard deviation of latencies
    if len(latencies) > 1:
        jitter = statistics.stdev(latencies)  # Use sample standard deviation
    else:
        jitter = 0.0
    
    # Log individual samples for debugging
    logger.info(f"Latency samples: {[f'{l:.1f}' for l in latencies]} ms")
    logger.info(f"Results - Latency: {avg_latency:.2f} ms | Jitter: {jitter:.2f} ms | Success: {len(latencies)}/{samples}")
    
    return {"latency_ms": round(avg_latency, 2), "jitter_ms": round(jitter, 2)}