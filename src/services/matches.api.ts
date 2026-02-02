import apiClient from './apiClient'

// Types
export type FlowType = 'TRAINING' | 'CHALLENGE'
export type MatchType = 'FRIENDLY' | 'COMPETITIVE'
export type ChallengeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED'

export interface CreateMatchPayload {
  sportId: string
  formatId?: string
  matchType: MatchType
  flowType: FlowType
  homeTeamId: string
  awayTeamId?: string  // Only for CHALLENGE if known upfront
}

export interface CreateMatchResponse {
  matchId: string
  status: string
  flowType: FlowType
  homeTeamId: string
  awayTeamId: string | null
  matchTeams: Array<{
    teamId: string
    side: 'HOME' | 'AWAY'
    label: string
    name: string
  }>
  challenge?: {
    challengeId: string
    status: ChallengeStatus
    awayTeamId: string | null
    awayCaptainUserId: string | null
  } | null
}

export interface TeamSearchResult {
  teamId: string
  name: string
  logoUrl?: string | null
  visibility?: 'PRIVATE' | 'DISCOVERABLE' | 'PUBLIC'
  captain: {
    id: string
    name: string
  }
}

export interface CreateChallengePayload {
  awayTeamId: string
  awayCaptainUserId: string
  message?: string
}

export interface CreateChallengeResponse {
  challengeId: string
  status: ChallengeStatus
  awayTeamId: string
  awayCaptainUserId: string
  message: string | null
  createdAt: string
}

export const matchesApi = {
  // Create a new match (TRAINING or CHALLENGE)
  createMatch: async (payload: CreateMatchPayload): Promise<CreateMatchResponse> => {
    const response = await apiClient.post('/matches', payload)
    return response.data
  },

  // Search teams for challenge (by sport + query)
  // Uses new backend endpoint that returns only DISCOVERABLE/PUBLIC teams
  // Excludes current user's teams automatically
  searchTeamsForChallenge: async (params: { 
    sportId: string
    q: string
    limit?: number
  }): Promise<TeamSearchResult[]> => {
    const response = await apiClient.get('/teams/search', { 
      params: {
        sportId: params.sportId,
        q: params.q,
        limit: params.limit || 10
      }
    })
    return response.data
  },

  // Create a challenge invitation (send to away captain)
  createChallenge: async (
    matchId: string, 
    payload: CreateChallengePayload
  ): Promise<CreateChallengeResponse> => {
    const response = await apiClient.post(`/matches/${matchId}/challenge`, payload)
    return response.data
  },

  // Accept challenge (away captain only)
  acceptChallenge: async (matchId: string): Promise<void> => {
    await apiClient.post(`/matches/${matchId}/challenge/accept`)
  },

  // Decline challenge (away captain only)
  declineChallenge: async (matchId: string): Promise<void> => {
    await apiClient.post(`/matches/${matchId}/challenge/decline`)
  }
}
