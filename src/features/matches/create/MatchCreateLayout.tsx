import React from 'react'
import { Outlet } from 'react-router-dom'

export default function MatchCreateLayout() {
  return (
    <div className="min-h-screen pb-20 px-4 pt-6 bg-[#0a1628]">
      <div className="max-w-2xl mx-auto">
        <Outlet />
      </div>
    </div>
  )
}
