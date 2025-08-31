from __future__ import annotations

from typing import Iterable, List, Tuple


def moving_average(values: Iterable[float], window: int) -> List[float]:
    vals = list(values)
    if window <= 1:
        return vals
    result: List[float] = []
    for i in range(len(vals)):
        start = max(0, i - window + 1)
        window_vals = vals[start : i + 1]
        result.append(sum(window_vals) / len(window_vals))
    return result


def zscore_anomalies(values: Iterable[float], threshold: float = 3.0) -> List[int]:
    vals = list(values)
    if not vals:
        return []
    mean = sum(vals) / len(vals)
    variance = sum((v - mean) ** 2 for v in vals) / len(vals)
    std = variance ** 0.5
    if std == 0:
        return []
    anomalies: List[int] = []
    for i, v in enumerate(vals):
        z = abs((v - mean) / std)
        if z >= threshold:
            anomalies.append(i)
    return anomalies 