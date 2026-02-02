import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { matchesApi, CreateMatchPayload, CreateChallengePayload } from '../../../../services/matches.api'

// Hook: Create Match (TRAINING or CHALLENGE)
export function useCreateMatchMutation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (payload: CreateMatchPayload) => matchesApi.createMatch(payload),
    retry: false,  // Don't retry - validation errors won't fix themselves
    onSuccess: () => {
      // Invalidate matches list if needed
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    }
  })
}

// Hook: Search Teams for Challenge
export function useTeamSearchQuery(params: { sportId: string; q: string; limit?: number }, enabled: boolean = true) {
  return useQuery({
    queryKey: ['challenge-teams', params.sportId, params.q],
    queryFn: () => matchesApi.searchTeamsForChallenge(params),
    enabled: enabled && params.q.trim().length >= 2,  // Only search if query is 2+ chars
    staleTime: 10000,  // 10 seconds
    placeholderData: (previousData) => previousData  // Keep previous data while fetching
  })
}

// Hook: Create Challenge (send invitation)
export function useCreateChallengeMutation(matchId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (payload: CreateChallengePayload) => matchesApi.createChallenge(matchId, payload),
    retry: false,  // Don't retry - validation errors won't fix themselves
    onSuccess: () => {
      // Invalidate match summary to reflect new challenge status
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] })
      queryClient.invalidateQueries({ queryKey: ['match-summary', matchId] })
    }
  })
}

// Hook: Accept Challenge
export function useAcceptChallengeMutation(matchId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => matchesApi.acceptChallenge(matchId),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] })
      queryClient.invalidateQueries({ queryKey: ['match-summary', matchId] })
    }
  })
}

// Hook: Decline Challenge
export function useDeclineChallengeMutation(matchId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => matchesApi.declineChallenge(matchId),
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', matchId] })
      queryClient.invalidateQueries({ queryKey: ['match-summary', matchId] })
    }
  })
}
