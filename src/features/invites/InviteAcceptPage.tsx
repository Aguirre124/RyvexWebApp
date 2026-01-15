import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import Button from '../../components/Button'
import Card from '../../components/Card'
import { invitesApi } from '../../services/endpoints'
import { useAuthStore } from '../auth/auth.store'

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => !!s.token)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Token is missing')
      return await invitesApi.accept(token)
    },
    onSuccess: (data) => {
      setSuccess(true)
      setTimeout(() => {
        navigate(`/matches/${data.matchId}/summary`)
      }, 2000)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to accept invitation')
    }
  })

  const handleAccept = () => {
    if (!isAuthenticated) {
      localStorage.setItem('returnUrl', window.location.pathname)
      navigate('/login')
      return
    }
    setError(null)
    acceptMutation.mutate()
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h2 className="text-xl font-bold">Invitación aceptada</h2>
          <p className="text-sm text-muted">Redirigiendo al partido...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center mb-6">
          <div className="text-2xl font-extrabold mb-2">RYVEX</div>
          <div className="text-sm text-muted">Invitación a partido</div>
        </div>

        <Card className="space-y-4">
          <h2 className="text-xl font-bold text-center">
            Has sido invitado a un partido
          </h2>
          <p className="text-sm text-muted text-center">
            Te han invitado a unirte a un equipo para un próximo partido. ¿Aceptas la
            invitación?
          </p>

          {error && (
            <div className="bg-red-900 text-red-200 text-sm rounded p-3 text-center">
              {error}
            </div>
          )}

          {!isAuthenticated && (
            <div className="bg-blue-900 text-blue-200 text-sm rounded p-3 text-center">
              Debes iniciar sesión para aceptar la invitación
            </div>
          )}

          <Button
            onClick={handleAccept}
            variant="primary"
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? 'Aceptando...' : 'Aceptar invitación'}
          </Button>
        </Card>
      </div>
    </div>
  )
}
