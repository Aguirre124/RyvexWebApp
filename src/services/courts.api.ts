import apiClient from './apiClient'

export type Court = {
  id: string
  venueId: string
  name: string
  surfaceType?: string
  isIndoor?: boolean
  isActive?: boolean
  [key: string]: any
}

export const courtsApi = {
  getCourtsByVenue: async (venueId: string): Promise<Court[]> => {
    const { data } = await apiClient.get(`/venues/${venueId}/courts`)
    return data
  },

  getCourtById: async (courtId: string): Promise<Court> => {
    const { data } = await apiClient.get(`/courts/${courtId}`)
    return data
  }
}
