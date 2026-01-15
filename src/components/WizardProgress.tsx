import React from 'react'

type ProgressProps = {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
}

export default function WizardProgress({ currentStep, totalSteps, stepLabels }: ProgressProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-muted">
          Paso {currentStep} de {totalSteps}
        </span>
        {stepLabels && (
          <span className="text-sm font-medium text-white">
            {stepLabels[currentStep - 1]}
          </span>
        )}
      </div>
      <div className="w-full bg-[#1f2937] rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
}
