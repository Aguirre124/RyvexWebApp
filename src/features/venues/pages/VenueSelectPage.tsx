import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '../../../components/Header'
import BottomNav from '../../../components/BottomNav'
import Button from '../../../components/Button'
import VenueCard from '../components/VenueCard'
import VenueFilters from '../components/VenueFilters'
import { venuesApi, type Venue } from '../../../services/venues.api'
import { matchesApi } from '../../../services/endpoints'
import { useAuthStore } from '../../auth/auth.store'

export default function VenueSelectPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const [selectedCity, setSelectedCity] = useState('')
  const [selectedZone, setSelectedZone] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmVenue, setConfirmVenue] = useState<Venue | null>(null)

  // Fetch venues
  const { data: venues = [], isLoading, error } = useQuery({
    queryKey: ['venues'],
    queryFn: venuesApi.getVenues
  })

  // Update match mutation
  const updateMatchMutation = useMutation({
    mutationFn: async (venueId: string) => {
      try {
        await matchesApi.updateVenue(matchId!, venueId)
      } catch (err: any) {
        // If endpoint doesn't exist or fails, we'll handle in onError
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchSummary', matchId] })
      navigate(`/matches/${matchId}/summary`)
    },
    onError: (error: any) => {
      console.error('Failed to update venue:', error)
      // Fallback: could store in local state if needed
      alert('No se pudo actualizar la cancha. Intenta nuevamente.')
    }
  })

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
      // Filter by active status
      if (venue.isActive === false) return false

      // Filter by city
      if (selectedCity && venue.city !== selectedCity) return false

      // Filter by zone
      if (selectedZone && venue.zone !== selectedZone) return false

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = venue.name.toLowerCase().includes(query)
        const matchesAddress = venue.address?.toLowerCase().includes(query)
        if (!matchesName && !matchesAddress) return false
      }

      return true
    })
  }, [venues, selectedCity, selectedZone, searchQuery])

  const handleSelectVenue = (venue: Venue) => {
    setConfirmVenue(venue)
  }

  const handleConfirmSelection = () => {
    if (confirmVenue) {
      updateMatchMutation.mutate(confirmVenue.id)
    }
  }

  const handleCancelSelection = () => {
    setConfirmVenue(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="px-4 pt-4">
          <h1 className="text-2xl font-bold mb-2">Seleccionar cancha</h1>
          <p className="text-muted mb-4">Elige una cancha para tu partido</p>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-[#0b1220] rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen pb-20">
        <Header name={user?.name} />
        <div className="px-4 pt-4">
          <h1 className="text-2xl font-bold mb-2">Seleccionar cancha</h1>
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">Error al cargar las canchas</p>
            <Button onClick={() => navigate(`/matches/${matchId}/summary`)}>
              Volver
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <Header name={user?.name} />

      <main className="px-4 space-y-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Seleccionar cancha</h1>
          <p className="text-muted mb-4">Elige una cancha para tu partido</p>
        </div>

        {/* Filters */}
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

        {/* Results count */}
        <div className="text-sm text-muted">
          {filteredVenues.length} {filteredVenues.length === 1 ? 'cancha encontrada' : 'canchas encontradas'}
        </div>

        {/* Venue list */}
        {filteredVenues.length === 0 ? (
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
          <div className="space-y-3 pb-4">
            {filteredVenues.map(venue => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onSelect={handleSelectVenue}
              />
            ))}
          </div>
        )}

        {/* Back button */}
        <Button
          onClick={() => navigate(`/matches/${matchId}/summary`)}
          variant="secondary"
          className="w-full"
        >
          Cancelar
        </Button>
      </main>

      <BottomNav />

      {/* Confirmation Modal */}
      {confirmVenue && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1628] rounded-lg p-6 max-w-md w-full border border-[#1f2937]">
            <h3 className="text-xl font-bold mb-4">Confirmar cancha</h3>
            <p className="text-muted mb-6">
              ¿Usar <span className="text-white font-semibold">{confirmVenue.name}</span> para este partido?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleCancelSelection}
                variant="secondary"
                className="flex-1"
                disabled={updateMatchMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSelection}
                variant="primary"
                className="flex-1"
                disabled={updateMatchMutation.isPending}
              >
                {updateMatchMutation.isPending ? 'Guardando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
