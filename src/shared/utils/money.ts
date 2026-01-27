/**
 * Format Colombian Peso (COP) currency
 * @param amount - The amount to format
 * @returns Formatted string like "$120.000"
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Calculate estimated price based on hourly rate and duration in minutes
 * @param hourlyRate - Price per hour
 * @param durationMin - Duration in minutes
 * @returns Estimated total price
 */
export function calculateEstimatedPrice(hourlyRate: number, durationMin: number): number {
  return Math.round(hourlyRate * (durationMin / 60))
}
