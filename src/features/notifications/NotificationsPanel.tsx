import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotificationsList } from './hooks/useNotificationsList'
import { markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notifications.api'
import NotificationCard from './NotificationCard'
import type { Notification } from './types'

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Notifications panel dropdown component
 * Shows list of notifications with mark as read functionality
 */
export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAll, setShowAll] = useState(false)

  // Fetch notifications only when panel is open
  const { data: notifications = [], isLoading, error } = useNotificationsList({
    status: showAll ? 'ALL' : 'UNREAD',
    enabled: isOpen
  })

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      // Invalidate queries to refresh counts and lists
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error)
    }
  })

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      // Invalidate queries to refresh counts and lists
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error)
    }
  })

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await markReadMutation.mutateAsync(notification.id)

      // Navigate if matchId exists
      if (notification.data?.matchId) {
        navigate(`/matches/${notification.data.matchId}/summary`)
        onClose()
      }
    } catch (error) {
      // Error is already logged in mutation
    }
  }

  // Handle mark all as read
  const handleMarkAllRead = () => {
    markAllReadMutation.mutate()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-16 right-4 w-[380px] max-w-[calc(100vw-2rem)] bg-[#0a1525] border border-[#1f2937] rounded-lg shadow-2xl z-50 max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1f2937]">
          <h3 className="font-bold text-lg">Notificaciones</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#1f2937] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-3 border-b border-[#1f2937]">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary hover:text-primary/80 transition"
          >
            {showAll ? 'Ver no leídas' : 'Ver todas'}
          </button>
          
          {notifications.some(n => n.status === 'UNREAD') && (
            <>
              <span className="text-gray-600">•</span>
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-primary hover:text-primary/80 transition disabled:opacity-50"
              >
                {markAllReadMutation.isPending ? 'Marcando...' : 'Marcar todo como leído'}
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Loading state */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg bg-[#071422] animate-pulse">
                  <div className="h-4 bg-[#0a1628] rounded mb-2 w-3/4" />
                  <div className="h-3 bg-[#0a1628] rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">⚠️</div>
              <p className="text-sm text-gray-400">Error al cargar notificaciones</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && notifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-semibold mb-1">No tienes notificaciones</p>
              <p className="text-xs text-gray-400">
                {showAll ? 'No hay notificaciones' : 'No tienes notificaciones sin leer'}
              </p>
            </div>
          )}

          {/* Notifications list */}
          {!isLoading && !error && notifications.length > 0 && (
            <>
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  )
}
