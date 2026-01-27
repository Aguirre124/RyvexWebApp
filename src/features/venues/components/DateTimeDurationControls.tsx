import React from 'react'

type DateTimeDurationControlsProps = {
  date: string
  time: string
  durationMin: number
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  onDurationChange: (duration: number) => void
}

const DURATION_OPTIONS = [
  { value: 60, label: '1 hora' },
  { value: 90, label: '1.5 horas' },
  { value: 120, label: '2 horas' }
]

export default function DateTimeDurationControls({
  date,
  time,
  durationMin,
  onDateChange,
  onTimeChange,
  onDurationChange
}: DateTimeDurationControlsProps) {
  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0]
  
  // Get selected hour for duration logic
  const selectedHour = time.split(':')[0] || ''
  const isLastTurn = selectedHour === '21'
  
  // Filter duration options based on selected hour
  const availableDurations = isLastTurn
    ? DURATION_OPTIONS.filter(opt => opt.value === 60)
    : DURATION_OPTIONS
  
  // Auto-adjust duration if 9 PM is selected and duration is > 60
  React.useEffect(() => {
    if (isLastTurn && durationMin > 60) {
      onDurationChange(60)
    }
  }, [isLastTurn, durationMin, onDurationChange])

  return (
    <div className="bg-[#0b1220] rounded-lg p-4 space-y-4 border border-[#1f2937]">
      <h3 className="font-semibold text-white">Fecha y duración del partido</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Picker */}
        <div>
          <label className="block text-sm text-muted mb-2">
            Fecha <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            min={today}
            required
            className="w-full px-3 py-2 bg-[#071422] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Time Picker */}
        <div>
          <label className="block text-sm text-muted mb-2">
            Hora <span className="text-red-400">*</span>
          </label>
          <select
            value={time.split(':')[0] || ''}
            onChange={(e) => onTimeChange(`${e.target.value}:00`)}
            required
            className="w-full px-3 py-2 bg-[#071422] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="" disabled>Seleccionar hora</option>
            {Array.from({ length: 13 }, (_, i) => {
              const hour = (i + 9).toString().padStart(2, '0')
              return (
                <option key={hour} value={hour}>
                  {hour}:00
                </option>
              )
            })}
          </select>
        </div>

        {/* Duration Dropdown */}
        <div>
          <label className="block text-sm text-muted mb-2">
            Duración <span className="text-red-400">*</span>
          </label>
          <select
            value={durationMin}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            required
            className="w-full px-3 py-2 bg-[#071422] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {availableDurations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {isLastTurn && (
            <p className="text-xs text-yellow-400 mt-1">
              Último turno: solo 1 hora disponible
            </p>
          )}
        </div>
      </div>

      <p className="text-xs text-muted">
        El precio es estimado. La disponibilidad se validará en una fase posterior.
      </p>
    </div>
  )
}
