import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Button from '../../../../components/Button'
import Card from '../../../../components/Card'
import Badge from '../../../../components/Badge'
import Input from '../../../../components/Input'
import { teamsApi, matchesApi, challengesApi } from '../../../../services/endpoints'
import { useWizardStore } from '../../../../store/wizard.store'
import type { Team } from '../../../../types/match.types'

export default function Step2Teams() {
  const {
    matchId,
    homeTeamId,
    awayTeamId,
    setHomeTeam,
    setAwayTeam,
    setChallenge,
    setStep
  } = useWizardStore()

  const [homeSearch, setHomeSearch] = useState('')
  const [awaySearch, setAwaySearch] = useState('')
  const [selectedHome, setSelectedHome] = useState<string | null>(homeTeamId)
  const [selectedAway, setSelectedAway] = useState<string | null>(awayTeamId)
  const [error, setError] = useState<string | null>(null)
  const [showChallenge, setShowChallenge] = useState(false)
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null)

  // Load teams
  const { data: myTeams = [] } = useQuery({
    queryKey: ['teams', 'mine'],
    queryFn: () => teamsApi.search({ scope: 'mine' })
  })

  const { data: publicTeams = [] } = useQuery({
    queryKey: ['teams', 'public', awaySearch],
    queryFn: () => teamsApi.search({ scope: 'public', q: awaySearch }),
    enabled: awaySearch.length > 0
  })

  const assignTeamMutation = useMutation({
    mutationFn: async ({
      teamId,
      side
    }: {
      teamId: string
      side: 'HOME' | 'AWAY'
    }) => {
      await matchesApi.assignTeam(matchId!, { teamId, side })
    }
  })

  const createChallengeMutation = useMutation({
    mutationFn: async (challengedTeamId: string) => {
      return await challengesApi.create(matchId!, { challengedTeamId })
    },
    onSuccess: (challenge) => {
      setChallenge('PENDING', challenge.urlToShare)
      setChallengeUrl(challenge.urlToShare)
      setShowChallenge(true)
    }
  })

  const filteredMyTeams = myTeams.filter((t) =>
    t.name.toLowerCase().includes(homeSearch.toLowerCase())
  )

  const allAwayTeams = [...myTeams, ...publicTeams]
  const filteredAwayTeams = allAwayTeams.filter((t) =>
    t.name.toLowerCase().includes(awaySearch.toLowerCase())
  )

  const selectedHomeTeam = myTeams.find((t) => t.id === selectedHome)
  const selectedAwayTeam = allAwayTeams.find((t) => t.id === selectedAway)

  const handleContinue = async () => {
    if (!selectedHome || !selectedAway) {
      setError('Please select both HOME and AWAY teams')
      return
    }

    if (selectedHome === selectedAway) {
      setError('HOME and AWAY teams must be different')
      return
    }

    setError(null)

    try {
      // Assign HOME team
      await assignTeamMutation.mutateAsync({
        teamId: selectedHome,
        side: 'HOME'
      })
      setHomeTeam(selectedHome)

      // Assign AWAY team
      await assignTeamMutation.mutateAsync({
        teamId: selectedAway,
        side: 'AWAY'
      })

      const awayTeam = allAwayTeams.find((t) => t.id === selectedAway)
      const isAwayPublic = awayTeam?.isPublic || false
      setAwayTeam(selectedAway, isAwayPublic)

      // If AWAY is public and not managed by user, create challenge
      const isAwayManagedByUser = myTeams.some((t) => t.id === selectedAway)
      if (isAwayPublic && !isAwayManagedByUser) {
        await createChallengeMutation.mutateAsync(selectedAway)
      } else {
        setStep(3)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign teams')
    }
  }

  if (showChallenge && challengeUrl) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Desafío enviado</h2>
          <p className="text-sm text-muted">
            Comparte este enlace con el equipo rival
          </p>
        </div>

        <Card>
          <div className="space-y-3">
            <div className="text-sm text-muted">Enlace del desafío:</div>
            <div className="bg-[#071422] p-3 rounded text-xs break-all">
              {challengeUrl}
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(challengeUrl)
              }}
              variant="secondary"
            >
              Copiar enlace
            </Button>
          </div>
        </Card>

        <Button onClick={() => setStep(3)} variant="primary">
          Continuar al siguiente paso
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Selecciona los equipos</h2>
        <p className="text-sm text-muted">Elige los equipos HOME y AWAY</p>
      </div>

      {error && (
        <div className="bg-red-900 text-red-200 text-sm rounded p-3 text-center">
          {error}
        </div>
      )}

      {/* HOME TEAM */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold">Equipo LOCAL (HOME)</label>
          {selectedHomeTeam && (
            <Badge variant="info">{selectedHomeTeam.name}</Badge>
          )}
        </div>
        <Input
          placeholder="Buscar en mis equipos..."
          value={homeSearch}
          onChange={(e) => setHomeSearch(e.target.value)}
        />
        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
          {filteredMyTeams.map((team) => (
            <Card
              key={team.id}
              selected={selectedHome === team.id}
              onClick={() => setSelectedHome(team.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{team.name}</span>
                <span className="text-xs text-muted">{team.memberCount} miembros</span>
              </div>
            </Card>
          ))}
          {filteredMyTeams.length === 0 && (
            <div className="text-center text-sm text-muted py-4">
              No se encontraron equipos
            </div>
          )}
        </div>
      </div>

      {/* AWAY TEAM */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold">Equipo VISITANTE (AWAY)</label>
          {selectedAwayTeam && (
            <div className="flex gap-2">
              <Badge variant="warning">{selectedAwayTeam.name}</Badge>
              {selectedAwayTeam.isPublic && <Badge variant="info">Público</Badge>}
            </div>
          )}
        </div>
        <Input
          placeholder="Buscar equipos..."
          value={awaySearch}
          onChange={(e) => setAwaySearch(e.target.value)}
        />
        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
          {filteredAwayTeams.map((team) => (
            <Card
              key={team.id}
              selected={selectedAway === team.id}
              onClick={() => setSelectedAway(team.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{team.name}</span>
                  {team.isPublic && (
                    <Badge variant="info" className="ml-2">
                      Público
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted">{team.memberCount} miembros</span>
              </div>
            </Card>
          ))}
          {filteredAwayTeams.length === 0 && awaySearch && (
            <div className="text-center text-sm text-muted py-4">
              No se encontraron equipos
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => setStep(1)} variant="secondary">
          Atrás
        </Button>
        <Button
          onClick={handleContinue}
          disabled={
            !selectedHome ||
            !selectedAway ||
            assignTeamMutation.isPending ||
            createChallengeMutation.isPending
          }
          variant="primary"
        >
          {assignTeamMutation.isPending || createChallengeMutation.isPending
            ? 'Procesando...'
            : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}
