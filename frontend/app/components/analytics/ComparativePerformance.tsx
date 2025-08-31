'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface ComparativePerformanceProps {
  data: Array<{
    timestamp: string
    download_mbps: number
    upload_mbps: number
    latency_ms: number
    jitter_ms: number
  }>
}

export function ComparativePerformance({ data }: ComparativePerformanceProps) {
  // Calculate historical averages and current trends
  const processedData = data?.slice(-30).map((item, index) => {
    const date = new Date(item.timestamp)
    
    // Calculate historical average (all data up to this point)
    const historicalData = data.slice(0, Math.max(1, Math.floor(data.length * 0.7))) // First 70% as historical
    const historicalAvgDownload = historicalData.length > 0 
      ? historicalData.reduce((sum, d) => sum + d.download_mbps, 0) / historicalData.length 
      : 0
    const historicalAvgUpload = historicalData.length > 0 
      ? historicalData.reduce((sum, d) => sum + d.upload_mbps, 0) / historicalData.length 
      : 0
    const historicalAvgLatency = historicalData.length > 0 
      ? historicalData.reduce((sum, d) => sum + d.latency_ms, 0) / historicalData.length 
      : 0
    
    // Calculate recent trend (last 10 measurements)
    const recentData = data.slice(Math.max(0, index - 9), index + 1)
    const recentAvgDownload = recentData.length > 0 
      ? recentData.reduce((sum, d) => sum + d.download_mbps, 0) / recentData.length 
      : 0
    const recentAvgUpload = recentData.length > 0 
      ? recentData.reduce((sum, d) => sum + d.upload_mbps, 0) / recentData.length 
      : 0
    
    // Performance comparison metrics
    const downloadImprovement = historicalAvgDownload > 0 
      ? ((item.download_mbps - historicalAvgDownload) / historicalAvgDownload) * 100 
      : 0
    const uploadImprovement = historicalAvgUpload > 0 
      ? ((item.upload_mbps - historicalAvgUpload) / historicalAvgUpload) * 100 
      : 0
    const latencyImprovement = historicalAvgLatency > 0 
      ? ((historicalAvgLatency - item.latency_ms) / historicalAvgLatency) * 100 
      : 0 // Lower is better
    
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      currentDownload: item.download_mbps,
      currentUpload: item.upload_mbps,
      currentLatency: item.latency_ms,
      historicalDownload: historicalAvgDownload,
      historicalUpload: historicalAvgUpload,
      historicalLatency: historicalAvgLatency,
      recentTrendDownload: recentAvgDownload,
      recentTrendUpload: recentAvgUpload,
      downloadImprovement,
      uploadImprovement,
      latencyImprovement
    }
  }) || []

  // Calculate overall comparison stats
  const currentData = data?.slice(-10) || [] // Last 10 measurements as "current"
  const historicalData = data?.slice(0, Math.max(1, Math.floor(data.length * 0.7))) || []
  
  const currentAvgDownload = currentData.length > 0 
    ? currentData.reduce((sum, d) => sum + d.download_mbps, 0) / currentData.length 
    : 0
  const historicalAvgDownload = historicalData.length > 0 
    ? historicalData.reduce((sum, d) => sum + d.download_mbps, 0) / historicalData.length 
    : 0
  const downloadChange = historicalAvgDownload > 0 
    ? ((currentAvgDownload - historicalAvgDownload) / historicalAvgDownload) * 100 
    : 0
  
  const currentAvgLatency = currentData.length > 0 
    ? currentData.reduce((sum, d) => sum + d.latency_ms, 0) / currentData.length 
    : 0
  const historicalAvgLatency = historicalData.length > 0 
    ? historicalData.reduce((sum, d) => sum + d.latency_ms, 0) / historicalData.length 
    : 0
  const latencyChange = historicalAvgLatency > 0 
    ? ((historicalAvgLatency - currentAvgLatency) / historicalAvgLatency) * 100 
    : 0

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Current Download:</span>
              <span className="font-medium">{data.currentDownload.toFixed(1)} Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Historical Avg:</span>
              <span className="font-medium">{data.historicalDownload.toFixed(1)} Mbps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Improvement:</span>
              <span className={`font-medium ${data.downloadImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.downloadImprovement >= 0 ? '+' : ''}{data.downloadImprovement.toFixed(1)}%
              </span>
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
        Current vs Historical Performance
      </h3>
      
      {/* Comparison Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className={`text-2xl font-light ${downloadChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {downloadChange >= 0 ? '+' : ''}{downloadChange.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Download Change</div>
          <div className="text-xs text-gray-500">
            {currentAvgDownload.toFixed(1)} vs {historicalAvgDownload.toFixed(1)} Mbps
          </div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-light ${latencyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {latencyChange >= 0 ? '+' : ''}{latencyChange.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Latency Change</div>
          <div className="text-xs text-gray-500">
            {currentAvgLatency.toFixed(1)} vs {historicalAvgLatency.toFixed(1)} ms
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light text-gray-900 dark:text-white">
            {((currentAvgDownload / historicalAvgDownload) || 1).toFixed(2)}x
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Performance Ratio</div>
          <div className="text-xs text-gray-500">Current/Historical</div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" className="dark:stroke-gray-800" opacity={0.3} />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(value) => `${value.toFixed(0)} Mbps`} />
            <Tooltip content={customTooltip} />
            
            {/* Historical average reference line */}
            <ReferenceLine y={historicalAvgDownload} stroke="#6b7280" strokeDasharray="5 5" label={{ value: "Historical Avg", position: "top" }} />
            
            <Line type="monotone" dataKey="currentDownload" name="Current Speed" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 4, stroke: '#10b981', strokeWidth: 2, fill: 'white' }} />
            <Line type="monotone" dataKey="historicalDownload" name="Historical Average" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={false} opacity={0.7} />
            <Line type="monotone" dataKey="recentTrendDownload" name="Recent Trend" stroke="#3b82f6" strokeWidth={2} dot={false} opacity={0.8} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Current Performance</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Historical Average</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Recent Trend</span>
        </div>
      </div>
    </div>
  )
}
