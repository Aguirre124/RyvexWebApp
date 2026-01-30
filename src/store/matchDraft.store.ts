import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Sport = {
  id: string
  name: string
}

type Team = {
  id: string
  name: string
}

type FormatCode = 'FUTSAL' | 'F5' | 'F7' | 'F11'

type MatchDraftState = {
  selectedSport: Sport | null
  homeTeam: Team | null
  awayTeam: Team | null
  format: FormatCode | null
  
  // Venue booking details
  venueId: string | null
  courtId: string | null
  scheduledAt: string | null  // ISO string
  durationMin: number | null  // 60, 90, 120
  estimatedPrice: number | null
  currency: string | null
  bookingId: string | null  // Confirmed booking ID
  
  // Hold details
  holdId: string | null
  expiresAt: string | null  // ISO string
  selectedStart: string | null  // ISO string
  selectedEnd: string | null    // ISO string
  
  // Actions
  setSport: (sport: Sport) => void
  setHomeTeam: (team: Team) => void
  setAwayTeam: (team: Team) => void
  setFormat: (format: FormatCode) => void
  setVenueBooking: (data: {
    venueId?: string | null
    courtId?: string | null
    scheduledAt?: string | null
    durationMin?: number | null
    estimatedPrice?: number | null
    currency?: string | null
    bookingId?: string | null
  }) => void
  setHold: (data: {
    holdId?: string | null
    expiresAt?: string | null
    selectedStart?: string | null
    selectedEnd?: string | null
  }) => void
  clearHold: () => void
  resetDraft: () => void
}

const initialState = {
  selectedSport: null,
  homeTeam: null,
  awayTeam: null,
  format: null,
  venueId: null,
  courtId: null,
  scheduledAt: null,
  durationMin: null,
  estimatedPrice: null,
  currency: null,
  bookingId: null,
  holdId: null,
  expiresAt: null,
  selectedStart: null,
  selectedEnd: null
}

export const useMatchDraftStore = create<MatchDraftState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSport: (sport) => set({ selectedSport: sport }),
      setHomeTeam: (team) => set({ homeTeam: team }),
      setAwayTeam: (team) => set({ awayTeam: team }),
      setFormat: (format) => set({ format }),
      setVenueBooking: (data) => set((state) => ({
        ...state,
        ...data
      })),
      setHold: (data) => set((state) => ({
        ...state,
        ...data
      })),
      clearHold: () => set({
        holdId: null,
        expiresAt: null,
        selectedStart: null,
        selectedEnd: null
      }),
      resetDraft: () => set(initialState)
    }),
    {
      name: 'ryvex-match-draft-storage'
    }
  )
)
