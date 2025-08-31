interface HealthIndicatorProps {
  health: {
    score: number
    status: string
  }
}

export function HealthIndicator({ health }: HealthIndicatorProps) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="p-4">
      <div className="text-center">
        <div className={`text-4xl font-light mb-1 ${getHealthColor(health.score)}`}>
          {health.score.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{health.status}</div>
      </div>
    </div>
  )
}
