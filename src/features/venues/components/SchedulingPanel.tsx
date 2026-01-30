import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../../../components/Button'
import Badge from '../../../components/Badge'
import { availabilityApi } from '../../../services/availability.api'
import { holdsApi } from '../../../services/holds.api'
import { bookingsApi } from '../../../services/bookings.api'
import { useMatchDraftStore } from '../../../store/matchDraft.store'
import { useCountdown } from '../../../shared/hooks/useCountdown'
import { formatLocalTime, formatTimeRange, formatDateLabel, toYYYYMMDD } from '../../../shared/utils/datetime'
import { calculateEstimatedPrice, formatCOP } from '../../../shared/utils/money'

type Slot = {
  start: string
  end: string
}

type SchedulingPanelProps = {
  matchId: string
  courtId: string
  venueId: string
  venueName: string
  courtName?: string
  hourlyRate?: number
  currency?: string
  onBookingConfirmed: () => void
}

const DURATION_OPTIONS = [
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30m' },
  { value: 120, label: '2 horas' }
]

type TimeOfDay = 'morning' | 'afternoon' | 'evening'

function getTimeOfDay(isoString: string): TimeOfDay {
  const hour = new Date(isoString).getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

const TIME_OF_DAY_LABELS = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche'
}

export default function SchedulingPanel({
  matchId,
  courtId,
  venueId,
  venueName,
  courtName,
  hourlyRate,
  currency = 'COP',
  onBookingConfirmed
}: SchedulingPanelProps) {
  const queryClient = useQueryClient()
  
  // Store state
  const {
    durationMin: storedDuration,
    holdId,
    expiresAt,
    selectedStart,
    setVenueBooking,
    setHold,
    clearHold
  } = useMatchDraftStore()

  // Local state
  const [date, setDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return toYYYYMMDD(tomorrow)
  })
  const [durationMin, setDurationMin] = useState(storedDuration || 60)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Countdown for hold
  const { formattedTime, isExpired } = useCountdown(expiresAt)

  // Clear hold on mount if expired or no holdId
  useEffect(() => {
    if (!holdId || isExpired) {
      clearHold()
      setSelectedSlot(null)
    }
  }, [])

  // Auto-clear hold when expired
  useEffect(() => {
    if (isExpired && holdId) {
      clearHold()
      setSelectedSlot(null)
      queryClient.invalidateQueries({ queryKey: ['availability', courtId, date, durationMin] })
    }
  }, [isExpired, holdId, clearHold, queryClient, courtId, date, durationMin])

  // Fetch availability
  const { data: availability, isLoading, error, refetch } = useQuery({
    queryKey: ['availability', courtId, date, durationMin],
    queryFn: async () => {
      console.log('🔍 Fetching availability:', { courtId, date, durationMin })
      const result = await availabilityApi.getCourtAvailability(courtId, date, durationMin)
      console.log('✅ Availability response:', result)
      return result
    },
    enabled: !!courtId && !!date && !!durationMin,
    staleTime: 30000 // 30 seconds
  })

  // Create hold mutation
  const createHoldMutation = useMutation({
    mutationFn: (start: string) => {
      console.log('🔒 Creating hold:', { courtId, matchId, start, durationMin })
      return holdsApi.createCourtHold(courtId, {
        matchId,
        start,
        durationMin
      })
    },
    onSuccess: (data, start) => {
      console.log('✅ Hold created:', data)
      const endTime = new Date(start)
      endTime.setMinutes(endTime.getMinutes() + durationMin)
      
      setHold({
        holdId: data.holdId,
        expiresAt: data.expiresAt,
        selectedStart: start,
        selectedEnd: endTime.toISOString()
      })
      
      // Automatically confirm booking after hold is created, passing holdId directly
      confirmBookingMutation.mutate(data.holdId)
    },
    onError: (error: any) => {
      console.error('❌ Hold creation failed:', error)
      setSelectedSlot(null)
      setErrorMessage(error.response?.data?.message || 'No se pudo reservar el horario. Intenta nuevamente.')
    }
  })

  // Confirm booking mutation
  const confirmBookingMutation = useMutation({
    mutationFn: (holdIdParam: string) => {
      console.log('💳 Confirming booking:', { holdId: holdIdParam, hourlyRate, durationMin })
      const price = hourlyRate 
        ? calculateEstimatedPrice(hourlyRate, durationMin)
        : 0
      
      return bookingsApi.confirmBooking({
        holdId: holdIdParam,
        price,
        currency
      })
    },
    onSuccess: (booking) => {
      console.log('✅ Booking confirmed:', booking)
      // Update store with confirmed booking
      setVenueBooking({
        venueId,
        courtId,
        scheduledAt: booking.start,
        durationMin: booking.durationMin,
        estimatedPrice: booking.price,
        currency: booking.currency,
        bookingId: booking.id
      })
      clearHold()
      
      // Invalidate match summary
      queryClient.invalidateQueries({ queryKey: ['matchSummary', matchId] })
      
      onBookingConfirmed()
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        setErrorMessage('La reserva ha expirado. Selecciona otro horario.')
        clearHold()
        setSelectedSlot(null)
        refetch()
      } else {
        setErrorMessage(error.response?.data?.message || 'No se pudo confirmar la reserva. Intenta nuevamente.')
      }
    }
  })

  const handleSlotClick = (slot: Slot) => {
    if (holdId) {
      clearHold()
    }
    setSelectedSlot(slot)
    setErrorMessage(null)
  }

  const handleConfirmSelection = () => {
    if (selectedSlot) {
      createHoldMutation.mutate(selectedSlot.start)
    }
  }

  const handleDurationChange = (newDuration: number) => {
    setDurationMin(newDuration)
    setVenueBooking({ durationMin: newDuration })
    // Clear hold and selection when changing duration
    if (holdId) {
      clearHold()
    }
    setSelectedSlot(null)
  }

  // Group slots by time of day
  const groupedSlots = useMemo(() => {
    if (!availability?.slots) return { morning: [], afternoon: [], evening: [] }
    
    return availability.slots.reduce((acc, slot) => {
      const timeOfDay = getTimeOfDay(slot.start)
      acc[timeOfDay].push(slot)
      return acc
    }, { morning: [] as Slot[], afternoon: [] as Slot[], evening: [] as Slot[] })
  }, [availability?.slots])

  const estimatedPrice = hourlyRate ? calculateEstimatedPrice(hourlyRate, durationMin) : null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-white mb-2">Selecciona fecha y duración</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Date picker */}
          <div>
            <label className="block text-xs text-muted mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                // Clear hold and selection when changing date
                if (holdId) {
                  clearHold()
                }
                setSelectedSlot(null)
              }}
              min={toYYYYMMDD(new Date())}
              className="w-full px-3 py-2 bg-[#071422] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Duration dropdown */}
          <div>
            <label className="block text-xs text-muted mb-1">Duración</label>
            <select
              value={durationMin}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#071422] border border-[#1f2937] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price estimate */}
        {estimatedPrice && !selectedSlot && (
          <div className="mt-2 text-sm text-muted">
            Precio estimado: <span className="text-primary font-semibold">{formatCOP(estimatedPrice)}</span>
          </div>
        )}
      </div>

      {/* Available slots */}
      <div>
        <h4 className="font-semibold text-white mb-3">Horarios disponibles</h4>
        
        {isLoading && (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-[#0b1220] rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <p className="text-red-400 mb-3">Error al cargar horarios</p>
            <Button onClick={() => refetch()} variant="secondary" className="text-sm">
              Reintentar
            </Button>
          </div>
        )}

        {availability && availability.slots.length === 0 && (
          <div className="bg-[#0b1220] border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm mb-2">⚠️ No hay horarios disponibles</p>
            <p className="text-muted text-xs">
              No hay slots disponibles para esta fecha y duración.
            </p>
          </div>
        )}

        {availability && availability.slots.length > 0 && (
          <div className="space-y-4">
            {(['morning', 'afternoon', 'evening'] as TimeOfDay[]).map((period) => {
              const slots = groupedSlots[period]
              if (slots.length === 0) return null

              return (
                <div key={period}>
                  <h5 className="text-sm font-medium text-muted mb-2">
                    {TIME_OF_DAY_LABELS[period]}
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.start === slot.start
                      return (
                        <button
                          key={slot.start}
                          onClick={() => handleSlotClick(slot)}
                          disabled={createHoldMutation.isPending}
                          aria-pressed={isSelected}
                          className={`
                            relative px-4 py-3 rounded-xl font-semibold text-sm transition-all
                            border flex items-center justify-between gap-2
                            ${isSelected
                              ? 'border-teal-400 bg-teal-500/10 text-teal-100 ring-2 ring-teal-500/30'
                              : 'border-white/10 bg-[#0b1220] text-white hover:bg-white/5'
                            }
                            ${createHoldMutation.isPending ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                            focus:outline-none focus:ring-2 focus:ring-primary/50
                          `}
                        >
                          <span className="text-left">
                            {formatTimeRange(slot.start, slot.end)}
                          </span>
                          {isSelected && (
                            <svg className="w-4 h-4 flex-shrink-0 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Summary Panel */}
      {selectedSlot && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h4 className="text-sm font-semibold text-white mb-3">Resumen de reserva</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Fecha:</span>
              <span className="text-white font-medium">{formatDateLabel(date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Horario:</span>
              <span className="text-white font-medium">{formatTimeRange(selectedSlot.start, selectedSlot.end)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Cancha:</span>
              <span className="text-white font-medium">
                {venueName}{courtName ? ` · ${courtName}` : ''}
              </span>
            </div>
            {estimatedPrice && (
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-muted">Precio estimado:</span>
                <span className="text-primary font-semibold">{formatCOP(estimatedPrice)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b1220] border border-red-500/30 rounded-lg p-6 max-w-sm w-full">
            <div className="flex items-start gap-3">
              <div className="text-red-500 text-xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-2">Error</h3>
                <p className="text-sm text-muted mb-4">{errorMessage}</p>
                <Button
                  onClick={() => setErrorMessage(null)}
                  variant="primary"
                  className="w-full"
                >
                  Aceptar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Selection Button */}
      {!holdId && (
        <Button
          onClick={handleConfirmSelection}
          disabled={!selectedSlot || createHoldMutation.isPending || confirmBookingMutation.isPending}
          variant="primary"
          className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createHoldMutation.isPending || confirmBookingMutation.isPending
            ? 'Procesando...'
            : selectedSlot
            ? 'Continuar con este horario'
            : 'Selecciona un horario'}
        </Button>
      )}

      {/* Loading state while processing */}
      {(createHoldMutation.isPending || confirmBookingMutation.isPending) && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted mt-2">
            {createHoldMutation.isPending ? 'Reservando horario...' : 'Confirmando reserva...'}
          </p>
        </div>
      )}
    </div>
  )
}
