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
type FlowType = 'TRAINING' | 'CHALLENGE'
type ChallengeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

type MatchDraftState = {
  selectedSport: Sport | null
  homeTeam: Team | null
  awayTeam: Team | null
  format: FormatCode | null
  
  // Training vs Challenge flow
  flowType: FlowType | null
  matchId: string | null  // Created match ID (for TRAINING: immediate, CHALLENGE: after accept)
  challengeId: string | null  // For CHALLENGE flow
  awayCaptainUserId: string | null  // For challenge flow
  challengeStatus: ChallengeStatus | null
  challengeMessage: string | null  // Optional message to away captain
  
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
  setFlowType: (flowType: FlowType) => void
  setMatchId: (matchId: string) => void
  setChallengeId: (challengeId: string) => void
  setAwayCaptain: (userId: string) => void
  setChallengeStatus: (status: ChallengeStatus) => void
  setChallengeMessage: (message: string) => void
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
  flowType: null,
  matchId: null,
  challengeId: null,
  awayCaptainUserId: null,
  challengeStatus: null,
  challengeMessage: null,
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
      setFlowType: (flowType) => set({ flowType }),
      setMatchId: (matchId) => set({ matchId }),
      setChallengeId: (challengeId) => set({ challengeId }),
      setAwayCaptain: (userId) => set({ awayCaptainUserId: userId }),
      setChallengeStatus: (status) => set({ challengeStatus: status }),
      setChallengeMessage: (message) => set({ challengeMessage: message }),
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
