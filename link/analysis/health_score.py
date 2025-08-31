from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

# Simplified single profile approach
WEIGHTS = {"speed": 0.35, "latency": 0.35, "jitter": 0.20, "stability": 0.10}

@dataclass
class HealthInputs:
    download_mbps: float
    upload_mbps: float
    latency_ms: float
    jitter_ms: float
    stability: float = 1.0  # 0..1 uptime factor

@dataclass
class HealthExplanation:
    metric: str
    value: str
    status: str
    explanation: str
    recommendation: str

@dataclass
class HealthResult:
    score: float
    status: str
    components: Dict[str, float]
    explanations: List[HealthExplanation]
    insights: List[str]

def _get_status(score: float) -> str:
    if score >= 80:
        return "Excellent"
    elif score >= 60:
        return "Good"
    elif score >= 40:
        return "Fair"
    else:
        return "Poor"

def _normalize_speed(download_mbps: float, upload_mbps: float) -> float:
    # Consider combined effective throughput, cap at 200 Mbps for score
    combined = (download_mbps * 0.75) + (upload_mbps * 0.25)
    return max(0.0, min(1.0, combined / 200.0))

def _normalize_latency(latency_ms: float) -> float:
    # 0ms -> 1.0; 150ms -> ~0; clamp
    return max(0.0, min(1.0, (150.0 - latency_ms) / 150.0))

def _normalize_jitter(jitter_ms: float) -> float:
    # 0ms -> 1.0; 50ms -> ~0
    return max(0.0, min(1.0, (50.0 - jitter_ms) / 50.0))

def _generate_explanations(inputs: HealthInputs) -> List[HealthExplanation]:
    explanations = []
    
    # Latency explanation
    if inputs.latency_ms < 20:
        latency_status = "Excellent"
        latency_explanation = "Perfect for competitive gaming and real-time applications"
        latency_rec = "Your connection is ideal for gaming and video calls"
    elif inputs.latency_ms < 50:
        latency_status = "Good"
        latency_explanation = "Suitable for most online activities"
        latency_rec = "Good for casual gaming and streaming"
    elif inputs.latency_ms < 100:
        latency_status = "Fair"
        latency_explanation = "Acceptable for browsing but may affect gaming"
        latency_rec = "Consider gaming during off-peak hours"
    else:
        latency_status = "Poor"
        latency_explanation = "May cause issues with real-time applications"
        latency_rec = "Contact your ISP about connection quality"
    
    explanations.append(HealthExplanation(
        metric="Latency",
        value=f"{inputs.latency_ms:.1f}ms",
        status=latency_status,
        explanation=latency_explanation,
        recommendation=latency_rec
    ))
    
    # Download explanation
    if inputs.download_mbps >= 100:
        download_status = "Excellent"
        download_explanation = "Supports 4K streaming on multiple devices"
        download_rec = "Your download speed is excellent for all use cases"
    elif inputs.download_mbps >= 25:
        download_status = "Good"
        download_explanation = "Supports HD streaming and fast downloads"
        download_rec = "Good for most streaming and gaming needs"
    elif inputs.download_mbps >= 10:
        download_status = "Fair"
        download_explanation = "Basic streaming works but may buffer on HD"
        download_rec = "Consider upgrading for better streaming experience"
    else:
        download_status = "Poor"
        download_explanation = "May struggle with modern streaming services"
        download_rec = "Contact your ISP about speed issues"
    
    explanations.append(HealthExplanation(
        metric="Download",
        value=f"{inputs.download_mbps:.1f} Mbps",
        status=download_status,
        explanation=download_explanation,
        recommendation=download_rec
    ))
    
    # Upload explanation
    if inputs.upload_mbps >= 10:
        upload_status = "Excellent"
        upload_explanation = "Great for live streaming and video calls"
        upload_rec = "Your upload speed supports all online activities"
    elif inputs.upload_mbps >= 5:
        upload_status = "Good"
        upload_explanation = "Suitable for video calls and small uploads"
        upload_rec = "Good for most work and communication needs"
    elif inputs.upload_mbps >= 2:
        upload_status = "Fair"
        upload_explanation = "Basic video calls work but may be unstable"
        upload_rec = "Consider upgrading for better video call quality"
    else:
        upload_status = "Poor"
        upload_explanation = "Video calls may drop or be very poor quality"
        upload_rec = "Contact your ISP about upload speed issues"
    
    explanations.append(HealthExplanation(
        metric="Upload",
        value=f"{inputs.upload_mbps:.1f} Mbps",
        status=upload_status,
        explanation=upload_explanation,
        recommendation=upload_rec
    ))
    
    # Jitter explanation
    if inputs.jitter_ms < 5:
        jitter_status = "Excellent"
        jitter_explanation = "Very stable connection with minimal variation"
        jitter_rec = "Your connection stability is excellent"
    elif inputs.jitter_ms < 15:
        jitter_status = "Good"
        jitter_explanation = "Stable connection suitable for most activities"
        jitter_rec = "Good stability for gaming and streaming"
    elif inputs.jitter_ms < 30:
        jitter_status = "Fair"
        jitter_explanation = "Some variation that may affect real-time apps"
        jitter_rec = "Monitor for stability issues during peak hours"
    else:
        jitter_status = "Poor"
        jitter_explanation = "High variation may cause connection issues"
        jitter_rec = "Contact your ISP about connection stability"
    
    explanations.append(HealthExplanation(
        metric="Jitter",
        value=f"{inputs.jitter_ms:.1f}ms",
        status=jitter_status,
        explanation=jitter_explanation,
        recommendation=jitter_rec
    ))
    
    return explanations

def _generate_insights(inputs: HealthInputs) -> List[str]:
    insights = []
    
    # General performance insights
    if inputs.download_mbps < 10:
        insights.append("Low download speed may affect streaming and large downloads")
    elif inputs.download_mbps >= 100:
        insights.append("Excellent download speed supports 4K streaming and fast downloads")
    
    if inputs.upload_mbps < 3:
        insights.append("Low upload speed may affect video calls and file uploads")
    elif inputs.upload_mbps >= 10:
        insights.append("Great upload speed for video calls and content sharing")
    
    if inputs.latency_ms > 100:
        insights.append("High latency may cause delays in real-time applications")
    elif inputs.latency_ms < 20:
        insights.append("Excellent latency for gaming and video calls")
    
    if inputs.jitter_ms > 20:
        insights.append("High jitter may cause unstable connections")
    elif inputs.jitter_ms < 5:
        insights.append("Very stable connection with minimal variation")
    
    # Overall performance insights
    if inputs.download_mbps < 25 and inputs.latency_ms > 80:
        insights.append("Consider upgrading your internet plan for better overall performance")
    
    return insights

def compute_health(inputs: HealthInputs) -> HealthResult:
    s_speed = _normalize_speed(inputs.download_mbps, inputs.upload_mbps)
    s_latency = _normalize_latency(inputs.latency_ms)
    s_jitter = _normalize_jitter(inputs.jitter_ms)
    s_stability = max(0.0, min(1.0, inputs.stability))

    components = {
        "speed": s_speed,
        "latency": s_latency,
        "jitter": s_jitter,
        "stability": s_stability,
    }

    score_0_1 = sum(components[k] * WEIGHTS[k] for k in WEIGHTS)
    score = round(score_0_1 * 100.0, 2)
    
    explanations = _generate_explanations(inputs)
    insights = _generate_insights(inputs)
    
    return HealthResult(
        score=score,
        status=_get_status(score),
        components=components,
        explanations=explanations,
        insights=insights
    ) 