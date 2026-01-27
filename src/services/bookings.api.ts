import apiClient from './apiClient'

export type ConfirmBookingRequest = {
  holdId: string
  price: number
  currency: string
}

export type Booking = {
  id: string
  matchId?: string
  courtId: string
  venueId: string
  start: string  // ISO string
  end: string    // ISO string
  durationMin: number
  price: number
  currency: string
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  createdAt: string
  [key: string]: any
}

export const bookingsApi = {
  confirmBooking: async (data: ConfirmBookingRequest): Promise<Booking> => {
    const { data: response } = await apiClient.post('/bookings/confirm', data)
    return response
  },

  listBookings: async (): Promise<Booking[]> => {
    const { data } = await apiClient.get('/bookings')
    return data
  },

  getBookingDetails: async (bookingId: string): Promise<Booking> => {
    const { data } = await apiClient.get(`/bookings/${bookingId}`)
    return data
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    await apiClient.delete(`/bookings/${bookingId}`)
  }
}
