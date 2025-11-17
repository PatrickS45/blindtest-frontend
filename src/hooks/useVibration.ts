'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Custom hook for vibration API (mobile devices)
 */
export function useVibration() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if vibration API is supported
    setIsSupported('vibrate' in navigator)
  }, [])

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!isSupported) {
        console.warn('Vibration API not supported')
        return false
      }

      try {
        navigator.vibrate(pattern)
        return true
      } catch (err) {
        console.error('Vibration failed:', err)
        return false
      }
    },
    [isSupported]
  )

  const stop = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(0)
    }
  }, [isSupported])

  // Predefined patterns
  const patterns = {
    short: () => vibrate(50),
    medium: () => vibrate(200),
    long: () => vibrate(500),
    double: () => vibrate([100, 50, 100]),
    triple: () => vibrate([100, 50, 100, 50, 100]),
    buzz: () => vibrate([50, 50, 50, 50, 50]),
    success: () => vibrate([100, 50, 100]),
    error: () => vibrate([200, 100, 200]),
  }

  return {
    vibrate,
    stop,
    isSupported,
    ...patterns,
  }
}
