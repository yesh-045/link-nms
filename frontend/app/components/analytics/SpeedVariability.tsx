'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface SpeedVariabilityProps {
  data: Array<{
    timestamp: string
    download_mbps: number
    upload_mbps: number
    latency_ms: number
    jitter_ms: number
  }>
}

export function SpeedVariability({ data }: SpeedVariabilityProps) {
  // Calculate variability metrics
  const processedData = data?.slice(-30).map((item, index) => {
    const date = new Date(item.timestamp)
    
    // Calculate rolling standard deviation for variability
    const windowSize = Math.min(5, index + 1)
    const window = data.slice(Math.max(0, index - windowSize + 1), index + 1)
    
    const avgSpeed = window.reduce((sum, d) => sum + d.download_mbps, 0) / (window.length || 1)
    const variance = window.length > 0 
      ? window.reduce((sum, d) => sum + Math.pow(d.download_mbps - avgSpeed, 2), 0) / window.length 
      : 0
    const stdDev = Math.sqrt(variance)
    
    // Consistency score (lower variability = higher consistency)
    const consistency = avgSpeed > 0 
      ? Math.max(0, 100 - (stdDev / avgSpeed) * 100) 
      : (stdDev === 0 ? 100 : 0)
    
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      speed: item.download_mbps,
      variability: stdDev,
      consistency: consistency,
      avgSpeed: avgSpeed
    }
  }) || []

  // Calculate overall stats
  const speeds = data?.map(d => d.download_mbps) || []
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0
  const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0
  const speedRange = maxSpeed - minSpeed
  const consistencyScore = speedRange > 0 && avgSpeed > 0 
    ? Math.max(0, 100 - (speedRange / avgSpeed) * 100) 
    : 100
  const peakMinRatio = minSpeed > 0 ? (maxSpeed / minSpeed) : 0

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{entry.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {entry.dataKey === 'consistency' ? `${entry.value.toFixed(1)}%` : `${entry.value.toFixed(1)} Mbps`}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-lg font-light text-gray-900 dark:text-white mb-4">
        Speed Variability & Consistency
      </h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-light text-gray-900 dark:text-white">{avgSpeed.toFixed(1)}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Avg Speed (Mbps)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light text-gray-900 dark:text-white">{speedRange.toFixed(1)}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Speed Range (Mbps)</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-light ${consistencyScore > 80 ? 'text-green-600 dark:text-green-400' : consistencyScore > 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
            {consistencyScore.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Consistency Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light text-gray-900 dark:text-white">{minSpeed > 0 ? peakMinRatio.toFixed(1) : '—'}x</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Peak/Min Ratio</div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" className="dark:stroke-gray-800" opacity={0.3} />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis yAxisId="speed" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(value) => `${value.toFixed(0)} Mbps`} />
            <YAxis yAxisId="consistency" orientation="right" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(value) => `${value.toFixed(0)}%`} />
            <Tooltip content={customTooltip} />
            
            {/* Average speed reference line */}
            <ReferenceLine yAxisId="speed" y={avgSpeed} stroke="#6b7280" strokeDasharray="3 3" label={{ value: "Average", position: "top" }} />
            
            <Line yAxisId="speed" type="monotone" dataKey="speed" name="Current Speed" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: 'white' }} />
            <Line yAxisId="speed" type="monotone" dataKey="avgSpeed" name="Rolling Average" stroke="#3b82f6" strokeWidth={1} strokeDasharray="5 5" dot={false} opacity={0.7} />
            <Line yAxisId="consistency" type="monotone" dataKey="consistency" name="Consistency %" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: 'white' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 text-center">
        Higher consistency score indicates more stable speeds
      </div>
    </div>
  )
}
