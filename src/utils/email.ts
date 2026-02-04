/**
 * Simple email validation regex
 * Validates basic email format: user@domain.ext
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  const trimmed = email.trim()
  
  if (trimmed.length === 0 || trimmed.length > 254) {
    return false
  }
  
  return EMAIL_REGEX.test(trimmed)
}

/**
 * Masks an email address for display
 * Example: john.doe@example.com -> j***e@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email
  }
  
  const [local, domain] = email.split('@')
  
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  
  const firstChar = local[0]
  const lastChar = local[local.length - 1]
  
  return `${firstChar}***${lastChar}@${domain}`
}
