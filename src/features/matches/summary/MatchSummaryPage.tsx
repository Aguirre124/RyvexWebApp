import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import Badge from '../../../components/Badge'
import Header from '../../../components/Header'
import BottomNav from '../../../components/BottomNav'
import InvitePlayerModal from '../invites/InvitePlayerModal'
import { matchesApi } from '../../../services/endpoints'
import { useAuthStore } from '../../auth/auth.store'

export default function MatchSummaryPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [inviteModal, setInviteModal] = useState<{
    teamId: string
    teamName: string
    side: 'HOME' | 'AWAY'
  } | null>(null)

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['match-summary', matchId],
    queryFn: async () => {
      const result = await matchesApi.getSummary(matchId!)
      console.log('Match summary response:', result)
      console.log('homeTeam:', result?.homeTeam)
      console.log('awayTeam:', result?.awayTeam)
      if (!result) {
        throw new Error('No summary data returned from API')
      }
      return result
    },
    enabled: !!matchId,
    retry: false
  })

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="text-center py-8 text-muted">Cargando...</div>
        <BottomNav />
      </div>
    )
  }

  if (error || !summary) {
    console.error('Match summary error:', error)
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="text-center py-8 px-4">
          <div className="text-red-400 mb-4">
            Error al cargar el partido
          </div>
          <div className="text-sm text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'El partido no tiene datos de resumen disponibles'}
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Match ID: {matchId}
          </div>
          <Button onClick={() => navigate('/home')} variant="secondary">
            Volver al inicio
          </Button>
        </div>
        <BottomNav />
      </div>
    )
  }

  const homeReady =
    summary.homeTeam &&
    summary.homeTeam.acceptedCount >= summary.homeTeam.minRequired

  const awayReady =
    summary.awayTeam &&
    summary.awayTeam.acceptedCount >= summary.awayTeam.minRequired

  const challengeAccepted =
    !summary.challenge || summary.challenge.status === 'ACCEPTED'

  const isMatchReady = homeReady && awayReady && challengeAccepted

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

        {/* Format */}
        <Card>
          <h3 className="font-semibold mb-3">Formato: {summary.format.name}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted">Jugadores en campo</div>
              <div className="font-semibold">{summary.format.onFieldPlayers}</div>
            </div>
            <div>
              <div className="text-muted">Suplentes</div>
              <div className="font-semibold">{summary.format.substitutesAllowed}</div>
            </div>
          </div>
        </Card>

        {/* HOME Team */}
        {summary.homeTeam && (
          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{summary.homeTeam.name}</h3>
                <Badge variant="info">LOCAL</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-muted">Invitados</div>
                  <div className="font-semibold">{summary.homeTeam.invitedCount}</div>
                </div>
                <div>
                  <div className="text-muted">Aceptados</div>
                  <div className="font-semibold">{summary.homeTeam.acceptedCount}</div>
                </div>
                <div>
                  <div className="text-muted">Mínimo</div>
                  <div className="font-semibold">{summary.format.onFieldPlayers}</div>
                </div>
              </div>
              {homeReady ? (
                <Badge variant="success">✓ Listo</Badge>
              ) : (
                <Badge variant="warning">
                  Faltan {summary.homeTeam.minRequired - summary.homeTeam.acceptedCount}{' '}
                  jugadores
                </Badge>
              )}
              <Button
                onClick={() => {
                  console.log('HOME button clicked')
                  console.log('homeTeamId:', summary.homeTeam?.id)
                  if (summary.homeTeam?.id) {
                    setInviteModal({
                      teamId: summary.homeTeam.id,
                      teamName: summary.homeTeam.name,
                      side: 'HOME'
                    })
                  } else {
                    console.error('No homeTeamId available')
                  }
                }}
                variant="primary"
                className="w-full mt-2"
                disabled={!summary.homeTeam?.id}
              >
                + Agregar jugador
              </Button>
            </div>
          </Card>
        )}

        {/* AWAY Team */}
        {summary.awayTeam && (
          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{summary.awayTeam.name}</h3>
                <Badge variant="warning">VISITANTE</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-muted">Invitados</div>
                  <div className="font-semibold">{summary.awayTeam.invitedCount}</div>
                </div>
                <div>
                  <div className="text-muted">Aceptados</div>
                  <div className="font-semibold">{summary.awayTeam.acceptedCount}</div>
                </div>
                <div>
                  <div className="text-muted">Mínimo</div>
                  <div className="font-semibold">{summary.format.onFieldPlayers}</div>
                </div>
              </div>
              {awayReady ? (
                <Badge variant="success">✓ Listo</Badge>
              ) : (
                <Badge variant="warning">
                  Faltan {summary.awayTeam.minRequired - summary.awayTeam.acceptedCount}{' '}
                  jugadores
                </Badge>
              )}
              <Button
                onClick={() => {
                  console.log('AWAY button clicked')
                  console.log('awayTeamId:', summary.awayTeam?.id)
                  if (summary.awayTeam?.id) {
                    setInviteModal({
                      teamId: summary.awayTeam.id,
                      teamName: summary.awayTeam.name,
                      side: 'AWAY'
                    })
                  } else {
                    console.error('No awayTeamId available')
                  }
                }}
                variant="primary"
                className="w-full mt-2"
                disabled={!summary.awayTeam?.id}
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
