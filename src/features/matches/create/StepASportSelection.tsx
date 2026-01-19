import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import { sportsApi } from '../../../services/endpoints'
import { useMatchDraftStore } from '../../../store/matchDraft.store'

export default function StepASportSelection() {
  const navigate = useNavigate()
  const { setSport } = useMatchDraftStore()
  const [selectedSport, setSelectedSport] = React.useState<{ id: string; name: string } | null>(null)

  const { data: sports = [], isLoading, error } = useQuery({
    queryKey: ['sports'],
    queryFn: sportsApi.getAll
  })

  const handleContinue = () => {
    if (!selectedSport) {
      return
    }
    setSport(selectedSport)
    navigate('/matches/create/home-team')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Selecciona el deporte</h2>
          <p className="text-sm text-muted">Cargando deportes disponibles...</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#0b1220] border border-[#1f2937] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-sm text-muted">No se pudieron cargar los deportes</p>
        </div>
        <div className="bg-red-900 text-red-200 text-sm rounded p-3 text-center">
          {(error as any)?.message || 'Error al cargar deportes'}
        </div>
        <Button onClick={() => window.location.reload()} variant="secondary">
          Reintentar
        </Button>
      </div>
    )
  }

  if (sports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Selecciona el deporte</h2>
        </div>
        <Card>
          <div className="text-center py-8">
            <p className="text-muted">No hay deportes creados</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Selecciona el deporte</h2>
        <p className="text-sm text-muted">Elige el deporte para tu partido</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sports.map((sport) => (
          <Card
            key={sport.id}
            selected={selectedSport?.id === sport.id}
            onClick={() => setSelectedSport(sport)}
          >
            <div className="text-center py-4">
              <div className="text-lg font-bold">{sport.name}</div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selectedSport}
        variant="primary"
      >
        Continuar
      </Button>
    </div>
  )
}
