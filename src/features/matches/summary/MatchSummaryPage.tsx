import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import Badge from '../../../components/Badge'
import Header from '../../../components/Header'
import BottomNav from '../../../components/BottomNav'
import InvitePlayerModal from '../invites/InvitePlayerModal'
import { useAuthStore } from '../../auth/auth.store'
import { useMatchSummary } from '../hooks/useMatchSummary'
import { MatchTeamSummary } from '../../../types/match.types'
import FieldMatch from '../../lineup/components/FieldMatch'
import { SOCCER_LAYOUTS_BY_FORMAT } from '../../lineup/layouts/soccerLayouts'
import { autoAssignLineup } from '../../lineup/utils/autoAssignLineup'

export default function MatchSummaryPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [inviteModal, setInviteModal] = useState<{
    teamId: string
    teamName: string
    side: 'HOME' | 'AWAY'
  } | null>(null)

  const { data: summary, isLoading, error, refetch } = useMatchSummary(matchId)

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="text-center py-8 text-muted">Cargando resumen...</div>
        <BottomNav />
      </div>
    )
  }

  if (error || !summary) {
    console.error('Match summary error:', error)
    const errorMessage = error && typeof error === 'object' && 'message' in error 
      ? String(error.message) 
      : 'El partido no tiene datos de resumen disponibles'
    
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="text-center py-8 px-4">
          <div className="text-red-400 mb-4">
            Error al cargar el partido
          </div>
          <div className="text-sm text-gray-400 mb-4">
            {errorMessage}
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Match ID: {matchId}
          </div>
          <Button onClick={() => refetch()} variant="primary" className="mb-2">
            Reintentar
          </Button>
          <Button onClick={() => navigate('/home')} variant="secondary">
            Volver al inicio
          </Button>
        </div>
        <BottomNav />
      </div>
    )
  }

  // Extract teams from matchTeams array
  const homeTeam = summary.matchTeams?.find(t => t.side === 'HOME')
  const awayTeam = summary.matchTeams?.find(t => t.side === 'AWAY')

  // Extract counts from _count field
  const homeInvited = homeTeam?._count?.invites ?? 0
  const homeAccepted = homeTeam?._count?.rosters ?? 0
  const awayInvited = awayTeam?._count?.invites ?? 0
  const awayAccepted = awayTeam?._count?.rosters ?? 0

  // Get format info (onFieldPlayers is the minimum required)
  const minRequired = homeTeam?.onFieldPlayers ?? summary.format?.onFieldPlayers ?? 5

  const homeReady = homeAccepted >= minRequired
  const awayReady = awayAccepted >= minRequired

  const challengeAccepted = !summary.challenge || summary.challenge.status === 'ACCEPTED'
  const isMatchReady = homeReady && awayReady && challengeAccepted

  // Get field layout based on format
  const formatCode = summary.format?.code || 'STANDARD_5V5'
  const fieldLayout = SOCCER_LAYOUTS_BY_FORMAT[formatCode] ?? SOCCER_LAYOUTS_BY_FORMAT['STANDARD_5V5']

  // Get accepted players for each team
  const homeAcceptedPlayers = homeTeam?.rosters?.map(r => ({
    userId: r.userId,
    name: r.user?.name ?? 'Jugador',
    avatarUrl: r.user?.avatarUrl,
    // Try different possible field names for role
    suggestedRoleCode: r.suggestedRoleCode ?? (r as any).roleCode ?? (r as any).role ?? (r as any).position
  })) ?? []

  const awayAcceptedPlayers = awayTeam?.rosters?.map(r => ({
    userId: r.userId,
    name: r.user?.name ?? 'Jugador',
    avatarUrl: r.user?.avatarUrl,
    // Try different possible field names for role
    suggestedRoleCode: r.suggestedRoleCode ?? (r as any).roleCode ?? (r as any).role ?? (r as any).position
  })) ?? []

  // Auto-assign players to field positions
  const homeLineup = autoAssignLineup(fieldLayout, homeAcceptedPlayers)
  const awayLineup = autoAssignLineup(fieldLayout, awayAcceptedPlayers)

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="text-center py-8 text-muted">Cargando...</div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <Header name={user?.name} />

      <main className="px-4 space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Resumen del partido</h1>
          {isMatchReady ? (
            <Badge variant="success">Listo</Badge>
          ) : (
            <Badge variant="warning">Pendiente</Badge>
          )}
        </div>

        {/* Format with Field View */}
        {(summary.format || homeTeam) && (
          <Card>
            <div className="text-sm text-muted mb-4 text-center">
              Jugadores en campo: <span className="font-semibold text-white">{homeTeam?.onFieldPlayers ?? summary.format?.onFieldPlayers ?? minRequired}</span>
              {' • '}
              Suplentes: <span className="font-semibold text-white">{homeTeam?.substitutesAllowed ?? summary.format?.substitutesAllowed ?? 0}</span>
            </div>

            {/* Single field showing both teams */}
            <div className="mt-4">
              <FieldMatch
                layout={fieldLayout}
                homeStarters={homeLineup.starters}
                awayStarters={awayLineup.starters}
                homeTeamName={homeTeam?.team?.name || 'Local'}
                awayTeamName={awayTeam?.team?.name || 'Visitante'}
                homeBench={homeLineup.bench}
                awayBench={awayLineup.bench}
                maxSubstitutes={homeTeam?.substitutesAllowed ?? summary.format?.substitutesAllowed ?? 5}
              />
            </div>
          </Card>
        )}

        {/* HOME Team */}
        {homeTeam && (
          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{homeTeam.team.name}</h3>
                <Badge variant="info">LOCAL</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-muted">Invitados</div>
                  <div className="font-semibold">{homeInvited}</div>
                </div>
                <div>
                  <div className="text-muted">Aceptados</div>
                  <div className="font-semibold">{homeAccepted}</div>
                </div>
                <div>
                  <div className="text-muted">Mínimo</div>
                  <div className="font-semibold">{minRequired}</div>
                </div>
              </div>
              {homeReady ? (
                <Badge variant="success">✓ Listo</Badge>
              ) : (
                <Badge variant="warning">
                  Faltan {minRequired - homeAccepted} jugadores
                </Badge>
              )}
              <Button
                onClick={() => {
                  setInviteModal({
                    teamId: homeTeam.teamId,
                    teamName: homeTeam.team.name,
                    side: 'HOME'
                  })
                }}
                variant="primary"
                className="w-full mt-2"
              >
                + Agregar jugador
              </Button>
            </div>
          </Card>
        )}

        {/* AWAY Team */}
        {awayTeam && (
          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{awayTeam.team.name}</h3>
                <Badge variant="warning">VISITANTE</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-muted">Invitados</div>
                  <div className="font-semibold">{awayInvited}</div>
                </div>
                <div>
                  <div className="text-muted">Aceptados</div>
                  <div className="font-semibold">{awayAccepted}</div>
                </div>
                <div>
                  <div className="text-muted">Mínimo</div>
                  <div className="font-semibold">{minRequired}</div>
                </div>
              </div>
              {awayReady ? (
                <Badge variant="success">✓ Listo</Badge>
              ) : (
                <Badge variant="warning">
                  Faltan {minRequired - awayAccepted} jugadores
                </Badge>
              )}
              <Button
                onClick={() => {
                  setInviteModal({
                    teamId: awayTeam.teamId,
                    teamName: awayTeam.team.name,
                    side: 'AWAY'
                  })
                }}
                variant="primary"
                className="w-full mt-2"
              >
                + Agregar jugador
              </Button>
            </div>
          </Card>
        )}

        {/* Challenge */}
        {summary.challenge && (
          <Card>
            <h3 className="font-semibold mb-2">Desafío</h3>
            {summary.challenge.status === 'PENDING' && (
              <Badge variant="warning">Pendiente de aceptación</Badge>
            )}
            {summary.challenge.status === 'ACCEPTED' && (
              <Badge variant="success">✓ Aceptado</Badge>
            )}
            {summary.challenge.status === 'DECLINED' && (
              <Badge variant="error">Rechazado</Badge>
            )}
          </Card>
        )}

        <Button onClick={() => navigate('/home')} variant="secondary">
          Volver al inicio
        </Button>
      </main>

      <BottomNav />

      {inviteModal && (
        <InvitePlayerModal
          matchId={matchId!}
          teamId={inviteModal.teamId}
          teamName={inviteModal.teamName}
          side={inviteModal.side}
          onClose={() => setInviteModal(null)}
        />
      )}
    </div>
  )
}
