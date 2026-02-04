import apiClient from './apiClient'

// ==================== TYPES ====================
export interface CreateInvitePayload {
  teamId: string
  inviteeUserId?: string // For registered users
  inviteeEmail?: string // For email invites
  message?: string
  suggestedRoleCode?: string
}

export interface InviteResponse {
  id: string
  matchId: string
  teamId: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  deliveryChannel?: 'IN_APP' | 'EMAIL'
  createdAt: string
}

export interface InviteTokenPreview {
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  expiresAt: string
  matchId: string
  teamId: string
  teamLabel: string
  matchSummary: {
    sportName: string
    formatName: string
    homeTeamName: string
    awayTeamName: string
  }
  inviteeEmail?: string // May be masked
}

// ==================== INVITES API ====================
export const invitesApi = {
  /**
   * Create a match invite for a registered user or by email
   */
  createMatchInvite: async (
    matchId: string,
    payload: CreateInvitePayload
  ): Promise<InviteResponse> => {
    const { data } = await apiClient.post(`/invites/matches/${matchId}`, payload)
    return data
  },

  /**
   * Get invite details by token (for email invites)
   */
  getInviteByToken: async (token: string): Promise<InviteTokenPreview> => {
    const { data } = await apiClient.get(`/invites/token/${token}`)
    return data
  },

  /**
   * Accept an invite by token (requires auth)
   */
  acceptInviteToken: async (token: string): Promise<void> => {
    await apiClient.post(`/invites/token/${token}/accept`)
  },

  /**
   * Decline an invite by token (requires auth)
   */
  declineInviteToken: async (token: string): Promise<void> => {
    await apiClient.post(`/invites/token/${token}/decline`)
  }
}
