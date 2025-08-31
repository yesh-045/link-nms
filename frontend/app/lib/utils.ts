import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number | undefined | null, decimals = 2) {
  if (bytes == null || isNaN(bytes) || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatMbps(mbps: number | undefined | null, decimals = 2) {
  if (mbps == null || isNaN(mbps)) return '0.00 Mbps'
  return `${mbps.toFixed(decimals)} Mbps`
}

export function formatLatency(ms: number | undefined | null) {
  if (ms == null || isNaN(ms)) return '0.0 ms'
  return `${ms.toFixed(1)} ms`
}

export function getHealthColor(score: number | undefined | null) {
  if (score == null || isNaN(score)) return 'text-gray-500'
  if (score >= 90) return 'text-green-500'
  if (score >= 80) return 'text-blue-500'
  if (score >= 70) return 'text-yellow-500'
  if (score >= 60) return 'text-orange-500'
  return 'text-red-500'
}

export function getHealthBgColor(score: number | undefined | null) {
  if (score == null || isNaN(score)) return 'bg-gray-500/10'
  if (score >= 90) return 'bg-green-500/10'
  if (score >= 80) return 'bg-blue-500/10'
  if (score >= 70) return 'bg-yellow-500/10'
  if (score >= 60) return 'bg-orange-500/10'
  return 'bg-red-500/10'
}

export function getStatusColor(status: string | undefined | null) {
  if (!status) return 'text-gray-500'
  switch (status.toLowerCase()) {
    case 'excellent': return 'text-green-500'
    case 'good': return 'text-blue-500'
    case 'fair': return 'text-yellow-500'
    case 'poor': return 'text-orange-500'
    case 'critical': return 'text-red-500'
    default: return 'text-gray-500'
  }
}

export function formatDate(dateString: string | undefined | null) {
  if (!dateString) return '--'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '--'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '--'
  }
}

export function formatTimeRange(days: number | undefined | null) {
  if (days == null || isNaN(days)) return '7 Days'
  if (days === 1) return '24 Hours'
  if (days === 7) return '7 Days'
  if (days === 30) return '30 Days'
  return `${days} Days`
} 