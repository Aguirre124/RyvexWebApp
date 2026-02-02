import apiClient from './apiClient'

export type ChallengeStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

export interface CreateChallengeInvitationPayload {
  sportId: string
  matchType: 'FRIENDLY' | 'COMPETITIVE'
  homeTeamId: string
  awayTeamId: string
  awayCaptainUserId: string
  message?: string
  proposedDateTime?: string
}

export interface ChallengeInvitation {
  challengeId: string
  status: ChallengeStatus
  sportId: string
  matchType: string
  homeTeam: {
    id: string
    name: string
    captain: {
      id: string
      name: string
    }
  }
  awayTeam: {
    id: string
    name: string
    captain: {
      id: string
      name: string
    }
  }
  message: string | null
  createdAt: string
  expiresAt: string
}

export interface AcceptChallengeResponse {
  challengeId: string
  status: 'ACCEPTED'
  matchId: string
  match: {
    id: string
    sportId: string
    matchType: string
    flowType: string
    homeTeamId: string
    awayTeamId: string
    status: string
    createdAt: string
  }
}

export const challengesApi = {
  // Send challenge invitation (NO match creation)
  createChallengeInvitation: async (
    payload: CreateChallengeInvitationPayload
  ): Promise<ChallengeInvitation> => {
    const response = await apiClient.post('/challenge-invitations', payload)
    return response.data
  },

  // Accept challenge (creates match)
  acceptChallenge: async (challengeId: string): Promise<AcceptChallengeResponse> => {
    const response = await apiClient.post(`/challenge-invitations/${challengeId}/accept`)
    return response.data
  },

  // Decline challenge
  declineChallenge: async (challengeId: string, reason?: string): Promise<void> => {
    await apiClient.post(`/challenge-invitations/${challengeId}/decline`, { reason })
  },

  // Get received challenges
  getReceivedChallenges: async (
    status: ChallengeStatus | 'ALL' = 'PENDING'
  ): Promise<ChallengeInvitation[]> => {
    const response = await apiClient.get('/challenge-invitations', {
      params: { 
        status: status === 'ALL' ? undefined : status,
        type: 'received' 
      }
    })
    return response.data.challenges || response.data
  },

  // Get sent challenges
  getSentChallenges: async (
    status?: ChallengeStatus | 'ALL'
  ): Promise<ChallengeInvitation[]> => {
    const response = await apiClient.get('/challenge-invitations', {
      params: { 
        status: status === 'ALL' ? undefined : status,
        type: 'sent' 
      }
    })
    return response.data.challenges || response.data
  }
}
