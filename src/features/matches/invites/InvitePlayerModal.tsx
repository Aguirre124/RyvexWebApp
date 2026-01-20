import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../../../components/Button'
import UserSearchInput from '../create/components/UserSearchInput'
import FallbackInviteForm from '../create/components/FallbackInviteForm'
import { invitesApi } from '../../../services/endpoints'
import { UserSearchResult } from '../../../services/users.api'

type InvitePlayerModalProps = {
  matchId: string
  teamId: string
  teamName: string
  side: 'HOME' | 'AWAY'
  onClose: () => void
}

type SelectedInvite = 
  | { type: 'user'; user: UserSearchResult }
  | { type: 'email'; email: string }
  | { type: 'phone'; phone: string }

export default function InvitePlayerModal({
  matchId,
  teamId,
  teamName,
  side,
  onClose
}: InvitePlayerModalProps) {
  const [selectedInvite, setSelectedInvite] = useState<SelectedInvite | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()

  const inviteMutation = useMutation({
    mutationFn: async (invite: SelectedInvite) => {
      console.log('Sending invite with teamId:', teamId)
      console.log('teamId type:', typeof teamId)
      console.log('Full payload:', { teamId, matchId, invite })
      
      if (invite.type === 'user') {
        await invitesApi.send(matchId, {
          teamId,
          inviteeUserId: invite.user.id
        })
      } else if (invite.type === 'email') {
        await invitesApi.send(matchId, {
          teamId,
          inviteeEmail: invite.email
        })
      } else {
        await invitesApi.send(matchId, {
          teamId,
          inviteePhone: invite.phone
        })
      }
    },
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['match-summary', matchId] })
      
      setTimeout(() => {
        onClose()
      }, 2000)
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message ||
        'Error al enviar la invitación. Intenta nuevamente.'
      )
    }
  })

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedInvite({ type: 'user', user })
    setError(null)
  }

  const handleAddFallback = (data: { email?: string; phone?: string }) => {
    if (data.email) {
      setSelectedInvite({ type: 'email', email: data.email })
    } else if (data.phone) {
      setSelectedInvite({ type: 'phone', phone: data.phone })
    }
    setError(null)
  }

  const handleSend = () => {
    if (!selectedInvite) {
      setError('Por favor selecciona o ingresa un jugador')
      return
    }
    inviteMutation.mutate(selectedInvite)
  }

  const getInviteDisplay = () => {
    if (!selectedInvite) return null
    
    if (selectedInvite.type === 'user') {
      return (
        <div className="flex items-center gap-3 p-3 bg-[#071422] border border-primary rounded-lg">
          {selectedInvite.user.avatar ? (
            <img src={selectedInvite.user.avatar} alt={selectedInvite.user.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold">
                {selectedInvite.user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="font-medium text-white">{selectedInvite.user.name}</div>
            <div className="text-xs text-gray-400">
              {selectedInvite.user.email || selectedInvite.user.phoneNumber}
            </div>
          </div>
          <button
            onClick={() => setSelectedInvite(null)}
            className="p-1 hover:bg-red-500/10 rounded"
          >
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )
    }
    
    return (
      <div className="flex items-center gap-3 p-3 bg-[#071422] border border-primary rounded-lg">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="font-medium text-white">
            {selectedInvite.type === 'email' ? selectedInvite.email : selectedInvite.phone}
          </div>
          <div className="text-xs text-gray-400">
            {selectedInvite.type === 'email' ? 'Email' : 'Teléfono'}
          </div>
        </div>
        <button
          onClick={() => setSelectedInvite(null)}
          className="p-1 hover:bg-red-500/10 rounded"
        >
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-[#0a1628] border border-[#1f2937] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Invitar jugador</h3>
            <p className="text-sm text-gray-400">
              Equipo: <span className="text-white font-semibold">{teamName}</span>
              <span className={`ml-2 text-xs ${side === 'HOME' ? 'text-blue-400' : 'text-orange-400'}`}>
                ({side === 'HOME' ? 'LOCAL' : 'VISITANTE'})
              </span>
            </p>
          </div>

          {success ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-16 h-16 bg-green-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-white font-semibold">¡Invitación enviada!</div>
              <p className="text-sm text-gray-400">
                La invitación ha sido enviada exitosamente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Invite Display */}
              {selectedInvite && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Jugador seleccionado
                  </label>
                  {getInviteDisplay()}
                </div>
              )}

              {/* User Search */}
              {!selectedInvite && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Buscar jugador registrado
                  </label>
                  <UserSearchInput
                    onSelectUser={handleSelectUser}
                    excludeUserIds={[]}
                  />
                </div>
              )}

              {/* Fallback Form */}
              {!selectedInvite && <FallbackInviteForm onAddInvite={handleAddFallback} />}

              {error && (
                <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-200 text-sm rounded p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  disabled={inviteMutation.isPending}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  variant="primary"
                  disabled={inviteMutation.isPending || !selectedInvite}
                  className="flex-1"
                >
                  {inviteMutation.isPending ? 'Enviando...' : 'Enviar invitación'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
