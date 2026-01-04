import React from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string }

const Input = React.forwardRef<HTMLInputElement, Props>(
  ({ label, className = '', ...props }, ref) => (
    <label className="flex flex-col text-sm gap-2 w-full">
      {label && <span className="text-muted text-xs">{label}</span>}
      <input
        ref={ref}
        className={`w-full bg-[#071022] border border-[#1f2937] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        {...props}
      />
    </label>
  )
)
Input.displayName = 'Input'
export default Input
