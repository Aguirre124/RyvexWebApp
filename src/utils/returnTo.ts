/**
 * Utilities for handling auth redirects after login/register
 */

const RETURN_TO_KEY = 'ryvex_returnTo'

/**
 * Save a return URL to localStorage
 */
export function saveReturnTo(path: string): void {
  try {
    localStorage.setItem(RETURN_TO_KEY, path)
  } catch (error) {
    console.warn('Failed to save returnTo:', error)
  }
}

/**
 * Get the saved return URL from localStorage
 */
export function getReturnTo(): string | null {
  try {
    return localStorage.getItem(RETURN_TO_KEY)
  } catch (error) {
    console.warn('Failed to get returnTo:', error)
    return null
  }
}

/**
 * Clear the saved return URL from localStorage
 */
export function clearReturnTo(): void {
  try {
    localStorage.removeItem(RETURN_TO_KEY)
  } catch (error) {
    console.warn('Failed to clear returnTo:', error)
  }
}

/**
 * Get and clear the return URL in one operation
 */
export function consumeReturnTo(): string | null {
  const returnTo = getReturnTo()
  if (returnTo) {
    clearReturnTo()
  }
  return returnTo
}
