import React from 'react'

type Props = {
  homeTeamName: string
  awayTeamName: string
  homeGoals: number
  awayGoals: number
  onHomeGoalsChange: (value: number) => void
  onAwayGoalsChange: (value: number) => void
}

export default function ScoreInputs({
  homeTeamName,
  awayTeamName,
  homeGoals,
  awayGoals,
  onHomeGoalsChange,
  onAwayGoalsChange
}: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Marcador final</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Home Team */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">{homeTeamName}</label>
          <input
            type="number"
            min="0"
            value={homeGoals}
            onChange={(e) => onHomeGoalsChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-4 py-3 bg-[#0b1220] border border-[#1f2937] rounded-lg text-white text-2xl font-bold text-center focus:outline-none focus:border-primary"
          />
        </div>

        {/* Away Team */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">{awayTeamName}</label>
          <input
            type="number"
            min="0"
            value={awayGoals}
            onChange={(e) => onAwayGoalsChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-4 py-3 bg-[#0b1220] border border-[#1f2937] rounded-lg text-white text-2xl font-bold text-center focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  )
}
