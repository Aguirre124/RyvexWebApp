import apiClient from './apiClient'

export type CreateHoldRequest = {
  matchId?: string
  start: string  // ISO string
  durationMin: number
}

export type HoldResponse = {
  holdId: string
  expiresAt: string  // ISO string
}

export type BackendHoldResponse = {
  id: string
  courtId: string
  venueId: string
  matchId?: string
  startAt: string
  endAt: string
  durationMin: number
  status: string
  expiresAt: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export const holdsApi = {
  createCourtHold: async (
    courtId: string,
    data: CreateHoldRequest
  ): Promise<HoldResponse> => {
    const { data: response } = await apiClient.post<BackendHoldResponse>(
      `/courts/${courtId}/holds`,
      data
    )
    // Map backend response to our expected format
    return {
      holdId: response.id,
      expiresAt: response.expiresAt
    }
  }
}
