import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Badge from '../../../components/Badge'
import { matchesApi } from '../../../services/endpoints'
import { useMatchDraftStore } from '../../../store/matchDraft.store'

type FormatOption = {
  code: 'FUTSAL' | 'F5' | 'F7' | 'F11'
  name: string
  onFieldPlayers: number
  substitutesAllowed: number
  maxSquadSize: number
}

const formats: FormatOption[] = [
  {
    code: 'FUTSAL',
    name: 'FUTSAL',
    onFieldPlayers: 5,
    substitutesAllowed: 5,
    maxSquadSize: 10
  },
  {
    code: 'F5',
    name: 'Fútbol 5',
    onFieldPlayers: 5,
    substitutesAllowed: 5,
    maxSquadSize: 10
  },
  {
    code: 'F7',
    name: 'Fútbol 7',
    onFieldPlayers: 7,
    substitutesAllowed: 5,
    maxSquadSize: 12
  },
  {
    code: 'F11',
    name: 'Fútbol 11',
    onFieldPlayers: 11,
    substitutesAllowed: 5,
    maxSquadSize: 16
  }
]

export default function StepDFormatSelection() {
  const navigate = useNavigate()
  const { selectedSport, homeTeam, awayTeam, setFormat, resetDraft } = useMatchDraftStore()
  const [selectedFormatLocal, setSelectedFormatLocal] = useState<FormatOption | null>(null)
  const [error, setError] = useState<string | null>(null)

  const createMatchMutation = useMutation({
    mutationFn: async (format: FormatOption) => {
      if (!selectedSport || !homeTeam || !awayTeam) {
        throw new Error('Faltan datos necesarios')
      }

      return await matchesApi.create({
        sportId: selectedSport.id,
        matchType: 'FRIENDLY',
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        tournamentId: null,
        venueId: null,
        scheduledAt: null,
        durationMin: null
      })
    },
    onSuccess: (match, format) => {
      setFormat(format.code)
      alert('¡Partido amistoso creado exitosamente!')
      resetDraft()
      navigate('/home')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error al crear el partido')
    }
  })

  const handleContinue = () => {
    if (!selectedFormatLocal) {
      setError('Por favor selecciona un formato antes de continuar')
      return
    }
    setError(null)
    createMatchMutation.mutate(selectedFormatLocal)
  }

  if (!selectedSport || !homeTeam || !awayTeam) {
    navigate('/matches/create')
    return null
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Selecciona el formato</h2>
        <p className="text-sm text-gray-400">Elige el tipo de partido que quieres crear</p>
      </div>

      <Card className="bg-[#071422]">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Deporte:</span>
            <span className="font-medium text-white">{selectedSport.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Local:</span>
            <Badge variant="info">{homeTeam.name}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Visitante:</span>
            <Badge variant="warning">{awayTeam.name}</Badge>
          </div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-900 text-red-200 text-sm rounded p-3 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {formats.map((format) => (
          <Card
            key={format.code}
            selected={selectedFormatLocal?.code === format.code}
            onClick={() => setSelectedFormatLocal(format)}
          >
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-2">{format.name}</div>
              <div className="text-sm text-gray-300 space-y-1">
                <div>{format.onFieldPlayers} jugadores</div>
                <div>{format.substitutesAllowed} suplentes</div>
                <div className="text-xs pt-1 border-t border-[#1f2937] mt-2 text-gray-400">
                  Máx. {format.maxSquadSize} convocados
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={() => navigate('/matches/create/away-team')} variant="secondary">
          Atrás
        </Button>
        <Button
          onClick={handleContinue}
          disabled={createMatchMutation.isPending}
          variant="primary"
        >
          {createMatchMutation.isPending ? 'Creando partido...' : 'Crear partido'}
        </Button>
      </div>
    </div>
  )
}
