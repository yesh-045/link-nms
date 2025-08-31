'use client'

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface PeakHoursAnalysisProps {
  data: Array<{
    timestamp: string
    download_mbps: number
    upload_mbps: number
    latency_ms: number
    jitter_ms: number
  }>
}

export function PeakHoursAnalysis({ data }: PeakHoursAnalysisProps) {
  // Group data by hour and calculate averages
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourData = data.filter(item => {
      const itemHour = new Date(item.timestamp).getHours()
      return itemHour === hour
    })

    if (hourData.length === 0) {
      return {
        hour,
        avgDownload: 0,
        avgUpload: 0,
        avgLatency: 0,
        count: 0,
        performance: 0
      }
    }

    const avgDownload = hourData.reduce((sum, d) => sum + d.download_mbps, 0) / hourData.length
    const avgUpload = hourData.reduce((sum, d) => sum + d.upload_mbps, 0) / hourData.length
    const avgLatency = hourData.reduce((sum, d) => sum + d.latency_ms, 0) / hourData.length
    
    // Performance score: higher download/upload, lower latency = better
    const performance = (avgDownload + avgUpload) / (avgLatency + 1) * 10

    return {
      hour,
      avgDownload,
      avgUpload,
      avgLatency,
      count: hourData.length,
      performance
    }
  })

  // Find best and worst hours
  const validHours = hourlyData.filter(h => h.count > 0)
  const bestHour = validHours.reduce((best, current) => 
    current.performance > best.performance ? current : best, validHours[0] || hourlyData[0])
  const worstHour = validHours.reduce((worst, current) => 
    current.performance < worst.performance ? current : worst, validHours[0] || hourlyData[0])

  const getBarColor = (hour: number, performance: number) => {
    if (hour === bestHour?.hour) return '#10b981' // Green for best
    if (hour === worstHour?.hour) return '#ef4444' // Red for worst
    if (performance > 50) return '#3b82f6' // Blue for good
    if (performance > 20) return '#f59e0b' // Yellow for average
    return '#6b7280' // Gray for poor/no data
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label}:00 - {(parseInt(label) + 1) % 24}:00
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg Download:</span>
              <span className="font-medium">{data.avgDownload.toFixed(1)} Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg Upload:</span>
              <span className="font-medium">{data.avgUpload.toFixed(1)} Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Avg Latency:</span>
              <span className="font-medium">{data.avgLatency.toFixed(1)} ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Measurements:</span>
              <span className="font-medium">{data.count}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-light text-gray-900 dark:text-white mb-4">
        Performance by Hour of Day
      </h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-light text-green-600 dark:text-green-400">
            {bestHour?.hour || 0}:00
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Peak Performance Hour</div>
          <div className="text-xs text-gray-500">
            {bestHour?.avgDownload.toFixed(1)} Mbps average speed
          </div>
          <div className="text-xs text-gray-500">
            {bestHour?.count || 0} measurements
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light text-red-600 dark:text-red-400">
            {worstHour?.hour || 0}:00
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Lowest Performance Hour</div>
          <div className="text-xs text-gray-500">
            {worstHour?.avgDownload.toFixed(1)} Mbps average speed
          </div>
          <div className="text-xs text-gray-500">
            {worstHour?.count || 0} measurements
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={hourlyData} outerRadius="80%">
            <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-800" opacity={0.3} />
            <PolarAngleAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v: any) => `${v}:00`} />
            <PolarRadiusAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Tooltip content={customTooltip} />
            <Radar name="Avg Download" dataKey="avgDownload" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Peak Hour</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Lowest Hour</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Good Performance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">No Data</span>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          Analysis based on {data?.length || 0} total measurements across different hours
        </div>
      </div>
    </div>
  )
}
