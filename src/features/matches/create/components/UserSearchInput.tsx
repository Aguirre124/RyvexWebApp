import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersApi, UserSearchResult } from '../../../../services/users.api'
import { useDebounce } from '../../../../hooks/useDebounce'

type UserSearchInputProps = {
  onSelectUser: (user: UserSearchResult) => void
  excludeUserIds?: string[]
}

export default function UserSearchInput({ onSelectUser, excludeUserIds = [] }: UserSearchInputProps) {
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const debouncedQuery = useDebounce(query, 350)

  const { data: results = [], isLoading, isFetching } = useQuery({
    queryKey: ['userSearch', debouncedQuery],
    queryFn: () => usersApi.search({ q: debouncedQuery, limit: 10, scope: 'invite' }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000
  })

  useEffect(() => {
    setShowResults(query.length >= 2)
  }, [query])

  const handleSelect = (user: UserSearchResult) => {
    onSelectUser(user)
    setQuery('')
    setShowResults(false)
  }

  const filteredResults = results.filter(user => !excludeUserIds.includes(user.id))

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="w-full px-4 py-3 bg-[#0b1220] border border-[#1f2937] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
        />
        {(isLoading || isFetching) && debouncedQuery.length >= 2 && (
          <div className="absolute right-3 top-3.5">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Hint */}
      {query.length > 0 && query.length < 2 && (
        <div className="text-xs text-gray-500 mt-1 px-1">
          Escribe al menos 2 caracteres para buscar
        </div>
      )}

      {/* Results Dropdown */}
      {showResults && debouncedQuery.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-[#0a1628] border border-[#1f2937] rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filteredResults.length === 0 && !isLoading && !isFetching ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No encontramos usuarios con ese criterio
            </div>
          ) : (
            <div>
              {filteredResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelect(user)}
                  className="w-full px-4 py-3 text-left hover:bg-[#0b1220] border-b border-[#1f2937] last:border-b-0 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white flex items-center gap-2">
                        {user.name}
                        {user.isVerified && (
                          <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {user.email || user.phoneNumber || 'Sin contacto'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  )
}
