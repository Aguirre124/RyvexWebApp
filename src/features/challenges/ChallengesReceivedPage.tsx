import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import { challengesApi, type ChallengeInvitation } from '../../services/challenges.api'

export default function ChallengesReceivedPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedChallenge, setSelectedChallenge] = React.useState<ChallengeInvitation | null>(null)
  const [showDeclineModal, setShowDeclineModal] = React.useState(false)
  const [declineReason, setDeclineReason] = React.useState('')

  // Fetch received challenges
  const { data: challenges = [], isLoading, error } = useQuery({
    queryKey: ['challenges', 'received', 'PENDING'],
    queryFn: () => challengesApi.getReceivedChallenges('PENDING'),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Accept challenge mutation
  const acceptMutation = useMutation({
    mutationFn: (challengeId: string) => challengesApi.acceptChallenge(challengeId),
    onSuccess: (data) => {
      // Invalidate all relevant queries so the match appears in home page
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      
      // Navigate to match summary
      navigate(`/matches/${data.matchId}/summary`)
    },
    onError: (error: any) => {
      console.error('Error accepting challenge:', error)
      alert(error.response?.data?.message || 'Error al aceptar el desafío')
    },
  })

  // Decline challenge mutation
  const declineMutation = useMutation({
    mutationFn: ({ challengeId, reason }: { challengeId: string; reason?: string }) =>
      challengesApi.declineChallenge(challengeId, reason),
    onSuccess: () => {
      console.log('✅ Challenge declined')
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      setShowDeclineModal(false)
      setSelectedChallenge(null)
      setDeclineReason('')
    },
    onError: (error: any) => {
      console.error('❌ Error declining challenge:', error)
      alert(error.response?.data?.message || 'Error al rechazar el desafío')
    },
  })

  const handleAccept = (challenge: ChallengeInvitation) => {
    acceptMutation.mutate(challenge.challengeId)
  }

  const handleDecline = (challenge: ChallengeInvitation) => {
    setSelectedChallenge(challenge)
    setShowDeclineModal(true)
  }

  const confirmDecline = () => {
    if (selectedChallenge) {
      declineMutation.mutate({
        challengeId: selectedChallenge.challengeId,
        reason: declineReason.trim() || undefined,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-400 mt-4">Cargando desafíos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-red-900/30 border-red-600">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Error al cargar desafíos</h3>
              <p className="text-red-300 text-sm">{(error as any).message}</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <div className="bg-[#0b1220] border-b border-[#1f2937] p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-bold">Desafíos Recibidos</h1>
              <p className="text-sm text-gray-400">
                {challenges.length} desafío{challenges.length !== 1 ? 's' : ''} pendiente{challenges.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {challenges.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">
              No tienes desafíos pendientes
            </h3>
            <p className="text-gray-400 text-sm">
              Cuando otros equipos te reten, aparecerán aquí
            </p>
          </Card>
        ) : (
          challenges.map((challenge) => (
            <Card key={challenge.challengeId} className="border-blue-500/30">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="warning">NUEVO DESAFÍO</Badge>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {challenge.homeTeam.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      te ha retado a un partido {challenge.matchType === 'FRIENDLY' ? 'amistoso' : 'competitivo'}
                    </p>
                  </div>
                  <div className="text-4xl">⚔️</div>
                </div>

                {/* Details */}
                <div className="bg-[#0b1220] rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Capitán:</span>
                    <span className="text-white">{challenge.homeTeam.captain.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="text-white">
                      {challenge.matchType === 'FRIENDLY' ? 'Amistoso' : 'Competitivo'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Expira:</span>
                    <span className="text-white">
                      {new Date(challenge.expiresAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Message */}
                {challenge.message && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-gray-300 italic">
                      "{challenge.message}"
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => handleDecline(challenge)}
                    disabled={declineMutation.isPending || acceptMutation.isPending}
                    className="flex-1"
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleAccept(challenge)}
                    disabled={acceptMutation.isPending || declineMutation.isPending}
                    className="flex-1"
                  >
                    {acceptMutation.isPending ? 'Aceptando...' : '✓ Aceptar Desafío'}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Decline Modal */}
      {showDeclineModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">❌</div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Rechazar Desafío
                </h3>
                <p className="text-sm text-gray-400">
                  De {selectedChallenge.homeTeam.name}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Razón (opcional)
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Explica por qué rechazas el desafío..."
                  className="w-full bg-[#0b1220] border border-[#1f2937] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeclineModal(false)
                    setSelectedChallenge(null)
                    setDeclineReason('')
                  }}
                  disabled={declineMutation.isPending}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmDecline}
                  disabled={declineMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {declineMutation.isPending ? 'Rechazando...' : 'Confirmar Rechazo'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
