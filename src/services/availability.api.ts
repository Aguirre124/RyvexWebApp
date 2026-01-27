import apiClient from './apiClient'

export type TimeSlot = {
  start: string  // ISO string
  end: string    // ISO string
}

export type AvailabilityResponse = {
  courtId: string
  venueId: string
  timezone: string
  date: string  // YYYY-MM-DD
  durationMin: number
  slots: TimeSlot[]
}

export const availabilityApi = {
  getCourtAvailability: async (
    courtId: string,
    date: string,
    durationMin: number
  ): Promise<AvailabilityResponse> => {
    const { data } = await apiClient.get(`/courts/${courtId}/availability`, {
      params: {
        date,
        durationMin
      }
    })
    return data
  }
}
