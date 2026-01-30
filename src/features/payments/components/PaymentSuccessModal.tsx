import React from 'react'
import Button from '../../../components/Button'

type PaymentSuccessModalProps = {
  open: boolean
  onClose: () => void
  venueName?: string
  courtName?: string
  scheduledLabel?: string
  amount?: number
  currency?: string
}

export default function PaymentSuccessModal({
  open,
  onClose,
  venueName,
  courtName,
  scheduledLabel,
  amount,
  currency = 'COP'
}: PaymentSuccessModalProps) {
  if (!open) return null

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1f2937] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-scale-in">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-primary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Reserva confirmada!
          </h2>
          <p className="text-muted text-sm">
            Tu pago ha sido procesado exitosamente
          </p>
        </div>

        {/* Booking Details */}
        <div className="bg-[#111827] rounded-lg p-4 space-y-3">
          {venueName && (
            <div>
              <div className="text-xs text-muted mb-1">Cancha</div>
              <div className="font-semibold text-white">
                {venueName}
                {courtName && <span className="text-primary"> · {courtName}</span>}
              </div>
            </div>
          )}

          {scheduledLabel && (
            <div>
              <div className="text-xs text-muted mb-1">Fecha y hora</div>
              <div className="font-medium text-white">{scheduledLabel}</div>
            </div>
          )}

          {amount && (
            <div className="pt-3 border-t border-[#374151]">
              <div className="text-xs text-muted mb-1">Total pagado</div>
              <div className="text-2xl font-bold text-primary">
                {formatAmount(amount)}
              </div>
            </div>
          )}
        </div>

        {/* Success Message */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <p className="text-sm text-primary text-center">
            ✓ Recibirás un correo de confirmación con los detalles de tu reserva
          </p>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          variant="primary"
          className="w-full"
        >
          Entendido
        </Button>
      </div>
    </div>
  )
}
