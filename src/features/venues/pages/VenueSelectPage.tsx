import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Header from '../../../components/Header'
import BottomNav from '../../../components/BottomNav'
import Button from '../../../components/Button'
import Card from '../../../components/Card'
import Badge from '../../../components/Badge'
import VenueFilters from '../components/VenueFilters'
import SchedulingPanel from '../components/SchedulingPanel'
import { venuesApi, type Venue } from '../../../services/venues.api'
import { courtsApi, type Court } from '../../../services/courts.api'
import { matchesApi } from '../../../services/endpoints'
import { useAuthStore } from '../../auth/auth.store'
import { useMatchDraftStore } from '../../../store/matchDraft.store'

type Step = 'venue' | 'court' | 'schedule'

export default function VenueSelectPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { format, setFormat } = useMatchDraftStore()

  const [step, setStep] = useState<Step>('venue')
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  
  // Venue filters
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedZone, setSelectedZone] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch match summary to get the format if not in store
  const { data: matchSummary } = useQuery({
    queryKey: ['matchSummary', matchId],
    queryFn: () => matchesApi.getSummary(matchId!),
    enabled: !!matchId && !format
  })

  // Load format from match summary if not in store
  React.useEffect(() => {
    if (matchSummary?.format?.code && !format) {
      setFormat(matchSummary.format.code as any)
    }
  }, [matchSummary, format, setFormat])

  // Fetch venues
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: venuesApi.getVenues
  })

  // Fetch courts for selected venue
  const { data: courts = [], isLoading: courtsLoading } = useQuery({
    queryKey: ['courts', selectedVenue?.id],
    queryFn: () => courtsApi.getCourtsByVenue(selectedVenue!.id),
    enabled: !!selectedVenue && step === 'court'
  })

  // Filter courts by format
  const filteredCourts = useMemo(() => {
    if (!format) return courts
    
    // Map format codes to court name patterns
    const formatPatterns: Record<string, RegExp[]> = {
      'FUTSAL': [/5v5/i, /5\s*v\s*5/i, /futsal/i, /cancha\s*5/i],
      'F5': [/5v5/i, /5\s*v\s*5/i, /cancha\s*5/i],
      'STANDARD_5V5': [/5v5/i, /5\s*v\s*5/i, /cancha\s*5/i],
      'F7': [/7v7/i, /7\s*v\s*7/i, /cancha\s*7/i],
      'STANDARD_7V7': [/7v7/i, /7\s*v\s*7/i, /cancha\s*7/i],
      'F11': [/11v11/i, /11\s*v\s*11/i, /cancha\s*11/i, /campo/i],
      'STANDARD_11V11': [/11v11/i, /11\s*v\s*11/i, /cancha\s*11/i, /campo/i]
    }
    
    const patterns = formatPatterns[format] || []
    
    return courts.filter(court => {
      // If no patterns defined, show all courts
      if (patterns.length === 0) return true
      
      // Check if court name matches any pattern for the format
      return patterns.some(pattern => pattern.test(court.name))
    })
  }, [courts, format])

  // Get unique cities
  const cities = useMemo(() => {
    const citySet = new Set<string>()
    venues.forEach(v => {
      if (v.city) citySet.add(v.city)
    })
    return Array.from(citySet).sort()
  }, [venues])

  // Get zones for selected city
  const zones = useMemo(() => {
    if (!selectedCity) return []
    const zoneSet = new Set<string>()
    venues
      .filter(v => v.city === selectedCity && v.zone)
      .forEach(v => zoneSet.add(v.zone!))
    return Array.from(zoneSet).sort()
  }, [venues, selectedCity])

  // Filter venues
  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      if (venue.isActive === false) return false
      if (selectedCity && venue.city !== selectedCity) return false
      if (selectedZone && venue.zone !== selectedZone) return false
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = venue.name.toLowerCase().includes(query)
        const matchesAddress = venue.address?.toLowerCase().includes(query)
        if (!matchesName && !matchesAddress) return false
      }

      return true
    })
  }, [venues, selectedCity, selectedZone, searchQuery])

  // Handle venue selection
  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue)
    setStep('court')
  }

  // Handle court selection
  const handleCourtSelect = (court: Court) => {
    setSelectedCourt(court)
    setStep('schedule')
  }

  // Handle booking confirmed
  const handleBookingConfirmed = () => {
    navigate(`/matches/${matchId}/summary`)
  }

  // Handle back navigation
  const handleBack = () => {
    if (step === 'schedule') {
      setSelectedCourt(null)
      setStep('court')
    } else if (step === 'court') {
      setSelectedVenue(null)
      setStep('venue')
    } else {
      navigate(`/matches/${matchId}/summary`)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <Header name={user?.name} />

      <main className="px-4 space-y-4 pt-4 pb-20">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {step === 'venue' && 'Seleccionar cancha'}
              {step === 'court' && 'Seleccionar superficie'}
              {step === 'schedule' && 'Agendar horario'}
            </h1>
            {step === 'venue' && (
              <p className="text-sm text-muted">Elige una cancha para tu partido</p>
            )}
            {step === 'court' && (
              <p className="text-sm text-muted">{selectedVenue?.name}</p>
            )}
            {step === 'schedule' && (
              <p className="text-sm text-muted">{selectedVenue?.name} • {selectedCourt?.name}</p>
            )}
          </div>
        </div>

        {/* Step 1: Venue Selection */}
        {step === 'venue' && (
          <>
            <VenueFilters
              cities={cities}
              zones={zones}
              selectedCity={selectedCity}
              selectedZone={selectedZone}
              searchQuery={searchQuery}
              onCityChange={(city) => {
                setSelectedCity(city)
                setSelectedZone('')
              }}
              onZoneChange={setSelectedZone}
              onSearchChange={setSearchQuery}
            />

            <div className="text-sm text-muted">
              {filteredVenues.length} {filteredVenues.length === 1 ? 'cancha encontrada' : 'canchas encontradas'}
            </div>

            {venuesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-[#0b1220] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredVenues.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted mb-4">No hay canchas con esos filtros</p>
                <Button
                  onClick={() => {
                    setSelectedCity('')
                    setSelectedZone('')
                    setSearchQuery('')
                  }}
                  variant="secondary"
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVenues.map(venue => (
                  <Card key={venue.id} className="cursor-pointer hover:border-primary" onClick={() => handleVenueSelect(venue)}>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white">{venue.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {venue.city && <Badge variant="info">{venue.city}</Badge>}
                        {venue.zone && <Badge variant="secondary">{venue.zone}</Badge>}
                      </div>
                      {venue.address && (
                        <p className="text-sm text-muted">{venue.address}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step 2: Court Selection */}
        {step === 'court' && (
          <>
            {courtsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-[#0b1220] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredCourts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted mb-4">
                  No hay superficies disponibles para el formato {format}
                </p>
                <Button onClick={handleBack} variant="secondary">
                  Elegir otra cancha
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCourts.map(court => (
                  <Card
                    key={court.id}
                    className="cursor-pointer hover:border-primary"
                    onClick={() => handleCourtSelect(court)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{court.name}</h3>
                        <div className="flex gap-2 mt-1">
                          {court.surfaceType && (
                            <Badge variant="info">{court.surfaceType}</Badge>
                          )}
                          {court.isIndoor !== undefined && (
                            <Badge variant="secondary">
                              {court.isIndoor ? 'Techada' : 'Abierta'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-muted">
                        →
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step 3: Scheduling */}
        {step === 'schedule' && selectedVenue && selectedCourt && (
          <SchedulingPanel
            matchId={matchId!}
            courtId={selectedCourt.id}
            venueId={selectedVenue.id}
            venueName={selectedVenue.name}
            courtName={selectedCourt.name}
            hourlyRate={selectedVenue.pricing?.hourlyRate}
            currency={selectedVenue.pricing?.currency}
            onBookingConfirmed={handleBookingConfirmed}
          />
        )}
      </main>

      {/* Back button at bottom */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-[#030712] via-[#030712] to-transparent pt-6">
        <Button
          onClick={handleBack}
          variant="secondary"
          className="w-full"
        >
          Volver
        </Button>
      </div>

      <BottomNav />
    </div>
  )
}
