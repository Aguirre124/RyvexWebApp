import React from 'react'
import type { FieldLayout } from '../layouts/soccerLayouts'
import type { SlotAssignment } from '../utils/autoAssignLineup'

type FieldMatchProps = {
  layout: FieldLayout
  homeStarters: SlotAssignment[]
  awayStarters: SlotAssignment[]
  homeTeamName: string
  awayTeamName: string
}

export default function FieldMatch({ layout, homeStarters, awayStarters, homeTeamName, awayTeamName }: FieldMatchProps) {
  
  const getPlayerInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="w-full bg-gradient-to-r from-green-900/40 via-green-800/40 to-green-900/40 rounded-lg overflow-hidden border border-green-700/30">
      {/* Horizontal field - wider aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0">
          {/* Field markings */}
          <svg 
            className="absolute inset-0 w-full h-full opacity-30" 
            viewBox="0 0 280 140"
            preserveAspectRatio="none"
          >
            {/* Outer border */}
            <rect 
              x="2" 
              y="2" 
              width="276" 
              height="136" 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5" 
            />
            
            {/* Midfield line */}
            <line 
              x1="140" 
              y1="0" 
              x2="140" 
              y2="140" 
              stroke="white" 
              strokeWidth="0.5" 
            />
            
            {/* Center circle */}
            <circle 
              cx="140" 
              cy="70" 
              r="12" 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5" 
            />
            
            {/* Left goal box (HOME) */}
            <rect 
              x="2" 
              y="40" 
              width="12" 
              height="60" 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5" 
            />
            <rect 
              x="2" 
              y="52" 
              width="6" 
              height="36" 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5" 
            />
            
            {/* Right goal box (AWAY) */}
            <rect 
              x="266" 
              y="40" 
              width="12" 
              height="60" 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5" 
            />
            <rect 
              x="272" 
              y="52" 
              width="6" 
              height="36" 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5" 
            />
          </svg>

          {/* HOME team players (left side) */}
          {homeStarters.map((assignment) => {
            const { slot, player } = assignment
            // Convert vertical field coordinates to horizontal field
            // Original: x is width (100), y is height (140, 0=top/opponent goal, 140=bottom/own goal)
            // HOME team defends left side (x=0), attacks towards middle (x=140)
            // GK at y=140 (own goal) should be at x=0 (left edge)
            // ATT at y=0 (opponent goal) should be at x=140 (middle)
            const fieldX = 140 - (slot.y / layout.height) * 140 // Invert: y=140->x=0, y=0->x=140
            const fieldY = (slot.x / layout.width) * 140 // x becomes vertical position
            const leftPercent = (fieldX / 280) * 100
            const topPercent = (fieldY / 140) * 100

            return (
              <div
                key={`home-${slot.code}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                }}
              >
                {player ? (
                  // Filled slot with player
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-[33px] h-[33px] rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xs">
                        {getPlayerInitials(player.name)}
                      </span>
                    </div>
                    <div className="text-[8px] text-white font-medium bg-black/60 px-1 py-0.5 rounded whitespace-nowrap max-w-[50px] truncate">
                      {player.name.split(' ')[0]}
                    </div>
                  </div>
                ) : (
                  // Empty slot
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-[33px] h-[33px] rounded-full bg-blue-500/30 border-2 border-dashed border-blue-400 flex items-center justify-center">
                      <span className="text-blue-300 font-semibold text-[10px]">
                        {slot.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* AWAY team players (right side) */}
          {awayStarters.map((assignment) => {
            const { slot, player } = assignment
            // AWAY team defends right side (x=280), attacks towards middle (x=140)
            // GK at y=140 (own goal) should be at x=280 (right edge)
            // ATT at y=0 (opponent goal) should be at x=140 (middle)
            const fieldX = 140 + (slot.y / layout.height) * 140 // y=140->x=280, y=0->x=140
            const fieldY = (slot.x / layout.width) * 140
            const leftPercent = (fieldX / 280) * 100
            const topPercent = (fieldY / 140) * 100

            return (
              <div
                key={`away-${slot.code}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                }}
              >
                {player ? (
                  // Filled slot with player
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-[33px] h-[33px] rounded-full bg-red-500 border-2 border-white flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xs">
                        {getPlayerInitials(player.name)}
                      </span>
                    </div>
                    <div className="text-[8px] text-white font-medium bg-black/60 px-1 py-0.5 rounded whitespace-nowrap max-w-[50px] truncate">
                      {player.name.split(' ')[0]}
                    </div>
                  </div>
                ) : (
                  // Empty slot
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-[33px] h-[33px] rounded-full bg-red-500/30 border-2 border-dashed border-red-400 flex items-center justify-center">
                      <span className="text-red-300 font-semibold text-[10px]">
                        {slot.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Team labels */}
          <div className="absolute top-2 left-4 text-[10px] font-bold text-white bg-blue-600/80 px-2 py-1 rounded">
            {homeTeamName}
          </div>
          <div className="absolute top-2 right-4 text-[10px] font-bold text-white bg-red-600/80 px-2 py-1 rounded">
            {awayTeamName}
          </div>
        </div>
      </div>
    </div>
  )
}
