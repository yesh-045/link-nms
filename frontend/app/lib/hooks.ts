import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from './api'
import { NetworkMetrics, HealthScoreResponse, StatsResponse, TrendData } from './types'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useLatestMetrics() {
  const [state, setState] = useState<UseApiState<NetworkMetrics>>({
    data: null,
    loading: true,
    error: null
  })

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const data = await api.getLatestMetrics()
      setState({ data, loading: false, error: null })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch latest metrics'
      setState({ data: null, loading: false, error: message })
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchData])

  return { ...state, refetch: fetchData }
}

export function useHealthScore() {
  const [state, setState] = useState<UseApiState<HealthScoreResponse>>({
    data: null,
    loading: true,
    error: null
  })

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const data = await api.getHealthScore()
      setState({ data, loading: false, error: null })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch health score'
      setState({ data: null, loading: false, error: message })
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...state, refetch: fetchData }
}

export function useHistory(days: number = 7) {
  const [state, setState] = useState<UseApiState<NetworkMetrics[]>>({
    data: null,
    loading: true,
    error: null
  })

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const data = await api.getHistory(days)
      setState({ data, loading: false, error: null })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch history'
      setState({ data: null, loading: false, error: message })
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...state, refetch: fetchData }
}

export function useStats(days: number = 7) {
  const [state, setState] = useState<UseApiState<StatsResponse>>({
    data: null,
    loading: true,
    error: null
  })

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const data = await api.getStats(days)
      setState({ data, loading: false, error: null })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch stats'
      setState({ data: null, loading: false, error: message })
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...state, refetch: fetchData }
}

export function useTrends(days: number = 7) {
  const [state, setState] = useState<UseApiState<TrendData>>({
    data: null,
    loading: true,
    error: null
  })

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const data = await api.getTrends(days)
      setState({ data, loading: false, error: null })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to fetch trends'
      setState({ data: null, loading: false, error: message })
    }
  }, [days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...state, refetch: fetchData }
} 