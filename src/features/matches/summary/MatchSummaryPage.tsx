import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import Badge from '../../../components/Badge'
import Header from '../../../components/Header'
import BottomNav from '../../../components/BottomNav'
import Tabs from '../../../components/Tabs'
import InvitePlayerModal from '../invites/InvitePlayerModal'
import PaymentModal from '../../payments/components/PaymentModal'
import PaymentSuccessModal from '../../payments/components/PaymentSuccessModal'
import { useAuthStore } from '../../auth/auth.store'
import { useMatchSummary } from '../hooks/useMatchSummary'
import { MatchTeamSummary } from '../../../types/match.types'
import FieldMatch from '../../lineup/components/FieldMatch'
import { SOCCER_LAYOUTS_BY_FORMAT } from '../../lineup/layouts/soccerLayouts'
import { autoAssignLineup } from '../../lineup/utils/autoAssignLineup'
import { useMatchDraftStore } from '../../../store/matchDraft.store'
import { formatCOP } from '../../../shared/utils/money'
import { formatTimeRange } from '../../../shared/utils/datetime'
import { courtsApi } from '../../../services/courts.api'
import { bookingsApi } from '../../../services/bookings.api'

export default function MatchSummaryPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  
  // Get booking details from store
  const {
    courtId: storedCourtId,
    scheduledAt: storedScheduledAt,
    durationMin: storedDurationMin,
    estimatedPrice: storedEstimatedPrice,
    currency: storedCurrency,
    bookingId: storedBookingId
  } = useMatchDraftStore()
  
  // Fetch booking details to check payment status
  const { data: bookingDetails } = useQuery({
    queryKey: ['booking', storedBookingId],
    queryFn: () => bookingsApi.getBookingDetails(storedBookingId!),
    enabled: !!storedBookingId
  })
  
  const [inviteModal, setInviteModal] = useState<{
    teamId: string
    teamName: string
    side: 'HOME' | 'AWAY'
  } | null>(null)

  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState<{
    amount: number
    currency: string
  } | null>(null)

  const { data: summary, isLoading, error, refetch } = useMatchSummary(matchId)

  // Fetch court details if we have a courtId from store or summary
  const courtId = storedCourtId
  const { data: courtDetails } = useQuery({
    queryKey: ['court', courtId],
    queryFn: () => courtsApi.getCourtById(courtId!),
    enabled: !!courtId
  })

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

  // DEBUG: Log booking data to check payment status
  console.log('🔍 Booking Debug:', {
    booking: summary.booking,
    bookingId: summary.bookingId,
    venue: summary.venue,
    storedBookingId,
    bookingDetails
  })

  // Check if booking has been paid - use paymentStatus field
  const isBookingPaid = bookingDetails?.paymentStatus === 'PAID'

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
  
  // Check if venue/court is scheduled
  const isVenueScheduled = !!(summary.venue && (summary.scheduledAt || storedScheduledAt))
  
  // Match is ready when players are ready AND challenge accepted AND venue scheduled
  const isMatchReady = homeReady && awayReady && challengeAccepted && isVenueScheduled

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
          <div className="flex gap-2">
            {/* Main Match Status */}
            {isMatchReady ? (
              <Badge variant="success">Listo</Badge>
            ) : (
              <Badge variant="warning">
                {!isVenueScheduled ? 'Sin cancha' : 
                 !homeReady || !awayReady ? 'Faltan jugadores' : 
                 !challengeAccepted ? 'Esperando aceptación' : 'Pendiente'}
              </Badge>
            )}
            
            {/* Payment Status - only show if venue is scheduled */}
            {isVenueScheduled && (
              <>
                {(paymentSuccess || isBookingPaid) ? (
                  <Badge variant="success">Pagado</Badge>
                ) : (
                  <Badge variant="info">Pago pendiente</Badge>
                )}
              </>
            )}
          </div>
        </div>

        <Tabs
          tabs={[
            {
              id: 'encuentro',
              label: 'Encuentro',
              content: (
                <div className="space-y-4">
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

                  {/* Venue Information */}
                  {summary.venue ? (
                    <Card>
                      <h3 className="font-semibold text-center mb-4">Cancha seleccionada</h3>
                      
                      {/* DEBUG: Log prices */}
                      {console.log('💰 Price Debug:', {
                        summaryPrice: summary.estimatedPrice,
                        storedPrice: storedEstimatedPrice,
                        summaryVenue: summary.venue,
                        bookingId: storedBookingId
                      })}
                      
                      {/* Warning if price is 0 */}
                      {storedEstimatedPrice === 0 && (
                        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded-lg">
                          <p className="text-yellow-400 text-sm">
                            ⚠️ La reserva fue creada con precio $0. Por favor, haz clic en "Cambiar cancha" y vuelve a seleccionar el horario para actualizar el precio.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Venue and Court */}
                        <div className="flex-1">
                          <div className="font-semibold text-primary text-lg">
                            {summary.venue.name}
                            {courtDetails?.name && (
                              <span className="text-white"> · {courtDetails.name}</span>
                            )}
                          </div>
                          {summary.venue.city && (
                            <div className="text-sm text-muted mt-1">{summary.venue.city}</div>
                          )}
                        </div>
                        
                        {/* Right: Date/Time/Duration */}
                        {(summary.scheduledAt || storedScheduledAt) && (
                          <div className="text-right">
                            <div className="text-white font-medium">
                              {(() => {
                                const startTime = summary.scheduledAt || storedScheduledAt!
                                const duration = summary.durationMin || storedDurationMin || 60
                                const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString()
                                return formatTimeRange(startTime, endTime)
                              })()}
                            </div>
                            {(summary.durationMin || storedDurationMin) && (
                              <div className="text-xs text-muted mt-1">
                                Duración: {summary.durationMin || storedDurationMin} min
                              </div>
                            )}
                            <div className="text-xs text-muted mt-1">
                              {new Date(summary.scheduledAt || storedScheduledAt!).toLocaleDateString('es-CO', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      {(summary.estimatedPrice || storedEstimatedPrice) && (
                        <div className="pt-3 mt-3 border-t border-[#1f2937]">
                          <div className="text-xs text-muted mb-1">Precio</div>
                          <div className="text-primary font-bold text-xl">
                            {formatCOP(summary.estimatedPrice || storedEstimatedPrice!)}
                          </div>
                        </div>
                      )}

                      {/* Payment Button */}
                      {storedBookingId && !paymentSuccess && !isBookingPaid && (
                        <Button
                          onClick={() => {
                            console.log('💳 Opening payment modal for booking:', storedBookingId)
                            setPaymentModalOpen(true)
                          }}
                          variant="primary"
                          className="w-full mt-3"
                        >
                          Pagar y reservar
                        </Button>
                      )}

                      {/* Paid Status */}
                      {storedBookingId && (paymentSuccess || isBookingPaid) && (
                        <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg text-center">
                          <div className="text-primary font-semibold">✓ Reserva confirmada y pagada</div>
                          <div className="text-sm text-muted mt-1">Tu cancha está reservada</div>
                        </div>
                      )}

                      {/* Change Venue Button - disabled after payment */}
                      {(paymentSuccess || isBookingPaid) ? (
                        <div className="mt-3 p-3 bg-gray-800 border border-gray-600 rounded-lg text-center">
                          <div className="text-gray-400 text-sm">
                            🔒 No se puede cambiar la cancha después del pago
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Solo un administrador puede reprogramar partidos pagados
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => navigate(`/matches/${matchId}/venues`)}
                          variant="secondary"
                          className="w-full mt-3"
                        >
                          Cambiar cancha
                        </Button>
                      )}
                    </Card>
                  ) : (
                    <Card>
                      <Button
                        onClick={() => navigate(`/matches/${matchId}/venues`)}
                        variant="primary"
                        className="w-full"
                      >
                        + Seleccionar cancha
                      </Button>
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
                </div>
              )
            },
            {
              id: 'jugadores',
              label: 'Jugadores',
              content: (
                <div className="space-y-4">
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
                </div>
              )
            }
          ]}
        />

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

      {storedBookingId && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          bookingId={storedBookingId}
          venueName={summary?.venue?.name || 'Cancha'}
          courtName={courtDetails?.name || ''}
          scheduledLabel={(() => {
            const scheduledAt = summary?.scheduledAt || storedScheduledAt
            const durationMin = summary?.durationMin || storedDurationMin
            if (!scheduledAt || !durationMin) return ''
            
            const startTime = new Date(scheduledAt)
            const endTime = new Date(startTime.getTime() + durationMin * 60000)
            
            const dateLabel = startTime.toLocaleDateString('es-CO', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })
            
            return `${dateLabel} · ${formatTimeRange(scheduledAt, endTime.toISOString())}`
          })()}
          onSuccess={() => {
            const amount = summary?.estimatedPrice || storedEstimatedPrice || 0
            const currency = summary?.currency || storedCurrency || 'COP'
            setPaymentSuccess({ amount, currency })
            setPaymentModalOpen(false)
            refetch()
          }}
        />
      )}

      <PaymentSuccessModal
        open={!!paymentSuccess}
        onClose={() => setPaymentSuccess(null)}
        venueName={summary?.venue?.name}
        courtName={courtDetails?.name}
        scheduledLabel={(() => {
          const scheduledAt = summary?.scheduledAt || storedScheduledAt
          const durationMin = summary?.durationMin || storedDurationMin
          if (!scheduledAt || !durationMin) return ''
          
          const startTime = new Date(scheduledAt)
          const endTime = new Date(startTime.getTime() + durationMin * 60000)
          
          const dateLabel = startTime.toLocaleDateString('es-CO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          })
          
          return `${dateLabel} · ${formatTimeRange(scheduledAt, endTime.toISOString())}`
        })()}
        amount={paymentSuccess?.amount}
        currency={paymentSuccess?.currency}
      />
    </div>
  )
}
