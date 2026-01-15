import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FormatDetails, ChallengeStatus } from '../types/match.types'

type WizardState = {
  // Match data
  matchId: string | null
  sportId: string
  selectedFormat: FormatDetails | null
  
  // Teams
  homeTeamId: string | null
  awayTeamId: string | null
  awayIsPublic: boolean
  
  // Challenge
  awayRequiresChallenge: boolean
  challengeStatus: ChallengeStatus | null
  challengeUrl: string | null
  
  // Wizard navigation
  currentStep: number
  
  // Actions
  setMatchId: (matchId: string) => void
  setFormat: (format: FormatDetails) => void
  setHomeTeam: (teamId: string) => void
  setAwayTeam: (teamId: string, isPublic: boolean) => void
  setChallenge: (status: ChallengeStatus, url?: string) => void
  setStep: (step: number) => void
  resetWizard: () => void
}

const initialState = {
  matchId: null,
  sportId: 'football', // MVP: hardcoded to football
  selectedFormat: null,
  homeTeamId: null,
  awayTeamId: null,
  awayIsPublic: false,
  awayRequiresChallenge: false,
  challengeStatus: null,
  challengeUrl: null,
  currentStep: 1
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setMatchId: (matchId) => set({ matchId }),
      
      setFormat: (format) => set({ selectedFormat: format }),
      
      setHomeTeam: (teamId) => set({ homeTeamId: teamId }),
      
      setAwayTeam: (teamId, isPublic) =>
        set({
          awayTeamId: teamId,
          awayIsPublic: isPublic,
          awayRequiresChallenge: isPublic
        }),
      
      setChallenge: (status, url) =>
        set({
          challengeStatus: status,
          challengeUrl: url || null
        }),
      
      setStep: (step) => set({ currentStep: step }),
      
      resetWizard: () => set(initialState)
    }),
    {
      name: 'ryvex-wizard-storage'
    }
  )
)
