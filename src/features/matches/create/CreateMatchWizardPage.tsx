import React from 'react'
import { useWizardStore } from '../../../store/wizard.store'
import WizardProgress from '../../../components/WizardProgress'
import Step1Format from './steps/Step1Format'
import Step2Teams from './steps/Step2Teams'
import Step3Invites from './steps/Step3Invites'
import Step4Summary from './steps/Step4Summary'

const stepLabels = ['Formato', 'Equipos', 'Invitaciones', 'Resumen']

export default function CreateMatchWizardPage() {
  const currentStep = useWizardStore((s) => s.currentStep)

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Format />
      case 2:
        return <Step2Teams />
      case 3:
        return <Step3Invites />
      case 4:
        return <Step4Summary />
      default:
        return <Step1Format />
    }
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-2xl mx-auto">
        <WizardProgress
          currentStep={currentStep}
          totalSteps={4}
          stepLabels={stepLabels}
        />
        {renderStep()}
      </div>
    </div>
  )
}
