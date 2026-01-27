import { useState, useEffect } from 'react'
import { getTimeRemaining, formatCountdown } from '../utils/datetime'

/**
 * Hook to manage countdown timer for hold expiry
 * Returns remaining seconds and formatted countdown string
 */
export function useCountdown(expiresAt: string | null) {
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!expiresAt) {
      setSecondsRemaining(0)
      setIsExpired(false)
      return
    }

    // Initial calculation
    const remaining = getTimeRemaining(expiresAt)
    setSecondsRemaining(remaining)
    setIsExpired(remaining === 0)

    if (remaining === 0) return

    // Update every second
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(expiresAt)
      setSecondsRemaining(remaining)
      
      if (remaining === 0) {
        setIsExpired(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  return {
    secondsRemaining,
    isExpired,
    formattedTime: formatCountdown(secondsRemaining)
  }
}
