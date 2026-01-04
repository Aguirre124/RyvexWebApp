import React from 'react'

export default function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted my-3">
      <div className="flex-1 h-px bg-[#1f2937]" />
      {label && <div className="whitespace-nowrap">{label}</div>}
      <div className="flex-1 h-px bg-[#1f2937]" />
    </div>
  )
}
