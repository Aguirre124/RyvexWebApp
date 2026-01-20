import apiClient from './apiClient'

export type UserSearchResult = {
  id: string
  name: string
  email: string | null
  phoneNumber: string | null
  avatar: string | null
  isActive: boolean
  isVerified: boolean
}

export const usersApi = {
  search: async (params: {
    q: string
    limit?: number
    scope?: 'invite'
  }): Promise<UserSearchResult[]> => {
    const { data } = await apiClient.get('/users/search', { 
      params: {
        q: params.q,
        limit: params.limit || 10,
        scope: params.scope || 'invite'
      }
    })
    return data
  }
}
