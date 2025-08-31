interface DataCardProps {
  label: string
  value: string | number
  unit?: string
  className?: string
}

export function DataCard({ label, value, unit, className }: DataCardProps) {
  return (
    <div className={`border border-gray-200 dark:border-gray-800 p-6 ${className || ''}`}>
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        {label}
      </div>
      <div className="flex items-baseline">
        <span className="text-3xl font-light text-gray-900 dark:text-white">
          {value}
        </span>
        {unit && (
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export function DataGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className || ''}`}>
      {children}
    </div>
  )
}
