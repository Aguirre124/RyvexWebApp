import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchResultsApi, SubmitResultsPayload } from '../../../services/matchResults.api'

export const useMatchResults = (matchId: string | undefined) => {
  return useQuery({
    queryKey: ['matchResults', matchId],
    queryFn: () => matchResultsApi.getMatchResults(matchId!),
    enabled: !!matchId,
    refetchOnWindowFocus: false
  })
}

export const useSubmitMatchResults = (matchId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SubmitResultsPayload) => 
      matchResultsApi.submitMatchResults(matchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchResults', matchId] })
      queryClient.invalidateQueries({ queryKey: ['matchSummary', matchId] })
    }
  })
}
