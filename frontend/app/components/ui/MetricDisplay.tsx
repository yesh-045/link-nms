'use client'

interface MetricDisplayProps {
  title: string
  value: string | number
  unit?: string
  change?: {
    value: number
    period: string
  }
  status?: 'good' | 'warning' | 'critical'
  size?: 'small' | 'medium' | 'large'
  trend?: number[]
}

export function MetricDisplay({
  title,
  value,
  unit,
  change,
  status = 'good',
  size = 'medium',
  trend
}: MetricDisplayProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'warning': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-green-600 dark:text-green-400'
    }
  }

  const getChangeColor = () => {
    if (!change) return ''
    return change.value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  }

  const valueClasses = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  }

  return (
    <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg ${sizeClasses[size]} group hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
          </h3>
          
          <div className="flex items-baseline space-x-2">
            <span className={`${valueClasses[size]} font-light text-gray-900 dark:text-white`}>
              {value}
            </span>
            {unit && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {unit}
              </span>
            )}
          </div>

          {change && (
            <div className={`flex items-center space-x-1 mt-2 text-sm ${getChangeColor()}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d={change.value > 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} 
                />
              </svg>
              <span>
                {Math.abs(change.value)}% {change.period}
              </span>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className={`w-3 h-3 rounded-full ${
          status === 'critical' ? 'bg-red-500' :
          status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
        }`} />
      </div>

      {/* Mini Trend Chart */}
      {trend && trend.length > 0 && (
        <div className="mt-4">
          <svg className="w-full h-8" viewBox="0 0 100 20">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className={getStatusColor()}
              points={trend.map((value, index) => 
                `${(index / (trend.length - 1)) * 100},${20 - (value / Math.max(...trend)) * 15}`
              ).join(' ')}
            />
          </svg>
        </div>
      )}
    </div>
  )
}

export function MetricGrid({ children, columns = 4 }: { children: React.ReactNode; columns?: number }) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  }

  return (
    <div className={`grid ${gridClasses[columns as keyof typeof gridClasses]} gap-6`}>
      {children}
    </div>
  )
}
