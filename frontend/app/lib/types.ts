export interface NetworkMetrics {
  id: number
  timestamp: string
  download_mbps: number
  upload_mbps: number
  latency_ms: number
  jitter_ms: number
}

export interface HealthExplanation {
  metric: string
  value: string
  status: string
  explanation: string
  recommendation: string
}

export interface HealthComponents {
  speed: number
  latency: number
  jitter: number
  stability: number
}

export interface HealthResult {
  score: number
  status: string
  profile: string
  components: HealthComponents
  explanations: HealthExplanation[]
  insights: string[]
}

export interface HealthScoreResponse {
  score: number
  status: string
  profile: string
  components: HealthComponents
  explanations: HealthExplanation[]
  insights: string[]
  timestamp: string
}

export interface StatsResponse {
  days: number
  avg_download_mbps: number
  avg_upload_mbps: number
  avg_latency_ms: number
  avg_jitter_ms: number
}

export interface TrendData {
  labels: string[]
  download: number[]
  upload: number[]
  latency: number[]
  jitter: number[]
}

export interface Profile {
  weights: {
    speed: number
    latency: number
    jitter: number
    stability: number
  }
  description: string
}

export interface ProfilesResponse {
  profiles: Record<string, Profile>
}

export interface TimeRange {
  label: string
  days: number
} 