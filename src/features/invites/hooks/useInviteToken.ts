import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invitesApi } from '../../../services/invites.api'
import type { InviteTokenPreview } from '../../../services/invites.api'

/**
 * Hook to fetch invite details by token
 */
export function useInviteToken(token: string) {
  return useQuery<InviteTokenPreview>({
    queryKey: ['inviteToken', token],
    queryFn: () => invitesApi.getInviteByToken(token),
    enabled: !!token,
    retry: false,
    staleTime: 30000 // 30 seconds
  })
}

/**
 * Hook to accept an invite by token
 */
export function useAcceptInviteToken() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (token: string) => invitesApi.acceptInviteToken(token),
    onSuccess: (_, token) => {
      // Invalidate the token query
      queryClient.invalidateQueries({ queryKey: ['inviteToken', token] })
      // Invalidate notifications if applicable
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })
}

/**
 * Hook to decline an invite by token
 */
export function useDeclineInviteToken() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (token: string) => invitesApi.declineInviteToken(token),
    onSuccess: (_, token) => {
      // Invalidate the token query
      queryClient.invalidateQueries({ queryKey: ['inviteToken', token] })
    }
  })
}
