import React from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import WizardProgress from '../../../components/WizardProgress'
import { useMatchDraftStore } from '../../../store/matchDraft.store'
import { useCreateMatchMutation } from './hooks/useMatchFlowHooks'
import type { CreateMatchResponse } from '../../../services/matches.api'

export default function TrainingInfoStep() {
  const navigate = useNavigate()
  const { 
    selectedSport, 
    homeTeam, 
    flowType, 
    format,
    setMatchId,
    setAwayTeam
  } = useMatchDraftStore()
  
  const [error, setError] = React.useState<string | null>(null)
  const createMatchMutation = useCreateMatchMutation()

  // Redirect if missing required data
  React.useEffect(() => {
    if (!selectedSport || !homeTeam || flowType !== 'TRAINING') {
      navigate('/matches/create')
    }
  }, [selectedSport, homeTeam, flowType, navigate])

  const handleContinue = async () => {
    if (!selectedSport || !homeTeam) return

    setError(null)
    try {
      // Create the match - for TRAINING, awayTeamId = homeTeamId
      // Don't send formatId at all - it will be set in the next step
      const payload = {
        sportId: selectedSport.id,
        matchType: 'FRIENDLY' as const,
        flowType: 'TRAINING' as const,
        homeTeamId: homeTeam.id,
        awayTeamId: homeTeam.id  // Same team for training
      }
      
      const result = await createMatchMutation.mutateAsync(payload) as CreateMatchResponse
      
      // The API returns either 'matchId' or 'id' depending on the endpoint
      const createdMatchId = result.matchId || (result as any).id
      
      // Store match ID and set away team to home team (training logic)
      setMatchId(createdMatchId)
      setAwayTeam(homeTeam)  // Same team for training
      
      // For TRAINING, skip format selection and go directly to summary
      // The match is already complete with teams assigned
      navigate(`/matches/${createdMatchId}/summary`)
    } catch (error: any) {
      console.error('Error creating training match:', error)
      const errorMessage = error.response?.data?.message || 'Error al crear el entrenamiento'
      setError(errorMessage)
    }
  }

  const handleBack = () => {
    navigate('/matches/create/match-type')
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <WizardProgress
        currentStep={4}
        totalSteps={4}
        title="Creación de partido"
      />

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Entrenamiento</h2>
        <p className="text-sm text-gray-400">
          Tu equipo se dividirá en dos lados
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-400 text-xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-red-400 font-semibold mb-1">Error al crear entrenamiento</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="bg-blue-500/20 rounded-lg p-4 mb-2">
                <div className="text-2xl font-bold text-blue-400">A</div>
              </div>
              <div className="text-sm text-gray-300">{homeTeam?.name} A</div>
              <div className="text-xs text-gray-500">Local</div>
            </div>
            
            <div className="text-2xl text-gray-600">VS</div>
            
            <div className="text-center">
              <div className="bg-red-500/20 rounded-lg p-4 mb-2">
                <div className="text-2xl font-bold text-red-400">B</div>
              </div>
              <div className="text-sm text-gray-300">{homeTeam?.name} B</div>
              <div className="text-xs text-gray-500">Visitante</div>
            </div>
          </div>

          <div className="bg-[#0b1220] rounded-lg p-3 border border-[#1f2937]">
            <p className="text-xs text-gray-400 text-center">
              💡 Podrás invitar jugadores a cada lado en el siguiente paso
            </p>
          </div>
        </div>
      </Card>

      {/* Additional Info */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="text-blue-500 mt-0.5">✓</div>
          <p className="text-sm text-gray-300">
            Mismo equipo base dividido en dos lados
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-blue-500 mt-0.5">✓</div>
          <p className="text-sm text-gray-300">
            Como organizador, gestionas ambos lados
          </p>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-blue-500 mt-0.5">✓</div>
          <p className="text-sm text-gray-300">
            Ideal para prácticas y entrenamientos internos
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="secondary"
          onClick={handleBack}
          className="flex-1"
          disabled={createMatchMutation.isPending}
        >
          Atrás
        </Button>
        <Button
          variant="primary"
          onClick={handleContinue}
          className="flex-1"
          disabled={createMatchMutation.isPending}
        >
          {createMatchMutation.isPending ? 'Creando...' : 'Crear entrenamiento'}
        </Button>
      </div>
    </div>
  )
}
