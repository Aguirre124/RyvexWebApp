import React from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import Badge from '../../../components/Badge'
import { useMatchDraftStore } from '../../../store/matchDraft.store'
import { useTeamSearchQuery } from './hooks/useMatchFlowHooks'
import { useDebounce } from '../../../hooks/useDebounce'
import { challengesApi } from '../../../services/challenges.api'
import type { TeamSearchResult } from '../../../services/matches.api'

export default function ChallengeSearchStep() {
  const navigate = useNavigate()
  const { 
    selectedSport, 
    homeTeam, 
    flowType, 
    setAwayTeam,
    setAwayCaptain,
    setChallengeId,
    setChallengeStatus,
    setChallengeMessage
  } = useMatchDraftStore()
  
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedTeam, setSelectedTeam] = React.useState<TeamSearchResult | null>(null)
  const [message, setMessage] = React.useState('¡Hola! Te reto a un partido amistoso en RYVEX. ¿Aceptas?')
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [sendError, setSendError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  
  const debouncedQuery = useDebounce(searchQuery, 500)
  
  // Search teams with updated limit parameter
  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useTeamSearchQuery(
    { sportId: selectedSport?.id || '', q: debouncedQuery, limit: 10 },
    !!selectedSport && debouncedQuery.trim().length >= 2
  )
  
  // Redirect if missing required data
  React.useEffect(() => {
    if (!selectedSport || !homeTeam || flowType !== 'CHALLENGE') {
      navigate('/matches/create')
    }
  }, [selectedSport, homeTeam, flowType, navigate])

  const handleSendChallenge = async () => {
    if (!selectedTeam || isCreating) return

    setIsCreating(true)
    setSendError(null)
    
    try {
      // Get team and captain IDs
      const teamId = (selectedTeam as any).id || selectedTeam.teamId
      const captainId = selectedTeam.captain?.id
      
      if (!teamId || !captainId) {
        setSendError('Error: Datos del equipo incompletos')
        setIsCreating(false)
        return
      }

      if (!selectedSport || !homeTeam) {
        setSendError('Error: Faltan datos del partido')
        setIsCreating(false)
        return
      }

      // Send challenge invitation (NO match creation yet)
      const challenge = await challengesApi.createChallengeInvitation({
        sportId: selectedSport.id,
        matchType: 'FRIENDLY',
        homeTeamId: homeTeam.id,
        awayTeamId: teamId,
        awayCaptainUserId: captainId,
        message: message.trim() || undefined
      })

      // Update store with challengeId
      setChallengeId(challenge.challengeId)
      setAwayTeam({ id: teamId, name: selectedTeam.name })
      setAwayCaptain(captainId)
      setChallengeStatus('PENDING')
      setChallengeMessage(message)

      setShowSuccess(true)
    } catch (error: any) {
      let errorMessage = 'Error al enviar el desafío'
      
      if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor. El backend necesita verificar:\n' +
          '1. Que la tabla "challenges" existe\n' +
          '2. Que el endpoint POST /challenge-invitations está implementado\n' +
          '3. Que todos los campos requeridos están siendo procesados correctamente\n\n' +
          'Detalles técnicos: ' + (error.response?.data?.message || 'Internal server error')
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setSendError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  const handleBack = () => {
    navigate('/matches/create/match-type')
  }

  const handleGoToSummary = () => {
    // For challenges, we don't have a matchId yet (created when accepted)
    // Instead, navigate to home or challenges page
    navigate('/home')
  }

  const handleGoHome = () => {
    navigate('/home')
  }

  // Success state
  if (showSuccess && selectedTeam) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Desafío enviado!</h2>
          <p className="text-sm text-gray-400">
            Hemos notificado al capitán rival
          </p>
        </div>

        <Card className="bg-blue-500/10 border-blue-500/30">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Equipo rival</div>
              <div className="text-white font-semibold">{selectedTeam.name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Capitán</div>
              <div className="text-white">{selectedTeam.captain.name}</div>
            </div>
            <div>
              <Badge variant="warning">PENDIENTE</Badge>
            </div>
          </div>
        </Card>

        <div className="bg-[#0b1220] rounded-lg p-4 border border-[#1f2937]">
          <p className="text-sm text-gray-300 text-center">
            Estamos esperando que el capitán acepte el desafío. El partido se creará automáticamente cuando acepte.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            variant="primary"
            onClick={handleGoHome}
            className="w-full"
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  // Main search UI
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Buscar equipo rival</h2>
        <p className="text-sm text-gray-400">
          Encuentra y reta a otro equipo
        </p>
      </div>

      {/* Error Message */}
      {sendError && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-400 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-1">Error al enviar desafío</h3>
              <p className="text-sm text-red-300">{sendError}</p>
              {sendError.includes('flow type') && (
                <button
                  onClick={() => {
                    setSendError(null)
                    window.location.reload()
                  }}
                  className="mt-3 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Recargar y crear nuevo partido
                </button>
              )}
            </div>
            <button
              onClick={() => setSendError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div>
        <Input
          label="Buscar equipo"
          placeholder="Buscar por nombre del equipo o capitán..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setSelectedTeam(null)  // Clear selection on new search
          }}
          autoFocus
        />
        {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
          <p className="text-xs text-gray-500 mt-1">
            Escribe al menos 2 caracteres
          </p>
        )}
      </div>

      {/* Search Results */}
      {debouncedQuery.trim().length >= 2 && (
        <div className="space-y-3">
          {isSearching && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-400 mt-2">Buscando...</p>
            </div>
          )}

          {!isSearching && searchResults.length === 0 && (
            <Card className="text-center py-8">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-white font-medium mb-2">
                No encontramos equipos con "{debouncedQuery}"
              </p>
              <p className="text-sm text-gray-400">
                Nota: Solo aparecen equipos "Visibles para desafíos"
              </p>
            </Card>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                {searchResults.length} resultado{searchResults.length > 1 ? 's' : ''}
              </p>
              {searchResults.map((team: any) => {
                const teamId = team.id || team.teamId
                const selectedId = (selectedTeam as any)?.id || selectedTeam?.teamId
                return (
                  <Card
                    key={teamId}
                    className={`cursor-pointer transition-all ${
                      selectedId === teamId
                        ? 'border-2 border-blue-500 bg-blue-500/10'
                        : 'border border-[#1f2937] hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">{team.name}</h3>
                        <p className="text-sm text-gray-400">
                          Capitán: {team.captain.name}
                        </p>
                      </div>
                      {selectedId === teamId && (
                      <div className="text-blue-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Message Input - only show if team selected */}
      {selectedTeam && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mensaje (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#0b1220] border border-[#1f2937] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Escribe un mensaje al capitán rival..."
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="secondary"
          onClick={handleBack}
          className="flex-1"
          disabled={isCreating}
        >
          Atrás
        </Button>
        <Button
          variant="primary"
          onClick={handleSendChallenge}
          disabled={!selectedTeam || isCreating}
          className="flex-1"
        >
          {isCreating ? 'Enviando...' : 'Enviar desafío'}
        </Button>
      </div>
    </div>
  )
}
