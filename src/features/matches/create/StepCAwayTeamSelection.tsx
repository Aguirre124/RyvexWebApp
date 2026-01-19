import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Badge from '../../../components/Badge'
import { teamsApi } from '../../../services/endpoints'
import { useMatchDraftStore } from '../../../store/matchDraft.store'
import { useDebounce } from '../../../hooks/useDebounce'

export default function StepCAwayTeamSelection() {
  const navigate = useNavigate()
  const { selectedSport, homeTeam, setAwayTeam } = useMatchDraftStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
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

  const handleTeamSelect = (team: { id: string; name: string }) => {
    if (team.id === homeTeam?.id) {
      setValidationError('No puedes seleccionar el mismo equipo para LOCAL y VISITANTE')
      setSelectedTeam(null)
      return
    }
    setValidationError(null)
    setSelectedTeam(team)
  }

  const handleContinue = () => {
    if (!selectedTeam) return
    if (selectedTeam.id === homeTeam?.id) {
      setValidationError('No puedes seleccionar el mismo equipo para LOCAL y VISITANTE')
      return
    }
    setAwayTeam(selectedTeam)
    navigate('/matches/create/summary')
  }

  const handleCreateTeam = () => {
    navigate('/teams/create?role=away')
  }

  if (!selectedSport || !homeTeam) {
    navigate('/matches/create')
    return null
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Selecciona el equipo visitante</h2>
        <p className="text-sm text-muted">Equipo AWAY para {selectedSport.name}</p>
      </div>

      {homeTeam && (
        <Card className="bg-[#071422]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Equipo local:</span>
            <Badge variant="info">{homeTeam.name}</Badge>
          </div>
        </Card>
      )}

      {validationError && (
        <div className="bg-red-900 text-red-200 text-sm rounded p-3 text-center">
          {validationError}
        </div>
      )}

      <Input
        placeholder="Buscar equipo..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-muted">Buscando...</div>
        ) : teams.length === 0 ? (
          <Card>
            <div className="text-center py-6 space-y-3">
              <p className="text-muted text-sm">
                {searchQuery
                  ? 'No se encontraron equipos con ese nombre'
                  : 'No tienes más equipos para este deporte.'}
              </p>
              <Button onClick={handleCreateTeam} variant="primary">
                Crear equipo visitante
              </Button>
            </div>
          </Card>
        ) : (
          teams.map((team) => {
            const isHomeTeam = team.id === homeTeam?.id
            return (
              <Card
                key={team.id}
                selected={selectedTeam?.id === team.id}
                onClick={() => !isHomeTeam && handleTeamSelect(team)}
                className={isHomeTeam ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{team.name}</span>
                  {isHomeTeam && (
                    <Badge variant="warning" className="text-xs">
                      Ya seleccionado
                    </Badge>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>

      {teams.length > 0 && (
        <Button onClick={handleCreateTeam} variant="secondary">
          + Crear nuevo equipo
        </Button>
      )}

      <div className="flex gap-3">
        <Button onClick={() => navigate('/matches/create/home-team')} variant="secondary">
          Atrás
        </Button>
        <Button onClick={handleContinue} disabled={!selectedTeam} variant="primary">
          Continuar
        </Button>
      </div>
    </div>
  )
}
