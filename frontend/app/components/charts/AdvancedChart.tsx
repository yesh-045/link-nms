'use client'

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Brush
} from 'recharts'

interface AdvancedChartProps {
  data: any[]
  type: 'line' | 'area' | 'bar'
  title: string
  metrics: Array<{
    key: string
    name: string
    color: string
    unit?: string
  }>
  height?: number
  showBrush?: boolean
  showLegend?: boolean
  showGrid?: boolean
  referenceLines?: Array<{
    value: number
    label: string
    color: string
  }>
  formatValue?: (value: number) => string
}

export function AdvancedChart({
  data,
  type,
  title,
  metrics,
  height = 400,
  showBrush = false,
  showLegend = true,
  showGrid = true,
  referenceLines = [],
  formatValue = (value: number) => value.toString()
}: AdvancedChartProps) {
  const ChartComponent = type === 'area' ? AreaChart : type === 'bar' ? BarChart : LineChart

  // Context-aware date/time formatter for X axis and Brush
  const tickFormatter = (value: any) => {
    const dates = Array.isArray(data) ? data : []
    if (!dates || dates.length === 0) return ''
    const first = new Date(dates[0]?.date)
    const last = new Date(dates[dates.length - 1]?.date)
    const current = new Date(value)

    const sameDay = first.toDateString() === last.toDateString()
    const sameYear = first.getFullYear() === last.getFullYear()

    if (sameDay) {
      // Show HH:MM for same-day ranges
      return current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (sameYear) {
      // Show DD Mon for same-year ranges
      return current.toLocaleDateString([], { day: '2-digit', month: 'short' })
    }
    // Cross-year: include year
    return current.toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' })
  }

  // Determine primary color for theming (first metric)
  const primaryColor = metrics?.[0]?.color || '#6b7280'
  const hexToRgba = (hex: string, alpha: number) => {
    const m = hex.replace('#', '')
    const bigint = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {new Date(label).toLocaleString()}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {entry.name}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-light text-gray-900 dark:text-white mb-6">
        {title}
      </h3>
      
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="1 1" 
              stroke="#e5e7eb" 
              className="dark:stroke-gray-800" 
              opacity={0.3}
            />
          )}
          
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            fontSize={11}
            axisLine={false}
            tickLine={false}
            tickFormatter={tickFormatter}
            minTickGap={12}
            tickMargin={8}
          />
          
          <YAxis
            stroke="#9ca3af"
            fontSize={11}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatValue}
          />
          
          <Tooltip content={customTooltip} />
          
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          )}

          {referenceLines.map((line, index) => (
            <ReferenceLine
              key={index}
              y={line.value}
              stroke={line.color}
              strokeDasharray="5 5"
              label={{ value: line.label, position: "top" }}
            />
          ))}

          {metrics.map((metric) => {
            if (type === 'area') {
              return (
                <Area
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.name}
                  stroke={metric.color}
                  fill={metric.color + '20'}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: metric.color, strokeWidth: 2, fill: 'white' }}
                />
              )
            } else if (type === 'bar') {
              return (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  name={metric.name}
                  fill={metric.color}
                  radius={[2, 2, 0, 0]}
                />
              )
            } else {
              return (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  name={metric.name}
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: metric.color, strokeWidth: 2, fill: 'white' }}
                />
              )
            }
          })}

          {showBrush && (
            <Brush
              dataKey="date"
              height={36}
              stroke={primaryColor}
              fill={hexToRgba(primaryColor, 0.15)}
              travellerWidth={10}
              tickFormatter={tickFormatter}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}
