import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { stripePromise } from '../../../payments/stripe'
import { paymentsApi } from '../../../services/payments.api'
import Button from '../../../components/Button'
import { formatCOP } from '../../../shared/utils/money'

type PaymentModalProps = {
  open: boolean
  onClose: () => void
  bookingId: string
  venueName?: string
  courtName?: string
  scheduledLabel?: string
  onSuccess?: () => void
}

function PaymentForm({
  bookingId,
  venueName,
  courtName,
  scheduledLabel,
  onSuccess,
  onClose
}: Omit<PaymentModalProps, 'open'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [cardholderName, setCardholderName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Create payment intent
  const createIntentMutation = useMutation({
    mutationFn: () => {
      console.log('🔐 Creating payment intent for booking:', bookingId)
      return paymentsApi.createStripeIntent(bookingId)
    },
    onSuccess: (data) => {
      console.log('✅ Payment intent created:', data)
    },
    onError: (err: any) => {
      console.error('❌ Failed to create payment intent:', err)
      console.error('Error response:', err.response)
      console.error('Error data:', err.response?.data)
      console.error('Error status:', err.response?.status)
      
      // Better error messages based on status
      const errorMessage = err.response?.data?.message || ''
      
      if (err.response?.status === 400) {
        if (errorMessage.includes('must convert to at least')) {
          setError('❌ El monto es demasiado bajo para procesar el pago ($500 COP). El precio mínimo es de $2.000 COP. Por favor contacta al administrador de la cancha para actualizar las tarifas.')
        } else {
          setError(errorMessage || 'Solicitud inválida.')
        }
      } else if (err.response?.status === 403) {
        if (errorMessage.includes('not authorized')) {
          setError('⚠️ La reserva no está asociada a tu usuario. Esto es un error del backend. Por favor, contacta al equipo técnico con el ID de reserva: ' + bookingId)
        } else {
          setError('No tienes permiso para crear un pago. Verifica que estés autenticado.')
        }
      } else if (err.response?.status === 404) {
        setError('La reserva no fue encontrada. Por favor intenta nuevamente.')
      } else if (err.response?.status === 409) {
        setError('Esta reserva ya ha sido pagada.')
      } else {
        setError(errorMessage || 'No se pudo crear la intención de pago.')
      }
    }
  })

  // Confirm payment on backend
  const confirmPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => {
      console.log('✅ Confirming payment on backend:', paymentId)
      return paymentsApi.confirmStripePayment(paymentId)
    },
    onSuccess: (data) => {
      console.log('✅ Payment confirmed on backend:', data)
      onSuccess?.()
      onClose()
    },
    onError: (err: any) => {
      console.error('❌ Failed to confirm payment:', err)
      setError(err.response?.data?.message || 'No se pudo confirmar el pago.')
    }
  })

  // Fetch client secret on mount
  React.useEffect(() => {
    if (bookingId) {
      console.log('💳 PaymentModal mounted with bookingId:', bookingId)
      
      // Check if user is authenticated
      const authStorage = localStorage.getItem('ryvex-auth')
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage)
          const token = authData.state?.token
          console.log('🔑 Auth token exists:', !!token)
          console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'none')
        } catch (e) {
          console.error('❌ Failed to parse auth storage:', e)
        }
      } else {
        console.warn('⚠️ No auth storage found')
      }
      
      createIntentMutation.mutate()
    }
  }, [bookingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('💳 Starting payment submission...')
    
    if (!stripe || !elements || !createIntentMutation.data) {
      console.error('❌ Missing required data:', {
        stripe: !!stripe,
        elements: !!elements,
        intentData: !!createIntentMutation.data
      })
      return
    }

    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      console.error('❌ Card element not found')
      return
    }

    console.log('💳 Confirming card payment with Stripe...')
    console.log('Client secret:', createIntentMutation.data.clientSecret?.substring(0, 20) + '...')
    
    // Confirm card payment with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      createIntentMutation.data.clientSecret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName || undefined
          }
        }
      }
    )

    if (stripeError) {
      console.error('❌ Stripe error:', stripeError)
      setError(stripeError.message || 'Error al procesar el pago.')
      return
    }

    console.log('✅ Stripe payment confirmed:', paymentIntent?.status)
    console.log('Payment Intent:', paymentIntent)

    if (paymentIntent?.status === 'succeeded') {
      console.log('✅ Payment succeeded, confirming on backend...')
      // Confirm on backend
      confirmPaymentMutation.mutate(createIntentMutation.data.paymentId)
    } else if (paymentIntent?.status === 'requires_payment_method') {
      console.error('❌ Payment requires payment method')
      setError('El pago falló. Verifica los datos de tu tarjeta.')
    } else {
      console.warn('⚠️ Unexpected payment status:', paymentIntent?.status)
      setError(`Estado de pago inesperado: ${paymentIntent?.status}`)
    }
  }

  const isLoading = createIntentMutation.isPending || confirmPaymentMutation.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Pagar y reservar</h2>
        {venueName && (
          <p className="text-sm text-muted">
            {venueName}
            {courtName && ` · ${courtName}`}
          </p>
        )}
        {scheduledLabel && (
          <p className="text-sm text-muted">{scheduledLabel}</p>
        )}
      </div>

      {/* Amount */}
      {createIntentMutation.data && (
        <div className="bg-[#0b1220] rounded-xl p-4 text-center">
          <div className="text-xs text-muted mb-1">Total a pagar</div>
          <div className="text-3xl font-bold text-primary">
            {formatCOP(createIntentMutation.data.amount)}
          </div>
        </div>
      )}

      {/* Loading state while creating intent */}
      {createIntentMutation.isPending && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-sm text-muted">Preparando pago...</p>
        </div>
      )}

      {/* Card details */}
      {createIntentMutation.data && (
        <>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nombre en la tarjeta
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-4 py-3 bg-[#071422] border border-[#1f2937] rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Datos de la tarjeta
            </label>
            <div className="bg-[#071422] border border-[#1f2937] rounded-lg p-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#ffffff',
                      '::placeholder': {
                        color: '#6b7280'
                      },
                      iconColor: '#ffffff'
                    },
                    invalid: {
                      color: '#ef4444',
                      iconColor: '#ef4444'
                    }
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted mt-2">
              Tarjeta de prueba: 4242 4242 4242 4242
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={!stripe || isLoading}
            >
              {isLoading ? 'Procesando...' : `Pagar ${createIntentMutation.data ? formatCOP(createIntentMutation.data.amount) : ''}`}
            </Button>
          </div>
        </>
      )}
    </form>
  )
}

export default function PaymentModal(props: PaymentModalProps) {
  if (!props.open) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a1628] border border-[#1f2937] rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Elements stripe={stripePromise}>
          <PaymentForm {...props} />
        </Elements>
      </div>
    </div>
  )
}
