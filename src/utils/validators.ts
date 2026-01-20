export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  // Allow digits, spaces, +, -, (, )
  const phoneRegex = /^[\d\s\+\-\(\)]+$/
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8
}

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d\+]/g, '')
}
