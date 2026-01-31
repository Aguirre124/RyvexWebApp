import apiClient from './apiClient'
import type {
  Team,
  Match,
  MatchSummary,
  Challenge,
  FormatDetails
} from '../types/match.types'

// ==================== SPORTS ====================
export const sportsApi = {
  getAll: async (): Promise<Array<{ id: string; name: string }>> => {
    const { data } = await apiClient.get('/sports')
    return data
  }
}

// ==================== TEAMS ====================
export const teamsApi = {
  search: async (params: {
    scope?: string // 'mine,public'
    sportId?: string
    q?: string
  }): Promise<Team[]> => {
    const { data } = await apiClient.get('/teams', { params })
    return data
  },

  create: async (payload: {
    name: string
    sportId: string
    captainId: string
    description?: string
    logoUrl?: string
  }): Promise<Team> => {
    const { data } = await apiClient.post('/teams', payload)
    return data
  }
}

// ==================== MATCHES ====================
export const matchesApi = {
  create: async (payload: {
    sportId: string
    matchType: 'FRIENDLY' | 'TOURNAMENT'
    homeTeamId: string
    awayTeamId: string
    tournamentId?: string | null
    venueId?: string | null
    scheduledAt?: string | null
    durationMin?: number | null
  }): Promise<Match> => {
    const { data } = await apiClient.post('/matches', payload)
    return data
  },

  getMyMatches: async (params?: {
    status?: string
    limit?: number
  }): Promise<Match[]> => {
    const { data } = await apiClient.get('/matches', { params })
    return data
  },

  getSummary: async (matchId: string): Promise<MatchSummary> => {
    const { data } = await apiClient.get(`/matches/${matchId}/summary`, {
      params: {
        includeRosters: true,
        includeUsers: true
      }
    })
    return data
  },

  assignTeam: async (
    matchId: string,
    payload: { teamId: string; side: 'HOME' | 'AWAY' }
  ): Promise<void> => {
    await apiClient.post(`/matches/${matchId}/teams`, payload)
  },

  updateVenue: async (
    matchId: string, 
    venueId: string,
    bookingDetails?: {
      scheduledAt?: string
      durationMin?: number
      estimatedPrice?: number | null
      currency?: string
    }
  ): Promise<void> => {
    await apiClient.patch(`/matches/${matchId}`, { 
      venueId,
      ...bookingDetails
    })
  },

  updateVisibility: async (matchId: string, isPublic: boolean): Promise<void> => {
    await apiClient.patch(`/matches/${matchId}`, { isPublic })
  }
}

// ==================== CHALLENGES ====================
export const challengesApi = {
  create: async (
    matchId: string,
    payload: { challengedTeamId: string }
  ): Promise<Challenge> => {
    const { data } = await apiClient.post(`/matches/${matchId}/challenges`, payload)
    return data
  },

  accept: async (token: string): Promise<{ matchId: string }> => {
    const { data } = await apiClient.post(`/challenges/${token}/accept`)
    return data
  },

  decline: async (token: string): Promise<void> => {
    await apiClient.post(`/challenges/${token}/decline`)
  }
}

// ==================== INVITES ====================
export const invitesApi = {
  send: async (
    matchId: string,
    payload: {
      teamId: string
      inviteeUserId?: string
      inviteeEmail?: string
      inviteePhone?: string
      message?: string
      suggestedRoleCode?: string
    }
  ): Promise<void> => {
    // Normalize suggestedRoleCode: empty string becomes undefined
    const normalizedPayload = {
      ...payload,
      suggestedRoleCode: payload.suggestedRoleCode?.trim() || undefined
    }
    await apiClient.post(`/invites/matches/${matchId}`, normalizedPayload)
  },

  accept: async (token: string): Promise<{ matchId: string }> => {
    const { data } = await apiClient.post(`/invites/${token}/accept`)
    return data
  },

  decline: async (token: string): Promise<void> => {
    await apiClient.post(`/invites/${token}/decline`)
  }
}

// ==================== FORMATS (mock for now) ====================
export const formatsApi = {
  getAll: async (sportId: string): Promise<FormatDetails[]> => {
    // For MVP, return hardcoded formats
    // In production, this would be an API call
    return [
      {
        id: 'futsal',
        sportId,
        name: 'FUTSAL',
        onFieldPlayers: 5,
        substitutesAllowed: 5,
        maxSquadSize: 10
      },
      {
        id: 'f5',
        sportId,
        name: 'F5',
        onFieldPlayers: 5,
        substitutesAllowed: 5,
        maxSquadSize: 10
      },
      {
        id: 'f7',
        sportId,
        name: 'F7',
        onFieldPlayers: 7,
        substitutesAllowed: 5,
        maxSquadSize: 12
      },
      {
        id: 'f11',
        sportId,
        name: 'F11',
        onFieldPlayers: 11,
        substitutesAllowed: 5,
        maxSquadSize: 16
      }
    ]
  }
}
