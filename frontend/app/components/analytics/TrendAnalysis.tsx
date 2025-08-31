'use client'

import React from 'react'
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts'

interface TrendAnalysisProps {
  data: Array<{
    timestamp: string
    download_mbps: number
    upload_mbps: number
    latency_ms: number
    jitter_ms: number
  }>
}

export function TrendAnalysis({ data }: TrendAnalysisProps) {
  // Process data for trend analysis
  const processedData = data?.slice(-20).map((item, index) => {
    const date = new Date(item.timestamp)
    
    // Calculate moving averages for trend prediction
    const windowSize = Math.min(5, index + 1)
    const window = data.slice(Math.max(0, index - windowSize + 1), index + 1)
    
    const avgDownload = window.reduce((sum, d) => sum + d.download_mbps, 0) / window.length
    const avgUpload = window.reduce((sum, d) => sum + d.upload_mbps, 0) / window.length
    
    // Simple linear prediction based on recent trend
    const prediction = index >= 3 ? 
      avgDownload + (avgDownload - window[0].download_mbps) / window.length : avgDownload
    
    // Detect anomalies (latency spikes)
    const avgLatency = window.reduce((sum, d) => sum + d.latency_ms, 0) / window.length
    const anomaly = item.latency_ms > avgLatency * 1.5
    
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      download: item.download_mbps,
      upload: item.upload_mbps,
      latency: item.latency_ms,
      prediction: Math.max(0, prediction),
      anomaly
    }
  }) || []

  // Calculate real insights from data
  const speeds = data?.map(d => d.download_mbps) || []
  const latencies = data?.map(d => d.latency_ms) || []
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / (speeds.length || 1)
  const maxSpeed = Math.max(...speeds)
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1)
  const anomalyCount = processedData.filter(d => d.anomaly).length
  
  // Calculate trend direction
  const recentSpeeds = speeds.slice(-5)
  const earlierSpeeds = speeds.slice(-10, -5)
  const recentAvg = recentSpeeds.reduce((a, b) => a + b, 0) / (recentSpeeds.length || 1)
  const earlierAvg = earlierSpeeds.reduce((a, b) => a + b, 0) / (earlierSpeeds.length || 1)
  const trendDirection = recentAvg > earlierAvg ? 'improving' : 'declining'
  const trendPercent = Math.abs(((recentAvg - earlierAvg) / earlierAvg) * 100)

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center space-x-4">
              <span className="text-xs" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="text-xs font-medium">
                {entry.value?.toFixed(2)} {entry.name === 'latency' ? 'ms' : 'Mbps'}
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
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Predictive Trend Analysis
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" className="dark:stroke-gray-800" opacity={0.3} />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} />
            <Tooltip content={customTooltip} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
            
            <Area type="monotone" dataKey="download" fill="#10b981" fillOpacity={0.2} stroke="#10b981" strokeWidth={2} name="Download" />
            <Area type="monotone" dataKey="upload" fill="#3b82f6" fillOpacity={0.2} stroke="#3b82f6" strokeWidth={2} name="Upload" />
            <Line type="monotone" dataKey="prediction" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Prediction" />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#ef4444"
              strokeWidth={1}
              dot={(props: any) => {
                if (processedData[props.index]?.anomaly) {
                  return <circle cx={props.cx} cy={props.cy} r={4} fill="#dc2626" stroke="#fff" strokeWidth={2} />
                }
                return <circle cx={props.cx} cy={props.cy} r={0} fill="transparent" />
              }}
              name="Latency"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-gray-900 dark:text-white font-medium mb-2">Real-time Insights</div>
          <ul className="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• Average speed: {avgSpeed.toFixed(1)} Mbps</li>
            <li>• Peak speed: {maxSpeed.toFixed(1)} Mbps</li>
            <li>• {anomalyCount} latency anomalies detected</li>
          </ul>
        </div>
        <div>
          <div className="text-gray-900 dark:text-white font-medium mb-2">Trend Analysis</div>
          <ul className="space-y-1 text-gray-600 dark:text-gray-400">
            <li>• Speed trend: {trendDirection}</li>
            <li>• Change rate: {trendPercent.toFixed(1)}%</li>
            <li>• Avg latency: {avgLatency.toFixed(1)} ms</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
