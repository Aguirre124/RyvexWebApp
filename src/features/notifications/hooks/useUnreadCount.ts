import { useQuery } from '@tanstack/react-query'
import { getUnreadCount } from '../../../services/notifications.api'
import { useAuthStore } from '../../auth/auth.store'

/**
 * Hook to fetch and track unread notifications count
 * 
 * Features:
 * - Refetches on window focus
 * - Polls every 30 seconds (configurable)
 * - Only runs when user is authenticated
 * - Maintains fresh data with 15s stale time
 */
export function useUnreadCount() {
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    
    // Only fetch when authenticated
    enabled: !!token,
    
    // Refetch strategies
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Poll every 30 seconds
    
    // Cache configuration
    staleTime: 15000, // Consider data fresh for 15 seconds
    
    // Extract count from response
    select: (data) => data?.count ?? 0,
  })
}
