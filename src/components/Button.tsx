import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export default function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  const base = 'w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors'
  const styles =
    variant === 'primary'
      ? 'bg-primary text-black disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed'
      : 'bg-[#111827] text-white border border-[#1f2937] disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed'
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  )
}
