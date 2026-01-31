import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../../../components/Header'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import { useAuthStore } from '../../auth/auth.store'
import { useMatchSummary } from '../hooks/useMatchSummary'
import { useSubmitMatchResults } from '../hooks/useMatchResults'
import ScoreInputs from '../components/results/ScoreInputs'
import PlayerStatsEditor from '../components/results/PlayerStatsEditor'
import MvpSelect from '../components/results/MvpSelect'
import { MatchEvent } from '../../../services/matchResults.api'

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

export default function MatchResultsPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: summary, isLoading } = useMatchSummary(matchId)
  const submitMutation = useSubmitMatchResults(matchId!)

  const [homeGoals, setHomeGoals] = useState(0)
  const [awayGoals, setAwayGoals] = useState(0)
  const [homeStats, setHomeStats] = useState<PlayerStats>({})
  const [awayStats, setAwayStats] = useState<PlayerStats>({})
  const [mvpUserId, setMvpUserId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Extract players from roster
  const homePlayers: PlayerLite[] = useMemo(() => {
    const homeTeam = summary?.matchTeams?.find(t => t.side === 'HOME')
    return homeTeam?.rosters?.map(r => ({
      userId: r.userId,
      name: r.user?.name || 'Jugador',
      avatarUrl: r.user?.avatarUrl,
      teamId: homeTeam.teamId
    })) || []
  }, [summary])

  const awayPlayers: PlayerLite[] = useMemo(() => {
    const awayTeam = summary?.matchTeams?.find(t => t.side === 'AWAY')
    return awayTeam?.rosters?.map(r => ({
      userId: r.userId,
      name: r.user?.name || 'Jugador',
      avatarUrl: r.user?.avatarUrl,
      teamId: awayTeam.teamId
    })) || []
  }, [summary])

  const allPlayers = useMemo(() => [...homePlayers, ...awayPlayers], [homePlayers, awayPlayers])

  const homeTeam = summary?.matchTeams?.find(t => t.side === 'HOME')
  const awayTeam = summary?.matchTeams?.find(t => t.side === 'AWAY')

  const handleHomeStatsChange = (userId: string, type: keyof PlayerStats[string], value: number) => {
    setHomeStats(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { goals: 0, assists: 0, yellowCards: 0, redCards: 0 }),
        [type]: value
      }
    }))
  }

  const handleAwayStatsChange = (userId: string, type: keyof PlayerStats[string], value: number) => {
    setAwayStats(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { goals: 0, assists: 0, yellowCards: 0, redCards: 0 }),
        [type]: value
      }
    }))
  }

  const validateAndSubmit = () => {
    setValidationError(null)

    // Calculate total goals from player stats
    const homePlayerGoals = Object.values(homeStats).reduce((sum, stats) => sum + stats.goals, 0)
    const awayPlayerGoals = Object.values(awayStats).reduce((sum, stats) => sum + stats.goals, 0)

    // Validate consistency
    if (homePlayerGoals !== homeGoals) {
      setValidationError(`Los goles por jugador del equipo local (${homePlayerGoals}) no coinciden con el marcador (${homeGoals})`)
      return
    }

    if (awayPlayerGoals !== awayGoals) {
      setValidationError(`Los goles por jugador del equipo visitante (${awayPlayerGoals}) no coinciden con el marcador (${awayGoals})`)
      return
    }

    // Build events array
    const events: MatchEvent[] = []

    // Home team events
    Object.entries(homeStats).forEach(([userId, stats]) => {
      if (stats.goals > 0) {
        events.push({ teamId: homeTeam!.teamId, userId, type: 'GOAL', count: stats.goals })
      }
      if (stats.assists > 0) {
        events.push({ teamId: homeTeam!.teamId, userId, type: 'ASSIST', count: stats.assists })
      }
      if (stats.yellowCards > 0) {
        events.push({ teamId: homeTeam!.teamId, userId, type: 'YELLOW', count: stats.yellowCards })
      }
      if (stats.redCards > 0) {
        events.push({ teamId: homeTeam!.teamId, userId, type: 'RED', count: stats.redCards })
      }
    })

    // Away team events
    Object.entries(awayStats).forEach(([userId, stats]) => {
      if (stats.goals > 0) {
        events.push({ teamId: awayTeam!.teamId, userId, type: 'GOAL', count: stats.goals })
      }
      if (stats.assists > 0) {
        events.push({ teamId: awayTeam!.teamId, userId, type: 'ASSIST', count: stats.assists })
      }
      if (stats.yellowCards > 0) {
        events.push({ teamId: awayTeam!.teamId, userId, type: 'YELLOW', count: stats.yellowCards })
      }
      if (stats.redCards > 0) {
        events.push({ teamId: awayTeam!.teamId, userId, type: 'RED', count: stats.redCards })
      }
    })

    // Submit
    submitMutation.mutate(
      {
        homeGoals,
        awayGoals,
        mvpUserId,
        notes: notes.trim() || undefined,
        events
      },
      {
        onSuccess: () => {
          navigate(`/matches/${matchId}/summary`, { 
            state: { message: '✅ Resultados guardados' }
          })
        }
      }
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="text-center py-8 text-muted">Cargando...</div>
      </div>
    )
  }

  if (!summary || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="text-center py-8 text-red-400">
          No se pudo cargar la información del partido
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <Header name={user?.name} />

      <main className="px-4 space-y-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold">Registrar resultados</h1>
        </div>

        {validationError && (
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-200">{validationError}</p>
          </div>
        )}

        <Card>
          <ScoreInputs
            homeTeamName={homeTeam.team.name}
            awayTeamName={awayTeam.team.name}
            homeGoals={homeGoals}
            awayGoals={awayGoals}
            onHomeGoalsChange={setHomeGoals}
            onAwayGoalsChange={setAwayGoals}
          />
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-3">Estadísticas por jugador</h3>
          <p className="text-sm text-gray-400 mb-4">
            Los goles por jugador deben coincidir con el marcador final
          </p>
          
          <div className="space-y-6">
            <PlayerStatsEditor
              players={homePlayers}
              teamName={homeTeam.team.name}
              stats={homeStats}
              onStatsChange={handleHomeStatsChange}
            />

            <PlayerStatsEditor
              players={awayPlayers}
              teamName={awayTeam.team.name}
              stats={awayStats}
              onStatsChange={handleAwayStatsChange}
            />
          </div>
        </Card>

        <Card>
          <MvpSelect
            players={allPlayers}
            selectedMvpId={mvpUserId}
            onSelect={setMvpUserId}
          />
        </Card>

        <Card>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones adicionales sobre el partido..."
            rows={3}
            className="w-full px-3 py-2 bg-[#0b1220] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-primary resize-none"
          />
        </Card>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={validateAndSubmit}
            disabled={submitMutation.isPending}
            className="flex-1"
          >
            {submitMutation.isPending ? 'Guardando...' : 'Guardar resultados'}
          </Button>
        </div>
      </main>
    </div>
  )
}
