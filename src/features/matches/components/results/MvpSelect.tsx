import React from 'react'

type PlayerLite = {
  userId: string
  name: string
  avatarUrl?: string | null
  teamId: string
}

type Props = {
  players: PlayerLite[]
  selectedMvpId: string | null
  onSelect: (userId: string | null) => void
}

export default function MvpSelect({ players, selectedMvpId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Mejor jugador (MVP)
      </label>
      <select
        value={selectedMvpId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full px-3 py-2 bg-[#0b1220] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-primary"
      >
        <option value="">Seleccionar jugador</option>
        {players.map((player) => (
          <option key={player.userId} value={player.userId}>
            {player.name}
          </option>
        ))}
      </select>
    </div>
  )
}
