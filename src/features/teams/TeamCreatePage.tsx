import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { teamsApi } from '../../services/endpoints'
import { useMatchDraftStore } from '../../store/matchDraft.store'
import { useAuthStore } from '../auth/auth.store'

const teamSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().max(120, 'La descripción no puede superar 120 caracteres').optional()
})

type TeamForm = z.infer<typeof teamSchema>

export default function TeamCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role') as 'home' | 'away' | null
  
  const { selectedSport, setHomeTeam, setAwayTeam } = useMatchDraftStore()
  const user = useAuthStore((s) => s.user)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema)
  })

  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamForm) => {
      if (!selectedSport || !user) {
        throw new Error('Faltan datos necesarios')
      }
      
      return await teamsApi.create({
        name: data.name,
        sportId: selectedSport.id,
        captainId: user.id,
        description: data.description || '',
        logoUrl: ''
      })
    },
    onSuccess: (team) => {
      const teamData = { id: team.id, name: team.name }
      
      if (role === 'home') {
        setHomeTeam(teamData)
        navigate('/matches/create/away-team')
      } else if (role === 'away') {
        setAwayTeam(teamData)
        navigate('/matches/create/format')
      } else {
        navigate('/matches/create')
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error al crear el equipo')
    }
  })

  const onSubmit = (data: TeamForm) => {
    setError(null)
    createTeamMutation.mutate(data)
  }

  const handleCancel = () => {
    if (role === 'home') {
      navigate('/matches/create/home-team')
    } else if (role === 'away') {
      navigate('/matches/create/away-team')
    } else {
      navigate('/matches/create')
    }
  }

  if (!selectedSport) {
    navigate('/matches/create')
    return null
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Crear equipo</h2>
          <p className="text-sm text-muted">
            Nuevo equipo de {selectedSport.name}
            {role && ` (${role === 'home' ? 'LOCAL' : 'VISITANTE'})`}
          </p>
        </div>

        {error && (
          <div className="bg-red-900 text-red-200 text-sm rounded p-3 text-center mb-4">
            {error}
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                label="Nombre del equipo *"
                placeholder="Ej: Red Dragons"
                {...register('name')}
              />
              {errors.name && (
                <div className="text-red-400 text-xs mt-1">{errors.name.message}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descripción (opcional)</label>
              <textarea
                className="w-full px-3 py-2 bg-[#071422] border border-[#1f2937] rounded-lg text-white focus:outline-none focus:border-primary"
                rows={3}
                placeholder="Describe tu equipo..."
                {...register('description')}
              />
              {errors.description && (
                <div className="text-red-400 text-xs mt-1">{errors.description.message}</div>
              )}
            </div>

            <div className="bg-[#071422] border border-[#1f2937] rounded-lg p-3">
              <div className="text-xs text-muted">
                <div className="mb-1">
                  <strong>Capitán:</strong> {user?.name || 'Usuario actual'}
                </div>
                <div>
                  <strong>Deporte:</strong> {selectedSport.name}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={handleCancel}
                variant="secondary"
                disabled={createTeamMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? 'Creando...' : 'Crear equipo'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
