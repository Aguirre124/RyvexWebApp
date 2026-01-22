import { useQuery } from '@tanstack/react-query'
import { matchesApi } from '../../../services/endpoints'
import { useAuthStore } from '../../auth/auth.store'

export const useMatchSummary = (matchId: string | undefined) => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: ['matchSummary', matchId],
    queryFn: () => matchesApi.getSummary(matchId!),
    enabled: !!matchId && !!token,
    refetchOnWindowFocus: true,
    staleTime: 10000, // 10 seconds
  })
}
