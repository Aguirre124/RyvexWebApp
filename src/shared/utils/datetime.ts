/**
 * Format ISO date string to YYYY-MM-DD
 */
export function toYYYYMMDD(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

/**
 * Format ISO datetime to local time (HH:mm)
 */
export function formatLocalTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Format ISO datetime to full local datetime
 */
export function formatLocalDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

/**
 * Format ISO datetime to short date
 */
export function formatShortDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Calculate time remaining in seconds
 */
export function getTimeRemaining(expiresAt: string): number {
  const now = new Date().getTime()
  const expiry = new Date(expiresAt).getTime()
  return Math.max(0, Math.floor((expiry - now) / 1000))
}

/**
 * Format seconds to MM:SS
 */
export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
