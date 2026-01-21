import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../../../../components/Button'
import Badge from '../../../../components/Badge'
import UserSearchInput from './UserSearchInput'
import FallbackInviteForm from './FallbackInviteForm'
import InviteeChipList, { PendingInvite } from './InviteeChipList'
import { invitesApi } from '../../../../services/endpoints'
import { UserSearchResult } from '../../../../services/users.api'
import { useMatchDraftStore } from '../../../../store/matchDraft.store'
import { formatPhoneNumber } from '../../../../utils/validators'

type TeamTab = 'home' | 'away'

const FORMAT_LIMITS: Record<string, number> = {
  'FUTSAL': 10,
  'F5': 10,
  'F7': 12,
  'F11': 16
}

export default function Step3Invites() {
  const navigate = useNavigate()
  const { matchId } = useParams<{ matchId: string }>()
  const { selectedSport, homeTeam, awayTeam, format } = useMatchDraftStore()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<TeamTab>('home')
  const [homeInvites, setHomeInvites] = useState<PendingInvite[]>([])
  const [awayInvites, setAwayInvites] = useState<PendingInvite[]>([])
  const [message, setMessage] = useState('¡Te invito a jugar en mi equipo!')
  const [successCount, setSuccessCount] = useState(0)
  const [failedInvites, setFailedInvites] = useState<Array<{ invite: PendingInvite; error: string }>>([])

  const maxAllowed = format ? FORMAT_LIMITS[format] || 16 : 16
  const currentInvites = activeTab === 'home' ? homeInvites : awayInvites
  const setCurrentInvites = activeTab === 'home' ? setHomeInvites : setAwayInvites
  const currentTeamId = activeTab === 'home' ? homeTeam?.id : awayTeam?.id

  const sendInviteMutation = useMutation({
    mutationFn: async (payload: {
      teamId: string
      inviteeUserId?: string
      inviteeEmail?: string
      inviteePhone?: string
      message?: string
    }) => {
      if (!matchId) throw new Error('Match ID no encontrado')
      await invitesApi.send(matchId, payload)
    }
  })

  const handleAddUser = (user: UserSearchResult) => {
    // Check if already exists
    const exists = currentInvites.some(
      inv => inv.kind === 'user' && inv.userId === user.id
    )
    if (exists) {
      alert('Este usuario ya está en la lista')
      return
    }

    if (currentInvites.length >= maxAllowed) {
      alert(`Máximo ${maxAllowed} jugadores permitidos para este formato`)
      return
    }

    const newInvite: PendingInvite = {
      kind: 'user',
      userId: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber
    }

    setCurrentInvites([...currentInvites, newInvite])
  }

  const handleAddFallback = (data: { email?: string; phone?: string }) => {
    if (currentInvites.length >= maxAllowed) {
      alert(`Máximo ${maxAllowed} jugadores permitidos para este formato`)
      return
    }

    if (data.email) {
      // Check duplicate email
      const exists = currentInvites.some(
        inv => inv.kind === 'email' && inv.email === data.email
      )
      if (exists) {
        alert('Este email ya está en la lista')
        return
      }
      setCurrentInvites([...currentInvites, { kind: 'email', email: data.email }])
    } else if (data.phone) {
      const formattedPhone = formatPhoneNumber(data.phone)
      // Check duplicate phone
      const exists = currentInvites.some(
        inv => inv.kind === 'phone' && inv.phone === formattedPhone
      )
      if (exists) {
        alert('Este teléfono ya está en la lista')
        return
      }
      setCurrentInvites([...currentInvites, { kind: 'phone', phone: formattedPhone }])
    }
  }

  const handleRemoveInvite = (index: number) => {
    setCurrentInvites(currentInvites.filter((_, i) => i !== index))
  }

  const handleSendInvites = async () => {
    if (!currentTeamId) {
      alert('ID del equipo no encontrado')
      return
    }

    if (currentInvites.length === 0) {
      alert('Agrega al menos una invitación')
      return
    }

    setSuccessCount(0)
    setFailedInvites([])

    const results = await Promise.allSettled(
      currentInvites.map((invite) => {
        const basePayload = {
          teamId: currentTeamId,
          message: message || undefined
        }

        if (invite.kind === 'user') {
          return sendInviteMutation.mutateAsync({
            ...basePayload,
            inviteeUserId: invite.userId
          })
        } else if (invite.kind === 'email') {
          return sendInviteMutation.mutateAsync({
            ...basePayload,
            inviteeEmail: invite.email
          })
        } else {
          return sendInviteMutation.mutateAsync({
            ...basePayload,
            inviteePhone: invite.phone
          })
        }
      })
    )

    let success = 0
    const failed: Array<{ invite: PendingInvite; error: string }> = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success++
      } else {
        failed.push({
          invite: currentInvites[index],
          error: result.reason?.response?.data?.message || 'Error desconocido'
        })
      }
    })

    setSuccessCount(success)
    setFailedInvites(failed)

    // Refresh notifications if any invites succeeded
    // Backend auto-creates notifications for registered users
    if (success > 0) {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
    }

    if (failed.length === 0) {
      // All succeeded
      setCurrentInvites([])
      alert(`✓ ${success} invitaciones enviadas exitosamente`)
    } else if (success > 0) {
      // Partial success
      alert(`✓ ${success} invitaciones enviadas. ${failed.length} fallaron.`)
      // Remove successful ones
      setCurrentInvites(failed.map(f => f.invite))
    } else {
      // All failed
      alert(`Error: No se pudo enviar ninguna invitación`)
    }
  }

  if (!matchId || !homeTeam || !awayTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Datos del partido incompletos</p>
          <Button onClick={() => navigate('/matches/create')} variant="secondary">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6 bg-[#0a1628]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Invitar jugadores</h2>
          <p className="text-sm text-gray-400">
            Agrega jugadores a cada equipo para el partido
          </p>
        </div>

        {/* Match Info */}
        <div className="bg-[#071422] border border-[#1f2937] rounded-lg p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Deporte:</span>
              <span className="ml-2 text-white font-medium">{selectedSport?.name}</span>
            </div>
            <div>
              <span className="text-gray-400">Formato:</span>
              <span className="ml-2 text-white font-medium">{format || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === 'home'
                ? 'bg-blue-500 text-white'
                : 'bg-[#0b1220] text-gray-400 border border-[#1f2937]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>LOCAL</span>
              <Badge variant="info">{homeTeam.name}</Badge>
              {homeInvites.length > 0 && (
                <span className="bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {homeInvites.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('away')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === 'away'
                ? 'bg-orange-500 text-white'
                : 'bg-[#0b1220] text-gray-400 border border-[#1f2937]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>VISITANTE</span>
              <Badge variant="warning">{awayTeam.name}</Badge>
              {awayInvites.length > 0 && (
                <span className="bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {awayInvites.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Search Section */}
        <div className="bg-[#071422] border border-[#1f2937] rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Buscar jugador registrado
            </label>
            <UserSearchInput
              onSelectUser={handleAddUser}
              excludeUserIds={currentInvites
                .filter(inv => inv.kind === 'user')
                .map(inv => (inv as any).userId)}
            />
          </div>

          {/* Fallback Form */}
          <FallbackInviteForm onAddInvite={handleAddFallback} />
        </div>

        {/* Pending Invites List */}
        <div className="bg-[#071422] border border-[#1f2937] rounded-lg p-4">
          <InviteeChipList
            invites={currentInvites}
            onRemove={handleRemoveInvite}
            maxAllowed={maxAllowed}
          />
        </div>

        {/* Optional Message */}
        {currentInvites.length > 0 && (
          <div className="bg-[#071422] border border-[#1f2937] rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mensaje personalizado (opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={3}
              placeholder="Mensaje para los invitados..."
              className="w-full px-4 py-3 bg-[#0b1220] border border-[#1f2937] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary resize-none"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {message.length} / 200
            </div>
          </div>
        )}

        {/* Failed Invites */}
        {failedInvites.length > 0 && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <h4 className="text-red-400 font-semibold mb-2 text-sm">
              Invitaciones fallidas ({failedInvites.length})
            </h4>
            <div className="space-y-2">
              {failedInvites.map((item, idx) => (
                <div key={idx} className="text-xs text-red-300">
                  • {item.invite.kind === 'user' ? (item.invite as any).name : 
                     item.invite.kind === 'email' ? item.invite.email : item.invite.phone} 
                  - {item.error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            className="flex-1"
          >
            Atrás
          </Button>
          <Button
            onClick={handleSendInvites}
            disabled={currentInvites.length === 0 || sendInviteMutation.isPending}
            variant="primary"
            className="flex-1"
          >
            {sendInviteMutation.isPending
              ? 'Enviando...'
              : `Enviar ${currentInvites.length} invitación${currentInvites.length !== 1 ? 'es' : ''}`}
          </Button>
        </div>

        {/* Summary */}
        <div className="text-center text-xs text-gray-500">
          <p>
            HOME: {homeInvites.length} • AWAY: {awayInvites.length}
          </p>
          <p className="mt-1">
            Máximo {maxAllowed} jugadores por equipo
          </p>
        </div>
      </div>
    </div>
  )
}
