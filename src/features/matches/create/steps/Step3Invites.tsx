import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Button from '../../../../components/Button'
import Card from '../../../../components/Card'
import Badge from '../../../../components/Badge'
import Input from '../../../../components/Input'
import Tabs from '../../../../components/Tabs'
import { invitesApi, matchesApi } from '../../../../services/endpoints'
import { useWizardStore } from '../../../../store/wizard.store'

const inviteSchema = z.object({
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  userId: z.string().optional().or(z.literal(''))
}).refine(
  (data) => data.email || data.phone || data.userId,
  {
    message: 'Debes proporcionar al menos un email, teléfono o ID de usuario'
  }
)

type InviteForm = z.infer<typeof inviteSchema>

export default function Step3Invites() {
  const {
    matchId,
    homeTeamId,
    awayTeamId,
    challengeStatus,
    challengeUrl,
    setStep
  } = useWizardStore()

  const [activeTeam, setActiveTeam] = useState<'HOME' | 'AWAY'>('HOME')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data: summary, refetch } = useQuery({
    queryKey: ['match-summary', matchId],
    queryFn: () => matchesApi.getSummary(matchId!),
    enabled: !!matchId
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema)
  })

  const sendInvitesMutation = useMutation({
    mutationFn: async (data: InviteForm) => {
      const teamId = activeTeam === 'HOME' ? homeTeamId : awayTeamId
      if (!teamId) throw new Error('Team not selected')

      const invitees: any[] = []
      if (data.email) invitees.push({ email: data.email })
      if (data.phone) invitees.push({ phone: data.phone })
      if (data.userId) invitees.push({ userId: data.userId })

      await invitesApi.send(matchId!, { teamId, invitees })
    },
    onSuccess: () => {
      setSuccess('Invitación enviada correctamente')
      setError(null)
      reset()
      refetch()
      setTimeout(() => setSuccess(null), 3000)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error al enviar invitación')
      setSuccess(null)
    }
  })

  const onSubmit = (data: InviteForm) => {
    sendInvitesMutation.mutate(data)
  }

  const homeRoster = summary?.homeTeam
  const awayRoster = summary?.awayTeam
  const currentRoster = activeTeam === 'HOME' ? homeRoster : awayRoster

  const awayRequiresChallenge =
    activeTeam === 'AWAY' && challengeStatus && challengeStatus !== 'ACCEPTED'

  const renderRosterInfo = () => {
    if (!currentRoster) return null

    const progress = currentRoster.acceptedCount / currentRoster.minRequired
    const isReady = currentRoster.acceptedCount >= currentRoster.minRequired

    return (
      <Card className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{currentRoster.teamName}</span>
            {isReady ? (
              <Badge variant="success">Listo</Badge>
            ) : (
              <Badge variant="warning">Pendiente</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted">Invitados</div>
              <div className="font-semibold">{currentRoster.invitedCount}</div>
            </div>
            <div>
              <div className="text-muted">Aceptados</div>
              <div className="font-semibold">{currentRoster.acceptedCount}</div>
            </div>
            <div>
              <div className="text-muted">Mínimo requerido</div>
              <div className="font-semibold">{currentRoster.minRequired}</div>
            </div>
            <div>
              <div className="text-muted">Máximo permitido</div>
              <div className="font-semibold">{currentRoster.maxAllowed}</div>
            </div>
          </div>
          <div>
            <div className="w-full bg-[#1f2937] rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isReady ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{
                  width: `${Math.min((progress * 100), 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const renderInviteForm = () => {
    if (awayRequiresChallenge) {
      return (
        <Card>
          <div className="text-center space-y-3">
            <Badge variant="warning">Esperando aceptación del desafío</Badge>
            <p className="text-sm text-muted">
              El equipo rival debe aceptar el desafío antes de que puedas invitar jugadores
            </p>
            {challengeUrl && (
              <>
                <div className="bg-[#071422] p-3 rounded text-xs break-all">
                  {challengeUrl}
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(challengeUrl)
                    setSuccess('Enlace copiado')
                    setTimeout(() => setSuccess(null), 2000)
                  }}
                  variant="secondary"
                >
                  Copiar enlace del desafío
                </Button>
              </>
            )}
          </div>
        </Card>
      )
    }

    const canAddMore =
      currentRoster && currentRoster.invitedCount < currentRoster.maxAllowed

    return (
      <div className="space-y-4">
        {!canAddMore && (
          <div className="bg-yellow-900 text-yellow-200 text-sm rounded p-3">
            Has alcanzado el máximo de convocados permitidos
          </div>
        )}

        {canAddMore && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Input
              label="Email"
              type="email"
              placeholder="jugador@email.com"
              {...register('email')}
            />
            <Input
              label="Teléfono (opcional)"
              type="tel"
              placeholder="+34 600 000 000"
              {...register('phone')}
            />
            <Input
              label="ID de usuario (opcional)"
              type="text"
              placeholder="user-id-123"
              {...register('userId')}
            />
            {errors.root && (
              <div className="text-red-400 text-xs">{errors.root.message}</div>
            )}
            <Button
              type="submit"
              disabled={sendInvitesMutation.isPending}
              variant="primary"
            >
              {sendInvitesMutation.isPending ? 'Enviando...' : 'Enviar invitación'}
            </Button>
          </form>
        )}
      </div>
    )
  }

  const tabs = [
    {
      id: 'HOME',
      label: `LOCAL ${homeRoster ? `(${homeRoster.acceptedCount}/${homeRoster.minRequired})` : ''}`,
      content: (
        <>
          {renderRosterInfo()}
          {renderInviteForm()}
        </>
      )
    },
    {
      id: 'AWAY',
      label: `VISITANTE ${awayRoster ? `(${awayRoster.acceptedCount}/${awayRoster.minRequired})` : ''}`,
      content: (
        <>
          {renderRosterInfo()}
          {renderInviteForm()}
        </>
      )
    }
  ]

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Invita jugadores</h2>
        <p className="text-sm text-muted">Completa los equipos para el partido</p>
      </div>

      {error && (
        <div className="bg-red-900 text-red-200 text-sm rounded p-3 text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900 text-green-200 text-sm rounded p-3 text-center">
          {success}
        </div>
      )}

      <Tabs
        tabs={tabs}
        defaultTab={activeTeam}
      />

      <div className="flex gap-3 pt-4">
        <Button onClick={() => setStep(2)} variant="secondary">
          Atrás
        </Button>
        <Button onClick={() => setStep(4)} variant="primary">
          Ver resumen
        </Button>
      </div>
    </div>
  )
}
