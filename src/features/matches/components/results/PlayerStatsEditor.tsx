import React from 'react'

type PlayerLite = {
  userId: string
  name: string
  avatarUrl?: string | null
  teamId: string
}

type PlayerStats = {
  [userId: string]: {
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
}

type Props = {
  players: PlayerLite[]
  teamName: string
  stats: PlayerStats
  onStatsChange: (userId: string, type: 'goals' | 'assists' | 'yellowCards' | 'redCards', value: number) => void
}

export default function PlayerStatsEditor({ players, teamName, stats, onStatsChange }: Props) {
  const StatStepper = ({ 
    value, 
    onChange, 
    label,
    color = 'primary'
  }: { 
    value: number
    onChange: (val: number) => void
    label: string
    color?: 'primary' | 'yellow' | 'red'
  }) => {
    const colorClasses = {
      primary: 'text-primary',
      yellow: 'text-yellow-400',
      red: 'text-red-400'
    }

    return (
      <div className="flex items-center gap-1">
        <span className={`text-xs ${colorClasses[color]} mr-1`}>{label}</span>
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-sm"
          disabled={value === 0}
        >
          -
        </button>
        <span className="w-6 text-center text-sm font-semibold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-6 h-6 rounded bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-sm"
        >
          +
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{teamName}</h3>
      
      <div className="space-y-2">
        {players.map((player) => {
          const playerStats = stats[player.userId] || { goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
          
          return (
            <div key={player.userId} className="p-3 bg-[#0b1220] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt={player.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium">{player.name}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <StatStepper 
                  label="⚽" 
                  value={playerStats.goals} 
                  onChange={(val) => onStatsChange(player.userId, 'goals', val)}
                />
                <StatStepper 
                  label="🅰️" 
                  value={playerStats.assists} 
                  onChange={(val) => onStatsChange(player.userId, 'assists', val)}
                />
                <StatStepper 
                  label="🟨" 
                  value={playerStats.yellowCards} 
                  onChange={(val) => onStatsChange(player.userId, 'yellowCards', val)}
                  color="yellow"
                />
                <StatStepper 
                  label="🟥" 
                  value={playerStats.redCards} 
                  onChange={(val) => onStatsChange(player.userId, 'redCards', val)}
                  color="red"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
