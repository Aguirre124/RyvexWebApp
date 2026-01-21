import React, { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Button from '../../../components/Button'
import Input from '../../../components/Input'
import { invitesApi } from '../../../services/endpoints'
import { usersApi, UserSearchResult } from '../../../services/users.api'
import { useDebounce } from '../../../hooks/useDebounce'

type InvitePlayerModalProps = {
  matchId: string
  teamId: string
  teamName: string
  side: 'HOME' | 'AWAY'
  onClose: () => void
}

type PendingInvite =
  | { kind: 'user'; userId: string; name: string; email?: string | null; phoneNumber?: string | null }
  | { kind: 'email'; email: string }

const emailSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido')
})

type EmailForm = z.infer<typeof emailSchema>

export default function InvitePlayerModal({
  matchId,
  teamId,
  teamName,
  side,
  onClose
}: InvitePlayerModalProps) {
  const [query, setQuery] = useState('')
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const queryClient = useQueryClient()
  const debouncedQuery = useDebounce(query, 350)

  const { register, handleSubmit, formState: { errors: formErrors }, reset } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema)
  })

  // Search users query
  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ['usersSearch', debouncedQuery],
    queryFn: () => usersApi.search({ q: debouncedQuery, limit: 10, scope: 'invite' }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000
  })

  const showNoResultsFallback = debouncedQuery.length >= 2 && !isFetching && searchResults.length === 0

  const inviteMutation = useMutation({
    mutationFn: async (invites: PendingInvite[]) => {
      const defaultMessage = 'Te invito a unirte a un partido en RYVEX. Abre el enlace para crear tu cuenta y aceptar la invitación.'
      
      const results = await Promise.allSettled(
        invites.map((invite) => {
          if (invite.kind === 'user') {
            return invitesApi.send(matchId, {
              teamId,
              inviteeUserId: invite.userId,
              message: defaultMessage
            })
          } else {
            return invitesApi.send(matchId, {
              teamId,
              inviteeEmail: invite.email,
              message: defaultMessage
            })
          }
        })
      )

      const failures = results.filter(r => r.status === 'rejected')
      if (failures.length > 0) {
        throw new Error(`${failures.length} invitación(es) fallaron`)
      }

      return results
    },
    onSuccess: () => {
      setSuccess(true)
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['match-summary', matchId] })
      
      // Refresh notifications for invited users
      // Backend auto-creates notifications for registered users
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] })
      
      setTimeout(() => {
        onClose()
      }, 2000)
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || err.message
      
      // Check for specific error messages and translate to Spanish
      if (errorMessage?.toLowerCase().includes('pending invite') || 
          errorMessage?.toLowerCase().includes('already has') ||
          errorMessage?.toLowerCase().includes('duplicate')) {
        setError('El jugador ya tiene una invitación activa')
      } else {
        setError(errorMessage || 'Error al enviar la invitación. Intenta nuevamente.')
      }
    }
  })

  const handleSelectUser = (user: UserSearchResult) => {
    // Check if already exists
    const exists = pendingInvites.some(
      inv => (inv.kind === 'user' && inv.userId === user.id) ||
             (inv.kind === 'email' && inv.email?.toLowerCase() === user.email?.toLowerCase())
    )
    
    if (exists) {
      setError('Este usuario ya está en la lista')
      return
    }

    setPendingInvites([...pendingInvites, {
      kind: 'user',
      userId: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber
    }])
    
    setQuery('')
    setError(null)
  }

  const handleAddEmail = (data: EmailForm) => {
    const normalizedEmail = data.email.toLowerCase()
    
    // Check duplicate email
    const exists = pendingInvites.some(
      inv => (inv.kind === 'email' && inv.email.toLowerCase() === normalizedEmail) ||
             (inv.kind === 'user' && inv.email?.toLowerCase() === normalizedEmail)
    )
    
    if (exists) {
      setError('Este email ya está en la lista')
      return
    }

    setPendingInvites([...pendingInvites, {
      kind: 'email',
      email: data.email
    }])
    
    reset()
    setShowEmailForm(false)
    setError(null)
  }

  const handleRemoveInvite = (index: number) => {
    setPendingInvites(pendingInvites.filter((_, i) => i !== index))
  }

  const handleSend = () => {
    if (pendingInvites.length === 0) {
      setError('Agrega al menos una invitación')
      return
    }
    inviteMutation.mutate(pendingInvites)
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
              {/* Search Input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Buscar jugador registrado
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="w-full px-4 py-3 bg-[#0b1220] border border-[#1f2937] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                  {isFetching && debouncedQuery.length >= 2 && (
                    <div className="absolute right-3 top-3.5">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {query.length > 0 && query.length < 2 && (
                  <div className="text-xs text-gray-500 mt-1 px-1">
                    Escribe al menos 2 caracteres para buscar
                  </div>
                )}
                
                {query.length === 0 && (
                  <div className="text-xs text-gray-500 mt-1 px-1">
                    Busca por nombre, email o teléfono del jugador registrado.
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && debouncedQuery.length >= 2 && (
                <div className="border border-[#1f2937] rounded-lg overflow-hidden">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-4 py-3 text-left hover:bg-[#0b1220] border-b border-[#1f2937] last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-xs text-gray-400 truncate">
                            {user.email || user.phoneNumber || 'Sin contacto'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No Results Fallback */}
              {showNoResultsFallback && (
                <div className="bg-[#071422] border border-[#1f2937] rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-300 text-center">
                    No encontramos usuarios registrados con <span className="text-white font-semibold">'{debouncedQuery}'</span>.
                  </p>
                  
                  {!showEmailForm ? (
                    <Button
                      type="button"
                      onClick={() => setShowEmailForm(true)}
                      variant="secondary"
                      className="w-full"
                    >
                      Invitar por email
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400">
                        Le enviaremos una invitación para crear su cuenta y unirse al partido.
                      </p>
                      <form onSubmit={handleSubmit(handleAddEmail)} className="space-y-3">
                        <div>
                          <Input
                            {...register('email')}
                            type="email"
                            placeholder="jugador@email.com"
                          />
                          {formErrors.email && (
                            <div className="text-red-400 text-xs mt-1">{formErrors.email.message}</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              setShowEmailForm(false)
                              reset()
                            }}
                            variant="secondary"
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                          >
                            + Agregar email
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="bg-[#071422] border border-[#1f2937] rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-400 mb-3">
                    Invitaciones pendientes ({pendingInvites.length})
                  </div>
                  <div className="space-y-2">
                    {pendingInvites.map((invite, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-[#0b1220] border border-[#1f2937] rounded-lg"
                      >
                        {invite.kind === 'user' ? (
                          <>
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-primary font-bold text-xs">
                                {invite.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm">{invite.name}</div>
                              <div className="text-xs text-gray-400 truncate">
                                {invite.email || invite.phoneNumber || 'Usuario registrado'}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm truncate">{invite.email}</div>
                              <div className="text-xs text-gray-400">Email</div>
                            </div>
                          </>
                        )}
                        <button
                          onClick={() => handleRemoveInvite(index)}
                          className="p-1 hover:bg-red-500/10 rounded transition-colors"
                        >
                          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  disabled={inviteMutation.isPending || pendingInvites.length === 0}
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
