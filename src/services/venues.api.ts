import apiClient from './apiClient'

export type Venue = {
  id: string
  name: string
  city?: string | null
  zone?: string | null
  address?: string | null
  isActive?: boolean
  capacity?: number | null
  amenities?: Record<string, boolean> | null
  pricing?: {
    currency?: 'COP' | string
    hourlyRate?: number
    minBookingMinutes?: number
  } | null
  [key: string]: any // Allow extra fields
}

export const venuesApi = {
  getVenues: async (): Promise<Venue[]> => {
    const { data } = await apiClient.get('/venues')
    return data
  },

  getVenueById: async (id: string): Promise<Venue> => {
    const { data } = await apiClient.get(`/venues/${id}`)
    return data
  }
}
