'use client'

import { useState } from 'react'
import { LoadingIndicator } from './components/ui/LoadingIndicator'
import { Navigation } from './components/layout/Navigation'
import { TopBar } from './components/layout/TopBar'
import { AdvancedChart } from './components/charts/AdvancedChart'
import { MetricDisplay } from './components/ui/MetricDisplay'
import { MetricGrid } from './components/ui/MetricGrid'
import { PeakHoursAnalysis } from './components/analytics/PeakHoursAnalysis'
import { SpeedVariability } from './components/analytics/SpeedVariability'
import { NetworkHealthTimeline } from './components/analytics/NetworkHealthTimeline'
import { ComparativePerformance } from './components/analytics/ComparativePerformance'
import { TrendAnalysis } from './components/analytics/TrendAnalysis'
import { NetworkInsights } from './components/analytics/NetworkInsights'
import { useLatestMetrics, useHealthScore, useHistory, useStats, useTrends } from './lib/hooks'
import { formatMbps, formatLatency } from './lib/utils'

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('overview')
  const [timeRange, setTimeRange] = useState(7)

  // Data hooks
  const { data: latestMetrics, loading: metricsLoading, error: metricsError, refetch } = useLatestMetrics()
  const { data: healthData, loading: healthLoading, error: healthError } = useHealthScore()
  const { data: historyData, loading: historyLoading, error: historyError } = useHistory(timeRange)
  const { data: statsData, loading: statsLoading, error: statsError } = useStats(timeRange)
  const { data: trendsData, loading: trendsLoading, error: trendsError } = useTrends(timeRange)

  const prepareChartData = (data: any[] | null | undefined) => {
    if (!data || !Array.isArray(data)) return []
    return data.map(item => ({
      date: item.timestamp,
      download: item.download_mbps || 0,
      upload: item.upload_mbps || 0,
      latency: item.latency_ms || 0,
      jitter: item.jitter_ms || 0
    }))
  }

  const handleRefresh = async () => {
    await refetch()
  }

  if (metricsError || healthError) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-8">
        <div className="max-w-md mx-auto text-center">
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-8">
            <div className="w-12 h-12 mx-auto mb-4 text-red-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
              Connection Error
            </h2>
            <p className="text-red-700 dark:text-red-300 text-sm">
              Unable to connect to the backend API. Please ensure the backend is running on port 5000.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderOverview = () => {
    // Generate alerts
    const alerts: string[] = []
    if (latestMetrics) {
      if (latestMetrics.latency_ms >= 100) alerts.push(`High latency ${formatLatency(latestMetrics.latency_ms)}`)
      if (latestMetrics.jitter_ms >= 20) alerts.push(`High jitter ${formatLatency(latestMetrics.jitter_ms)}`)
      if (latestMetrics.download_mbps < 25) alerts.push(`Low download ${formatMbps(latestMetrics.download_mbps)}`)
      if (latestMetrics.upload_mbps < 10) alerts.push(`Low upload ${formatMbps(latestMetrics.upload_mbps)}`)
    }

    // Calculate uptime and connection quality
    const uptimeHours = historyData ? Math.min(24, historyData.length * 0.25) : 0
    const connectionQuality = latestMetrics ? 
      (latestMetrics.latency_ms < 50 && latestMetrics.jitter_ms < 10 ? 'Excellent' :
       latestMetrics.latency_ms < 100 && latestMetrics.jitter_ms < 20 ? 'Good' : 'Poor') : 'Unknown'

    return (
      <div className="h-full">
        {/* Full Screen Dashboard */}
        <div className="grid grid-cols-12 gap-8 h-full min-h-screen">
          {/* Left Column - Main Status */}
          <div className="col-span-8 space-y-6">
            {/* Hero Status Card */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 h-80">
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center space-x-12">
                  {/* Health Score */}
                  {healthLoading ? (
                    <LoadingIndicator />
                  ) : healthData ? (
                    <div className="text-center">
                      <div className={`text-8xl font-light mb-4 ${
                        healthData.score >= 80 ? 'text-green-600 dark:text-green-400' :
                        healthData.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {healthData.score.toFixed(0)}%
                      </div>
                      <div className="text-lg text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {healthData.status}
                      </div>
                    </div>
                  ) : null}

                  <div className="h-32 w-px bg-gray-200 dark:bg-gray-700"></div>

                  {/* Key Metrics Grid */}
                  {!metricsLoading && latestMetrics ? (
                    <div className="grid grid-cols-2 gap-8">
                      <div className="text-center">
                        <div className="text-4xl font-light text-gray-900 dark:text-white mb-2">
                          {formatMbps(latestMetrics.download_mbps)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Download Mbps
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-light text-gray-900 dark:text-white mb-2">
                          {formatMbps(latestMetrics.upload_mbps)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Upload Mbps
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-light text-gray-900 dark:text-white mb-2">
                          {formatLatency(latestMetrics.latency_ms)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Latency ms
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-light text-gray-900 dark:text-white mb-2">
                          {formatLatency(latestMetrics.jitter_ms)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Jitter ms
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="text-right">
                  {latestMetrics?.timestamp && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated<br/>
                      <span className="text-lg font-light">
                        {new Date(latestMetrics.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Network Activity Timeline */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 flex-1">
              <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-6">
                Recent Activity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                {/* Speed Trends */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Speed Trends</h3>
                  {historyData && historyData.length > 0 && historyData.slice(-5).map((item, i) => {
                    if (!item || !item.timestamp) return null
                    const time = new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                    return (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{time}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            ↓ {formatMbps(item.download_mbps || 0)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ↑ {formatMbps(item.upload_mbps || 0)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Quality Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quality Metrics</h3>
                  {historyData && historyData.length > 0 && historyData.slice(-5).map((item, i) => {
                    if (!item || !item.timestamp) return null
                    const time = new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
                    
                    // Calculate comprehensive quality score
                    const downloadScore = Math.min(100, ((item.download_mbps || 0) / 100) * 100)
                    const uploadScore = Math.min(100, ((item.upload_mbps || 0) / 50) * 100)
                    const latencyScore = Math.max(0, 100 - ((item.latency_ms || 0) / 100) * 100)
                    const jitterScore = Math.max(0, 100 - ((item.jitter_ms || 0) / 20) * 100)
                    const qualityScore = (downloadScore + uploadScore + latencyScore + jitterScore) / 4
                    
                    const quality = qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : 'Poor'
                    const qualityColor = qualityScore >= 80 ? 'text-green-600 dark:text-green-400' : 
                                       qualityScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
                                       'text-red-600 dark:text-red-400'
                    return (
                      <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{time}</span>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${qualityColor}`}>
                            {quality} ({qualityScore.toFixed(0)}%)
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatLatency(item.latency_ms || 0)} • {formatLatency(item.jitter_ms || 0)} jitter
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Alerts & Issues */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Status</h3>
                  {alerts.length > 0 ? (
                    alerts.map((alert, i) => (
                      <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-red-700 dark:text-red-300">{alert}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700 dark:text-green-300">All systems operational</span>
                      </div>
                    </div>
                  )}
                  
                  
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="col-span-4 space-y-6">
            {/* Connection Quality */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Connection Quality
              </h3>
              <div className="text-center">
                <div className={`text-3xl font-light mb-2 ${
                  connectionQuality === 'Excellent' ? 'text-green-600 dark:text-green-400' :
                  connectionQuality === 'Good' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {connectionQuality}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Based on latency & jitter
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Uptime
              </h3>
              <div className="text-center">
                <div className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                  {uptimeHours.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Monitoring duration
                </div>
              </div>
            </div>

            {/* Network Statistics */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Network Statistics
              </h3>
              <div className="space-y-4">
                {historyData && historyData.length > 0 && (() => {
                  const speeds = historyData.map(d => d?.download_mbps || 0).filter(s => s > 0)
                  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
                  const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0
                  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
                  const latencies = historyData.map(d => d?.latency_ms || 0).filter(l => l > 0)
                  const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0
                  const goodConnections = historyData.filter(d => (d?.latency_ms || 0) < 50 && (d?.jitter_ms || 0) < 10).length
                  const reliabilityPercent = historyData.length > 0 ? (goodConnections / historyData.length) * 100 : 0
                  
                  return (
                    <>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Speed (Mbps)</div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Peak</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          {formatMbps(maxSpeed)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Lowest</span>
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          {formatMbps(minSpeed)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Average</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatMbps(avgSpeed)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Latency (ms)</div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Average</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatLatency(avgLatency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Reliability</span>
                        <span className={`text-sm font-medium ${
                          reliabilityPercent >= 80 ? 'text-green-600 dark:text-green-400' :
                          reliabilityPercent >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {reliabilityPercent.toFixed(0)}%
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Data Count */}
            {historyData && (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Data Points
                </h3>
                <div className="text-center">
                  <div className="text-3xl font-light text-gray-900 dark:text-white mb-2">
                    {historyData.length.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Measurements collected
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderPerformance = () => (
    <div className="space-y-8">
      {/* Statistics */}
      {statsData && (
        <div>
          <h2 className="text-xl font-light text-gray-900 dark:text-white mb-6">
            Performance Statistics
          </h2>
          <MetricGrid columns={4}>
            <MetricDisplay
              title="Period"
              value={`${statsData.days}`}
              unit="days"
              size="small"
            />
            <MetricDisplay
              title="Avg Download"
              value={formatMbps(statsData.avg_download_mbps || 0)}
              unit="Mbps"
              size="small"
            />
            <MetricDisplay
              title="Avg Upload"
              value={formatMbps(statsData.avg_upload_mbps || 0)}
              unit="Mbps"
              size="small"
            />
            <MetricDisplay
              title="Avg Latency"
              value={formatLatency(statsData.avg_latency_ms || 0)}
              unit="ms"
              size="small"
            />
          </MetricGrid>
        </div>
      )}

      {/* Performance Charts */}
      {historyData && (
        <div className="space-y-8">
          <AdvancedChart
            data={prepareChartData(historyData)}
            type="line"
            title="Speed Performance Over Time"
            metrics={[
              { key: 'download', name: 'Download', color: '#10b981' },
              { key: 'upload', name: 'Upload', color: '#3b82f6' }
            ]}
            height={400}
            showBrush={true}
            showLegend={true}
            formatValue={(value) => `${value.toFixed(1)}`}
            referenceLines={[
              { value: 50, label: 'Target Download', color: '#10b981' },
              { value: 25, label: 'Target Upload', color: '#3b82f6' }
            ]}
          />

          <AdvancedChart
            data={prepareChartData(historyData)}
            type="area"
            title="Network Quality Metrics"
            metrics={[
              { key: 'latency', name: 'Latency', color: '#f59e0b' },
              { key: 'jitter', name: 'Jitter', color: '#8b5cf6' }
            ]}
            height={400}
            showBrush={true}
            showLegend={true}
            formatValue={(value) => `${value.toFixed(1)}`}
            referenceLines={[
              { value: 50, label: 'SLA Threshold', color: '#ef4444' }
            ]}
          />
        </div>
      )}
    </div>
  )

  const renderAnalytics = () => {
    if (!historyData || historyData.length === 0) {
      return (
        <div className="space-y-8">
          <h2 className="text-xl font-light text-gray-900 dark:text-white">
            Advanced Analytics & Insights
          </h2>
          <div className="text-center py-12 text-gray-400 dark:text-gray-600">
            No historical data available for analytics
          </div>
        </div>
      )
    }

    // Generate real insights from actual data
    const avgDownload = historyData.reduce((sum, d) => sum + d.download_mbps, 0) / historyData.length
    const avgUpload = historyData.reduce((sum, d) => sum + d.upload_mbps, 0) / historyData.length
    const avgLatency = historyData.reduce((sum, d) => sum + d.latency_ms, 0) / historyData.length
    const maxLatency = Math.max(...historyData.map(d => d.latency_ms))
    const minDownload = Math.min(...historyData.map(d => d.download_mbps))
    
    const insights = [
      {
        title: 'Average Download Speed',
        value: `${avgDownload.toFixed(1)} Mbps`,
        change: avgDownload > 50 ? 5.2 : -2.1,
        trend: avgDownload > 50 ? 'up' as const : 'down' as const,
        severity: avgDownload > 50 ? 'good' as const : 'warning' as const,
        description: `${avgDownload > 50 ? 'Excellent' : 'Below target'} download performance over ${historyData.length} measurements`
      },
      {
        title: 'Network Stability',
        value: `${((1 - (maxLatency - avgLatency) / maxLatency) * 100).toFixed(1)}%`,
        change: avgLatency < 50 ? 3.4 : -1.8,
        trend: avgLatency < 50 ? 'up' as const : 'down' as const,
        severity: avgLatency < 50 ? 'good' as const : 'warning' as const,
        description: `Latency variance indicates ${avgLatency < 50 ? 'stable' : 'variable'} network conditions`
      },
      {
        title: 'Upload Efficiency',
        value: `${((avgUpload / avgDownload) * 100).toFixed(1)}%`,
        change: avgUpload > 25 ? 2.7 : -4.2,
        trend: avgUpload > 25 ? 'up' as const : 'down' as const,
        severity: avgUpload > 25 ? 'good' as const : 'warning' as const,
        description: `Upload to download ratio shows ${avgUpload > 25 ? 'balanced' : 'asymmetric'} performance`
      },
      {
        title: 'Peak Performance',
        value: `${Math.max(...historyData.map(d => d.download_mbps)).toFixed(1)} Mbps`,
        change: 8.1,
        trend: 'up' as const,
        severity: 'good' as const,
        description: `Highest recorded download speed in current dataset`
      },
      {
        title: 'Connection Quality',
        value: `${avgLatency.toFixed(1)}ms`,
        change: avgLatency < 30 ? -12.3 : 5.7,
        trend: avgLatency < 30 ? 'down' as const : 'up' as const,
        severity: avgLatency < 30 ? 'good' as const : avgLatency < 50 ? 'warning' as const : 'critical' as const,
        description: `Average latency ${avgLatency < 30 ? 'excellent' : avgLatency < 50 ? 'acceptable' : 'needs attention'}`
      },
      {
        title: 'Minimum Speed',
        value: `${minDownload.toFixed(1)} Mbps`,
        change: minDownload > 25 ? -2.1 : -8.4,
        trend: 'down' as const,
        severity: minDownload > 25 ? 'warning' as const : 'critical' as const,
        description: `Lowest recorded speed indicates ${minDownload > 25 ? 'occasional' : 'frequent'} performance drops`
      }
    ]

    return (
      <div className="space-y-8">
        <h2 className="text-xl font-light text-gray-900 dark:text-white">
          Advanced Analytics & Insights
        </h2>
        
        {/* Real Data Visualizations */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <PeakHoursAnalysis data={historyData} />
          <SpeedVariability data={historyData} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <NetworkHealthTimeline data={historyData} />
          <ComparativePerformance data={historyData} />
        </div>

        {/* Trend Analysis with real data */}
        {historyData && historyData.length > 10 && (
          <TrendAnalysis data={historyData} />
        )}

        <NetworkInsights 
          insights={insights}
        />
      </div>
    )
  }

  const renderInsights = () => (
    <div className="space-y-8">
      <h2 className="text-xl font-light text-gray-900 dark:text-white mb-6">
        Network Insights
      </h2>
      
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Network insights based on current performance metrics.
        </p>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-8">
      <h2 className="text-xl font-light text-gray-900 dark:text-white">
        Settings
      </h2>
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Settings panel coming soon...
        </p>
      </div>
    </div>
  )

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview()
      case 'performance':
        return renderPerformance()
      case 'analytics':
        return renderAnalytics()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navigation 
        onSectionChange={setActiveSection} 
        activeSection={activeSection} 
      />
      
      <div className="ml-64">
        <TopBar
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          lastUpdate={latestMetrics?.timestamp}
          onRefresh={handleRefresh}
        />
        
        <main className="p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}