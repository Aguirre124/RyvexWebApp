import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../../components/Card'
import Button from '../../../../components/Button'
import { formatsApi, sportsApi } from '../../../../services/endpoints'
import { useWizardStore } from '../../../../store/wizard.store'
import { useMatchDraftStore } from '../../../../store/matchDraft.store'
import type { FormatDetails } from '../../../../types/match.types'

export default function Step1Format() {
  const navigate = useNavigate()
  const { sportId, selectedFormat, setFormat: setWizardFormat, setSportId } = useWizardStore()
  const { setFormat: setDraftFormat, setSport } = useMatchDraftStore()
  const [formats, setFormats] = useState<FormatDetails[]>([])
  const [selectedFormatLocal, setSelectedFormatLocal] = useState<FormatDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    // Fetch sports and set the football sportId if not already set or if it's the hardcoded 'football' string
    const initializeSport = async () => {
      if (!sportId || sportId === 'football') {
        const sports = await sportsApi.getAll()
        const footballSport = sports.find(s => s.name.toLowerCase().includes('fútbol') || s.name.toLowerCase().includes('football'))
        if (footballSport) {
          setSportId(footballSport.id)
          setSport(footballSport)
          formatsApi.getAll(footballSport.id).then(setFormats)
        }
      } else {
        formatsApi.getAll(sportId).then(setFormats)
      }
    }
    initializeSport()
  }, [])

  const handleContinue = () => {
    if (!selectedFormatLocal) {
      setError('Por favor selecciona un formato antes de continuar')
      return
    }
    setError(null)
    
    // Save format to both stores
    setWizardFormat(selectedFormatLocal)
    setDraftFormat(selectedFormatLocal.code as 'FUTSAL' | 'F5' | 'F7' | 'F11')
    
    // Set sport in draft store using sportId from wizard and format
    // We construct a minimal sport object since FormatDetails doesn't include the full sport
    if (sportId) {
      setSport({ 
        id: sportId, 
        name: selectedFormatLocal.name.includes('Fútbol') ? 'Fútbol' : 'Fútbol'  // Default to Fútbol
      })
    }
    
    // Navigate to match type selection (Training vs Challenge)
    navigate('/matches/create/match-type')
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
        disabled={!selectedFormatLocal}
        variant="primary"
      >
        Continuar
      </Button>
    </div>
  )
}
