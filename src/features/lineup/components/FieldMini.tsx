import React from 'react'
import type { FieldLayout } from '../layouts/soccerLayouts'
import type { SlotAssignment, AcceptedPlayer } from '../utils/autoAssignLineup'

type FieldMiniProps = {
  layout: FieldLayout
  starters: SlotAssignment[]
  title?: string
  bench?: AcceptedPlayer[]
  showBench?: boolean
}

export default function FieldMini({ 
  layout, 
  starters, 
  title, 
  bench = [], 
  showBench = true 
}: FieldMiniProps) {
  
  const getPlayerInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (
    <div className="space-y-3">
      {title && (
        <div className="text-sm font-semibold text-white">{title}</div>
      )}
      
      {/* Field Container */}
      <div className="relative bg-gradient-to-b from-green-900/40 to-green-800/40 rounded-lg overflow-hidden border border-green-700/30">
        {/* Fixed aspect ratio container */}
        <div className="relative w-full" style={{ paddingBottom: `${(layout.height / layout.width) * 100}%` }}>
          <div className="absolute inset-0">
            {/* Field markings */}
            <svg 
              className="absolute inset-0 w-full h-full opacity-30" 
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="none"
            >
              {/* Outer border */}
              <rect 
                x="2" 
                y="2" 
                width={layout.width - 4} 
                height={layout.height - 4} 
                fill="none" 
                stroke="white" 
                strokeWidth="0.5" 
              />
              
              {/* Midfield line */}
              <line 
                x1="0" 
                y1={layout.height / 2} 
                x2={layout.width} 
                y2={layout.height / 2} 
                stroke="white" 
                strokeWidth="0.5" 
              />
              
              {/* Center circle */}
              <circle 
                cx={layout.width / 2} 
                cy={layout.height / 2} 
                r="12" 
                fill="none" 
                stroke="white" 
                strokeWidth="0.5" 
              />
              
              {/* Goal boxes */}
              <rect 
                x={layout.width * 0.3} 
                y="2" 
                width={layout.width * 0.4} 
                height="12" 
                fill="none" 
                stroke="white" 
                strokeWidth="0.5" 
              />
              <rect 
                x={layout.width * 0.3} 
                y={layout.height - 14} 
                width={layout.width * 0.4} 
                height="12" 
                fill="none" 
                stroke="white" 
                strokeWidth="0.5" 
              />
            </svg>

            {/* Player slots */}
            {starters.map((assignment, idx) => {
              const { slot, player } = assignment
              const leftPercent = (slot.x / layout.width) * 100
              const topPercent = (slot.y / layout.height) * 100

              return (
                <div
                  key={slot.code}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                  }}
                >
                  {player ? (
                    // Filled slot with player
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-9 h-9 rounded-full bg-primary border-2 border-black flex items-center justify-center shadow-lg">
                        <span className="text-black font-bold text-xs">
                          {getPlayerInitials(player.name)}
                        </span>
                      </div>
                      <div className="text-[9px] text-white font-medium bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap max-w-[60px] truncate">
                        {player.name.split(' ')[0]}
                      </div>
                    </div>
                  ) : (
                    // Empty slot
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-9 h-9 rounded-full bg-gray-700/50 border-2 border-dashed border-gray-500 flex items-center justify-center">
                        <span className="text-gray-400 font-semibold text-[10px]">
                          {slot.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bench */}
      {showBench && bench.length > 0 && (
        <div className="bg-[#0b1220] border border-[#1f2937] rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-2 font-medium">
            Suplentes ({bench.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {bench.map((player, idx) => (
              <div
                key={`${player.userId}-${idx}`}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#071422] border border-[#1f2937] rounded text-xs"
              >
                <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-300 font-bold text-[9px]">
                    {getPlayerInitials(player.name)}
                  </span>
                </div>
                <span className="text-white font-medium">{player.name}</span>
                {player.suggestedRoleCode && (
                  <span className="text-gray-400 text-[10px]">
                    ({player.suggestedRoleCode})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
