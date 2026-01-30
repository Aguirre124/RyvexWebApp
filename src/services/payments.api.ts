import apiClient from './apiClient'

export type CreateStripeIntentRequest = {
  bookingId: string
}

export type CreateStripeIntentResponse = {
  paymentId: string
  clientSecret: string
  amount: number
  currency: string
}

export type ConfirmStripePaymentRequest = {
  paymentId: string
}

export type ConfirmStripePaymentResponse = {
  paymentId: string
  status: string
  bookingId: string
}

export const paymentsApi = {
  createStripeIntent: async (bookingId: string): Promise<CreateStripeIntentResponse> => {
    const { data } = await apiClient.post<CreateStripeIntentResponse>(
      '/payments/stripe/create-intent',
      { bookingId }
    )
    return data
  },

  confirmStripePayment: async (paymentId: string): Promise<ConfirmStripePaymentResponse> => {
    const { data } = await apiClient.post<ConfirmStripePaymentResponse>(
      '/payments/stripe/confirm',
      { paymentId }
    )
    return data
  }
}
