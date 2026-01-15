import React from 'react'

type BadgeProps = {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-[#1f2937] text-gray-300',
    success: 'bg-green-900 text-green-200',
    warning: 'bg-yellow-900 text-yellow-200',
    error: 'bg-red-900 text-red-200',
    info: 'bg-blue-900 text-blue-200'
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
