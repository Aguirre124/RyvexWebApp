import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export default function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  const base = 'w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2'
  const styles =
    variant === 'primary'
      ? 'bg-primary text-black'
      : 'bg-[#111827] text-white border border-[#1f2937]'
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}
