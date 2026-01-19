import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Badge from '../../../components/Badge'
import { matchesApi } from '../../../services/endpoints'
import { useMatchDraftStore } from '../../../store/matchDraft.store'

export default function StepDFormatSelection() {
  const navigate = useNavigate()
  const { selectedSport, homeTeam, awayTeam, resetDraft } = useMatchDraftStore()
  const [error, setError] = useState<string | null>(null)

  const createMatchMutation = useMutation({
    mutationFn: async () => {
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
    onSuccess: () => {
      alert('¡Partido amistoso creado exitosamente!')
      resetDraft()
      navigate('/home')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error al crear el partido')
    }
  })

  const handleContinue = () => {
    setError(null)
    createMatchMutation.mutate()
  }

  if (!selectedSport || !homeTeam || !awayTeam) {
    navigate('/matches/create')
    return null
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Confirmar partido</h2>
        <p className="text-sm text-gray-400">Revisa los detalles antes de crear el partido</p>
      </div>

      <Card className="bg-[#071422]">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Deporte:</span>
            <span className="font-medium text-white">{selectedSport.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Tipo:</span>
            <span className="font-medium text-white">Partido Amistoso</span>
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
