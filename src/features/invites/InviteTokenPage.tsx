import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useInviteToken, useAcceptInviteToken, useDeclineInviteToken } from './hooks/useInviteToken'
import { useAuthStore } from '../auth/auth.store'
import { saveReturnTo } from '../../utils/returnTo'
import Card from '../../components/Card'
import Button from '../../components/Button'

export default function InviteTokenPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  
  const { data: invite, isLoading, error } = useInviteToken(token!)
  const acceptMutation = useAcceptInviteToken()
  const declineMutation = useDeclineInviteToken()

  const [actionError, setActionError] = React.useState<string | null>(null)

  // Handle login redirect
  const handleLogin = () => {
    if (token) {
      saveReturnTo(`/invites/${token}`)
    }
    navigate('/login')
  }

  // Handle register redirect
  const handleRegister = () => {
    if (token) {
      saveReturnTo(`/invites/${token}`)
    }
    navigate('/register')
  }

  // Handle accept invite
  const handleAccept = async () => {
    if (!token) return
    
    setActionError(null)
    try {
      await acceptMutation.mutateAsync(token)
      
      // Show success message and redirect to match summary
      if (invite?.matchId) {
        navigate(`/matches/${invite.matchId}/summary`, {
          state: { message: 'Invitación aceptada exitosamente' }
        })
      } else {
        navigate('/partidos')
      }
    } catch (error: any) {
      console.error('Error accepting invite:', error)
      
      // Handle specific errors
      const status = error.response?.status
      const message = error.response?.data?.message
      
      if (status === 403 || message?.includes('email')) {
        setActionError('Debes iniciar sesión con el correo electrónico invitado')
      } else if (message?.includes('expired')) {
        setActionError('Esta invitación ha expirado')
      } else if (message?.includes('already')) {
        setActionError('Esta invitación ya fue respondida')
      } else {
        setActionError('Error al aceptar la invitación. Intenta nuevamente.')
      }
    }
  }

  // Handle decline invite
  const handleDecline = async () => {
    if (!token) return
    
    setActionError(null)
    try {
      await declineMutation.mutateAsync(token)
      navigate('/partidos', {
        state: { message: 'Invitación rechazada' }
      })
    } catch (error: any) {
      console.error('Error declining invite:', error)
      setActionError('Error al rechazar la invitación')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando invitación...</p>
          </div>
        </Card>
      </div>
    )
  }

  // Error states
  if (error || !invite) {
    const errorStatus = (error as any)?.response?.status
    const errorMessage = (error as any)?.response?.data?.message

    let title = 'Error'
    let message = 'No se pudo cargar la invitación'

    if (errorStatus === 401) {
      // Not authenticated - show login prompt
      return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="text-center py-6 space-y-4">
              <div className="text-4xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-white mb-2">Inicia sesión</h2>
              <p className="text-gray-400 mb-6">
                Necesitas iniciar sesión para ver esta invitación
              </p>
              <div className="space-y-3">
                <Button onClick={handleLogin} variant="primary" className="w-full">
                  Iniciar sesión
                </Button>
                <Button onClick={handleRegister} variant="secondary" className="w-full">
                  Crear cuenta
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (errorMessage?.includes('expired') || errorMessage?.includes('expiró')) {
      title = 'Invitación expirada'
      message = 'Esta invitación ya no es válida'
    } else if (errorMessage?.includes('not found')) {
      title = 'Invitación no encontrada'
      message = 'Esta invitación no existe o ya fue eliminada'
    }

    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <Button onClick={() => navigate('/partidos')} variant="secondary">
              Ir a partidos
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Check if invite is expired
  const isExpired = invite.status === 'EXPIRED' || new Date(invite.expiresAt) < new Date()
  const isAlreadyResponded = invite.status === 'ACCEPTED' || invite.status === 'DECLINED'

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">⏰</div>
            <h2 className="text-xl font-bold text-white mb-2">Invitación expirada</h2>
            <p className="text-gray-400 mb-2">
              Esta invitación expiró el {new Date(invite.expiresAt).toLocaleDateString('es-ES')}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Contacta al organizador para recibir una nueva invitación
            </p>
            <Button onClick={() => navigate('/partidos')} variant="secondary">
              Ir a partidos
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (isAlreadyResponded) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Invitación {invite.status === 'ACCEPTED' ? 'aceptada' : 'rechazada'}
            </h2>
            <p className="text-gray-400 mb-6">
              Ya respondiste a esta invitación
            </p>
            <Button onClick={() => navigate(`/matches/${invite.matchId}/summary`)} variant="primary">
              Ver partido
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Main invite display
  const expiresDate = new Date(invite.expiresAt)
  const daysUntilExpiry = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="space-y-6 py-6">
          {/* Header */}
          <div className="text-center">
            <div className="text-4xl mb-3">⚽</div>
            <h2 className="text-2xl font-bold text-white mb-2">Invitación a partido</h2>
            <p className="text-sm text-gray-400">
              Te han invitado a participar en un partido
            </p>
          </div>

          {/* Match Details */}
          <div className="bg-[#0b1220] rounded-lg p-4 space-y-3 border border-[#1f2937]">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Deporte</span>
              <span className="text-white font-medium">{invite.matchSummary.sportName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Formato</span>
              <span className="text-white font-medium">{invite.matchSummary.formatName}</span>
            </div>
            <div className="border-t border-[#1f2937] pt-3">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">Equipos</div>
                <div className="text-white font-semibold">
                  {invite.matchSummary.homeTeamName}
                  <span className="text-gray-500 mx-2">vs</span>
                  {invite.matchSummary.awayTeamName}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-[#1f2937] pt-3">
              <span className="text-sm text-gray-400">Tu equipo</span>
              <span className="text-primary font-bold">Lado {invite.teamLabel}</span>
            </div>
          </div>

          {/* Expiration Info */}
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">⏰</span>
              <span className="text-sm text-yellow-200">
                {daysUntilExpiry > 0 
                  ? `Expira en ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'día' : 'días'}`
                  : 'Expira hoy'}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {actionError && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">⚠️</span>
                <div>
                  <h3 className="text-red-400 font-semibold mb-1">Error</h3>
                  <p className="text-sm text-red-300">{actionError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-400 mb-4">
                Inicia sesión o crea una cuenta para responder a esta invitación
              </p>
              <Button onClick={handleLogin} variant="primary" className="w-full">
                Iniciar sesión
              </Button>
              <Button onClick={handleRegister} variant="secondary" className="w-full">
                Crear cuenta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                variant="primary"
                className="w-full"
                disabled={acceptMutation.isPending || declineMutation.isPending}
              >
                {acceptMutation.isPending ? 'Aceptando...' : 'Aceptar invitación'}
              </Button>
              <Button
                onClick={handleDecline}
                variant="secondary"
                className="w-full"
                disabled={acceptMutation.isPending || declineMutation.isPending}
              >
                {declineMutation.isPending ? 'Rechazando...' : 'Rechazar'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
