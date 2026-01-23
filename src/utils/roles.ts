// Role utilities for player positions

export const FOOTBALL_ROLES = [
  { code: '', label: 'Sin preferencia' },
  { code: 'GK', label: 'Arquero' },
  { code: 'DEF', label: 'Defensa' },
  { code: 'MID', label: 'Mediocampo' },
  { code: 'ATT', label: 'Delantero' },
  { code: 'SUB', label: 'Suplente' }
] as const

export type RoleCode = '' | 'GK' | 'DEF' | 'MID' | 'ATT' | 'SUB'

export function getRoleLabel(code: string): string {
  const role = FOOTBALL_ROLES.find(r => r.code === code)
  return role ? role.label : 'Sin preferencia'
}

export function getRoleShortLabel(code: string): string {
  if (!code) return '-'
  return code
}
