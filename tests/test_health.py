from __future__ import annotations

from link.analysis.health_score import HealthInputs, compute_health


def test_health_profiles_sensitivity_to_latency():
    fast_net = HealthInputs(download_mbps=200, upload_mbps=100, latency_ms=10, jitter_ms=2)
    slower_latency = HealthInputs(download_mbps=200, upload_mbps=100, latency_ms=80, jitter_ms=2)

    default_fast_result = compute_health(fast_net, profile="default")
    default_slow_result = compute_health(slower_latency, profile="default")

    gaming_fast_result = compute_health(fast_net, profile="gaming")
    gaming_slow_result = compute_health(slower_latency, profile="gaming")

    # Scores are within 0..100
    for result in [default_fast_result, default_slow_result, gaming_fast_result, gaming_slow_result]:
        assert 0 <= result.score <= 100

    # Increased latency reduces score; more strongly for gaming profile
    default_drop = default_fast_result.score - default_slow_result.score
    gaming_drop = gaming_fast_result.score - gaming_slow_result.score
    assert default_drop > 0
    assert gaming_drop > default_drop 