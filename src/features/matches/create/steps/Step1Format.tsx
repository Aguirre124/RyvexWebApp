import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { formatsApi, matchesApi } from '../../../../services/endpoints'
import { useWizardStore } from '../../../../store/wizard.store'
import type { FormatDetails } from '../../../../types/match.types'

export default function Step1Format() {
  const { sportId, selectedFormat, setFormat, setMatchId, setStep } = useWizardStore()
  const [formats, setFormats] = useState<FormatDetails[]>([])
  const [selectedFormatLocal, setSelectedFormatLocal] = useState<FormatDetails | null>(
    selectedFormat
  )
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    formatsApi.getAll(sportId).then(setFormats)
  }, [sportId])

  const createMatchMutation = useMutation({
    mutationFn: async (format: FormatDetails) => {
      // This old wizard is deprecated - use /matches/create flow instead
      throw new Error('This wizard is deprecated. Please use the new Create Match flow.')
    },
    onError: (err: any) => {
      setError('Este asistente está obsoleto. Por favor usa "Crear Partido" desde la página de inicio.')
    }
  })

  const handleContinue = () => {
    if (!selectedFormatLocal) {
      setError('Por favor selecciona un formato antes de continuar')
      return
    }
    setError(null)
    createMatchMutation.mutate(selectedFormatLocal)
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Selecciona el formato</h2>
        <p className="text-sm text-muted">Elige el tipo de partido que quieres crear</p>
      </div>

      {error && (
        <div className="bg-red-900 text-red-200 text-sm rounded p-3 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {formats.map((format) => (
          <Card
            key={format.id}
            selected={selectedFormatLocal?.id === format.id}
            onClick={() => setSelectedFormatLocal(format)}
          >
            <div className="text-center">
              <div className="text-xl font-bold mb-2">{format.name}</div>
              <div className="text-sm text-muted space-y-1">
                <div>{format.onFieldPlayers} jugadores</div>
                <div>{format.substitutesAllowed} suplentes</div>
                <div className="text-xs pt-1 border-t border-[#1f2937] mt-2">
                  Máx. {format.maxSquadSize} convocados
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleContinue}
        disabled={createMatchMutation.isPending}
        variant="primary"
      >
        {createMatchMutation.isPending ? 'Creando...' : 'Continuar'}
      </Button>
    </div>
  )
}
