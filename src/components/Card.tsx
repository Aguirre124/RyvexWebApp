import React from 'react'

type CardProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  selected?: boolean
}

export default function Card({ children, className = '', onClick, selected }: CardProps) {
  const baseClasses = 'bg-[#0b1220] border border-[#1f2937] rounded-lg p-4'
  const interactiveClasses = onClick ? 'cursor-pointer hover:border-primary transition-colors' : ''
  const selectedClasses = selected ? 'border-primary bg-[#0f1a2a]' : ''
  
  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${selectedClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
