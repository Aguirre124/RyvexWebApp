import React from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/Card'
import Button from '../../../components/Button'
import { useMatchDraftStore } from '../../../store/matchDraft.store'

type FlowOption = 'TRAINING' | 'CHALLENGE'

export default function MatchTypeStep() {
  const navigate = useNavigate()
  const { flowType, setFlowType, selectedSport, format } = useMatchDraftStore()
  const [selected, setSelected] = React.useState<FlowOption | null>(flowType)

  // Redirect if missing required data
  React.useEffect(() => {
    if (!selectedSport) {
      navigate('/matches/create')
    }
  }, [selectedSport, navigate])

  const handleContinue = () => {
    if (!selected) return
    
    setFlowType(selected)
    
    // Navigate to home team selection after choosing match type
    navigate('/matches/create/home-team')
  }

  const handleBack = () => {
    navigate('/matches/new')
  }

  const flowOptions: Array<{
    type: FlowOption
    title: string
    description: string
    icon: string
  }> = [
    {
      type: 'TRAINING',
      title: 'Entrenamiento',
      description: 'Divide tu equipo en A vs B',
      icon: '👥'
    },
    {
      type: 'CHALLENGE',
      title: 'Desafío',
      description: 'Reta a otro equipo. Cada capitán gestiona su plantel',
      icon: '⚔️'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Tipo de partido</h2>
        <p className="text-sm text-gray-400">
          Selecciona si será un entrenamiento o un desafío
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {flowOptions.map((option) => (
          <Card
            key={option.type}
            className={`cursor-pointer transition-all ${
              selected === option.type
                ? 'border-2 border-blue-500 bg-blue-500/10'
                : 'border border-[#1f2937] hover:border-gray-600'
            }`}
            onClick={() => setSelected(option.type)}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{option.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-400">{option.description}</p>
              </div>
              {selected === option.type && (
                <div className="text-blue-500">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
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
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="secondary"
          onClick={handleBack}
          className="flex-1"
        >
          Atrás
        </Button>
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={!selected}
          className="flex-1"
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
