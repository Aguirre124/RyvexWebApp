import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invitesApi } from '../../services/endpoints'
import { markNotificationAsRead } from '../../services/notifications.api'
import type { Notification } from './types'

interface NotificationCardProps {
  notification: Notification
  onClick: () => void
}

/**
 * Format relative time without date-fns to avoid type issues
 */
function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'ahora mismo'
    if (diffMins < 60) return `hace ${diffMins}m`
    if (diffHours < 24) return `hace ${diffHours}h`
    if (diffDays < 7) return `hace ${diffDays}d`
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
  } catch {
    return 'hace un momento'
  }
}

/**
 * Individual notification card component
 * Displays notification info with appropriate styling
 * Shows Accept/Decline buttons for MATCH_INVITE notifications
 */
export default function NotificationCard({ notification, onClick }: NotificationCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const isUnread = notification.status === 'UNREAD'
  const isMatchInvite = notification.type === 'MATCH_INVITE'
  
  // Extract invite token from notification data
  // Note: inviteId is NOT the same as token - don't use it as fallback
  const inviteToken = notification.data?.inviteToken ?? notification.data?.token
  const hasValidToken = !!inviteToken
  
  // Debug logging for MATCH_INVITE notifications
  React.useEffect(() => {
    if (isMatchInvite) {
      console.log('MATCH_INVITE notification data:', {
        notificationId: notification.id,
        data: notification.data,
        extractedToken: inviteToken,
        hasValidToken,
        warning: !inviteToken ? 'Token not found in notification.data - backend should include inviteToken or token field' : null
      })
    }
  }, [isMatchInvite, notification.id, notification.data, inviteToken, hasValidToken])
  
  // Format relative time
  const timeAgo = React.useMemo(() => {
    return getRelativeTime(notification.createdAt)
  }, [notification.createdAt])

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'MATCH_INVITE':
        return '🏆'
      case 'MATCH_ACCEPTED':
        return '✅'
      case 'MATCH_DECLINED':
        return '❌'
      case 'TEAM_INVITE':
        return '👥'
      case 'MATCH_REMINDER':
        return '⏰'
      case 'MATCH_CANCELLED':
        return '🚫'
      default:
        return '📬'
    }
  }

  // Accept invite mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!inviteToken) throw new Error('Token no disponible')
      setError(null)
      setSuccess(null)
      return invitesApi.accept(inviteToken)
    },
    onSuccess: async (response) => {
      try {
        // Mark notification as read
        await markNotificationAsRead(notification.id)
      } catch (err) {
        console.warn('Failed to mark as read:', err)
      }
      
      // Get matchId for invalidation
      const matchId = response?.matchId ?? notification.data?.matchId
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
      if (matchId) {
        queryClient.invalidateQueries({ queryKey: ['matchSummary', matchId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['matchSummary'] })
      }
      
      // Show success message
      setSuccess('✓ Invitación aceptada')
      
      // Navigate to match if matchId exists
      if (matchId) {
        setTimeout(() => {
          navigate(`/matches/${matchId}/summary`)
        }, 1000)
      }
    },
    onError: (err: any) => {
      console.error('Accept invite error:', err)
      const message = err.response?.data?.message || err.message || 'No se pudo aceptar la invitación'
      
      // Translate common errors
      if (message.toLowerCase().includes('not found')) {
        setError('Esta invitación ya no está disponible')
      } else if (message.toLowerCase().includes('already accepted')) {
        setError('Ya aceptaste esta invitación')
      } else if (message.toLowerCase().includes('expired')) {
        setError('Esta invitación ha expirado')
      } else if (message.toLowerCase().includes('team configuration')) {
        setError('Configuración de equipo no encontrada. Contacta al organizador.')
      } else if (message.toLowerCase().includes('bad request')) {
        setError('Solicitud inválida. Verifica que la invitación sea válida.')
      } else {
        setError(message)
      }
    },
    onSettled: () => {
      setIsProcessing(false)
    }
  })

  // Decline invite mutation
  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!inviteToken) throw new Error('Token no disponible')
      setError(null)
      setSuccess(null)
      await invitesApi.decline(inviteToken)
    },
    onSuccess: async () => {
      try {
        // Mark notification as read
        await markNotificationAsRead(notification.id)
      } catch (err) {
        console.warn('Failed to mark as read:', err)
      }
      
      // Get matchId for invalidation
      const matchId = notification.data?.matchId
      
      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
      if (matchId) {
        queryClient.invalidateQueries({ queryKey: ['matchSummary', matchId] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['matchSummary'] })
      }
      
      // Show success message
      setSuccess('Invitación rechazada')
    },
    onError: (err: any) => {
      console.error('Decline invite error:', err)
      const message = err.response?.data?.message || err.message || 'No se pudo rechazar la invitación'
      
      // Translate common errors
      if (message.toLowerCase().includes('not found')) {
        setError('Esta invitación ya no está disponible')
      } else if (message.toLowerCase().includes('already')) {
        setError('Esta invitación ya fue procesada')
      } else if (message.toLowerCase().includes('expired')) {
        setError('Esta invitación ha expirado')
      } else {
        setError(message)
      }
    },
    onSettled: () => {
      setIsProcessing(false)
    }
  })

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProcessing(true)
    acceptMutation.mutate()
  }

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProcessing(true)
    declineMutation.mutate()
  }

  const handleCardClick = () => {
    if (!isMatchInvite) {
      onClick()
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={`w-full text-left p-3 rounded-lg transition-colors ${
        !isMatchInvite ? 'cursor-pointer hover:bg-[#0a1628]' : ''
      } ${isUnread ? 'bg-[#0b1525]' : 'bg-[#071422]'}`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${isUnread ? 'text-white' : 'text-gray-300'}`}>
              {notification.title}
            </h4>
            {isUnread && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          
          <p className="text-xs text-gray-400 mb-1 line-clamp-2">
            {notification.body}
          </p>
          
          <time className="text-[10px] text-gray-500 block mb-2">
            {timeAgo}
          </time>

          {/* Action buttons for MATCH_INVITE */}
          {isMatchInvite && (
            <div className="mt-2">
              {hasValidToken ? (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAccept}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-1.5 bg-primary text-black text-xs font-semibold rounded hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {acceptMutation.isPending ? 'Aceptando...' : 'Aceptar'}
                    </button>
                    <button
                      onClick={handleDecline}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {declineMutation.isPending ? 'Rechazando...' : 'Rechazar'}
                    </button>
                  </div>
                  
                  {/* Success message */}
                  {success && (
                    <div className="mt-2 p-2 bg-green-900/30 border border-green-700/50 rounded text-[10px] text-green-400">
                      {success}
                    </div>
                  )}
                  
                  {/* Error message */}
                  {error && (
                    <div className="mt-2 p-2 bg-red-900/30 border border-red-700/50 rounded text-[10px] text-red-400">
                      {error}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-gray-500 italic">Acción no disponible</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
