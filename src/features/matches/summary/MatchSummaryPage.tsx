import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import Badge from '../../../components/Badge'
import Header from '../../../components/Header'
import BottomNav from '../../../components/BottomNav'
import { matchesApi } from '../../../services/endpoints'
import { useAuthStore } from '../../auth/auth.store'

export default function MatchSummaryPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['match-summary', matchId],
    queryFn: () => matchesApi.getSummary(matchId!),
    enabled: !!matchId
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
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="text-center py-8 text-red-400">
          Error al cargar el partido
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
                <h3 className="font-semibold">{summary.homeTeam.teamName}</h3>
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
                  <div className="font-semibold">{summary.homeTeam.minRequired}</div>
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
            </div>
          </Card>
        )}

        {/* AWAY Team */}
        {summary.awayTeam && (
          <Card>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{summary.awayTeam.teamName}</h3>
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
                  <div className="font-semibold">{summary.awayTeam.minRequired}</div>
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
    </div>
  )
}
