import { useQuery } from '@tanstack/react-query'
import { listNotifications } from '../../../services/notifications.api'
import { useAuthStore } from '../../auth/auth.store'
import type { NotificationStatusFilter } from '../types'

interface UseNotificationsListOptions {
  status?: NotificationStatusFilter
  limit?: number
  enabled?: boolean
}

/**
 * Hook to fetch notifications list
 * 
 * Features:
 * - Only fetches when enabled (e.g., panel is open)
 * - Refetches on window focus
 * - Filters by status (UNREAD/ALL)
 * - Only runs when user is authenticated
 */
export function useNotificationsList(options: UseNotificationsListOptions = {}) {
  const { status = 'UNREAD', limit = 20, enabled = false } = options
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: ['notifications', 'list', status],
    queryFn: () => listNotifications({ status, limit }),
    
    // Only fetch when authenticated AND explicitly enabled
    enabled: !!token && enabled,
    
    // Refetch on window focus
    refetchOnWindowFocus: true,
    
    // Cache configuration
    staleTime: 10000, // Consider data fresh for 10 seconds
  })
}
