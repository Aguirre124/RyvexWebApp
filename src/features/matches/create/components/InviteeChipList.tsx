import React from 'react'

export type PendingInvite =
  | { kind: 'user'; userId: string; name: string; email?: string | null; phoneNumber?: string | null }
  | { kind: 'email'; email: string }
  | { kind: 'phone'; phone: string }

type InviteeChipListProps = {
  invites: PendingInvite[]
  onRemove: (index: number) => void
  maxAllowed?: number
}

export default function InviteeChipList({ invites, onRemove, maxAllowed }: InviteeChipListProps) {
  if (invites.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        No hay invitaciones pendientes
      </div>
    )
  }

  const getInviteDisplay = (invite: PendingInvite) => {
    if (invite.kind === 'user') {
      return {
        primary: invite.name,
        secondary: invite.email || invite.phoneNumber || 'Usuario registrado'
      }
    }
    if (invite.kind === 'email') {
      return {
        primary: invite.email,
        secondary: 'Email'
      }
    }
    return {
      primary: invite.phone,
      secondary: 'Teléfono'
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          Invitaciones pendientes: {invites.length}
          {maxAllowed && ` / ${maxAllowed}`}
        </span>
        {maxAllowed && invites.length >= maxAllowed && (
          <span className="text-xs text-yellow-500">Límite alcanzado</span>
        )}
      </div>

      <div className="space-y-2">
        {invites.map((invite, index) => {
          const { primary, secondary } = getInviteDisplay(invite)
          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[#071422] border border-[#1f2937] rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {invite.kind === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-xs">
                      {invite.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">{primary}</div>
                  <div className="text-xs text-gray-400 truncate">{secondary}</div>
                </div>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="ml-2 p-1 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                title="Eliminar"
              >
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
