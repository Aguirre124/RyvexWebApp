import React from 'react'
import { useQuery } from '@tanstack/react-query'
import Button from '../../../../components/Button'
import Card from '../../../../components/Card'
import Badge from '../../../../components/Badge'
import { matchesApi } from '../../../../services/endpoints'
import { useWizardStore } from '../../../../store/wizard.store'
import { useNavigate } from 'react-router-dom'

export default function Step4Summary() {
  const { matchId, challengeUrl, setStep, resetWizard } = useWizardStore()
  const navigate = useNavigate()

  const { data: summary, isLoading } = useQuery({
    queryKey: ['match-summary', matchId],
    queryFn: () => matchesApi.getSummary(matchId!),
    enabled: !!matchId
  })

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted">Cargando resumen...</div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400">Error al cargar el resumen del partido</div>
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

  const handleFinish = () => {
    resetWizard()
    navigate('/home')
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Resumen del partido</h2>
        <p className="text-sm text-muted">Revisa los detalles antes de finalizar</p>
      </div>

      {/* Match Status */}
      <Card>
        <div className="text-center space-y-2">
          {isMatchReady ? (
            <>
              <Badge variant="success" className="text-base px-4 py-2">
                ✓ Partido listo
              </Badge>
              <p className="text-sm text-muted">
                Ambos equipos tienen suficientes jugadores confirmados
              </p>
            </>
          ) : (
            <>
              <Badge variant="warning" className="text-base px-4 py-2">
                Pendiente
              </Badge>
              <p className="text-sm text-muted">
                Aún faltan jugadores o aceptación del desafío
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Format Details */}
      <Card>
        <div className="space-y-2">
          <h3 className="font-semibold mb-3">Formato</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted">Tipo</div>
              <div className="font-semibold">{summary.format.name}</div>
            </div>
            <div>
              <div className="text-muted">Jugadores en campo</div>
              <div className="font-semibold">{summary.format.onFieldPlayers}</div>
            </div>
            <div>
              <div className="text-muted">Suplentes</div>
              <div className="font-semibold">{summary.format.substitutesAllowed}</div>
            </div>
            <div>
              <div className="text-muted">Máx. convocados</div>
              <div className="font-semibold">{summary.format.maxSquadSize}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Teams */}
      <div className="space-y-3">
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
      </div>

      {/* Challenge Status */}
      {summary.challenge && (
        <Card>
          <div className="space-y-3">
            <h3 className="font-semibold">Estado del desafío</h3>
            {summary.challenge.status === 'PENDING' && (
              <>
                <Badge variant="warning">Pendiente de aceptación</Badge>
                <p className="text-sm text-muted">
                  Esperando que el equipo rival acepte el desafío
                </p>
                {challengeUrl && (
                  <>
                    <div className="bg-[#071422] p-3 rounded text-xs break-all">
                      {challengeUrl}
                    </div>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(challengeUrl)
                      }}
                      variant="secondary"
                    >
                      Copiar enlace del desafío
                    </Button>
                  </>
                )}
              </>
            )}
            {summary.challenge.status === 'ACCEPTED' && (
              <>
                <Badge variant="success">✓ Aceptado</Badge>
                <p className="text-sm text-muted">
                  El equipo rival ha aceptado el desafío
                </p>
              </>
            )}
            {summary.challenge.status === 'DECLINED' && (
              <>
                <Badge variant="error">Rechazado</Badge>
                <p className="text-sm text-muted">El equipo rival rechazó el desafío</p>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <div className="flex gap-3">
          <Button onClick={() => setStep(3)} variant="secondary">
            Volver a invitaciones
          </Button>
          <Button onClick={handleFinish} variant="primary">
            Finalizar
          </Button>
        </div>
        {!isMatchReady && (
          <p className="text-xs text-muted text-center">
            Puedes finalizar ahora y seguir invitando jugadores más tarde
          </p>
        )}
      </div>
    </div>
  )
}
