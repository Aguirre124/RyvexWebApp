import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import { invitesApi } from '../../../services/endpoints'

type InvitePlayerModalProps = {
  matchId: string
  teamId: string
  teamName: string
  side: 'HOME' | 'AWAY'
  onClose: () => void
}

export default function InvitePlayerModal({
  matchId,
  teamId,
  teamName,
  side,
  onClose
}: InvitePlayerModalProps) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      await invitesApi.send(matchId, {
        teamId,
        invitees: [{ email }]
      })
    },
    onSuccess: () => {
      setSuccess(true)
      setEmail('')
      setError(null)
      // Refresh match summary to show updated invite count
      queryClient.invalidateQueries({ queryKey: ['match-summary', matchId] })
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message ||
        'Error al enviar la invitación. Intenta nuevamente.'
      )
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un email válido')
      return
    }
    
    setError(null)
    inviteMutation.mutate(email)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-[#0a1628] border border-[#1f2937] rounded-lg p-6 max-w-md w-full">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Invitar jugador</h3>
            <p className="text-sm text-gray-400">
              Equipo: <span className="text-white font-semibold">{teamName}</span>
              <span className={`ml-2 text-xs ${side === 'HOME' ? 'text-blue-400' : 'text-orange-400'}`}>
                ({side === 'HOME' ? 'LOCAL' : 'VISITANTE'})
              </span>
            </p>
          </div>

          {success ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-white font-semibold">¡Invitación enviada!</div>
              <p className="text-sm text-gray-400">
                Se ha enviado la invitación al email proporcionado
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Email del jugador
                </label>
                <Input
                  type="email"
                  placeholder="ejemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={inviteMutation.isPending}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si el jugador tiene cuenta, recibirá una notificación. Si no, recibirá un email para crear su cuenta.
                </p>
              </div>

              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-200 text-sm rounded p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  disabled={inviteMutation.isPending}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={inviteMutation.isPending}
                  className="flex-1"
                >
                  {inviteMutation.isPending ? 'Enviando...' : 'Enviar invitación'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
