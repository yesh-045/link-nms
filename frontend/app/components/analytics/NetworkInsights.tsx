'use client'

import React from 'react'

interface InsightCardProps {
  title: string
  value: string
  change: number
  trend: 'up' | 'down' | 'stable'
  severity: 'good' | 'warning' | 'critical'
  description: string
}

function InsightCard({ title, value, change, trend, severity, description }: InsightCardProps) {
  const getSeverityColor = () => {
    switch (severity) {
      case 'good': return 'text-green-600 dark:text-green-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      case 'critical': return 'text-red-600 dark:text-red-400'
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      case 'stable': return '→'
    }
  }

  return (
    <div className="p-3">
      <div className="flex items-start justify-between mb-1.5">
        <div>
          <h4 className="text-xs font-medium text-gray-900 dark:text-white">{title}</h4>
          <div className={`text-lg font-light mt-0.5 ${getSeverityColor()}`}>{value}</div>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-sm">{getTrendIcon()}</span>
          <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{change > 0 ? '+' : ''}{change}%</span>
        </div>
      </div>
      <p className="text-[11px] leading-snug text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}

interface NetworkInsightsProps {
  insights: Array<{
    title: string
    value: string
    change: number
    trend: 'up' | 'down' | 'stable'
    severity: 'good' | 'warning' | 'critical'
    description: string
  }>
}

export function NetworkInsights({ insights }: NetworkInsightsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">Network Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 border border-transparent">
          {insights.map((insight, index) => (
            <div key={index} className="rounded">
              <InsightCard {...insight} />
            </div>
          ))}
        </div>
      </div>
      {/* Removed large Performance Score box for a cleaner layout */}
    </div>
  )
}
