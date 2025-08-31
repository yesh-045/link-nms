import { 
  NetworkMetrics, 
  HealthScoreResponse, 
  StatsResponse, 
  TrendData, 
  ProfilesResponse 
} from './types'

const API_BASE = 'http://localhost:5000/api'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(0, `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export const api = {
  // Get latest network metrics
  async getLatestMetrics(): Promise<NetworkMetrics> {
    return fetchApi<NetworkMetrics>('/latest')
  },

  // Get health score
  async getHealthScore(): Promise<HealthScoreResponse> {
    return fetchApi<HealthScoreResponse>('/health')
  },

  // Get historical data
  async getHistory(days: number = 7): Promise<NetworkMetrics[]> {
    return fetchApi<NetworkMetrics[]>(`/history?days=${days}`)
  },

  // Get statistics
  async getStats(days: number = 7): Promise<StatsResponse> {
    return fetchApi<StatsResponse>(`/stats?days=${days}`)
  },

  // Get trend analysis
  async getTrends(days: number = 7): Promise<TrendData> {
    return fetchApi<TrendData>(`/trends?days=${days}`)
  },

  // Get available profiles
  async getProfiles(): Promise<ProfilesResponse> {
    return fetchApi<ProfilesResponse>('/profiles')
  },

  // Run a network test
  async runTest(): Promise<NetworkMetrics> {
    return fetchApi<NetworkMetrics>('/test', { method: 'POST' })
  }
}

export { ApiError } 