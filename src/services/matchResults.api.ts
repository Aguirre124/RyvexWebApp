import apiClient from './apiClient'

export type MatchResultsStatus = 'SCHEDULED' | 'PENDING_RESULTS' | 'COMPLETED'

export type EventType = 'GOAL' | 'ASSIST' | 'YELLOW' | 'RED'

export type MatchEvent = {
  teamId: string
  userId: string
  type: EventType
  count: number
}

export type MatchResult = {
  id: string
  matchId: string
  homeGoals: number
  awayGoals: number
  mvpUserId: string | null
  notes: string | null
  events: MatchEvent[]
  createdAt: string
}

export type MatchResultsResponse = {
  matchId: string
  status: MatchResultsStatus
  booking: {
    startAt: string
    endAt: string
    durationMin: number
    paymentStatus: string
  } | null
  result: MatchResult | null
  canSubmitResults: boolean
  reason: string
  serverNow: string
}

export type SubmitResultsPayload = {
  homeGoals: number
  awayGoals: number
  mvpUserId: string | null
  notes?: string
  events: MatchEvent[]
}

export const matchResultsApi = {
  getMatchResults: async (matchId: string): Promise<MatchResultsResponse> => {
    const { data } = await apiClient.get(`/matches/${matchId}/results`)
    return data
  },

  submitMatchResults: async (
    matchId: string, 
    payload: SubmitResultsPayload
  ): Promise<MatchResult> => {
    const { data } = await apiClient.post(`/matches/${matchId}/results`, payload)
    return data
  }
}
