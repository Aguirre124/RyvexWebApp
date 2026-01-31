import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import Badge from '../../components/Badge'
import Tabs from '../../components/Tabs'
import { useAuthStore } from '../auth/auth.store'
import { matchesApi } from '../../services/endpoints'

const mockCompetitions = [
  { id: 'c1', name: 'Liga de Domingo', games: 8 },
  { id: 'c2', name: 'Copa Ciudad', games: 4 }
]

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', 'my'],
    queryFn: () => matchesApi.getMyMatches({ limit: 10 })
  })

  // Mutation to update match visibility
  const visibilityMutation = useMutation({
    mutationFn: ({ matchId, isPublic }: { matchId: string, isPublic: boolean }) => 
      matchesApi.updateVisibility(matchId, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', 'my'] })
    }
  })

  // Filter matches into my matches and public matches
  // Backend already filters matches user has access to
  const myMatches = matches.filter(match => 
    !match.isPublic || match.createdById === user?.id // Not public OR created by me (my private/public matches)
  )

  const publicMatches = matches.filter(match => 
    match.isPublic && match.createdById !== user?.id // Public and NOT created by me
  )

  const renderMatchCard = (match: any, showVisibilityToggle: boolean = false) => (
    <div key={match.id} className="p-3 bg-[#071422] rounded">
      <div 
        onClick={() => navigate(`/matches/${match.id}/summary`)}
        className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info">{match.homeTeam?.name || 'Local'}</Badge>
            <span className="text-gray-500 text-xs">vs</span>
            <Badge variant="warning">{match.awayTeam?.name || 'Visitante'}</Badge>
          </div>
          <div className="text-xs text-gray-400">
            {match.type === 'FRIENDLY' ? 'Amistoso' : 'Torneo'}
            {match.status && (
              <span className="ml-2 text-primary">• {match.status === 'DRAFT' ? 'BORRADOR' : match.status}</span>
            )}
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Visibility Toggle - Show only for match creator in "Mis Partidos" */}
      {showVisibilityToggle && (user?.id === match.createdById || !match.createdById) && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between"
        >
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-300">Visibilidad</div>
            <div className="text-xs text-gray-500">
              {match.isPublic ? 'Público' : 'Solo invitados'}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              visibilityMutation.mutate({ matchId: match.id, isPublic: !match.isPublic })
            }}
            disabled={visibilityMutation.isPending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              match.isPublic ? 'bg-primary' : 'bg-gray-600'
            } ${visibilityMutation.isPending ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                match.isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen pb-20">
      <Header name={user?.name} />

      <main className="px-4 space-y-4">
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/matches/create')}
            className="flex-1 py-3 rounded-lg bg-primary text-black font-semibold"
          >
            Crear Partido
          </button>
          <button className="flex-1 py-3 rounded-lg bg-[#0b1220] border border-[#1f2937] text-white font-semibold opacity-50 cursor-not-allowed">
            Crear Torneo
            <span className="block text-[10px] font-normal text-gray-500 mt-0.5">Disponible pronto</span>
          </button>
        </div>

        <section className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Mis Competiciones</h3>
            <span className="text-xs text-muted">Ver todas</span>
          </div>
          <div className="space-y-2">
            {mockCompetitions.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-[#071422] rounded">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted">{c.games} partidos</div>
                </div>
                <div className="text-xs text-primary">Gestionar</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3 className="font-bold text-white mb-3">Partidos</h3>
          
          {isLoading ? (
            <div className="text-sm text-gray-400 py-4 text-center">Cargando partidos...</div>
          ) : (
            <Tabs
              tabs={[
                {
                  id: 'mis-partidos',
                  label: 'Mis Partidos',
                  content: (
                    <div className="space-y-2">
                      {myMatches.length === 0 ? (
                        <div className="text-sm text-gray-400 py-4">
                          No tienes partidos creados ni invitaciones. Crea uno para comenzar.
                        </div>
                      ) : (
                        myMatches.map((match) => renderMatchCard(match, true))
                      )}
                    </div>
                  )
                },
                {
                  id: 'publicos',
                  label: 'Partidos Públicos',
                  content: (
                    <div className="space-y-2">
                      {publicMatches.length === 0 ? (
                        <div className="text-sm text-gray-400 py-4">
                          No hay partidos públicos disponibles en este momento.
                        </div>
                      ) : (
                        publicMatches.map((match) => renderMatchCard(match, false))
                      )}
                    </div>
                  )
                }
              ]}
            />
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
