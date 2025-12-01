/**
 * Authentication utilities for Host access control
 */

const AUTH_STORAGE_KEY = 'blindtest_host_auth'

/**
 * Check if the user is authenticated as a host
 */
export function isHostAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const authData = sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (!authData) {
    return false
  }

  try {
    const { timestamp } = JSON.parse(authData)
    const now = Date.now()
    const expiration = 24 * 60 * 60 * 1000 // 24 hours

    // Check if the session has expired
    if (now - timestamp > expiration) {
      clearHostAuth()
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Verify the access code and set authentication
 */
export function verifyHostAccessCode(code: string): boolean {
  const expectedCode = process.env.NEXT_PUBLIC_HOST_ACCESS_CODE

  if (!expectedCode) {
    console.error('HOST_ACCESS_CODE not configured')
    return false
  }

  if (code === expectedCode) {
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
      })
    )
    return true
  }

  return false
}

/**
 * Clear host authentication
 */
export function clearHostAuth(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  }
}
