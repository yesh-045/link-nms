'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface NetworkHealthTimelineProps {
  data: Array<{
    timestamp: string
    download_mbps: number
    upload_mbps: number
    latency_ms: number
    jitter_ms: number
  }>
}

export function NetworkHealthTimeline({ data }: NetworkHealthTimelineProps) {
  // Calculate health score for each data point
  const processedData = data?.slice(-50).map(item => {
    const date = new Date(item.timestamp)
    
    // Health scoring algorithm
    const downloadScore = Math.min(100, (item.download_mbps / 100) * 100) // 100 Mbps = 100%
    const uploadScore = Math.min(100, (item.upload_mbps / 50) * 100) // 50 Mbps = 100%
    const latencyScore = Math.max(0, 100 - (item.latency_ms / 100) * 100) // 0ms = 100%, 100ms = 0%
    const jitterScore = Math.max(0, 100 - (item.jitter_ms / 20) * 100) // 0ms = 100%, 20ms = 0%
    
    const overallHealth = (downloadScore + uploadScore + latencyScore + jitterScore) / 4
    
    // Categorize health status
    let status = 'poor'
    let statusColor = '#ef4444'
    if (overallHealth >= 80) {
      status = 'excellent'
      statusColor = '#10b981'
    } else if (overallHealth >= 60) {
      status = 'good'
      statusColor = '#3b82f6'
    } else if (overallHealth >= 40) {
      status = 'fair'
      statusColor = '#f59e0b'
    }

    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: item.timestamp,
      health: overallHealth,
      downloadScore,
      uploadScore,
      latencyScore,
      jitterScore,
      status,
      statusColor,
      download: item.download_mbps,
      upload: item.upload_mbps,
      latency: item.latency_ms,
      jitter: item.jitter_ms
    }
  }) || []

  // Calculate overall stats
  const avgHealth = processedData.length > 0 ? 
    processedData.reduce((sum, d) => sum + d.health, 0) / processedData.length : 0
  
  const healthCounts = processedData.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const getHealthColor = (health: number) => {
    if (health >= 80) return '#10b981'
    if (health >= 60) return '#3b82f6'
    if (health >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Health Score:</span>
              <span className="font-medium" style={{ color: data.statusColor }}>
                {data.health.toFixed(1)}% ({data.status})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Download:</span>
              <span className="font-medium">{data.download.toFixed(1)} Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Upload:</span>
              <span className="font-medium">{data.upload.toFixed(1)} Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Latency:</span>
              <span className="font-medium">{data.latency.toFixed(1)} ms</span>
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
        Network Health Timeline
      </h3>
      
      {/* Health Summary */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="text-center">
          <div className={`text-2xl font-light`} style={{ color: getHealthColor(avgHealth) }}>
            {avgHealth.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Overall Health</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-light text-green-600 dark:text-green-400">
            {healthCounts.excellent || 0}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Excellent</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-light text-blue-600 dark:text-blue-400">
            {healthCounts.good || 0}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Good</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-light text-yellow-600 dark:text-yellow-400">
            {healthCounts.fair || 0}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Fair</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-light text-red-600 dark:text-red-400">
            {healthCounts.poor || 0}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Poor</div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" className="dark:stroke-gray-800" opacity={0.3} />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <Tooltip content={customTooltip} />
            
            {/* Health threshold lines */}
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Excellent", position: "top" }} />
            <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: "Good", position: "top" }} />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Fair", position: "top" }} />
            
            <Area
              type="monotone"
              dataKey="health"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#healthGradient)"
              dot={false}
              activeDot={{ r: 3, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Excellent (80%+)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Good (60-79%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Fair (40-59%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Poor (&lt;40%)</span>
        </div>
      </div>
    </div>
  )
}
