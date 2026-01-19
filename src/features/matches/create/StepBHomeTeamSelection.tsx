import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import { teamsApi } from '../../../services/endpoints'
import { useMatchDraftStore } from '../../../store/matchDraft.store'
import { useDebounce } from '../../../hooks/useDebounce'

export default function StepBHomeTeamSelection() {
  const navigate = useNavigate()
  const { selectedSport, setHomeTeam } = useMatchDraftStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null)
  const debouncedSearch = useDebounce(searchQuery, 350)

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams', 'mine', selectedSport?.id, debouncedSearch],
    queryFn: () =>
      teamsApi.search({
        scope: 'mine',
        sportId: selectedSport?.id,
        q: debouncedSearch
      }),
    enabled: !!selectedSport?.id
  })

  const handleContinue = () => {
    if (!selectedTeam) return
    setHomeTeam(selectedTeam)
    navigate('/matches/create/away-team')
  }

  const handleCreateTeam = () => {
    navigate('/teams/create?role=home')
  }

  if (!selectedSport) {
    navigate('/matches/create')
    return null
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Selecciona tu equipo local</h2>
        <p className="text-sm text-gray-400">Equipo HOME para {selectedSport.name}</p>
      </div>

      <Input
        placeholder="Buscar equipo..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-gray-400">Buscando...</div>
        ) : teams.length === 0 ? (
          <Card>
            <div className="text-center py-6 space-y-3">
              <p className="text-gray-300 text-sm">
                {searchQuery
                  ? 'No se encontraron equipos con ese nombre'
                  : 'No tienes equipos para este deporte. Debes crear uno para continuar.'}
              </p>
              <Button onClick={handleCreateTeam} variant="primary">
                Crear equipo
              </Button>
            </div>
          </Card>
        ) : (
          teams.map((team) => (
            <Card
              key={team.id}
              selected={selectedTeam?.id === team.id}
              onClick={() => setSelectedTeam(team)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{team.name}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {teams.length > 0 && (
        <Button onClick={handleCreateTeam} variant="secondary">
          + Crear nuevo equipo
        </Button>
      )}

      <div className="flex gap-3">
        <Button onClick={() => navigate('/matches/create')} variant="secondary">
          Atrás
        </Button>
        <Button onClick={handleContinue} disabled={!selectedTeam} variant="primary">
          Continuar
        </Button>
      </div>
    </div>
  )
}
