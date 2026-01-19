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
  
  // Actions
  setSport: (sport: Sport) => void
  setHomeTeam: (team: Team) => void
  setAwayTeam: (team: Team) => void
  setFormat: (format: FormatCode) => void
  resetDraft: () => void
}

const initialState = {
  selectedSport: null,
  homeTeam: null,
  awayTeam: null,
  format: null
}

export const useMatchDraftStore = create<MatchDraftState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSport: (sport) => set({ selectedSport: sport }),
      setHomeTeam: (team) => set({ homeTeam: team }),
      setAwayTeam: (team) => set({ awayTeam: team }),
      setFormat: (format) => set({ format }),
      resetDraft: () => set(initialState)
    }),
    {
      name: 'ryvex-match-draft-storage'
    }
  )
)
