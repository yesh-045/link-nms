interface MetricGridProps {
  children: React.ReactNode
  columns?: number
}

export function MetricGrid({ children, columns = 3 }: MetricGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  }

  return (
    <div className={`grid gap-6 ${gridCols[columns as keyof typeof gridCols] || gridCols[3]}`}>
      {children}
    </div>
  )
}
