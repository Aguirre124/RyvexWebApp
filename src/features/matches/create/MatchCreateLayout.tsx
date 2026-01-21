import React from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from '../../../components/BottomNav'

export default function MatchCreateLayout() {
  return (
    <div className="min-h-screen pb-20 px-4 pt-6 bg-[#0a1628]">
      <div className="max-w-2xl mx-auto">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
