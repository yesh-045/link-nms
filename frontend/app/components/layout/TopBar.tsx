'use client'

import { useState } from 'react'

interface TopBarProps {
  timeRange: number
  onTimeRangeChange: (range: number) => void
  lastUpdate?: string
  onRefresh?: () => void
}

export function TopBar({ timeRange, onTimeRangeChange, lastUpdate, onRefresh }: TopBarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const timeRanges = [
    { label: '1H', value: 0.04, description: '1 Hour' },
    { label: '6H', value: 0.25, description: '6 Hours' },
    { label: '24H', value: 1, description: '24 Hours' },
    { label: '7D', value: 7, description: '7 Days' },
    { label: '30D', value: 30, description: '30 Days' }
  ]

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true)
      await onRefresh()
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  return (
    <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 px-8 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Status */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
          </div>
          {lastUpdate && (
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-6">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Period:</span>
            <div className="flex border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => onTimeRangeChange(range.value)}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    timeRange === range.value
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                  title={range.description}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all disabled:opacity-50"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>

          {/* Export Button */}
          <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  )
}
