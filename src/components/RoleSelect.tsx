import React from 'react'
import { FOOTBALL_ROLES } from '../utils/roles'

type RoleSelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export default function RoleSelect({ value, onChange, disabled, className = '' }: RoleSelectProps) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-400 mb-1.5">
        Posición sugerida
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-[#0b1220] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {FOOTBALL_ROLES.map((role) => (
          <option key={role.code} value={role.code}>
            {role.label} {role.code && `(${role.code})`}
          </option>
        ))}
      </select>
    </div>
  )
}
