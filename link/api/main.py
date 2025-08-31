from __future__ import annotations

from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ..analysis.health_score import HealthInputs, compute_health
from ..config import load_config
from ..storage.db import fetch_averages, fetch_latest, fetch_since_days, init_db
from ..utils.logger import get_logger

app = FastAPI(
    title="LINK Network Health API",
    description="Simple network performance monitoring and health scoring",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = get_logger(__name__)

# Pydantic models
class NetworkMetrics(BaseModel):
    id: int
    timestamp: str
    download_mbps: float
    upload_mbps: float
    latency_ms: float
    jitter_ms: float

class HealthScoreRequest(BaseModel):
    profile: str = "default"

class HealthScoreResponse(BaseModel):
    score: float
    status: str
    profile: str
    components: dict
    explanations: List[dict]
    insights: List[str]
    timestamp: str

class StatsResponse(BaseModel):
    days: int
    avg_download_mbps: float
    avg_upload_mbps: float
    avg_latency_ms: float
    avg_jitter_ms: float

class TrendData(BaseModel):
    labels: List[str]
    download: List[float]
    upload: List[float]
    latency: List[float]
    jitter: List[float]

@app.on_event("startup")
async def startup_event():
    cfg = load_config()
    init_db(cfg.database_path)
    logger.info("LINK API started and database initialized")

@app.get("/")
async def root():
    return {"message": "LINK Network Health API", "version": "1.0.0"}

@app.get("/api/health", response_model=HealthScoreResponse)
async def get_health_score():
    """Get current network health score with detailed explanations"""
    cfg = load_config()
    row = fetch_latest(cfg.database_path)
    
    if not row:
        raise HTTPException(status_code=404, detail="No network data available")
    
    # Parse timestamp
    try:
        timestamp = datetime.fromisoformat(row.timestamp.replace('Z', '+00:00'))
    except:
        timestamp = datetime.now()
    
    health_result = compute_health(
        HealthInputs(
            download_mbps=row.download_mbps,
            upload_mbps=row.upload_mbps,
            latency_ms=row.latency_ms,
            jitter_ms=row.jitter_ms,
        )
    )
    
    return HealthScoreResponse(
        score=health_result.score,
        status=health_result.status,
        profile="default",
        components=health_result.components,
        explanations=[{
            "metric": exp.metric,
            "value": exp.value,
            "status": exp.status,
            "explanation": exp.explanation,
            "recommendation": exp.recommendation
        } for exp in health_result.explanations],
        insights=health_result.insights,
        timestamp=timestamp.isoformat()
    )

@app.get("/api/latest", response_model=NetworkMetrics)
async def get_latest_metrics():
    """Get the most recent network measurement"""
    cfg = load_config()
    row = fetch_latest(cfg.database_path)
    
    if not row:
        raise HTTPException(status_code=404, detail="No network data available")
    
    return NetworkMetrics(
        id=row.id,
        timestamp=row.timestamp,
        download_mbps=row.download_mbps,
        upload_mbps=row.upload_mbps,
        latency_ms=row.latency_ms,
        jitter_ms=row.jitter_ms
    )

@app.get("/api/history", response_model=List[NetworkMetrics])
async def get_history(days: int = Query(7, description="Number of days of history to retrieve")):
    """Get historical network measurements"""
    cfg = load_config()
    rows = fetch_since_days(cfg.database_path, days)
    
    return [
        NetworkMetrics(
            id=row.id,
            timestamp=row.timestamp,
            download_mbps=row.download_mbps,
            upload_mbps=row.upload_mbps,
            latency_ms=row.latency_ms,
            jitter_ms=row.jitter_ms
        )
        for row in rows
    ]

@app.get("/api/stats", response_model=StatsResponse)
async def get_statistics(days: int = Query(7, description="Number of days for statistics")):
    """Get aggregated statistics over a time period"""
    cfg = load_config()
    avgs = fetch_averages(cfg.database_path, days)
    
    if not avgs:
        raise HTTPException(status_code=404, detail="No data available for the specified period")
    
    download_mbps, upload_mbps, latency_ms, jitter_ms = avgs
    
    return StatsResponse(
        days=days,
        avg_download_mbps=round(download_mbps, 2),
        avg_upload_mbps=round(upload_mbps, 2),
        avg_latency_ms=round(latency_ms, 2),
        avg_jitter_ms=round(jitter_ms, 2)
    )

@app.get("/api/trends", response_model=TrendData)
async def get_trends(days: int = Query(7, description="Number of days for trend analysis")):
    """Get trend data for charts"""
    cfg = load_config()
    rows = fetch_since_days(cfg.database_path, days)
    
    if not rows:
        raise HTTPException(status_code=404, detail="No data available for the specified period")
    
    # Sort by timestamp and extract data
    sorted_rows = sorted(rows, key=lambda x: x.timestamp)
    
    labels = []
    download = []
    upload = []
    latency = []
    jitter = []
    
    for row in sorted_rows:
        try:
            dt = datetime.fromisoformat(row.timestamp.replace('Z', '+00:00'))
            labels.append(dt.strftime("%m/%d %H:%M"))
        except:
            labels.append(row.timestamp[:16])
        
        download.append(round(row.download_mbps, 2))
        upload.append(round(row.upload_mbps, 2))
        latency.append(round(row.latency_ms, 2))
        jitter.append(round(row.jitter_ms, 2))
    
    return TrendData(
        labels=labels,
        download=download,
        upload=upload,
        latency=latency,
        jitter=jitter
    )

@app.get("/api/profiles")
async def get_profiles():
    """Get network health scoring weights"""
    from ..analysis.health_score import WEIGHTS
    
    return {
        "weights": WEIGHTS,
        "description": "Balanced scoring for general network performance assessment"
    }